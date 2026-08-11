// app/api/recommendations/route.ts
// P4-11 — GET /api/recommendations?productId=<id>&limit=6
// Returns ranked product recommendations (co-purchase + category + rating).
// Tenant is resolved from the Host header so each store sees its own data.

import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendations";
import { getActiveTenantId } from "@/lib/tenants";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "recommendations",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const rawLimit = Number(url.searchParams.get("limit") || 6);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 12) : 6;

  try {
    const tenantId = await getActiveTenantId();
    const result = await getRecommendations({ tenantId, productId, limit });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
    });
  } catch (error: any) {
    console.error("Recommendations error:", error);
    return NextResponse.json({ error: "Failed to load recommendations" }, { status: 500 });
  }
}
