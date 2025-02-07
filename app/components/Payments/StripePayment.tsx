// components/Payment/StripePayment.tsx
"use client";
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from './Payments';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentProps {
  amount: number;
}

export const StripePayment: React.FC<StripePaymentProps> = ({ amount }) => (
  <Elements stripe={stripePromise}>
    <PaymentForm amount={amount} />
  </Elements>
);
