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
    const { orderId } = await createPendingOrder({
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
      // Store prices + DELIVERY_FEE are in PKR; Safepay takes the amount in
      // the lowest currency unit, so multiply by 100 (paisa).
      amount: Math.round(total * 100),
      redirectUrl: `${origin}/checkout/success?method=safepay&order_id=${orderId}`,
      cancelUrl: `${origin}/cart`,
      webhookUrl: `${origin}/api/payments/safepay/webhook`,
    });

    return NextResponse.json({ redirectUrl: checkout.redirectUrl, orderId });
  } catch (error: any) {
    console.error('Safepay API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
