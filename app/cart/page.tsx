"use client"
import React, { useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Counter from '../components/Counter/Counter';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

const CartPage = () => {
  // State for the cart items and their quantity
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Gradient Graphic Tshirt',
      size: 'Large',
      color: 'White',
      price: "$145",
      imageUrl: '/arrival4.svg'
    },
    {
      id: 2,
      name: 'Checkered Shirt',
      size: 'Medium',
      color: 'Red',
      price: "$180$",
      imageUrl: '/arrival1.svg'
    },
    {
      id: 3,
      name: 'Skinny Fit Jeans',
      size: 'Large',
      color: 'Blue',
      price: "$240",
      imageUrl: '/arrival3.svg'
    }
  ]);

  // Function to update the quantity
 

  // Function to remove an item from the cart
  const removeItem = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  return (
    <>
      <Header />
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-screen-xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cart Section */}
          <section className="col-span-2 w-full">
            <h3 className="text-left text-4xl font-extrabold mb-4">YOUR CART</h3>
            <div className="mx-auto max-w-3xl">
              <div className="mt-8 shadow-lg rounded-xl">
                <ul className="space-y-4">
                  {cartItems.map(item => (
                    <li key={item.id} className="flex items-center gap-4 border p-4 rounded-lg shadow-sm">
                      <div className="relative">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-900">{item.name}</h3>
                        <dl className="mt-0.5 space-y-px text-xs text-gray-600">
                          <div>
                            <dt className="inline">Size:</dt>
                            <dd className="inline">{item.size}</dd>
                          </div>
                          <div>
                            <dt className="inline">Color:</dt>
                            <dd className="inline">{item.color}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="flex flex-1 items-center justify-end gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className=" bg-red-500 text-white rounded-full p-1"
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
                        <label htmlFor={`qty-${item.id}`} className="sr-only">Quantity</label>
                        <Counter />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Order Summary Section */}
          <section className="w-full md:w-[80%] bg-white shadow-lg rounded-lg p-4">
            <Card className="overflow-hidden" x-chunk="order-summary">
              <CardHeader className="bg-muted/50 p-4">
                <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-xl font-extrabold">$299.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-red-500 text-xl font-extrabold">-$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="text-xl font-extrabold">$5.00</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-extrabold">$294.00</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    <Input placeholder="Enter discount code" className="w-full" />
                    <Button variant="outline" className="h-8">Apply</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center p-4">
                <Button className="min-w-96 md:w-auto">Proceed to Checkout</Button>
              </CardFooter>
            </Card>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CartPage;
