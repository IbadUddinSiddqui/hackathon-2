import { describe, it, expect } from "vitest";
import {
  parseListQuery,
  buildProductListGroq,
  toProductSummary,
  normalizeCreateInput,
  normalizeUpdateInput,
  validateProductInput,
  validateUpdateInput,
  buildUpdatePatch,
} from "./admin-products";

describe("parseListQuery", () => {
  it("defaults to page 1 / limit 20 with no params", () => {
    const q = parseListQuery(new URL("http://localhost/api/admin/products"));
    expect(q).toEqual({ page: 1, limit: 20, search: undefined, category: undefined });
  });

  it("reads page/limit/search/category", () => {
    const q = parseListQuery(
      new URL("http://localhost/api/admin/products?page=3&limit=50&search=tee&category=t-shirts")
    );
    expect(q).toEqual({ page: 3, limit: 50, search: "tee", category: "t-shirts" });
  });

  it("clamps page >= 1 and limit to 1..100", () => {
    const q = parseListQuery(new URL("http://localhost/api/admin/products?page=0&limit=500"));
    expect(q.page).toBe(1);
    expect(q.limit).toBe(100);
  });

  it("falls back to defaults for non-numeric values", () => {
    const q = parseListQuery(new URL("http://localhost/api/admin/products?page=abc&limit=x"));
    expect(q.page).toBe(1);
    expect(q.limit).toBe(20);
  });
});

describe("buildProductListGroq", () => {
  it("computes offset and search glob param", () => {
    const { params } = buildProductListGroq({
      page: 3,
      limit: 25,
      search: "tee",
      category: "shirts",
    });
    expect(params).toMatchObject({ offset: 50, limit: 25, search: "tee*", category: "shirts" });
  });

  it("leaves optional filters undefined", () => {
    const { params } = buildProductListGroq({ page: 1, limit: 20 });
    expect(params.search).toBeUndefined();
    expect(params.category).toBeUndefined();
  });

  it("produces list and count queries referencing the same filters", () => {
    const { groq, countGroq } = buildProductListGroq({ page: 1, limit: 20, search: "tee" });
    expect(groq).toContain('_type == "product"');
    expect(groq).toContain("name match $search");
    expect(groq).toContain("[$offset...$limit]");
    expect(countGroq).toContain("count(*[");
    expect(countGroq).toContain("name match $search");
  });
});

describe("toProductSummary", () => {
  it("maps a doc and extracts the main image URL", () => {
    const summary = toProductSummary({
      _id: "abc123",
      name: "Classic Tee",
      price: 1499,
      stock: 50,
      category: "T-Shirts",
      category_slug: "t-shirts",
      size: ["S", "M"],
      tags: ["new"],
      created_at: "2026-08-10T00:00:00.000Z",
      images: [
        { asset: { url: "https://cdn.sanity.io/images/proj/dataset/tee-front.jpg" } },
        { asset: { url: "https://cdn.sanity.io/images/proj/dataset/tee-back.jpg" } },
      ],
    });
    expect(summary.mainImage).toBe(
      "https://cdn.sanity.io/images/proj/dataset/tee-front.jpg"
    );
    expect(summary.size).toEqual(["S", "M"]);
  });

  it("handles missing images / arrays", () => {
    const summary = toProductSummary({
      _id: "x",
      name: "No Image",
      price: 100,
      stock: 1,
      category: "A",
      category_slug: "a",
    });
    expect(summary.mainImage).toBeUndefined();
    expect(summary.size).toEqual([]);
    expect(summary.tags).toEqual([]);
  });
});

