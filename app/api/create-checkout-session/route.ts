// app/api/create-checkout-session/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createPendingOrder, fetchProductsByIds } from '@/lib/orders';
import { validateDiscountCode } from '@/lib/discounts';
import { DELIVERY_FEE } from '@/lib/constants';
import { enforceRateLimit } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: 'create-checkout-session', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    // Parse the incoming request body as JSON
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
      return NextResponse.json(
        { error: discountResult.message },
        { status: 400 }
      );
    }

    // Persist a pending order in Sanity BEFORE redirecting to Stripe.
    const { orderId } = await createPendingOrder({
      items: orderItems,
      subtotal,
      total: subtotal - discountResult.discountAmount + DELIVERY_FEE,
      customerEmail: customerEmailValue,
      discountCode: discountResult.code || undefined,
      discountAmount: discountResult.discountAmount,
      // Legacy Stripe flow: Stripe charges USD, so the stored order must be
      // labeled USD to match (the PK storefront uses Safepay/COD in PKR).
      currency: 'usd',
    });

    // Build line items from REAL Sanity prices (dollars → cents). The imageUrl
    // is only used for display on Stripe's hosted page, so it can come from the
    // client.
    const imageByProduct = new Map(items.map((i: any) => [i.id, i.imageUrl]));

    // Stripe's hosted Checkout does NOT accept negative line-item amounts, so
    // instead of a "Discount" line item we fold the validated discount into the
    // unit amounts themselves. The discount is subtracted from the first item,
    // with any overflow (discount larger than one item) carried to the next.
    // The line items therefore total exactly subtotal - discount, to the cent.
    let discountCents = Math.round(discountResult.discountAmount * 100);
    const lineItems = orderItems.map((item: any) => {
      let unitAmount = Math.round(item.price * 100);
      if (discountCents > 0) {
        const lineTotal = unitAmount * item.quantity;
        const applied = Math.min(lineTotal, discountCents);
        discountCents -= applied;
        // Shave the discount off the unit amount across the quantity, rounding
        // down so the total of this line never exceeds lineTotal - applied.
        unitAmount = Math.floor((lineTotal - applied) / item.quantity);
        // Absorb any cent lost to flooring in the first item so the grand
        // total stays exact.
        if (item.quantity > 1) {
          discountCents += (lineTotal - applied) - unitAmount * item.quantity;
        }
      }
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: imageByProduct.get(item.id) ? [imageByProduct.get(item.id)] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // Determine the origin (base URL) from the request URL
    const { origin } = new URL(request.url);

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // Charge the single DELIVERY_FEE via shipping so the hosted page's total
      // matches the order's stored total (subtotal - discount + DELIVERY_FEE).
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(DELIVERY_FEE * 100),
              currency: 'usd',
            },
            display_name: 'Delivery Fee',
          },
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: customerEmailValue || undefined,
      metadata: {
        order_id: orderId,
      },
    });

    // Return the session id in the JSON response
    return NextResponse.json({ id: session.id, orderId });
  } catch (error: any) {
    console.error('Stripe API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
