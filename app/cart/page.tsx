"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { DELIVERY_FEE, CURRENCY_SYMBOL } from '@/lib/constants';
import { useLocale } from '@/lib/locale-provider';
import { t } from '@/lib/i18n';
import CartRecommendations from '../components/Recommendations/CartRecommendations';

const CartPage = () => {
  const router = useRouter();
  const { locale } = useLocale();
  const { items, updateQuantity, removeItem, discountCode, discountAmount, setDiscount, clearDiscount } = useCartStore();
  const [codeInput, setCodeInput] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountCode ? discountAmount : 0;
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal - discount + deliveryFee;

  const applyDiscountCode = async () => {
    if (!codeInput.trim()) {
      setCodeError('Enter a discount code');
      return;
    }
    setApplyingCode(true);
    setCodeError(null);
    try {
      const response = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput, subtotal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to validate code');
      if (!data.valid) {
        setCodeError(data.message || 'Invalid discount code');
        clearDiscount();
        return;
      }
      setDiscount(data.code, data.discountAmount);
    } catch (error: any) {
      setCodeError(error.message || 'Failed to validate code');
    } finally {
      setApplyingCode(false);
    }
  };

  const removeDiscountCode = () => {
    clearDiscount();
    setCodeInput('');
    setCodeError(null);
  };

  // Stripe is retired for this PK-only store; the checkout page now offers
  // Safepay (card) and Cash on Delivery. Just navigate there.
  const handleCheckout = () => {
    router.push('/checkout');
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-brand-surface text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Cart Section */}
            <section className="lg:col-span-2">
              <p className="text-eyebrow mb-3 text-brand-muted">Bag</p>
              <h1 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
                {t(locale, 'cart.title')}
              </h1>

              {items.length === 0 ? (
                <div className="border-y border-brand-line py-20 text-center">
                  <p className="text-xl text-brand-muted">{t(locale, 'cart.empty')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-brand-line border-y border-brand-line">
                  {items.map(item => (
                    <li key={item._id} className="flex flex-wrap items-center gap-5 py-6 sm:flex-nowrap">
                      <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-brand-surface-alt dark:bg-brand-charcoal">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={96}
                          height={112}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-brand-ink dark:text-brand-ink-inverse">
                          {item.name}
                        </h3>
                        <dl className="mt-1.5 space-y-px text-xs text-brand-muted">
                          <div>
                            <dt className="inline">{t(locale, 'cart.price')}</dt>{' '}
                            <dd className="inline font-medium tabular-nums">
                              {CURRENCY_SYMBOL} {fmt(item.price)}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline">{t(locale, 'cart.stock')}</dt>{' '}
                            <dd className="inline">{item.stock} {t(locale, 'cart.available')}</dd>
                          </div>
                          {item.color && (
                            <div>
                              <dt className="inline">{t(locale, 'cart.color')}: </dt>
                              <dd className="inline font-medium">{item.color}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      <div className="flex items-center gap-3">
                        <label htmlFor={`qty-${item._id}`} className="sr-only">Quantity</label>
                        <input
                          id={`qty-${item._id}`}
                          type="number"
                          min="1"
                          max={item.stock ?? undefined}
                          value={item.quantity}
                          onChange={(e) => {
                            let value = Number(e.target.value);
                            value = Math.max(1, Math.min(value, item.stock ?? value));
                            updateQuantity(item._id, value);
                          }}
                          className="w-18 border border-brand-line bg-transparent px-3 py-2 text-sm tabular-nums focus:border-brand-ink focus:outline-none dark:border-brand-line dark:focus:border-brand-ink-inverse"
                        />
                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-2 text-brand-muted transition-colors hover:text-brand-bad"
                          aria-label={t(locale, 'cart.remove')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Order Summary Section */}
            <section>
              <div className="border border-brand-line p-7">
                <h2 className="mb-6 text-lg font-semibold tracking-tight">
                  {t(locale, 'cart.orderSummary')}
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">{t(locale, 'cart.subtotal')}</span>
                    <span className="font-semibold tabular-nums">{CURRENCY_SYMBOL} {fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">
                      {t(locale, 'cart.discount')}{discountCode ? ` (${discountCode})` : ''}
                    </span>
                    <span className={`font-semibold tabular-nums ${discount > 0 ? 'text-brand-sale' : ''}`}>
                      {discount > 0 ? `-${CURRENCY_SYMBOL} ${discount.toFixed(2)}` : `${CURRENCY_SYMBOL} 0.00`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">{t(locale, 'cart.delivery')}</span>
                    <span className="font-semibold tabular-nums">{CURRENCY_SYMBOL} {deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-brand-line" />
                  <div className="flex justify-between text-base font-semibold">
                    <span>{t(locale, 'cart.total')}</span>
                    <span className="tabular-nums">{CURRENCY_SYMBOL} {fmt(total)}</span>
                  </div>

                  {/* Discount code */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={t(locale, 'cart.enterCode')}
                        value={codeInput}
                        onChange={(e) => {
                          setCodeInput(e.target.value);
                          setCodeError(null);
                        }}
                        className="h-10 rounded-none border-brand-line bg-transparent focus:border-brand-ink focus:ring-0 dark:focus:border-brand-ink-inverse"
                      />
                      {discountCode ? (
                        <Button
                          variant="outline"
                          onClick={removeDiscountCode}
                          className="h-10 shrink-0 rounded-none border-brand-line-strong text-brand-muted hover:border-brand-ink hover:text-brand-ink"
                        >
                          {t(locale, 'cart.remove')}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={applyDiscountCode}
                          disabled={applyingCode}
                          className="h-10 shrink-0 rounded-none border-brand-line-strong text-brand-muted hover:border-brand-ink hover:text-brand-ink"
                        >
                          {applyingCode ? '...' : t(locale, 'cart.apply')}
                        </Button>
                      )}
                    </div>
                    {codeError && (
                      <p className="text-xs text-brand-bad" role="alert">
                        {codeError}
                      </p>
                    )}
                    {discountCode && !codeError && (
                      <p className="text-xs text-brand-ok">
                        {discountCode} {t(locale, 'cart.appliedSave')} {CURRENCY_SYMBOL} {discount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                  className="mt-8 w-full rounded-none bg-brand-ink py-4 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse hover:bg-brand-ink-soft dark:bg-brand-ink-inverse dark:text-brand-ink dark:hover:bg-white"
                >
                  {t(locale, 'cart.proceed')}
                </Button>
              </div>
            </section>
          </div>
        </div>
        <CartRecommendations />
      </div>
      <Footer />
    </>
  );
};

export default CartPage;
