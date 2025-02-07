// components/Payment/PaymentForm.tsx
"use client";
import React, { useState, FormEvent } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentFormProps {
  amount: number; // Amount in cents
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'failure' | null;
    message: string;
  }>({ status: null, message: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setPaymentResult({
        status: 'failure',
        message: 'Stripe not initialized',
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Create payment method
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (createError || !paymentMethod) {
        throw createError || new Error('Payment method creation failed');
      }

      // 2. Create payment intent (call your backend with dynamic amount)
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }), // Use the passed amount in cents
      });

      if (!response.ok) throw new Error('Failed to create payment intent');

      const { clientSecret } = await response.json();

      // 3. Confirm payment with client secret
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) throw confirmError;
      if (!paymentIntent) throw new Error('Payment confirmation failed');

      setPaymentResult({
        status: 'success',
        message: `Payment successful! ID: ${paymentIntent.id}`,
      });
    } catch (err: any) {
      setPaymentResult({
        status: 'failure',
        message: err.message || 'Payment failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>

        {paymentResult.status && (
          <div
            className={`mt-4 p-3 rounded-md ${
              paymentResult.status === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {paymentResult.message}
          </div>
        )}
      </form>
    </div>
  );
};
