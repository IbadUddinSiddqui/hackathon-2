// lib/bulk-import.ts
// Pure, testable logic for the admin bulk product import. The route handler
// (app/api/admin/products/bulk-import/route.ts) does the actual Sanity writes;
// everything here is deterministic and unit-testable.

import * as XLSX from "xlsx";
import AdmZip from "adm-zip";

/** Normalized import row (column headers are lowercased, spaces → underscores). */
export type ImportRow = {
  rowNumber: number; // 1-based position in the sheet (header = 1)
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  category_slug?: string; // optional — derived from category when missing
  size?: string; // comma-separated, e.g. "S,M,L,XL"
  brand?: string;
  color?: string;
  tags?: string; // comma-separated
  image_urls?: string; // comma-separated http(s) URLs
  image_files?: string; // comma-separated filenames found in the uploaded ZIP
  [key: string]: unknown;
};

/** Validated product payload ready for a Sanity create/patch. */
export type ProductPayload = {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string; // always set — derived from category when the row omits it
  size: string[];
  brand?: string;
  color?: string;
  tags: string[];
  imageUrls: string[];
  imageFiles: string[]; // filenames to look up inside the uploaded ZIP
};

export type RowValidation =
  | { ok: true; product: ProductPayload }
  | { ok: false; errors: string[] };

const REQUIRED_TEXT = ["name", "category"] as const;

/**
 * Lowercase, drop apostrophes (men's → mens), collapse other
 * spaces/punctuation to hyphens, trim edge hyphens.
 * Used to auto-derive category_slug (and by the template instructions).
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Parse an uploaded workbook/CSV buffer into normalized rows. */
export function parseWorkbook(buf: ArrayBuffer): ImportRow[] {
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return [];

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });

  return raw.map((record, i) => {
    const row: ImportRow = { rowNumber: i + 2 }; // header is row 1
    for (const [key, value] of Object.entries(record)) {
      const norm = String(key).trim().toLowerCase().replace(/\s+/g, "_");
      if (norm) row[norm] = value;
    }
    return row;
  });
}

function asString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function asNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : undefined;
}