describe("normalizeCreateInput", () => {
  it("coerces numeric strings and trims text fields", () => {
    const input = normalizeCreateInput({
      name: "  Tee  ",
      price: "1499",
      stock: "10",
      category: " T-Shirts ",
      category_slug: "t-shirts",
    });
    expect(input.name).toBe("Tee");
    expect(input.price).toBe(1499);
    expect(input.stock).toBe(10);
    expect(input.category).toBe("T-Shirts");
  });

  it("accepts arrays or comma-separated strings for size/tags/imageUrls", () => {
    const fromArrays = normalizeCreateInput({
      size: ["S", " M "],
      tags: ["new", "summer"],
      imageUrls: ["https://cdn.example.com/a.jpg", "not-a-url"],
    });
    expect(fromArrays.size).toEqual(["S", "M"]);
    expect(fromArrays.tags).toEqual(["new", "summer"]);
    expect(fromArrays.imageUrls).toEqual(["https://cdn.example.com/a.jpg"]);

    const fromString = normalizeCreateInput({ size: "S,M,L", tags: "new" });
    expect(fromString.size).toEqual(["S", "M", "L"]);
    expect(fromString.tags).toEqual(["new"]);
  });

  it("turns invalid numbers into undefined", () => {
    const input = normalizeCreateInput({ price: "abc", stock: undefined });
    expect(input.price).toBeUndefined();
    expect(input.stock).toBeUndefined();
  });
});

describe("normalizeUpdateInput", () => {
  it("preserves an explicit empty description/brand so fields can be cleared", () => {
    const input = normalizeUpdateInput({ description: "", brand: "" });
    expect(input.description).toBe("");
    expect(input.brand).toBe("");
  });

  it("leaves absent optional fields undefined", () => {
    const input = normalizeUpdateInput({ price: 2000 });
    expect(input.description).toBeUndefined();
    expect(input.brand).toBeUndefined();
    expect(input.price).toBe(2000);
  });
});

describe("validateUpdateInput", () => {
  it("accepts a partial update with only some fields", () => {
    expect(validateUpdateInput({ price: 1999, stock: 12 })).toBeNull();
    expect(validateUpdateInput({ name: "Renamed Tee" })).toBeNull();
  });

  it("rejects provided-but-invalid fields", () => {
    expect(validateUpdateInput({ price: -5 })).toContain("price");
    expect(validateUpdateInput({ name: "   " })).toContain("name");
    expect(validateUpdateInput({ size: [] })).toContain("size");
    expect(validateUpdateInput({ category: "" })).toContain("category");
  });

  it("does not require fields that were not sent", () => {
    expect(validateUpdateInput({ name: "Tee" })).toBeNull();
  });
});

describe("buildUpdatePatch", () => {
  it("includes only provided editable fields", () => {
    const patch = buildUpdatePatch({
      price: 1999,
      size: ["S", "L"],
      tags: ["new"],
      imageUrls: ["https://cdn.example.com/x.jpg"],
    });
    expect(patch).toEqual({ price: 1999, size: ["S", "L"], tags: ["new"] });
    expect(patch.imageUrls).toBeUndefined();
  });

  it("allows clearing description and brand", () => {
    const patch = buildUpdatePatch({ description: "", brand: "" });
    expect(patch).toEqual({ description: "", brand: "" });
  });

  it("returns an empty patch when nothing editable is provided", () => {
    expect(buildUpdatePatch({ imageUrls: ["https://x.com/a.jpg"] })).toEqual({});
  });
});

describe("validateProductInput", () => {
  it("accepts a valid create payload with images", () => {
    expect(
      validateProductInput(
        {
          name: "Tee",
          price: 1499,
          stock: 10,
          category: "T-Shirts",
          category_slug: "t-shirts",
          size: ["S", "M"],
          imageUrls: ["https://cdn.example.com/a.jpg"],
        },
        { requireImages: true }
      )
    ).toBeNull();
  });

  it("requires imageUrls when requireImages is set", () => {
    const valid = {
      name: "Tee",
      price: 1,
      stock: 1,
      category: "A",
      category_slug: "a",
      size: ["S"],
    };
    expect(validateProductInput(valid, { requireImages: true })).toContain("imageUrls");
    expect(
      validateProductInput({ ...valid, imageUrls: ["ftp://nope"] }, { requireImages: true })
    ).toContain("imageUrls");
    // But a partial update (no images) is fine without the flag.
    expect(validateProductInput(valid)).toBeNull();
  });

  it("rejects missing name, negative price, empty size", () => {
    expect(validateProductInput({ price: 10, stock: 1, category: "A", category_slug: "a", size: ["S"] })).toContain("name");
    expect(validateProductInput({ name: "Tee", price: -1, stock: 1, category: "A", category_slug: "a", size: ["S"] })).toContain("price");
    expect(validateProductInput({ name: "Tee", price: 1, stock: 1, category: "A", category_slug: "a", size: [] })).toContain("size");
  });
});
