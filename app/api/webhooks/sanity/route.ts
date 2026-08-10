// app/api/webhooks/sanity/route.ts
// Sanity → Typesense automatic search-index sync (P2-EPIC-06).
//   POST /api/webhooks/sanity  — verified by x-sanity-webhook-signature
//   GET  /api/webhooks/sanity  — Sanity's test ping
//
// Setup (dashboard, human step): Sanity → API → Webhooks → create webhook for
// dataset "production", URL <PUBLIC_BASE_URL>/api/webhooks/sanity, trigger
// create/update/delete on the `product` document type, secret = SANITY_WEBHOOK_SECRET.

import { NextResponse } from "next/server";
import { verifySanityWebhookSignature, getSanityDocumentId } from "@/lib/sanity-webhook";
import { syncProductToSearch, removeProductFromSearch } from "@/lib/search-sync";

export async function GET() {
  // Sanity sends a verification ping on webhook creation.
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const rawBody = await request.text();
  const signature = request.headers.get("x-sanity-webhook-signature");

  if (!secret || !verifySanityWebhookSignature(secret, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { _type?: string; _id?: string; operation?: string } | null = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Only index product documents; ignore image assets, users, orders etc.
  if (!body || body._type !== "product" || !body._id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const id = getSanityDocumentId(body._id);

  try {
    if (body.operation === "delete") {
      await removeProductFromSearch(id);
    } else {
      await syncProductToSearch(id);
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Search sync webhook failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
