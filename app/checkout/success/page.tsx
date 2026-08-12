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
    <div className="flex min-h-screen items-center justify-center bg-brand-surface text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
      <div className="px-4 text-center">
        <p className="text-eyebrow mb-4 text-brand-ok">Confirmed</p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          {isCod ? "Order Placed!" : "Payment Successful!"}
        </h1>
        <p className="text-lg text-brand-muted">
          {isCod
            ? "Thank you for your order \u2014 keep cash ready for delivery."
            : "Thank you for your purchase. A receipt is on its way."}
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-brand-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse transition-opacity hover:opacity-90 dark:bg-brand-ink-inverse dark:text-brand-ink"
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