function splitList(v: unknown): string[] {
  const s = asString(v);
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Validate a single row; returns either a payload or the list of errors.
 * Images may come from image_urls (downloaded) and/or image_files (from the
 * ZIP the admin also uploads) — at least one declared source is required.
 */
export function validateRow(row: ImportRow): RowValidation {
  const errors: string[] = [];

  for (const field of REQUIRED_TEXT) {
    if (!asString(row[field])) errors.push(`${field} is required`);
  }

  const price = asNumber(row.price);
  if (price === undefined || price < 0) errors.push("price must be a non-negative number");

  const stock = asNumber(row.stock);
  if (stock === undefined || stock < 0) errors.push("stock must be a non-negative number");

  const size = splitList(row.size);
  if (size.length === 0) errors.push("size is required (comma-separated, e.g. S,M,L,XL)");

  // category_slug is optional: derive it from the category display name.
  const categorySlug =
    asString(row.category_slug) ?? slugify(asString(row.category) ?? "");
  if (!categorySlug) errors.push("category_slug is required (or leave it blank to auto-generate)");

  // Images are schema-required (min 1) and the storefront renders images[0],
  // so a row without any image source must be skipped to avoid broken cards.
  const imageUrls = splitList(row.image_urls).filter((u) => /^https?:\/\//i.test(u));
  const imageFiles = splitList(row.image_files);
  if (imageUrls.length === 0 && imageFiles.length === 0) {
    errors.push(
      "image_urls or image_files required (comma-separated https URLs and/or filenames inside the uploaded ZIP)"
    );
  }

  if (errors.length > 0) return { ok: false, errors };

  const name = asString(row.name)!;
  return {
    ok: true,
    product: {
      name,
      description: asString(row.description),
      price: price!,
      stock: stock!,
      category: asString(row.category)!,
      category_slug: categorySlug,
      size,
      brand: asString(row.brand),
      color: asString(row.color),
      tags: splitList(row.tags),
      imageUrls,
      imageFiles,
    },
  };
}

// ---------------------------------------------------------------------------
// Template (.xlsx) building
// ---------------------------------------------------------------------------

const TEMPLATE_HEADERS = [
  "name",
  "description",
  "price",
  "stock",
  "category",
  "category_slug",
  "size",
  "brand",
  "color",
  "tags",
  "image_urls",
  "image_files",
];

export type TemplateOptions = {
  categories?: { category: string; category_slug: string }[];
  brands?: string[];
  colors?: string[];
};

const DEFAULT_COLORS = [
  "Blue",
  "Red",
  "White",
  "Black",
  "Green",
  "Yellow",
  "Pink",
  "Navy",
  "Grey",
  "Brown",
  "Beige",
  "Maroon",
  "Purple",
  "Orange",
];

const DEFAULT_OPTIONS: TemplateOptions = {
  categories: [
    { category: "T-Shirts", category_slug: "t-shirts" },
    { category: "Women's Clothing", category_slug: "womens-clothing" },
    { category: "Men's Clothing", category_slug: "mens-clothings" },
    { category: "Footwear", category_slug: "footwear" },
    { category: "Children", category_slug: "children" },
  ],
  brands: ["AnK's"],
  colors: DEFAULT_COLORS,
};

const EXAMPLE_ROW = [
  "Classic Cotton Tee",
  "Soft 100% cotton, regular fit",
  1499,
  50,
  "T-Shirts",
  "t-shirts",
  "S,M,L,XL",
  "AnK's",
  "Blue",
  "new,summer",
  "https://example.com/tee-front.jpg, https://example.com/tee-back.jpg",
  "tee-front.jpg, tee-back.jpg",
];

const TEMPLATE_COL_WIDTHS = [
  { wch: 22 },
  { wch: 40 },
  { wch: 8 },
  { wch: 8 },
  { wch: 18 },
  { wch: 18 },
  { wch: 14 },
  { wch: 12 },
  { wch: 14 },
  { wch: 18 },
  { wch: 52 },
  { wch: 28 },
];

/**
 * Build the example .xlsx template the admin page offers for download.
 * Columns E (category), F (category_slug) and H (brand) get real dropdowns
 * (data validation) with the store's live categories/brands when provided.
 */
export function buildTemplate(options: TemplateOptions = {}): ArrayBuffer {
  const opts: TemplateOptions = { ...DEFAULT_OPTIONS, ...options };
  const cats = opts.categories && opts.categories.length > 0 ? opts.categories : DEFAULT_OPTIONS.categories!;
  const brands = opts.brands && opts.brands.length > 0 ? opts.brands : DEFAULT_OPTIONS.brands!;
  const colors = opts.colors && opts.colors.length > 0 ? opts.colors : DEFAULT_OPTIONS.colors!;

  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, EXAMPLE_ROW]);
  ws["!cols"] = TEMPLATE_COL_WIDTHS;

  // Styled header: bold white on dark fill.
  TEMPLATE_HEADERS.forEach((_, c) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "111827" } },
        alignment: { vertical: "center" },
      };
    }
  });
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Visible Lists sheet: dropdowns reference these ranges, so editing a list
  // here updates the dropdowns. Range refs avoid Excel's 255-char limit on
  // inline lists (matters once a store has many brands/categories).
  const listLen = Math.max(cats.length, brands.length, colors.length);
  const listsSheet = XLSX.utils.aoa_to_sheet([
    ["Category (dropdown)", "Category slug (dropdown)", "Brand (dropdown)", "Color (dropdown)"],
    ...Array.from({ length: listLen }, (_, i) => [
      cats[i]?.category ?? "",
      cats[i]?.category_slug ?? "",
      brands[i] ?? "",
      colors[i] ?? "",
    ]),
  ]);
  listsSheet["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 14 }];

  // Short how-to so the in-app download is self-explanatory.
  const instructions = XLSX.utils.aoa_to_sheet([
    ["BULK IMPORT — HOW TO USE"],
    [],
    ["1. Fill one product per row in the Products sheet (delete the example row)."],
    ["2. Photos WITHOUT URLs: upload a .zip together with this file. List filenames in the image_files column, or put each product's photos in a folder named exactly like the product (slugified folder names also match)."],
    ["3. Photos WITH URLs: paste public https:// URLs in the image_urls column."],
    ["4. category / category_slug / brand / color have dropdowns — edit the Lists sheet to add or rename values. Leave category_slug blank to auto-generate it from category. Color is optional and any value is accepted (shown on the product page and recorded on orders)."],
    ["5. Upload at Admin Panel → Products → Bulk import. Invalid rows are skipped and listed; the rest still import."],
    ["6. Rows with an existing product name UPDATE it, new names CREATE one. Max 2000 rows / 10 MB per file."],
  ]);
  instructions["!cols"] = [{ wch: 120 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.utils.book_append_sheet(wb, listsSheet, "Lists");
  XLSX.utils.book_append_sheet(wb, instructions, "Instructions");

  // Dropdowns can't be written by SheetJS CE, so we inject the dataValidation
  // XML directly into the Products sheet after SheetJS has serialized it.
  const validations = [
    { sqref: "E2:E500", ref: `Lists!$A$2:$A$${cats.length + 1}` },
    { sqref: "F2:F500", ref: `Lists!$B$2:$B$${cats.length + 1}` },
    { sqref: "H2:H500", ref: `Lists!$C$2:$C$${brands.length + 1}` },
    // Color is lenient — new colors must be typeable without an error dialog.
    { sqref: "I2:I500", ref: `Lists!$D$2:$D$${colors.length + 1}`, lenient: true },
  ];

  return injectDataValidations(
    XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer,
    validations
  );
}

type Validation = { sqref: string; ref: string; lenient?: boolean };

/**
 * Post-process a serialized .xlsx and inject <dataValidations> (Excel
 * dropdown lists) into the first worksheet. SheetJS CE can't write them, so
 * we do the XML surgery directly — the result opens cleanly in Excel,
 * LibreOffice and Google Sheets. Lists reference the "Lists" sheet ranges.
 */
export function injectDataValidations(buf: Buffer, validations: Validation[]): ArrayBuffer {
  if (validations.length === 0) return buf as unknown as ArrayBuffer;

  try {
    const zip = new AdmZip(buf);
    const sheetEntry = zip.getEntry("xl/worksheets/sheet1.xml");
    if (!sheetEntry) return buf as unknown as ArrayBuffer;

    let xml = sheetEntry.getData().toString("utf8");
    const blocks = validations
      .map(
        (v) =>
          `<dataValidation type="list" allowBlank="1"${v.lenient ? ' showErrorMessage="0"' : ""}><formula1>${v.ref}</formula1><sqref>${v.sqref}</sqref></dataValidation>`
      )
      .join("");

    const injection = `<dataValidations count="${validations.length}">${blocks}</dataValidations>`;
    if (!xml.includes("<dataValidations")) {
      // Must appear after sheetData (and before pageMargins/pageSetup).
      xml = xml.replace("</sheetData>", `</sheetData>${injection}`);
    }
    zip.updateFile("xl/worksheets/sheet1.xml", Buffer.from(xml, "utf8"));
    return zip.toBuffer() as unknown as ArrayBuffer;
  } catch {
    // Never break template download over a formatting nicety.
    return buf as unknown as ArrayBuffer;
  }
}
