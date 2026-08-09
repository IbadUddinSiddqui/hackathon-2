// app/checkout/page.tsx or pages/checkout.tsx
"use client";
import React from 'react';
import { useCartStore } from '@/lib/stores/cartStore';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { StripePayment } from '../components/CheckOut/CheckOut';
import { DELIVERY_FEE } from '@/lib/constants';

const CheckoutPage = () => {
  const { items, discountCode, discountAmount } = useCartStore();

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
              </CardContent>
              <CardFooter className="p-4">
                <Button className="w-full" onClick={scrollToPayment} disabled={items.length === 0}>
                  Proceed to Payment
                </Button>
              </CardFooter>
            </Card>

            {/* Stripe Payment Form */}
            <div id="payment-form">
              <StripePayment
                amount={stripeAmount}
                discountCode={discountCode || undefined}
                items={items.map(item => ({
                  id: item._id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  size: item.size,
                }))}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CheckoutPage;
