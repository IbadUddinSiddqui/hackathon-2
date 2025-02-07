import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
});

export async function POST() {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        order_id: 'abc123'  // A short order ID or reference (must be <500 characters)
      }
    });
    

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }

    );

    
  }
}