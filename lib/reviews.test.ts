import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverClient } from "@/sanity/lib/server-client";
import { validateReviewInput, createReview, averageRating } from "./reviews";

vi.mock("@/sanity/lib/server-client", () => ({
  serverClient: { create: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(serverClient.create).mockReset();
});

describe("validateReviewInput", () => {
  it("accepts a valid review", () => {
    expect(
      validateReviewInput({ productId: "p1", rating: 5, title: "Great", body: "Love it", customerName: "Ali" })
    ).toBeNull();
  });

  it("rejects missing product, out-of-range rating, oversize text, bad email", () => {
    expect(validateReviewInput({ productId: "", rating: 5 })).toContain("productId");
    expect(validateReviewInput({ productId: "p1", rating: 0 })).toContain("rating");
    expect(validateReviewInput({ productId: "p1", rating: 6 })).toContain("rating");
    expect(validateReviewInput({ productId: "p1", rating: 2.5 })).toContain("rating");
    expect(
      validateReviewInput({ productId: "p1", rating: 5, body: "x".repeat(1001) })
    ).toContain("review");
    expect(
      validateReviewInput({ productId: "p1", rating: 5, customerEmail: "not-an-email" })
    ).toContain("email");
  });
});

describe("createReview", () => {
  it("persists with status pending", async () => {
    vi.mocked(serverClient.create).mockResolvedValue({ _id: "r1" } as any);
    await createReview({ productId: "p1", rating: 4, title: "Nice", customerEmail: "a@b.com" });
    expect(serverClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: "review",
        product: { _type: "reference", _ref: "p1" },
        rating: 4,
        status: "pending",
      })
    );
  });
});

describe("averageRating", () => {
  it("computes the mean and returns 0 for empty", () => {
    expect(averageRating([])).toBe(0);
    expect(averageRating([{ rating: 5 }, { rating: 3 }])).toBe(4);
  });
});
