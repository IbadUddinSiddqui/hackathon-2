// app/api/cart-capture/route.ts
// P3-06 — persist a shopper's cart server-side when they enter an email at
// checkout but haven't completed the order yet. The checkout page calls this
// on email blur/change so an abandoned session is recoverable later.
// Rate-limited; always returns success (capture must never block checkout).

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { saveAbandonedCart, type CartItemInput } from "@/lib/abandoned-cart";
import { getActiveTenantId } from "@/lib/tenants";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: "cart-capture", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    const items: CartItemInput[] = rawItems
      .map((i: any) => ({
        id: String(i?.id || ""),
        name: String(i?.name || ""),
        price: Number(i?.price) || 0,
        quantity: Math.max(1, Number(i?.quantity) || 1),
        size: Array.isArray(i?.size) ? i.size.map(String) : undefined,
      }))
      .filter((i: CartItemInput) => i.id && i.name);

    if (!email || items.length === 0) {
      return NextResponse.json({ success: true }); // nothing to capture
    }

    await saveAbandonedCart({
      tenantId: await getActiveTenantId(),
      email,
      items,
      checkoutUrl: body?.checkoutUrl || "/checkout",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Never break checkout because capture failed.
    console.error("Cart capture error:", error?.message || error);
    return NextResponse.json({ success: true });
  }
}
