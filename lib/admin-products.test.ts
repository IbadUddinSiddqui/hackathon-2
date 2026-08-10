import { describe, it, expect } from "vitest";
import {
  parseListQuery,
  buildProductListGroq,
  toProductSummary,
  validateProductInput,
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

describe("validateProductInput", () => {
  it("accepts a valid payload", () => {
    expect(
      validateProductInput({
        name: "Tee",
        price: 1499,
        stock: 10,
        category: "T-Shirts",
        category_slug: "t-shirts",
        size: ["S", "M"],
      })
    ).toBeNull();
  });

  it("rejects missing name, negative price, empty size", () => {
    expect(validateProductInput({ price: 10, stock: 1, category: "A", category_slug: "a", size: ["S"] })).toContain("name");
    expect(validateProductInput({ name: "Tee", price: -1, stock: 1, category: "A", category_slug: "a", size: ["S"] })).toContain("price");
    expect(validateProductInput({ name: "Tee", price: 1, stock: 1, category: "A", category_slug: "a", size: [] })).toContain("size");
  });
});
