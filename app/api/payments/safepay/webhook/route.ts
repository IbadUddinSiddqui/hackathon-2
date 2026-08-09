// app/api/payments/safepay/webhook/route.ts
//
// Recon-first Safepay webhook handler. Per the P1-16 plan, do NOT build the
// fulfillment logic against Safepay's docs — first see what they actually POST.
//
// Two modes:
//   1. RECON MODE (no SAFEPAY_WEBHOOK_SECRET set): accept every request, log
//      the full headers + raw body, return 200. Run one sandbox transaction
//      and inspect these logs (and ngrok's inspector) to learn the REAL payload
//      structure, event names, and signature header names.
//   2. VERIFIED MODE (SAFEPAY_WEBHOOK_SECRET set): verify the HMAC-SHA256
//      signature and reject mismatches with 401. Fulfillment still belongs in
//      the same idempotent pattern as app/api/webhook/route.ts — add it only
//      after the recon logs confirm the payload shape.
import { NextResponse } from 'next/server';
import { verifySafepaySignature } from '@/lib/safepay';

const LOG_BODY_LIMIT = 5000;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const signature = headers['x-sfpy-signature'] || headers['x-safepay-signature'] || null;
  const timestamp = headers['x-sfpy-timestamp'] || headers['x-safepay-timestamp'] || null;
  const hasSecret = Boolean(process.env.SAFEPAY_WEBHOOK_SECRET);

  // RECON MODE — accept + log everything so we learn the real payload before
  // building fulfillment against potentially-stale docs.
  if (!hasSecret) {
    console.log('[Safepay webhook][RECON] headers:', JSON.stringify(headers, null, 2));
    console.log('[Safepay webhook][RECON] body:', rawBody.slice(0, LOG_BODY_LIMIT));
    return NextResponse.json({ received: true, recon: true });
  }

  const valid = verifySafepaySignature({ rawBody, signature, timestamp });
  if (!valid) {
    console.warn('[Safepay webhook] signature verification FAILED', {
      hasSignature: Boolean(signature),
      hasTimestamp: Boolean(timestamp),
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // VERIFIED MODE — the request is authentic. Parse the payload, find the
  // order by its order_id, and fulfil it exactly like app/api/webhook/route.ts
  // does for Stripe (decrement stock → email receipt → mark paid atomically).
  // TODO(P1-16): add fulfillment once the recon logs confirm the payload shape.
  console.log('[Safepay webhook] verified — body:', rawBody.slice(0, LOG_BODY_LIMIT));

  return NextResponse.json({ received: true });
}
