// app/api/create-checkout-session/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(request: Request) {
  try {
    // Parse the incoming request body as JSON
    const { items } = await request.json();

    // Create line items for the Stripe Checkout Session
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.imageUrl],
        },
        unit_amount: Math.round(item.price * 100), // Convert dollars to cents
      },
      quantity: item.quantity,
    }));

    // Determine the origin (base URL) from the request URL
    const { origin } = new URL(request.url);

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id?={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        // Store additional information if needed
        cartItems: JSON.stringify(items),
      },
    });

    // Return the session id in the JSON response
    return NextResponse.json({ id: session.id });
  } catch (error: any) {
    console.error('Stripe API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
