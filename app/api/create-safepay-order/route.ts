// app/api/create-safepay-order/route.ts
// Mirror of app/api/create-checkout-session/route.ts, but for Safepay (the
// Pakistan-viable gateway). Same safety rules: prices come from Sanity server-
// side, discounts are validated server-side, DELIVERY_FEE is included, and the
// pending order is persisted BEFORE the customer is redirected to Safepay's
// hosted checkout page.
import { NextResponse } from 'next/server';
import { createPendingOrder, fetchProductsByIds } from '@/lib/orders';
import { validateDiscountCode } from '@/lib/discounts';
import { DELIVERY_FEE } from '@/lib/constants';
import { createSafepayCheckout, isSafepayConfigured } from '@/lib/safepay';
import { serverClient } from '@/sanity/lib/server-client';

export async function POST(request: Request) {
  try {
    if (!isSafepayConfigured()) {
      return NextResponse.json(
        { error: 'Safepay is not configured (set SAFEPAY_API_KEY)' },
        { status: 503 }
      );
    }

    const { items, customerEmail, discountCode } = await request.json();
    const customerEmailValue = typeof customerEmail === 'string' ? customerEmail : '';
    const discountCodeValue = typeof discountCode === 'string' ? discountCode : '';

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Never trust client-sent prices: fetch the real products from Sanity.
    const products = await fetchProductsByIds(items.map((item: any) => item.id));
    const productMap = new Map(products.map((p) => [p._id, p]));

    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json(
          { error: `Product no longer available: ${item.id}` },
          { status: 400 }
        );
      }
      const price = product.price;
      const quantity = Math.max(1, Math.min(item.quantity, product.stock || 0));
      subtotal += price * quantity;
      orderItems.push({
        id: product._id,
        name: product.name,
        price,
        quantity,
        size: Array.isArray(item.size) ? item.size : undefined,
      });
    }

    // Validate the discount code server-side.
    const discountResult = discountCodeValue
      ? await validateDiscountCode(discountCodeValue, subtotal)
      : { valid: true as const, discountAmount: 0, code: '' };

    if (!discountResult.valid) {
      return NextResponse.json({ error: discountResult.message }, { status: 400 });
    }

    const total = subtotal - discountResult.discountAmount + DELIVERY_FEE;

    // Persist a pending order in Sanity BEFORE redirecting to Safepay, so the
    // webhook can find it by order_id and mark it paid.
    const { orderId, docId } = await createPendingOrder({
      items: orderItems,
      subtotal,
      total,
      customerEmail: customerEmailValue,
      discountCode: discountResult.code || undefined,
      discountAmount: discountResult.discountAmount,
      paymentMethod: 'safepay',
    });

    const { origin } = new URL(request.url);

    const checkout = await createSafepayCheckout({
      orderId,
      // VERIFIED 2026-08-09 live: Safepay treats `amount` as the MAJOR unit
      // (rupees). amount=21999 appeared in their dashboard as "PKR 21,999.00"
      // — NOT "PKR 219.99". So pass the rupee total (2dp), never paisa.
      amount: Math.round(total * 100) / 100,
      redirectUrl: `${origin}/checkout/success?method=safepay&order_id=${orderId}`,
      cancelUrl: `${origin}/cart`,
      webhookUrl: `${origin}/api/payments/safepay/webhook`,
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
