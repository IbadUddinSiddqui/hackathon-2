// app/api/cron/abandoned-cart/route.ts
// P3-07 — recovery-email trigger. Finds carts untouched for > 24h and sends
// the reminder (idempotent: reminded carts are never re-sent). Called by
// Vercel Cron (see vercel.json / P3-09) or manually. Also guarded by a shared
// CRON_SECRET so strangers can't burn your email quota.

import { NextResponse } from "next/server";
import { findRecoverableCarts, remindCart } from "@/lib/abandoned-cart";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const carts = await findRecoverableCarts();
    let reminded = 0;
    let failed = 0;

    for (const cart of carts) {
      try {
        if (await remindCart(cart)) reminded++;
      } catch (err: any) {
        failed++;
        console.error("Recovery email failed for", cart.email, err?.message);
      }
    }

    return NextResponse.json({ scanned: carts.length, reminded, failed });
  } catch (error: any) {
    console.error("Abandoned-cart cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
