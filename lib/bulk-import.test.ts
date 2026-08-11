import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import {
  parseWorkbook,
  validateRow,
  buildTemplate,
  slugify,
  type ImportRow,
} from "./bulk-import";

function row(partial: Partial<ImportRow> = {}): ImportRow {
  return {
    rowNumber: 2,
    name: "Test Tee",
    price: 1499,
    stock: 10,
    category: "T-Shirts",
    category_slug: "t-shirts",
    size: "S,M,L",
    image_urls: "https://example.com/a.jpg",
    ...partial,
  };
}

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Women's Clothing!")).toBe("womens-clothing");
    expect(slugify("Men's Clothing")).toBe("mens-clothing");
    expect(slugify("T-Shirts")).toBe("t-shirts");
  });
});

describe("buildTemplate dropdowns", () => {
  it("injects data validations referencing the Lists sheet ranges", () => {
    const buf = buildTemplate();
    const zip = new AdmZip(Buffer.from(buf as ArrayBuffer));
    const xml = zip.getEntry("xl/worksheets/sheet1.xml")!.getData().toString("utf8");

    expect(xml).toContain('<dataValidations count="4">');
    // Defaults: 5 categories (rows 2-6), 1 brand (row 2), 14 colors (rows 2-15)
    expect(xml).toContain('<formula1>Lists!$A$2:$A$6</formula1>');
    expect(xml).toContain('<formula1>Lists!$B$2:$B$6</formula1>');
    expect(xml).toContain('<formula1>Lists!$C$2:$C$2</formula1>');
    expect(xml).toContain('<formula1>Lists!$D$2:$D$15</formula1>');
    expect(xml).toContain('<sqref>E2:E500</sqref>');
    expect(xml).toContain('<sqref>F2:F500</sqref>');
    expect(xml).toContain('<sqref>H2:H500</sqref>');
    expect(xml).toContain('<sqref>I2:I500</sqref>');
    // Color dropdown must be lenient (no error dialog for custom values).
    expect(xml).toContain('showErrorMessage="0"');
  });

  it("scales ranges with custom category/brand/color lists", () => {
    const buf = buildTemplate({
      categories: [
        { category: "A", category_slug: "a" },
        { category: "B", category_slug: "b" },
      ],
      brands: ["X", "Y", "Z"],
      colors: ["Teal", "Coral"],
    });
    const zip = new AdmZip(Buffer.from(buf as ArrayBuffer));
    const xml = zip.getEntry("xl/worksheets/sheet1.xml")!.getData().toString("utf8");

    expect(xml).toContain('<formula1>Lists!$A$2:$A$3</formula1>');
    expect(xml).toContain('<formula1>Lists!$B$2:$B$3</formula1>');
    expect(xml).toContain('<formula1>Lists!$C$2:$C$4</formula1>');
    expect(xml).toContain('<formula1>Lists!$D$2:$D$3</formula1>');
  });
});

describe("parseWorkbook", () => {
  it("round-trips the generated template into a valid row", () => {
    const buf = buildTemplate();
    const rows = parseWorkbook(buf as ArrayBuffer);
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Classic Cotton Tee");
    expect(rows[0].price).toBe(1499);
    expect(rows[0].size).toBe("S,M,L,XL");
    expect(rows[0].image_urls).toContain("https://example.com/tee-front.jpg");
    expect(rows[0].image_files).toBe("tee-front.jpg, tee-back.jpg");
  });
});

describe("validateRow", () => {
  it("accepts a complete valid row", () => {
    const result = validateRow(row());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.product.name).toBe("Test Tee");
      expect(result.product.size).toEqual(["S", "M", "L"]);
      expect(result.product.price).toBe(1499);
      expect(result.product.category_slug).toBe("t-shirts");
      expect(result.product.imageFiles).toEqual([]);
    }
  });

  it("rejects a row missing a required text field", () => {
    const result = validateRow(row({ category: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(",")).toContain("category is required");
  });

  it("rejects non-numeric price", () => {
    const result = validateRow(row({ price: "not-a-number" as unknown as number }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(",")).toContain("price");
  });

  it("rejects empty size", () => {
    const result = validateRow(row({ size: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(",")).toContain("size");
  });

  it("allows a row with no declared image source (folder-trick rows)", () => {
    // No image_urls and no image_files is legal: the ZIP folder trick supplies
    // the images at import time. Rows that resolve to zero images are skipped
    // by the route with a clear reason.
    const result = validateRow(row({ image_urls: undefined, image_files: undefined }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.product.imageUrls).toEqual([]);
      expect(result.product.imageFiles).toEqual([]);
    }
  });

  it("drops non-http image URLs", () => {
    const result = validateRow(row({ image_urls: "not-a-url, https://ok.example.com/x.jpg" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.imageUrls).toEqual(["https://ok.example.com/x.jpg"]);
  });

  it("accepts image_files without any image_urls (ZIP flow)", () => {
    const result = validateRow(row({ image_urls: undefined, image_files: "front.jpg, back.jpg" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.product.imageUrls).toEqual([]);
      expect(result.product.imageFiles).toEqual(["front.jpg", "back.jpg"]);
    }
  });

  it("auto-derives category_slug from category when omitted", () => {
    const result = validateRow(row({ category: "Women's Clothing", category_slug: undefined }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.category_slug).toBe("womens-clothing");
  });

  it("prefers the explicit category_slug over the derived one", () => {
    const result = validateRow(
      row({ category: "Women's Clothing", category_slug: "custom-slug" })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.category_slug).toBe("custom-slug");
  });

  it("carries an optional color onto the payload", () => {
    const result = validateRow(row({ color: "Blue" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.color).toBe("Blue");

    const noColor = validateRow(row({ color: undefined }));
    expect(noColor.ok).toBe(true);
    if (noColor.ok) expect(noColor.product.color).toBeUndefined();
  });

  it("round-trips the color column from the template", () => {
    const buf = buildTemplate();
    const rows = parseWorkbook(buf as ArrayBuffer);
    expect(rows[0].color).toBe("Blue");
  });
});
