import { describe, it, expect } from "vitest";
import {
  letterSizeFrom,
  numericSizeFrom,
  recommendSize,
  validateQuizInput,
} from "./size-quiz";

describe("letterSizeFrom", () => {
  it("maps chest measurement to the size range", () => {
    expect(letterSizeFrom({ chestCm: 90 })).toBe("S");
    expect(letterSizeFrom({ chestCm: 100 })).toBe("M");
    expect(letterSizeFrom({ chestCm: 120 })).toBe("XL");
  });

  it("falls back to height when chest is missing", () => {
    expect(letterSizeFrom({ heightCm: 160 })).toBe("S");
    expect(letterSizeFrom({ heightCm: 175 })).toBe("M");
    expect(letterSizeFrom({ heightCm: 195 })).toBe("XXL");
  });

  it("clamps out-of-range values", () => {
    expect(letterSizeFrom({ chestCm: 50 })).toBe("XS");
    expect(letterSizeFrom({ chestCm: 200 })).toBe("XXL");
  });

  it("defaults to M with no measurements", () => {
    expect(letterSizeFrom({})).toBe("M");
  });
});

describe("numericSizeFrom", () => {
  it("maps waist to numeric sizes", () => {
    expect(numericSizeFrom({ waistCm: 70 })).toBe("28");
    expect(numericSizeFrom({ waistCm: 85 })).toBe("32");
    expect(numericSizeFrom({ waistCm: 100 })).toBe("36");
  });

  it("returns null without waist", () => {
    expect(numericSizeFrom({})).toBeNull();
  });
});

describe("recommendSize", () => {
  it("returns the direct letter hit when stocked", () => {
    expect(recommendSize(["S", "M", "L"], { chestCm: 100 })).toBe("M");
  });

  it("snaps to the nearest stocked letter size", () => {
    // Target L (chest 110) — only S and XL stocked → XL is nearer to L than S.
    expect(recommendSize(["S", "XL"], { chestCm: 110 })).toBe("XL");
  });

  it("uses waist for numeric products", () => {
    expect(recommendSize(["28", "30", "32", "34"], { waistCm: 85 })).toBe("32");
  });

  it("snaps numeric to the nearest stocked waist size", () => {
    // waist 90 → ideal 34; only 28 and 36 stocked → 36 is nearer.
    expect(recommendSize(["28", "36"], { waistCm: 90 })).toBe("36");
  });

  it("falls back to the first size when nothing matches", () => {
    expect(recommendSize(["One Size"], { chestCm: 100 })).toBe("One Size");
  });

  it("returns null for empty size lists", () => {
    expect(recommendSize([], { chestCm: 100 })).toBeNull();
  });
});

describe("validateQuizInput", () => {
  it("accepts sane values", () => {
    expect(validateQuizInput({ heightCm: 175, weightKg: 70, chestCm: 100, waistCm: 85 })).toEqual({});
  });

  it("rejects out-of-range values", () => {
    const errors = validateQuizInput({ heightCm: 50, weightKg: 500, chestCm: 10, waistCm: 5 });
    expect(Object.keys(errors).length).toBe(4);
  });
});
