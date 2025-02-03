"use client";
import React from 'react';
import { useCartStore } from '@/lib/stores/cartStore';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const CartPage = () => {
  const { items, updateQuantity, removeItem } = useCartStore();

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 10; // Example discount
  const deliveryFee = 5; // Example delivery fee
  const total = subtotal - discount + deliveryFee;

  return (
    <>
      
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-screen-xl grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          {/* Cart Section */}
          <section className="col-span-2 w-full">
            <h3 className="text-left text-4xl font-extrabold mb-4 text-gray-900 dark:text-gray-100">
              YOUR CART
            </h3>
            <div className="mx-auto max-w-3xl">
              <div className="mt-8 shadow-lg rounded-xl bg-white dark:bg-gray-800">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Your cart is empty
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {items.map(item => (
                      <li
                        key={item._id}
                        className="flex items-center gap-4 border p-4 rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700"
                      >
                        <div className="relative">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm text-gray-900 dark:text-gray-100">
                            {item.name}
                          </h3>
                          <dl className="mt-0.5 space-y-px text-xs text-gray-600 dark:text-gray-400">
                            <div>
                              <dt className="inline">Price:</dt>
                              <dd className="inline">
                                ${item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                              </dd>
                            </div>
                            <div>
                              <dt className="inline">Stock:</dt>
                              <dd className="inline">{item.stock} available</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="flex flex-1 items-center justify-end gap-2">
                          <button
                            onClick={() => removeItem(item._id)}
                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            aria-label="Remove item"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <label htmlFor={`qty-${item._id}`} className="sr-only">Quantity</label>
                          <input
                            id={`qty-${item._id}`}
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => {
                              let value = Number(e.target.value);
                              value = Math.max(1, Math.min(value, item.stock));
                              updateQuantity(item._id, value);
                            }}
                            className="w-20 px-3 py-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Order Summary Section */}
          <section className="w-full md:w-full">
            <Card className="overflow-hidden bg-white dark:bg-gray-800">
              <CardHeader className="bg-muted/50 p-4 dark:bg-gray-700">
                <CardTitle className="text-lg font-semibold dark:text-gray-100">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Subtotal</span>
                    <span className="text-xl font-extrabold dark:text-gray-100">
                      ${subtotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Discount</span>
                    <span className="text-red-500 text-xl font-extrabold">
                      -${discount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Delivery Fee</span>
                    <span className="text-xl font-extrabold dark:text-gray-100">
                      ${deliveryFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground dark:text-gray-400">Total</span>
                    <span className="text-xl font-extrabold dark:text-gray-100">
                      ${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Separator className="my-4 dark:bg-gray-700" />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter discount code"
                      className="w-full bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                    <Button variant="outline" className="h-8 dark:bg-gray-700 dark:text-gray-100">
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center p-4">
                <Button className="w-full md:w-auto dark:bg-gray-700 dark:text-gray-100">
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </section>
        </div>
      </div>
      
    </>
  );
};

export default CartPage;