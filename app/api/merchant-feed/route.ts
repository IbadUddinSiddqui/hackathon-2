// app/api/merchant-feed/route.ts
// P3-19 — Google Merchant Center shopping feed.
//   GET /api/merchant-feed → application/xml

import { NextResponse } from "next/server";
import { fetchFeedProducts, buildFeedXml } from "@/lib/merchant-feed";
import { getActiveTenantId } from "@/lib/tenants";

export async function GET() {
  try {
    // P4-03 — the feed is tenant-scoped (resolved from the Host header).
    const tenantId = await getActiveTenantId();
    const products = await fetchFeedProducts(tenantId);
    const xml = buildFeedXml(products);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Merchant feed error:", error);
    return NextResponse.json({ error: "Failed to build merchant feed" }, { status: 500 });
  }
}
