// app/api/reviews/route.ts
// P3-15 — public review submission (rate-limited, validated). Reviews start
// 'pending' and only appear after admin approval (P3-16).

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateReviewInput, createReview, getApprovedReviews } from "@/lib/reviews";

/** GET — approved reviews for a product (storefront). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") || "";
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }
  try {
    const reviews = await getApprovedReviews(productId);
    return NextResponse.json({ reviews });
  } catch (err: any) {
    console.error("Failed to load reviews:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: "reviews", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const input = {
    productId: String(body?.productId || "").trim(),
    rating: Number(body?.rating),
    title: typeof body?.title === "string" ? body.title : "",
    body: typeof body?.body === "string" ? body.body : "",
    customerName: typeof body?.customerName === "string" ? body.customerName : "",
    customerEmail: typeof body?.customerEmail === "string" ? body.customerEmail : "",
  };

  const error = validateReviewInput(input);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    await createReview(input);
    return NextResponse.json(
      { success: true, message: "Thanks! Your review is awaiting approval." },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Failed to create review:", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
