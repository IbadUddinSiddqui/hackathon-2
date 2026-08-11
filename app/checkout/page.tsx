// app/checkout/page.tsx
"use client";
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SafepayPayment, type CheckoutItem } from '../components/CheckOut/SafepayPayment';
import { DELIVERY_FEE, CURRENCY_SYMBOL } from '@/lib/constants';
import { useLocale } from '@/lib/locale-provider';
import { t } from '@/lib/i18n';

/** P3-06 — fire-and-forget: persist the cart server-side for recovery. */
async function captureCart(items: CheckoutItem[], email: string) {
  if (!email || items.length === 0) return;
  try {
    await fetch('/api/cart-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, items, checkoutUrl: '/checkout' }),
    });
  } catch {
    // capture is best-effort — never block checkout
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Cash-on-Delivery form: no Stripe, just create the pending order. */
function CodCheckoutForm({
  items,
  discountCode,
}: {
  items: CheckoutItem[];
  discountCode?: string;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  // P3-10/P3-11 — optional store credit + gift card inputs.
  const [giftCardCode, setGiftCardCode] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError(t(locale, 'checkout.validEmail'));
      return;
    }
    setLoading(true);
    setError(null);
    // P3-06: capture before submitting so an abandoned session is recoverable.
    await captureCart(items, email);
    try {
      const res = await fetch('/api/create-cod-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerEmail: email,
          discountCode,
          giftCardCode: giftCardCode.trim() || undefined,
          creditAmount: creditAmount ? Number(creditAmount) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');
      router.push('/checkout/success?method=cod');
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <form onSubmit={placeOrder}>
        <div className="mb-4">
          <label
            htmlFor="cod-email"
            className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200"
          >
            {t(locale, 'checkout.email')}
          </label>
          <input
            id="cod-email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // P3-06: persist on blur so the cart is captured even if they leave.
              if (EMAIL_RE.test(e.target.value)) captureCart(items, e.target.value);
            }}
            onBlur={(e) => EMAIL_RE.test(e.target.value) && captureCart(items, e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cod-giftcard"
              className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200"
            >
              {t(locale, 'checkout.giftCard')}
            </label>
            <input
              id="cod-giftcard"
              type="text"
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value)}
              placeholder="GIFT-1234"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="cod-credit"
              className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200"
            >
              {t(locale, 'checkout.credit')}
            </label>
            <input
              id="cod-credit"
              type="number"
              min="0"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t(locale, 'checkout.codNote')}
        </p>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {loading ? t(locale, 'checkout.placing') : t(locale, 'checkout.placeCod')}
        </button>

        {error && (
          <p className="mt-3 p-3 rounded-md bg-red-100 text-red-700 text-sm" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

const CheckoutPage = () => {
  const { locale } = useLocale();
  const { items, discountCode, discountAmount } = useCartStore();

  // Safepay is behind a feature flag until it's live: set
  // NEXT_PUBLIC_SAFEPAY_ENABLED=true in .env.local to show the option.
  const safepayEnabled = process.env.NEXT_PUBLIC_SAFEPAY_ENABLED === 'true';

  const [paymentMethod, setPaymentMethod] = useState<'safepay' | 'cod'>(
    safepayEnabled ? 'safepay' : 'cod'
  );

  // Calculate order summary values
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountCode ? discountAmount : 0;
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal - discount + deliveryFee;

  const checkoutItems: CheckoutItem[] = items.map((item) => ({
    id: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
  }));

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t(locale, 'checkout.title')}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Summary Section */}
            <Card className="bg-white dark:bg-gray-800 shadow">
              <CardHeader className="bg-gray-100 dark:bg-gray-700 p-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t(locale, 'cart.orderSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400">{t(locale, 'cart.subtotal')}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {CURRENCY_SYMBOL} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t(locale, 'cart.discount')}{discountCode ? ` (${discountCode})` : ''}
                  </span>
                  <span className="font-bold text-red-500">
                    {discount > 0
                      ? `-${CURRENCY_SYMBOL} ${discount.toFixed(2)}`
                      : `${CURRENCY_SYMBOL} 0.00`}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400">{t(locale, 'cart.delivery')}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {CURRENCY_SYMBOL} {deliveryFee.toFixed(2)}
                  </span>
                </div>
                <Separator className="my-4 dark:bg-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-600 dark:text-gray-400">{t(locale, 'cart.total')}</span>
                  <span className="text-xl text-gray-900 dark:text-gray-100">
                    {CURRENCY_SYMBOL} {total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t(locale, 'checkout.paymentMethod')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {safepayEnabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('safepay')}
                        aria-pressed={paymentMethod === 'safepay'}
                        className={`rounded-lg border p-3 text-left text-sm transition ${
                          paymentMethod === 'safepay'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                        }`}
                      >
                        <span className="block font-semibold text-gray-900 dark:text-gray-100">
                          {t(locale, 'checkout.cardSafepay')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t(locale, 'checkout.cardSub')}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      aria-pressed={paymentMethod === 'cod'}
                      className={`rounded-lg border p-3 text-left text-sm transition ${
                        paymentMethod === 'cod'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="block font-semibold text-gray-900 dark:text-gray-100">
                        {t(locale, 'checkout.cod')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t(locale, 'checkout.codSub')}
                      </span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form (Safepay card or Cash on Delivery) */}
            <div id="payment-form" className="scroll-mt-8">
              {paymentMethod === 'safepay' && safepayEnabled ? (
                <SafepayPayment
                  items={checkoutItems}
                  discountCode={discountCode || undefined}
                  giftCardCode={undefined}
                  creditAmount={undefined}
                />
              ) : (
                <CodCheckoutForm items={checkoutItems} discountCode={discountCode || undefined} />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CheckoutPage;
