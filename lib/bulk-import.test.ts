import { describe, it, expect } from "vitest";
import { parseWorkbook, validateRow, buildTemplate, type ImportRow } from "./bulk-import";

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

describe("parseWorkbook", () => {
  it("round-trips the generated template into a valid row", () => {
    const buf = buildTemplate();
    const rows = parseWorkbook(buf as ArrayBuffer);
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Classic Cotton Tee");
    expect(rows[0].price).toBe(1499);
    expect(rows[0].size).toBe("S,M,L,XL");
    expect(rows[0].image_urls).toContain("https://example.com/tee-front.jpg");
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

  it("rejects missing image URLs (storefront renders images[0])", () => {
    const result = validateRow(row({ image_urls: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(",")).toContain("image_urls");
  });

  it("drops non-http image URLs", () => {
    const result = validateRow(row({ image_urls: "not-a-url, https://ok.example.com/x.jpg" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.product.imageUrls).toEqual(["https://ok.example.com/x.jpg"]);
  });
});
