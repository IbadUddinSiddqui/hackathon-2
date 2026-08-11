import { NextResponse } from 'next/server';
import { createPendingOrder } from '@/lib/orders';
import { priceCheckout } from '@/lib/checkout-pricing';
import { enforceRateLimit } from '@/lib/rate-limit';
import { linkCustomerToOrder } from '@/lib/customers';
import { markCartCompleted } from '@/lib/abandoned-cart';
import { getActiveTenantId } from '@/lib/tenants';
import { recordUsage } from '@/lib/billing';

/**
 * Cash-on-Delivery checkout: mirrors the card flows' server-side pricing
 * (real Sanity prices + validated discount + gift card + store credit +
 * DELIVERY_FEE) but NEVER touches Stripe. The order is stored as
 * `status: pending`, `payment_method: cod` and an admin marks it paid/refunded
 * from the admin panel after delivery.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: 'create-cod-order', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const items: { id: string; quantity: number; size?: string[] }[] = Array.isArray(
      body?.items
    )
      ? body.items
      : [];
    const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail : '';
    const discountCode = typeof body?.discountCode === 'string' ? body.discountCode : '';
    const giftCardCode = typeof body?.giftCardCode === 'string' ? body.giftCardCode : '';
    const creditAmount =
      typeof body?.creditAmount === 'number' && Number.isFinite(body.creditAmount)
        ? Math.max(0, body.creditAmount)
        : 0;

    // P4-03: the order belongs to the tenant serving this request (Host header).
    const tenantId = await getActiveTenantId();

    // Server-side pricing: real Sanity prices, validated discount/gift card,
    // store credit capped at the balance, delivery fee added last.
    const priced = await priceCheckout({
      tenantId,
      items,
      customerEmail,
      discountCode,
      giftCardCode,
      creditAmount,
    });
    if ('error' in priced) {
      return NextResponse.json({ error: priced.error }, { status: 400 });
    }

    const { orderId, docId } = await createPendingOrder({
      tenantId,
      items: priced.items,
      subtotal: priced.subtotal,
      total: priced.total,
      customerEmail,
      discountCode: priced.discountCode,
      discountAmount: priced.discountAmount,
      giftCardCode: priced.giftCardCode,
      giftCardApplied: priced.giftCardApplied,
      creditApplied: priced.creditApplied,
      pointsEarned: priced.pointsEarned,
      paymentMethod: 'cod',
    });

    // P3-01: upsert the customer doc (by email) + attach the reference.
    await linkCustomerToOrder({ orderDocId: docId, tenantId, email: customerEmail, orderTotal: priced.total });
    // P3-06: this email just ordered — their abandoned cart is recovered.
    await markCartCompleted(customerEmail, tenantId);
    // P4-07: meter this order against the tenant's plan.
    await recordUsage(tenantId, 'orders', 1);

    return NextResponse.json({ success: true, orderId, total: priced.total });
  } catch (err: any) {
    console.error('COD order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
