// app/api/admin/customers/route.ts
// P3-02 — admin-only customer list.
//   GET /api/admin/customers?page=1&limit=20&search=ibad
// Unauthenticated → 401.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import {
  parseCustomerListQuery,
  buildCustomerListGroq,
  toCustomerSummary,
} from "@/lib/admin-customers";

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = parseCustomerListQuery(new URL(request.url));
  const { groq, countGroq, params } = buildCustomerListGroq(query);

  try {
    const [docs, total] = await Promise.all([
      serverClient.fetch<unknown[]>(groq, params),
      serverClient.fetch<number>(countGroq, params),
    ]);

    const items = docs.map((doc) =>
      toCustomerSummary(doc as Parameters<typeof toCustomerSummary>[0])
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
    console.error("Failed to list customers:", error);
    return NextResponse.json({ error: "Failed to list customers" }, { status: 500 });
  }
}
