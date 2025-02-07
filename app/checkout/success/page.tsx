// app/checkout/success/page.tsx
"use client";
import { useEffect } from 'react';
import { useCartStore } from '@/lib/stores/cartStore';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';

const SuccessPage = () => {
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <>
    <Header/>
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-lg">Thank you for your purchase.</p>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default SuccessPage;