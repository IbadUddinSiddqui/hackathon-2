import { NextResponse } from 'next/server';
import { createPendingOrder, fetchProductsByIds } from '@/lib/orders';
import { validateDiscountCode } from '@/lib/discounts';
import { DELIVERY_FEE } from '@/lib/constants';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * Cash-on-Delivery checkout: mirrors the card flows' server-side pricing
 * (real Sanity prices + validated discount + DELIVERY_FEE) but NEVER touches
 * Stripe. The order is stored as `status: pending`, `payment_method: cod` and
 * an admin marks it paid/refunded from the admin panel after delivery.
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

    if (items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Never trust client-sent prices: fetch the real products from Sanity.
    const products = await fetchProductsByIds(items.map((i) => i.id));
    const productMap = new Map(products.map((p) => [p._id, p]));

    const orderItems: { id: string; name: string; price: number; quantity: number; size?: string[] }[] = [];
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

    const discountResult = discountCode
      ? await validateDiscountCode(discountCode, subtotal)
      : { valid: true as const, discountAmount: 0, code: '' };

    if (!discountResult.valid) {
      return NextResponse.json({ error: discountResult.message }, { status: 400 });
    }

    const total = subtotal - discountResult.discountAmount + DELIVERY_FEE;

    const { orderId } = await createPendingOrder({
      items: orderItems,
      subtotal,
      total,
      customerEmail,
      discountCode: discountResult.code || undefined,
      discountAmount: discountResult.discountAmount,
      paymentMethod: 'cod',
    });

    return NextResponse.json({ success: true, orderId, total });
  } catch (err: any) {
    console.error('COD order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
