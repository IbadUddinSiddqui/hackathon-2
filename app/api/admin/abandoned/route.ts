// app/api/admin/abandoned/route.ts
// P3-08 — admin-only abandoned-cart list + manual "send reminder now".
//   GET  /api/admin/abandoned                     → { carts }
//   POST /api/admin/abandoned { id }              → sends reminder, marks reminded
// Unauthenticated → 401.

import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { remindCart, type AbandonedCartDoc } from "@/lib/abandoned-cart";
import { getTenantContext, tenantFilter } from "@/lib/tenants";

const PROJECTION = `{
  _id, email, items, subtotal, checkoutUrl, status, remindedAt, createdAt
}`;

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const carts = await serverClient.fetch(
      `*[_type == "abandonedCart" && ${tenantFilter()}] | order(createdAt desc) ${PROJECTION}`,
      { tenantId: ctx.tenantId }
    );
    return NextResponse.json({ carts });
  } catch (error: any) {
    console.error("Failed to load abandoned carts:", error);
    return NextResponse.json({ error: "Failed to load abandoned carts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Missing cart id" }, { status: 400 });
  }

  try {
    const cart: AbandonedCartDoc | null = await serverClient.fetch(
      `*[_id == $id && ${tenantFilter()}][0]${PROJECTION}`,
      { id, tenantId: ctx.tenantId }
    );
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }
    const sent = await remindCart(cart);
    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Failed to send reminder:", error);
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
  }
}
