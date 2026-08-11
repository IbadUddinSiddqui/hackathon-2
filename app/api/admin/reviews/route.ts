// app/api/admin/reviews/route.ts
// P3-16 — admin review moderation.
//   GET   /api/admin/reviews                 → list (pending first)
//   PATCH /api/admin/reviews/[id] { status } → approve/reject
// Unauthenticated → 401.

import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { getTenantContext, tenantFilter } from "@/lib/tenants";

const PROJECTION = `{
  _id, rating, title, body, customerName, customerEmail, status, createdAt,
  "productName": product->name
}`;

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviews = await serverClient.fetch(
      `*[_type == "review" && ${tenantFilter()}] | order(status == "pending" desc, createdAt desc) ${PROJECTION}`,
      { tenantId: ctx.tenantId }
    );
    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("Failed to load reviews:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
