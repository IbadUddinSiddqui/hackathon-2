import { describe, it, expect, vi } from "vitest";

// search-sync.ts imports @/lib/tenants -> @/auth -> next-auth (vitest can't
// resolve next/server). The tested functions are pure, so mock server deps.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn(() => true) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { toTypesenseDocument, type SanityProductDoc } from "./search-sync";

function makeDoc(overrides: Partial<SanityProductDoc> = {}): SanityProductDoc {
  return {
    _id: "prod1",
    name: "Classic Tee",
    description: "Soft cotton",
    price: 1499,
    stock: 50,
    category: "T-Shirts",
    category_slug: "t-shirts",
    images: [{ asset: { url: "https://cdn.example.com/tee.jpg" } }],
    size: ["S", "M"],
    qcom_availability: false,
    brand: "AnK's",
    tags: ["new"],
    ratings: 4.5,
    created_at: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("toTypesenseDocument", () => {
  it("maps all fields and converts created_at to unix seconds", () => {
    const doc = toTypesenseDocument(makeDoc())!;
    expect(doc.id).toBe("prod1");
    expect(doc.name).toBe("Classic Tee");
    expect(doc.price).toBe(1499);
    expect(doc.stock).toBe(50);
    expect(doc.category_slug).toBe("t-shirts");
    expect(doc.images).toEqual(["https://cdn.example.com/tee.jpg"]);
    expect(doc.size).toEqual(["S", "M"]);
    expect(doc.brand).toBe("AnK's");
    expect(doc.tags).toEqual(["new"]);
    expect(doc.ratings).toBe(4.5);
    expect(doc.tenant_id).toBe("tenant-anks");
    expect(doc.created_at).toBe(Math.floor(new Date("2026-08-10T00:00:00.000Z").getTime() / 1000));
  });

  it("drops missing image URLs and defaults optional fields", () => {
    const doc = toTypesenseDocument(
      makeDoc({
        images: [
          { asset: { url: "https://cdn.example.com/a.jpg" } },
          { asset: {} },
          { asset: { url: "" } },
        ],
        brand: undefined,
        tags: undefined,
        ratings: undefined,
      })
    )!;
    expect(doc.images).toEqual(["https://cdn.example.com/a.jpg"]);
    expect(doc.brand).toBe("");
    expect(doc.tags).toEqual([]);
    expect(doc.ratings).toBe(0);
    expect(doc.description).toBe("Soft cotton");
    expect(doc.tenant_id).toBe("tenant-anks");
  });

  it("returns null for products with no images (not indexed)", () => {
    expect(toTypesenseDocument(makeDoc({ images: [] }))).toBeNull();
    expect(toTypesenseDocument(makeDoc({ images: undefined as unknown as [] }))).toBeNull();
  });
});
