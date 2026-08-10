// lib/bulk-import.ts
// Pure, testable logic for the admin bulk product import. The route handler
// (app/api/admin/products/bulk-import/route.ts) does the actual Sanity writes;
// everything here is deterministic and unit-testable.

import * as XLSX from "xlsx";

/** Normalized import row (column headers are lowercased, spaces → underscores). */
export type ImportRow = {
  rowNumber: number; // 1-based position in the sheet (header = 1)
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  category_slug?: string;
  size?: string; // comma-separated, e.g. "S,M,L,XL"
  brand?: string;
  tags?: string; // comma-separated
  image_urls?: string; // comma-separated http(s) URLs
  [key: string]: unknown;
};

/** Validated product payload ready for a Sanity create/patch. */
export type ProductPayload = {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  size: string[];
  brand?: string;
  tags: string[];
  imageUrls: string[];
};

export type RowValidation =
  | { ok: true; product: ProductPayload }
  | { ok: false; errors: string[] };

const REQUIRED_TEXT = ["name", "category", "category_slug"] as const;

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

/** Validate a single row; returns either a payload or the list of errors. */
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

  // Images are schema-required (min 1) and the storefront renders images[0],
  // so a row without any image URL must be skipped to avoid broken cards.
  const imageUrls = splitList(row.image_urls).filter((u) => /^https?:\/\//i.test(u));
  if (imageUrls.length === 0) errors.push("image_urls required (comma-separated https URLs)");

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
      category_slug: asString(row.category_slug)!,
      size,
      brand: asString(row.brand),
      tags: splitList(row.tags),
      imageUrls,
    },
  };
}

/** Build the example .xlsx template the admin page offers for download. */
export function buildTemplate(): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([
    [
      "name",
      "description",
      "price",
      "stock",
      "category",
      "category_slug",
      "size",
      "brand",
      "tags",
      "image_urls",
    ],
    [
      "Classic Cotton Tee",
      "Soft 100% cotton, regular fit",
      1499,
      50,
      "T-Shirts",
      "t-shirts",
      "S,M,L,XL",
      "AnK's",
      "new,summer",
      "https://example.com/tee-front.jpg, https://example.com/tee-back.jpg",
    ],
  ]);
  ws["!cols"] = [{ wch: 22 }, { wch: 40 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}
