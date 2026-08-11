import { describe, it, expect } from "vitest";
import { stripColorSuffix, selectColorSiblings } from "./product-colors";

describe("stripColorSuffix", () => {
  it("strips a trailing ' - <color>' suffix", () => {
    expect(stripColorSuffix("Classic Cotton Tee - Blue", "Blue")).toBe("Classic Cotton Tee");
  });

  it("handles em-dash and colon separators", () => {
    expect(stripColorSuffix("Classic Cotton Tee — Red", "Red")).toBe("Classic Cotton Tee");
    expect(stripColorSuffix("Classic Cotton Tee: Navy", "Navy")).toBe("Classic Cotton Tee");
  });

  it("keeps interior dashes intact", () => {
    expect(stripColorSuffix("Co-wash Denim Jacket - Blue", "Blue")).toBe("Co-wash Denim Jacket");
  });

  it("returns the name unchanged when no color is given", () => {
    expect(stripColorSuffix("Plain Tee", undefined)).toBe("Plain Tee");
    expect(stripColorSuffix("  Plain Tee  ", "")).toBe("Plain Tee");
  });

  it("escapes regex characters in color names", () => {
    expect(stripColorSuffix("Track Pants - Blue (Dark)", "Blue (Dark)")).toBe("Track Pants");
  });

  it("is case-insensitive for the color match", () => {
    expect(stripColorSuffix("Classic Cotton Tee - BLUE", "blue")).toBe("Classic Cotton Tee");
  });
});

describe("selectColorSiblings", () => {
  const current = { _id: "p-blue", name: "Classic Cotton Tee - Blue", color: "Blue" };

  it("returns only same-family, colored, non-self products sorted by color", () => {
    const result = selectColorSiblings(current, [
      { _id: "p-red", name: "Classic Cotton Tee - Red", color: "Red", category_slug: "t-shirts" },
      { _id: "p-white", name: "Classic Cotton Tee - White", color: "White", category_slug: "t-shirts" },
      { _id: "p-blue", name: "Classic Cotton Tee - Blue", color: "Blue", category_slug: "t-shirts" },
      { _id: "p-dress", name: "Summer Dress - Red", color: "Red", category_slug: "womens-clothing" },
      { _id: "p-nocolor", name: "Classic Cotton Tee", category_slug: "t-shirts" },
    ]);

    expect(result.map((r) => r.color)).toEqual(["Red", "White"]);
    expect(result[0].category_slug).toBe("t-shirts");
  });

  it("returns nothing when the current product has no color", () => {
    expect(
      selectColorSiblings(
        { _id: "p-plain", name: "Classic Cotton Tee" },
        [{ _id: "p-red", name: "Classic Cotton Tee - Red", color: "Red" }]
      )
    ).toEqual([]);
  });

  it("returns nothing when there are no family members", () => {
    expect(selectColorSiblings(current, [{ _id: "p-dress", name: "Summer Dress - Red", color: "Red" }])).toEqual([]);
  });

  it("survives inconsistent naming (missing suffix on one side)", () => {
    const result = selectColorSiblings(
      { _id: "p-blue", name: "Classic Cotton Tee - Blue", color: "Blue" },
      [{ _id: "p-red", name: "Classic Cotton Tee", color: "Red" }]
    );
    // "Classic Cotton Tee" with color Red → base is "Classic Cotton Tee" == current base ✓
    expect(result.map((r) => r.color)).toEqual(["Red"]);
  });

  it("matches base names case-insensitively", () => {
    const result = selectColorSiblings(
      { _id: "p-blue", name: "Classic Cotton Tee - Blue", color: "Blue" },
      [{ _id: "p-red", name: "classic cotton tee - red", color: "Red" }]
    );
    expect(result.map((r) => r.color)).toEqual(["Red"]);
  });
});
