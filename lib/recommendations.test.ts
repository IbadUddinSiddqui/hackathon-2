import { describe, it, expect, vi } from "vitest";

// recommendations.ts imports @/lib/tenants -> @/auth -> next-auth (vitest can't
// resolve next/server). The tested functions are pure, so mock server deps.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn(() => true) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { scoreCoPurchase, type Recommendation } from "./recommendations";

type PairRow = [string, [string, number][]];

function pairs(...entries: PairRow[]) {
  const map = new Map<string, Map<string, number>>();
  for (const [from, tos] of entries) {
    map.set(from, new Map(tos));
  }
  return map;
}

describe("scoreCoPurchase", () => {
  it("ranks co-purchased products by frequency", () => {
    const p = pairs(["a", [["b", 5], ["c", 3], ["d", 1]]] as PairRow);
    const recs = scoreCoPurchase(p, "a", 6);
    expect(recs.map((r) => r.productId)).toEqual(["b", "c", "d"]);
    expect(recs[0].source).toBe("co-purchase");
    expect(recs[0].score).toBe(5);
  });

  it("returns [] when the product has no co-purchase pairs", () => {
    expect(scoreCoPurchase(new Map(), "a", 6)).toEqual([]);
  });

  it("respects the limit", () => {
    const p = pairs(["a", [["b", 5], ["c", 3], ["d", 1]]] as PairRow);
    expect(scoreCoPurchase(p, "a", 2)).toHaveLength(2);
  });

  it("never recommends the input product itself", () => {
    const p = pairs(["a", [["a", 9], ["b", 2]]] as PairRow);
    const recs = scoreCoPurchase(p, "a", 6);
    expect(recs.map((r) => r.productId)).not.toContain("a");
  });
});

describe("merge logic (co-purchase first, dedupe)", () => {
  it("drops duplicate ids across sources, keeping first occurrence order", () => {
    const co: Recommendation[] = [
      { productId: "b", score: 5, source: "co-purchase" },
      { productId: "c", score: 3, source: "co-purchase" },
    ];
    const cat: Recommendation[] = [
      { productId: "c", score: 4.5, source: "category" }, // duplicate of b? no — of c
      { productId: "d", score: 4.0, source: "category" },
    ];
    const rating: Recommendation[] = [
      { productId: "d", score: 4.9, source: "rating" },
      { productId: "e", score: 4.8, source: "rating" },
    ];

    const seen = new Set<string>(["a"]);
    const merged: Recommendation[] = [];
    for (const rec of [...co, ...cat, ...rating]) {
      if (seen.has(rec.productId)) continue;
      seen.add(rec.productId);
      merged.push(rec);
      if (merged.length >= 4) break;
    }

    expect(merged.map((r) => r.productId)).toEqual(["b", "c", "d", "e"]);
  });
});
