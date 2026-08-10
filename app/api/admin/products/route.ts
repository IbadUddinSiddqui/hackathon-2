// app/api/admin/products/route.ts
// Admin-only product management API. Node P2-01: paginated + searchable list.
//   GET /api/admin/products?page=1&limit=20&search=tee&category=t-shirts
// Returns `{ items, total, page, pages, limit }`. Unauthenticated → 401.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import {
  parseListQuery,
  buildProductListGroq,
  toProductSummary,
  type ProductSummary,
} from "@/lib/admin-products";

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = parseListQuery(new URL(request.url));
  const { groq, countGroq, params } = buildProductListGroq(query);

  try {
    const [docs, total] = await Promise.all([
      serverClient.fetch<unknown[]>(groq, params),
      serverClient.fetch<number>(countGroq, params),
    ]);

    const items: ProductSummary[] = docs.map((doc) =>
      toProductSummary(doc as Parameters<typeof toProductSummary>[0])
    );
    const pages = Math.max(1, Math.ceil(total / query.limit));

    return NextResponse.json({
      items,
      total,
      page: query.page,
      pages,
      limit: query.limit,
    });
  } catch (error: any) {
    console.error("Failed to list products:", error);
    return NextResponse.json({ error: "Failed to list products" }, { status: 500 });
  }
}
