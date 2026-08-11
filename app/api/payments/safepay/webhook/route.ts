// app/api/payments/safepay/webhook/route.ts
//
// Safepay webhook handler. Signature verification is PROVEN against the live
// sandbox (HMAC-SHA256 over `${timestamp}.${rawBody}` with the base64-decoded
// secret, header `X-SFPY-SIGNATURE: sha256=<hex>`, `X-SFPY-TIMESTAMP`).
//
// Fulfillment mirrors the Stripe webhook (app/api/webhook/route.ts) with the
// same idempotency guarantees: stock/email run FIRST so any throw returns an
// error → Safepay retries → order is still 'pending' when retried. The final
// mark-paid uses an optimistic revision lock so two deliveries can never
// double-decrement stock.
//
// The payload SHAPE is still being recon'd (only one real delivery has been
// observed, which failed signature under the old secret), so parsing is
// deliberately defensive: every verified request is logged with full headers +
// body, unknown event names are acknowledged but NOT fulfilled, and anything
// we learn about the real shape goes straight back into this file.
import { NextResponse } from 'next/server';
import { verifySafepaySignature } from '@/lib/safepay';
import { getPaymentConfig } from '@/lib/tenants';
import { enforceRateLimit } from '@/lib/rate-limit';
import {
  findOrderByOrderId,
  findOrderByTrackerToken,
  markOrderPaid,
  persistCustomerEmail,
  decrementProductStock,
  type OrderDocument,
} from '@/lib/orders';
import { sendOrderReceipt } from '@/lib/email';
import { incrementDiscountUsage } from '@/lib/discounts';
import { addLoyaltyPoints } from '@/lib/customers';
import { pointsEarned } from '@/lib/loyalty';
import { serverClient } from '@/sanity/lib/server-client';

const LOG_BODY_LIMIT = 8000;

/** First non-empty value among keys, walking nested shapes too. */
function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/** Recover the order_id we passed to Safepay at init time. */
function extractOrderId(data: any): string | undefined {
  const candidates = [
    data?.data?.order_id,
    data?.order?.order_id,
    data?.payload?.order?.order_id,
    data?.data?.metadata?.order_id,
    data?.metadata?.order_id,
    data?.orderId,
    data?.order_id,
  ];
  return pick(data, ['orderId', 'order_id']) ?? candidates.find(Boolean);
}

/** Recover a human-readable event name, whatever the casing/nesting. */
function extractEventName(data: any): string {
  const raw =
    pick(data, ['event', 'type', 'event_type', 'eventName']) ??
    data?.data?.event ??
    data?.data?.type ??
    data?.event?.type ??
    '';
  return String(raw || '').toLowerCase();
}

/**
 * Fulfil an order that Safepay reports as paid: decrement stock, email the
 * receipt, then atomically mark the order paid (revision-locked so duplicate
 * webhook deliveries can never fulfil twice). Mirrors app/api/webhook/route.ts.
 */
