import { describe, it, expect } from "vitest";
import { toCheckoutItem, bundleSubtotal, bundleSavings } from "./bundles";

const bundle = {
  _id: "b1",
  name: "Summer Pack",
  bundlePrice: 4000,
  items: [
    { product: { _id: "p1", name: "Tee", price: 1500 }, quantity: 2 },
    { product: { _id: "p2", name: "Cap", price: 1000 }, quantity: 1 },
  ],
};

describe("bundleSubtotal", () => {
  it("sums product price × quantity", () => {
    expect(bundleSubtotal(bundle.items)).toBe(4000);
  });
});

describe("bundleSavings", () => {
  it("returns the gap between sum and bundle price (0 when bundle is not cheaper)", () => {
    expect(bundleSavings(bundle)).toBe(0);
    expect(
      bundleSavings({ ...bundle, bundlePrice: 3000 })
    ).toBe(1000);
  });
});

describe("toCheckoutItem", () => {
  it("expands a bundle into checkout items with per-product pricing", () => {
    const items = toCheckoutItem(bundle);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ id: "p1", name: "Tee", price: 1500, quantity: 2 });
    expect(items[1]).toEqual({ id: "p2", name: "Cap", price: 1000, quantity: 1 });
  });
});
