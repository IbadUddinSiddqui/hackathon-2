// app/api/create-safepay-order/route.ts
// Creates a Safepay checkout session for a pending order (the Pakistan-viable
// gateway; the legacy Stripe routes were removed). Same safety rules: prices
// come from Sanity server-
// side, discounts are validated server-side, DELIVERY_FEE is included, and the
// pending order is persisted BEFORE the customer is redirected to Safepay's
// hosted checkout page.
import { NextResponse } from 'next/server';
import { createPendingOrder } from '@/lib/orders';
import { priceCheckout } from '@/lib/checkout-pricing';
import { createSafepayCheckout, isSafepayConfigured } from '@/lib/safepay';
import { serverClient } from '@/sanity/lib/server-client';
import { enforceRateLimit } from '@/lib/rate-limit';
import { linkCustomerToOrder } from '@/lib/customers';
import { markCartCompleted } from '@/lib/abandoned-cart';
import { getActiveTenantId, getPaymentConfig } from '@/lib/tenants';
import { recordUsage } from '@/lib/billing';

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: 'create-safepay-order', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { items, customerEmail, discountCode, giftCardCode, creditAmount } = await request.json();
    const customerEmailValue = typeof customerEmail === 'string' ? customerEmail : '';
    const discountCodeValue = typeof discountCode === 'string' ? discountCode : '';
    const giftCardCodeValue = typeof giftCardCode === 'string' ? giftCardCode : '';
    const creditAmountValue =
      typeof creditAmount === 'number' && Number.isFinite(creditAmount)
        ? Math.max(0, creditAmount)
        : 0;

    // P4-03/P4-06: the order belongs to the tenant serving this request, and
    // its own Safepay keys/currency apply (falling back to env vars).
    const tenantId = await getActiveTenantId();
    const paymentConfig = await getPaymentConfig(tenantId);

    if (!isSafepayConfigured(paymentConfig.safepayApiKey)) {
      return NextResponse.json(
        { error: 'Safepay is not configured for this store (set SAFEPAY_API_KEY or a tenant payment config)' },
        { status: 503 }
      );
    }

    // Server-side pricing: real Sanity prices (flash-sale aware), validated
    // discount + gift card, store credit capped at balance, delivery fee last.
    const priced = await priceCheckout({
      tenantId,
      items,
      customerEmail: customerEmailValue,
      discountCode: discountCodeValue,
      giftCardCode: giftCardCodeValue,
      creditAmount: creditAmountValue,
    });
    if ('error' in priced) {
      return NextResponse.json({ error: priced.error }, { status: 400 });
    }

    // Persist a pending order in Sanity BEFORE redirecting to Safepay, so the
    // webhook can find it by order_id and mark it paid.
    const { orderId, docId } = await createPendingOrder({
      tenantId,
      items: priced.items,
      subtotal: priced.subtotal,
      total: priced.total,
      customerEmail: customerEmailValue,
      discountCode: priced.discountCode,
      discountAmount: priced.discountAmount,
      giftCardCode: priced.giftCardCode,
      giftCardApplied: priced.giftCardApplied,
      creditApplied: priced.creditApplied,
      pointsEarned: priced.pointsEarned,
      paymentMethod: 'safepay',
    });

    // P3-01: upsert the customer doc (by email) + attach the reference.
    await linkCustomerToOrder({
      orderDocId: docId,
      tenantId,
      email: customerEmailValue,
      orderTotal: priced.total,
    });
    // P3-06: this email just started paying — mark their abandoned cart recovered.
    await markCartCompleted(customerEmailValue, tenantId);
    // P4-07: meter this order against the tenant's plan.
    await recordUsage(tenantId, 'orders', 1);

    // PUBLIC_BASE_URL lets us hand Safepay a reachable server-to-server URL
    // during local dev (e.g. the ngrok tunnel). Without it, `origin` is
    // http://localhost:3000 and Safepay's servers can never POST the webhook
    // back to us. In production this is the real domain.
    const baseUrl = process.env.PUBLIC_BASE_URL || new URL(request.url).origin;

    const checkout = await createSafepayCheckout({
      orderId,
      // VERIFIED 2026-08-09 live: Safepay treats `amount` as the MAJOR unit
      // (rupees). amount=21999 appeared in their dashboard as "PKR 21,999.00"
      // — NOT "PKR 219.99". So pass the rupee total (2dp), never paisa.
      amount: Math.round(priced.total * 100) / 100,
      currency: paymentConfig.currency,
      apiKey: paymentConfig.safepayApiKey,
      redirectUrl: `${baseUrl}/checkout/success?method=safepay&order_id=${orderId}`,
      cancelUrl: `${baseUrl}/cart`,
      webhookUrl: `${baseUrl}/api/payments/safepay/webhook`,
    });

    // Persist the Safepay tracker token on the order so the webhook can still
    // find this order by token if its payload doesn't carry our order_id.
    if (checkout.token) {
      try {
        await serverClient
          .patch(docId)
          .setIfMissing({ safepay_tracker_token: checkout.token })
          .commit();
      } catch (err: any) {
        console.error('Failed to persist Safepay tracker token:', err.message);
      }
    }

    return NextResponse.json({ redirectUrl: checkout.redirectUrl, orderId });
  } catch (error: any) {
    console.error('Safepay API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
