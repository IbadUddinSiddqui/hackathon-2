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

const CheckoutPage = () => {
  const { items } = useCartStore();

  // Calculate order summary values
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 10; // Example discount amount
  const deliveryFee = 5; // Example delivery fee
  const total = subtotal - discount + deliveryFee;

  // Stripe expects amounts in cents. Multiply dollars by 100.
  const stripeAmount = Math.round(total * 100);

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
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="font-bold text-red-500">-${discount.toFixed(2)}</span>
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
                <Button className="w-full">Proceed to Payment</Button>
              </CardFooter>
            </Card>

            {/* Stripe Payment Form */}
            <div >
              <StripePayment amount={stripeAmount} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CheckoutPage;