async function fulfilOrder(
  order: OrderDocument,
  safepayIds: { trackerToken?: string; reference?: string },
  customerEmailFromPayload?: string
) {
  if (order.status === 'paid') {
    console.log('Safepay: order already fulfilled, skipping:', order.order_id);
    return;
  }

  if (customerEmailFromPayload) {
    await persistCustomerEmail(order.order_id, customerEmailFromPayload);
  }

  // 1. Decrement stock (throws → webhook 500 → Safepay retries).
  const orderItems = order.items.map((item) => ({
    id: item.product?._ref || '',
    quantity: item.quantity,
  }));
  await decrementProductStock(orderItems.filter((i) => i.id));

  // 2. Email receipt (never fails the webhook — failures are logged).
  const recipientEmail = customerEmailFromPayload || order.customer_email;
  if (recipientEmail) {
    await sendOrderReceipt({
      to: recipientEmail,
      orderId: order.order_id,
      items: order.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
      })),
      total: order.total || 0,
    }).catch((err) => console.error('Receipt email failed:', err.message));
  }

  // 3. Mark paid LAST, atomically (ifRevisionId prevents double-fulfil). No
  //    Stripe IDs involved — Safepay identifiers are persisted separately below.
  const claimed = await markOrderPaid(order, {});
  if (!claimed) {
    console.log('Safepay: order already claimed by a concurrent webhook:', order.order_id);
    return;
  }

  // 4. Persist the Safepay identifiers for the admin order detail view.
  if (safepayIds.trackerToken || safepayIds.reference) {
    try {
      await serverClient
        .patch(order._id)
        .setIfMissing({
          safepay_tracker_token: safepayIds.trackerToken || '',
          safepay_reference: safepayIds.reference || '',
        })
        .commit();
    } catch (err: any) {
      console.error('Failed to persist Safepay IDs:', err.message);
    }
  }

  // 5. Bump the discount code's usage counter now that the order is paid.
  if (order.discount_code) {
    try {
      await incrementDiscountUsage(order.discount_code, order.tenantId);
    } catch (err: any) {
      console.error('Failed to increment discount usage:', err.message);
    }
  }

  // 6. P3-14 — credit loyalty points (1 per Rs 100 of the paid total).
  const recipient = customerEmailFromPayload || order.customer_email;
  const points = pointsEarned(order.total || 0);
  if (points > 0 && recipient) {
    try {
      await addLoyaltyPoints(recipient, points, order.tenantId);
    } catch (err: any) {
      console.error('Failed to award loyalty points:', err.message);
    }
  }
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: 'safepay-webhook',
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const signature = headers['x-sfpy-signature'] || headers['x-safepay-signature'] || null;
  const timestamp = headers['x-sfpy-timestamp'] || headers['x-safepay-timestamp'] || null;

  // ALWAYS log every request (headers + body) so ANY Safepay delivery — signed
  // or not — is fully captured for recon. Remove before production hardening.
  console.log('[Safepay webhook][ALL] headers:', JSON.stringify(headers));
  console.log('[Safepay webhook][ALL] body:', rawBody.slice(0, LOG_BODY_LIMIT));

  let data: any = {};
  try {
    data = JSON.parse(rawBody);
  } catch {
    // Malformed body — acknowledge so Safepay stops retrying, but log loudly.
    console.error('[Safepay webhook] body is not valid JSON — not fulfilling');
    return NextResponse.json({ received: true });
  }

  const eventName = extractEventName(data);
  const orderId = extractOrderId(data);
  const customerEmail =
    data?.data?.customer?.email ?? data?.data?.email ?? data?.customer?.email ?? undefined;
  const trackerToken =
    data?.data?.tracker_token ?? data?.data?.tracker?.token ?? data?.tracker_token ?? undefined;
  const reference =
    data?.data?.reference ?? data?.data?.id ?? data?.data?.transaction?.id ?? data?.reference ?? undefined;

  // P4-06 — verify against the PLATFORM secret first (covers the default
  // tenant, the common case) WITHOUT touching Sanity. Only if that fails do we
  // look up the order and retry with the tenant's own webhook secret — so
  // unauthenticated requests can't trigger Sanity reads. If no secret exists
  // at all, stay in RECON MODE (accept + log) while we learn the real payload.
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
  let  valid =
    Boolean(webhookSecret) &&
    verifySafepaySignature({ rawBody, signature, timestamp, webhookSecret });

  let order: Awaited<ReturnType<typeof findOrderByOrderId>> = null;
  let matchedOrder: Awaited<ReturnType<typeof findOrderByOrderId>> = null;
  if (!valid) {
    order = orderId ? await findOrderByOrderId(orderId) : null;
    matchedOrder =
      order ?? (trackerToken ? await findOrderByTrackerToken(trackerToken) : null);

    if (matchedOrder?.tenantId && matchedOrder.tenantId !== 'tenant-anks') {
      try {
        const cfg = await getPaymentConfig(matchedOrder.tenantId);
        if (cfg.safepayWebhookSecret) {
          valid = verifySafepaySignature({
            rawBody,
            signature,
            timestamp,
            webhookSecret: cfg.safepayWebhookSecret,
          });
        }
      } catch (err: any) {
        console.error('[Safepay webhook] failed to load tenant payment config:', err.message);
      }
    }
  }

  // RECON MODE — no secret configured (platform or tenant): accept + log
  // everything so we learn the real payload before trusting any assumed shape.
  if (!webhookSecret && !valid) {
    console.log('[Safepay webhook][RECON] headers:', JSON.stringify(headers, null, 2));
    console.log('[Safepay webhook][RECON] body:', rawBody.slice(0, LOG_BODY_LIMIT));
    return NextResponse.json({ received: true, recon: true });
  }

  if (!valid) {
    console.warn('[Safepay webhook] signature verification FAILED', {
      hasSignature: Boolean(signature),
      hasTimestamp: Boolean(timestamp),
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Resolve the order for fulfillment (already resolved above when the
  // platform secret didn't match; otherwise do it now).
  if (!matchedOrder) {
    order = orderId ? await findOrderByOrderId(orderId) : null;
    matchedOrder =
      order ?? (trackerToken ? await findOrderByTrackerToken(trackerToken) : null);
  }

  // VERIFIED MODE — the request is authentic. Always log the full body so we
  // keep learning the real shape even as fulfillment runs.
  console.log('[Safepay webhook] verified — headers:', JSON.stringify(headers));
  console.log('[Safepay webhook] verified — body:', rawBody.slice(0, LOG_BODY_LIMIT));

  console.log('[Safepay webhook] parsed', {
    eventName: eventName || '(none)',
    orderId: orderId || '(none)',
    hasCustomerEmail: Boolean(customerEmail),
  });

  // Success vs failure detection, loose on purpose (recon-first). If we can't
  // recognize the event, acknowledge without fulfilling — never guess.
  const isSuccess = /(success|succeeded|completed|capture|paid)/.test(eventName);
  const isFailure = /(failed|cancelled|canceled|declined|rejected|error)/.test(eventName);

  if (!matchedOrder) {
    console.warn('[Safepay webhook] order not found', {
      orderId: orderId || '(none)',
      trackerToken: trackerToken || '(none)',
    });
    return NextResponse.json({ received: true });
  }

  if (isSuccess) {
    await fulfilOrder(matchedOrder, { trackerToken, reference }, customerEmail);
  } else if (isFailure) {
    // Payment failed — mark the order failed (only if still pending) so the
    // admin panel reflects reality. Stock was never decremented for it.
    console.log('[Safepay webhook] payment failure event — marking order failed:', matchedOrder.order_id);
    if (matchedOrder.status === 'pending') {
      try {
        await serverClient.patch(matchedOrder._id).set({ status: 'failed' }).commit();
      } catch (err: any) {
        console.error('[Safepay webhook] failed to mark order failed:', err.message);
      }
    }
  } else {
    console.warn(
      '[Safepay webhook] unrecognized event name, acknowledged but NOT fulfilled:',
      eventName
    );
  }

  return NextResponse.json({ received: true });
}
