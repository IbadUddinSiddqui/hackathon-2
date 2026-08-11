import { describe, it, expect } from "vitest";
import { isSaleActive, effectivePrice, saleEndsAt } from "./flash-sales";

const sale = {
  _id: "s1",
  name: "Weekend",
  salePrice: 999,
  startsAt: "2026-08-10T00:00:00Z",
  endsAt: "2026-08-12T00:00:00Z",
  active: true,
};

describe("isSaleActive", () => {
  it("is active inside the window", () => {
    expect(isSaleActive(sale, new Date("2026-08-11T12:00:00Z"))).toBe(true);
  });

  it("is inactive before start / after end / when disabled", () => {
    expect(isSaleActive(sale, new Date("2026-08-09T00:00:00Z"))).toBe(false);
    expect(isSaleActive(sale, new Date("2026-08-13T00:00:00Z"))).toBe(false);
    expect(isSaleActive({ ...sale, active: false }, new Date("2026-08-11T12:00:00Z"))).toBe(false);
  });
});

describe("effectivePrice", () => {
  it("returns the sale price during the window", () => {
    expect(effectivePrice(sale, 1500, new Date("2026-08-11T12:00:00Z"))).toBe(999);
  });

  it("returns the list price outside the window", () => {
    expect(effectivePrice(sale, 1500, new Date("2026-08-13T00:00:00Z"))).toBe(1500);
  });
});

describe("saleEndsAt", () => {
  it("exposes the end timestamp", () => {
    expect(saleEndsAt(sale)).toBe("2026-08-12T00:00:00Z");
  });
});
