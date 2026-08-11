// lib/reviews.ts
// P3-15 — product reviews. Submission is validated here (rating bounds,
// required product ref, length caps); only APPROVED reviews are served to the
// storefront. Average rating is computed from approved reviews only.

import { serverClient } from "@/sanity/lib/server-client";

export type ReviewInput = {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  customerName?: string;
  customerEmail?: string;
};

export const MAX_TITLE_LEN = 80;
export const MAX_BODY_LEN = 1000;

/** Validate a review submission; returns an error string or null. */
export function validateReviewInput(input: ReviewInput): string | null {
  if (!input.productId || !String(input.productId).trim()) return "productId is required";
  if (
    typeof input.rating !== "number" ||
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    return "rating must be an integer 1–5";
  }
  if (input.title && String(input.title).length > MAX_TITLE_LEN) {
    return `title must be ${MAX_TITLE_LEN} characters or fewer`;
  }
  if (input.body && String(input.body).length > MAX_BODY_LEN) {
    return `review must be ${MAX_BODY_LEN} characters or fewer`;
  }
  if (input.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)) {
    return "customerEmail must be a valid email";
  }
  return null;
}

/** Persist a new review with status 'pending' (awaiting moderation). */
export async function createReview(input: ReviewInput): Promise<void> {
  const doc = await serverClient.create({
    _type: "review",
    product: { _type: "reference", _ref: input.productId },
    rating: input.rating,
    title: (input.title || "").trim(),
    body: (input.body || "").trim(),
    customerName: (input.customerName || "").trim(),
    customerEmail: (input.customerEmail || "").trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  void doc;
}

export type ReviewDoc = {
  _id: string;
  rating: number;
  title?: string;
  body?: string;
  customerName?: string;
  createdAt?: string;
};

/** Fetch APPROVED reviews for a product (storefront-facing). */
export async function getApprovedReviews(productId: string): Promise<ReviewDoc[]> {
  return serverClient.fetch(
    `*[_type == "review" && product._ref == $productId && status == "approved"] | order(createdAt desc)`,
    { productId }
  );
}

/** Compute the average rating from approved reviews (0 when none). */
export function averageRating(reviews: Pick<ReviewDoc, "rating">[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
