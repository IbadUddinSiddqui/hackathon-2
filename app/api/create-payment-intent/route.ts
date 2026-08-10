import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createPendingOrder, fetchProductsByIds } from '@/lib/orders';
import { validateDiscountCode } from '@/lib/discounts';
import { DELIVERY_FEE } from '@/lib/constants';
import { enforceRateLimit } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
});

// Sanity check: max order of $10,000.00 to prevent abuse from a tampered client.
const MAX_AMOUNT_CENTS = 1_000_000;

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: 'create-payment-intent', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const items: { id: string; quantity: number; size?: string[] }[] = Array.isArray(body?.items)
      ? body.items
      : [];
    const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail : '';
    const discountCode = typeof body?.discountCode === 'string' ? body.discountCode : '';

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Never trust client-sent prices: fetch the real products from Sanity.
    const products = await fetchProductsByIds(items.map((i) => i.id));
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

    // Validate the discount code server-side — clients can never set their own discount.
    const discountResult = discountCode
      ? await validateDiscountCode(discountCode, subtotal)
      : { valid: true as const, discountAmount: 0, code: '' };

    if (!discountResult.valid) {
      return NextResponse.json(
        { error: discountResult.message },
        { status: 400 }
      );
    }

    // The charged amount is fully computed server-side:
    // subtotal - validated discount + delivery fee, in cents.
    const total = subtotal - discountResult.discountAmount + DELIVERY_FEE;
    const amount = Math.round(total * 100);

    if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT_CENTS) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Persist a pending order in Sanity BEFORE charging, so the webhook can
    // mark it paid, decrement stock, and email the receipt.
    const { orderId } = await createPendingOrder({
      items: orderItems,
      subtotal,
      total: amount / 100,
      customerEmail,
      discountCode: discountResult.code || undefined,
      discountAmount: discountResult.discountAmount,
      // Legacy Stripe flow: Stripe charges USD, so the stored order must be
      // labeled USD to match (the PK storefront uses Safepay/COD in PKR).
      currency: 'usd',
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
      receipt_email: customerEmail || undefined,
      metadata: {
        order_id: orderId,
        amount_cents: String(amount),
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId,
      amount,
    });
  } catch (err: any) {
    console.error('Payment intent error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
