import { describe, it, expect } from "vitest";
import {
  NEW_ARRIVALS_DAYS,
  newArrivalsSince,
  salePriceFor,
  displayPriceFor,
} from "./product-sale";

describe("salePriceFor", () => {
  it("returns the sale price when on_sale is true and the price is lower", () => {
    expect(salePriceFor({ on_sale: true, sale_price: 1200, price: 2000 })).toBe(1200);
  });

  it("returns null when the product is not flagged on sale", () => {
    expect(salePriceFor({ on_sale: false, sale_price: 1200, price: 2000 })).toBeNull();
    expect(salePriceFor({ price: 2000 })).toBeNull();
  });

  it("returns null when there is no sale price", () => {
    expect(salePriceFor({ on_sale: true, price: 2000 })).toBeNull();
    expect(salePriceFor({ on_sale: true, sale_price: null, price: 2000 })).toBeNull();
  });

  it("ignores a sale price that is not lower than the list price", () => {
    expect(salePriceFor({ on_sale: true, sale_price: 2000, price: 2000 })).toBeNull();
    expect(salePriceFor({ on_sale: true, sale_price: 2500, price: 2000 })).toBeNull();
  });

  it("treats non-numeric sale prices as no sale", () => {
    expect(salePriceFor({ on_sale: true, sale_price: Number.NaN, price: 2000 })).toBeNull();
  });
});

describe("displayPriceFor", () => {
  it("prefers the sale price", () => {
    expect(displayPriceFor({ on_sale: true, sale_price: 999, price: 1500 })).toBe(999);
  });

  it("falls back to the list price", () => {
    expect(displayPriceFor({ on_sale: true, price: 1500 })).toBe(1500);
    expect(displayPriceFor({ price: 1500 })).toBe(1500);
  });
});

describe("newArrivalsSince", () => {
  it("is exactly the configured window before now", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    const since = newArrivalsSince(now);
    expect(since).toBe("2026-07-13T12:00:00.000Z");
  });

  it("defaults to a 30-day window", () => {
    expect(NEW_ARRIVALS_DAYS).toBe(30);
  });
});
