// app/api/admin/reviews/route.ts
// P3-16 — admin review moderation.
//   GET   /api/admin/reviews                 → list (pending first)
//   PATCH /api/admin/reviews/[id] { status } → approve/reject
// Unauthenticated → 401.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";

const PROJECTION = `{
  _id, rating, title, body, customerName, customerEmail, status, createdAt,
  "productName": product->name
}`;

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviews = await serverClient.fetch(
      `*[_type == "review"] | order(status == "pending" desc, createdAt desc) ${PROJECTION}`
    );
    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("Failed to load reviews:", error);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
