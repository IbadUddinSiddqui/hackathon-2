// app/checkout/page.tsx
"use client";
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { StripePayment, type CheckoutItem } from '../components/CheckOut/CheckOut';
import { DELIVERY_FEE } from '@/lib/constants';

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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError('Enter a valid email so we can confirm your order.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-cod-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customerEmail: email, discountCode }),
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
            Email for order confirmation
          </label>
          <input
            id="cod-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Pay <span className="font-semibold">cash on delivery</span>. Our courier
          will collect the total when your order arrives.
        </p>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {loading ? 'Placing order...' : 'Place Order — Cash on Delivery'}
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
  const { items, discountCode, discountAmount } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');

  // Calculate order summary values
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountCode ? discountAmount : 0;
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal - discount + deliveryFee;

  // Stripe expects amounts in cents. Multiply dollars by 100.
  const stripeAmount = Math.round(total * 100);

  // Scroll the user down to the payment form when they click "Proceed to Payment".
  const scrollToPayment = () => {
    document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const checkoutItems: CheckoutItem[] = items.map((item) => ({
    id: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
  }));

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Checkout</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Summary Section */}
            <Card className="bg-white dark:bg-gray-800 shadow">
              <CardHeader className="bg-gray-100 dark:bg-gray-700 p-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount{discountCode ? ` (${discountCode})` : ''}
                  </span>
                  <span className="font-bold text-red-500">
                    {discount > 0 ? `-$${discount.toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    ${deliveryFee.toFixed(2)}
                  </span>
                </div>
                <Separator className="my-4 dark:bg-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="text-xl text-gray-900 dark:text-gray-100">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Payment method
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      aria-pressed={paymentMethod === 'card'}
                      className={`rounded-lg border p-3 text-left text-sm transition ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="block font-semibold text-gray-900 dark:text-gray-100">Card</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Pay now with Stripe
                      </span>
                    </button>
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
                        Cash on Delivery
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Pay when it arrives
                      </span>
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4">
                {paymentMethod === 'card' ? (
                  <Button
                    className="w-full"
                    onClick={scrollToPayment}
                    disabled={items.length === 0}
                  >
                    Proceed to Payment
                  </Button>
                ) : null}
              </CardFooter>
            </Card>

            {/* Payment / COD Form */}
            <div id="payment-form" className="scroll-mt-8">
              {paymentMethod === 'card' ? (
                <StripePayment
                  amount={stripeAmount}
                  discountCode={discountCode || undefined}
                  items={checkoutItems}
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
