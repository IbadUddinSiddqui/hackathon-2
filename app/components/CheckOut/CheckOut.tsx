'use client';

import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, FormEvent } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentResult {
  status: 'success' | 'failure' | null;
  message: string;
}

export const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult>({
    status: null,
    message: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setPaymentResult({
        status: 'failure',
        message: 'Stripe not initialized'
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

      // 2. Create payment intent (call your backend)
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1000 }), // $10.00
      });

      if (!response.ok) throw new Error('Failed to create payment intent');

      // 3. Confirm payment with client secret
      const { clientSecret } = await response.json();
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
        message: `Payment successful! ID: ${paymentIntent.id}`
      });
    } catch (err: any) {
      setPaymentResult({
        status: 'failure',
        message: err.message || 'Payment failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm">
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
          {loading ? 'Processing...' : 'Pay Here'}
        </button>

        {paymentResult.status && (
          <div className={`mt-4 p-3 rounded-md ${
            paymentResult.status === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {paymentResult.message}
          </div>
        )}
      </form>
    </div>
  );
};

interface StripePaymentProps {
    amount: number|null;
  }
  
  

// Wrap in Elements provider
// Wrap in Elements provider
export const StripePayment: React.FC<StripePaymentProps> = ({ amount }) => {
    // Move console.log outside the return statement
    console.log(amount);
    
    return (
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    );
  };