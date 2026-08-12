// app/components/CheckOut/SafepayPayment.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useLocale } from '@/lib/locale-provider';
import { t } from '@/lib/i18n';

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
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !EMAIL_RE.test(email)) {
      setError(t(locale, 'checkout.validEmail'));
      return;
    }
    if (items.length === 0) {
      setError(t(locale, 'cart.empty'));
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
    <div className="mx-auto max-w-md border border-brand-line bg-brand-surface p-7 dark:bg-brand-surface-alt">
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="safepay-email"
            className="mb-1.5 block text-sm font-medium text-brand-ink dark:text-brand-ink-inverse"
          >
            {t(locale, 'checkout.email')}
          </label>
          <input
            id="safepay-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-brand-line bg-transparent px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-ink focus:outline-none dark:border-brand-line dark:text-brand-ink-inverse dark:focus:border-brand-ink-inverse"
          />
        </div>

        <p className="mb-5 text-sm leading-relaxed text-brand-muted">
          {t(locale, 'checkout.cardSub')} — {t(locale, 'checkout.cardSafepay')}
        </p>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full bg-brand-ink py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-brand-ink-inverse dark:text-brand-ink"
        >
          {loading ? t(locale, 'checkout.placing') : t(locale, 'checkout.cardSafepay')}
        </button>

        {error && (
          <p className="mt-4 border border-brand-bad/40 bg-brand-bad-soft p-3 text-sm text-brand-bad" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
};
