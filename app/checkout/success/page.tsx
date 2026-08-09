// app/checkout/success/page.tsx
"use client";
import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/stores/cartStore";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";

function SuccessContent() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const isCod = searchParams.get("method") === "cod";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4">
          {isCod ? "Order Placed!" : "Payment Successful!"}
        </h1>
        <p className="text-lg">
          {isCod
            ? "Thank you for your order \u2014 keep cash ready for delivery."
            : "Thank you for your purchase."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

const SuccessPage = () => {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen" />}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  );
};

export default SuccessPage;
