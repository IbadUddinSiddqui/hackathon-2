import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/orders", () => ({
  fetchProductsByIds: vi.fn(),
}));
vi.mock("@/lib/discounts", () => ({
  validateDiscountCode: vi.fn(async () => ({ valid: true as const, discountAmount: 0, code: "" })),
}));
vi.mock("@/lib/gift-cards", () => ({
  redeemGiftCard: vi.fn(async () => ({ applied: 0 })),
}));
vi.mock("@/lib/credit", () => ({
  applyStoreCredit: vi.fn(async () => 0),
}));
vi.mock("@/lib/constants", () => ({
  DELIVERY_FEE: 199,
}));
vi.mock("@/lib/flash-sales", () => ({
  getActiveFlashSales: vi.fn(async () => []),
  buildSalePriceMap: vi.fn(() => new Map()),
}));
vi.mock("@/lib/loyalty", () => ({
  pointsEarned: vi.fn(() => 0),
}));

import { priceCheckout } from "./checkout-pricing";
import { fetchProductsByIds } from "@/lib/orders";

const fetchProducts = fetchProductsByIds as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchProducts.mockReset();
});

describe("priceCheckout color (server-truth)", () => {
  it("stamps the color from the Sanity product even when the client omits it", async () => {
    fetchProducts.mockResolvedValue([
      { _id: "p1", name: "Classic Tee", price: 1000, stock: 5, color: "Blue" },
    ]);

    const result = await priceCheckout({ items: [{ id: "p1", quantity: 1 }] });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.items[0].color).toBe("Blue");
    }
  });

  it("ignores a client-supplied color", async () => {
    fetchProducts.mockResolvedValue([
      { _id: "p1", name: "Classic Tee", price: 1000, stock: 5, color: "Blue" },
    ]);

    const result = await priceCheckout({
      items: [{ id: "p1", quantity: 1, color: "Hacked" }],
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.items[0].color).toBe("Blue");
    }
  });

  it("leaves color undefined when the product has none", async () => {
    fetchProducts.mockResolvedValue([
      { _id: "p1", name: "Classic Tee", price: 1000, stock: 5 },
    ]);

    const result = await priceCheckout({ items: [{ id: "p1", quantity: 1 }] });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.items[0].color).toBeUndefined();
    }
  });
});
