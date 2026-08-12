// app/checkout/page.tsx
"use client";
import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useTenant } from '@/lib/tenant-provider';

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
    <div className="mx-auto max-w-md border border-brand-line bg-brand-surface p-7 dark:bg-brand-surface-alt">
      <form onSubmit={placeOrder}>
        <div className="mb-5">
          <label
            htmlFor="cod-email"
            className="mb-1.5 block text-sm font-medium text-brand-ink dark:text-brand-ink-inverse"
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
            className="w-full border border-brand-line bg-transparent px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-ink focus:outline-none dark:border-brand-line dark:text-brand-ink-inverse dark:focus:border-brand-ink-inverse"
          />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cod-giftcard"
              className="mb-1.5 block text-sm font-medium text-brand-ink dark:text-brand-ink-inverse"
            >
              {t(locale, 'checkout.giftCard')}
            </label>
            <input
              id="cod-giftcard"
              type="text"
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value)}
              placeholder="GIFT-1234"
              className="w-full border border-brand-line bg-transparent px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-ink focus:outline-none dark:border-brand-line dark:text-brand-ink-inverse dark:focus:border-brand-ink-inverse"
            />
          </div>
          <div>
            <label
              htmlFor="cod-credit"
              className="mb-1.5 block text-sm font-medium text-brand-ink dark:text-brand-ink-inverse"
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
              className="w-full border border-brand-line bg-transparent px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-ink focus:outline-none dark:border-brand-line dark:text-brand-ink-inverse dark:focus:border-brand-ink-inverse"
            />
          </div>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-brand-muted">
          {t(locale, 'checkout.codNote')}
        </p>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full bg-brand-ink py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-brand-ink-inverse dark:text-brand-ink"
        >
          {loading ? t(locale, 'checkout.placing') : t(locale, 'checkout.placeCod')}
        </button>

        {error && (
          <p className="mt-4 border border-brand-bad/40 bg-brand-bad-soft p-3 text-sm text-brand-bad" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

const CheckoutPage = () => {
  const { locale } = useLocale();
  const { tenant } = useTenant();
  const accent = tenant.accentColor || '#000000';
  const { items, discountCode, discountAmount } = useCartStore();

  // Safepay is behind a feature flag until it's live: set
  // NEXT_PUBLIC_SAFEPAY_ENABLED=true in .env.local to show the option.
  const safepayEnabled = process.env.NEXT_PUBLIC_SAFEPAY_ENABLED === 'true';

  const [paymentMethod, setPaymentMethod] = useState<'safepay' | 'cod'>(
    safepayEnabled ? 'safepay' : 'cod'
  );
  // Direction for the form-swap slide: +1 = towards COD, -1 = towards Safepay
  // (same direction-aware pattern as the testimonials pager).
  const [swapDirection, setSwapDirection] = useState(1);

  const selectPaymentMethod = (method: 'safepay' | 'cod') => {
    if (method === paymentMethod) return;
    setSwapDirection(method === 'cod' ? 1 : -1);
    setPaymentMethod(method);
  };

  // Direction-aware spring swap — the exact values from the testimonials
  // pager (enter/exit slide 64px, spring 260/24, 0.18s tween exit) so the
  // form change feels native to the rest of the site.
  const formSwapVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 64 }),
    center: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 260, damping: 24 },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir * -64,
      transition: { duration: 0.18 },
    }),
  };

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

  const methodBtn = (active: boolean) =>
    active
      ? { borderColor: accent, boxShadow: `inset 0 -2px 0 ${accent}` }
      : undefined;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-brand-surface text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <p className="text-eyebrow mb-3 text-brand-muted">Secure checkout</p>
          <h1 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
            {t(locale, 'checkout.title')}
          </h1>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Order Summary Section */}
            <Card className="rounded-none border border-brand-line bg-brand-surface shadow-none dark:bg-brand-surface-alt">
              <CardHeader className="border-b border-brand-line p-6">
                <CardTitle className="text-lg font-semibold tracking-tight text-brand-ink dark:text-brand-ink-inverse">
                  {t(locale, 'cart.orderSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-brand-muted">{t(locale, 'cart.subtotal')}</span>
                  <span className="font-semibold tabular-nums">{CURRENCY_SYMBOL} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-brand-muted">
                    {t(locale, 'cart.discount')}{discountCode ? ` (${discountCode})` : ''}
                  </span>
                  <span className={`font-semibold tabular-nums ${discount > 0 ? 'text-brand-sale' : ''}`}>
                    {discount > 0
                      ? `-${CURRENCY_SYMBOL} ${discount.toFixed(2)}`
                      : `${CURRENCY_SYMBOL} 0.00`}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-brand-muted">{t(locale, 'cart.delivery')}</span>
                  <span className="font-semibold tabular-nums">{CURRENCY_SYMBOL} {deliveryFee.toFixed(2)}</span>
                </div>
                <Separator className="my-4 bg-brand-line" />
                <div className="flex justify-between font-semibold">
                  <span>{t(locale, 'cart.total')}</span>
                  <span className="text-xl tabular-nums">{CURRENCY_SYMBOL} {total.toFixed(2)}</span>
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-sm font-medium text-brand-ink dark:text-brand-ink-inverse">
                    {t(locale, 'checkout.paymentMethod')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {safepayEnabled && (
                      <button
                        type="button"
                        onClick={() => selectPaymentMethod('safepay')}
                        aria-pressed={paymentMethod === 'safepay'}
                        style={methodBtn(paymentMethod === 'safepay')}
                        className={`border p-4 text-left text-sm transition ${
                          paymentMethod === 'safepay'
                            ? 'border-brand-line-strong bg-brand-surface-alt'
                            : 'border-brand-line hover:border-brand-line-strong'
                        }`}
                      >
                        <span className="block font-semibold text-brand-ink dark:text-brand-ink-inverse">
                          {t(locale, 'checkout.cardSafepay')}
                        </span>
                        <span className="text-xs text-brand-muted">
                          {t(locale, 'checkout.cardSub')}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => selectPaymentMethod('cod')}
                      aria-pressed={paymentMethod === 'cod'}
                      style={methodBtn(paymentMethod === 'cod')}
                      className={`border p-4 text-left text-sm transition ${
                        paymentMethod === 'cod'
                          ? 'border-brand-line-strong bg-brand-surface-alt'
                          : 'border-brand-line hover:border-brand-line-strong'
                      }`}
                    >
                      <span className="block font-semibold text-brand-ink dark:text-brand-ink-inverse">
                        {t(locale, 'checkout.cod')}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {t(locale, 'checkout.codSub')}
                      </span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form (Safepay card or Cash on Delivery) — swaps with a
                direction-aware spring slide instead of an instant cut. */}
            <div id="payment-form" className="scroll-mt-8">
              <AnimatePresence mode="wait" initial={false} custom={swapDirection}>
                <motion.div
                  key={paymentMethod}
                  custom={swapDirection}
                  variants={formSwapVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
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
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CheckoutPage;
