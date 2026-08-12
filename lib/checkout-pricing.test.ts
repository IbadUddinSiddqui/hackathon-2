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
import { buildSalePriceMap } from "@/lib/flash-sales";

const fetchProducts = fetchProductsByIds as unknown as ReturnType<typeof vi.fn>;
const saleMap = buildSalePriceMap as unknown as ReturnType<typeof vi.fn>;

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

describe("priceCheckout product-level sale (server-truth)", () => {
  beforeEach(() => {
    saleMap.mockReturnValue(new Map());
  });

  it("charges the product sale price when on_sale with a lower sale_price", async () => {
    fetchProducts.mockResolvedValue([
      { _id: "p1", name: "Classic Tee", price: 2000, stock: 5, on_sale: true, sale_price: 1200 },
    ]);

    const result = await priceCheckout({ items: [{ id: "p1", quantity: 2 }] });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.items[0].price).toBe(1200);
      expect(result.subtotal).toBe(2400);
      expect(result.total).toBe(2400 + 199); // + DELIVERY_FEE
    }
  });

  it("ignores the sale price when it is not lower than the list price", async () => {
    fetchProducts.mockResolvedValue([
      { _id: "p1", name: "Classic Tee", price: 1000, stock: 5, on_sale: true, sale_price: 1000 },
    ]);

    const result = await priceCheckout({ items: [{ id: "p1", quantity: 1 }] });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.items[0].price).toBe(1000);
    }
  });

  it("charges the list price when the product is not flagged on sale", async () => {
    fetchProducts.mockResolvedValue([
      { _id: "p1", name: "Classic Tee", price: 1000, stock: 5, sale_price: 500 },
    ]);

    const result = await priceCheckout({ items: [{ id: "p1", quantity: 1 }] });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.items[0].price).toBe(1000);
    }
  });

  it("lets an active flash sale win over the product-level sale", async () => {
    fetchProducts.mockResolvedValue([
      { _id: "p1", name: "Classic Tee", price: 2000, stock: 5, on_sale: true, sale_price: 1200 },
    ]);
    saleMap.mockReturnValue(new Map([["p1", 900]]));

    const result = await priceCheckout({ items: [{ id: "p1", quantity: 1 }] });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.items[0].price).toBe(900);
    }
  });
});
