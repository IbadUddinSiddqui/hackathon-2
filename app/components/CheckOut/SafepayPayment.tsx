// app/components/CheckOut/SafepayPayment.tsx
'use client';

import { useState, FormEvent } from 'react';

export type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string[];
  color?: string;
};

interface SafepayPaymentProps {
  items: CheckoutItem[];
  discountCode?: string;
  giftCardCode?: string;
  creditAmount?: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Safepay (Pakistan) hosted-checkout flow: collect the customer email, create
 * a pending order + Safepay checkout session server-side, then redirect the
 * browser to Safepay's hosted payment page. No card data ever touches this
 * app — Safepay handles it on their page, exactly like Stripe Checkout.
 */
export const SafepayPayment: React.FC<SafepayPaymentProps> = ({
  items,
  discountCode,
  giftCardCode,
  creditAmount,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !EMAIL_RE.test(email)) {
      setError('Please enter a valid email to receive your receipt.');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty. Add items before checking out.');
      return;
    }

    setLoading(true);
    try {
      // The server computes the total from Sanity prices + validated discount
      // + delivery fee, persists a pending order, and creates the Safepay
      // session. The client never sends an amount.
      const response = await fetch('/api/create-safepay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerEmail: email,
          discountCode,
          giftCardCode,
          creditAmount,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to start Safepay checkout');
      }
      if (!data?.redirectUrl) {
        throw new Error('Safepay did not return a checkout URL');
      }

      // Redirect to Safepay's hosted page. When the customer finishes, Safepay
      // redirects back to our success_url; our webhook fulfils the order.
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to start Safepay checkout');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="safepay-email"
            className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200"
          >
            Email for receipt
          </label>
          <input
            id="safepay-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          You will be taken to Safepay&apos;s secure payment page to complete your
          card payment. We never see your card details.
        </p>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {loading ? 'Redirecting to Safepay...' : 'Pay with Card (Safepay)'}
        </button>

        {error && (
          <p className="mt-3 p-3 rounded-md bg-red-100 text-red-700 text-sm" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
};
