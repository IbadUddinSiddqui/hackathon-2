import type { Metadata } from "next";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions | AnKs",
  description: "The terms that govern your use of AnKs.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Last updated: August 2026 · This is a draft for review.
        </p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              1. Acceptance of terms
            </h2>
            <p>
              By browsing or purchasing from AnKs you agree to these terms. If you do not
              agree, please do not use the store.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              2. Orders and pricing
            </h2>
            <p>
              All prices are displayed in USD and include the applicable delivery fee shown at
              checkout. A discount code must be entered before checkout to be applied. We
              reserve the right to cancel an order if a product is out of stock or if a pricing
              error occurred; in that case you will be notified and fully refunded.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              3. Payment
            </h2>
            <p>
              We accept card payments (processed securely by Stripe) and Cash on Delivery. Card
              orders are only fulfilled after payment is confirmed. For Cash on Delivery, the
              order is placed as pending and payment is collected when the order is delivered.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              4. Delivery
            </h2>
            <p>
              Estimated delivery times are shown during checkout and may vary by location. Risk
              of loss passes to you upon delivery. Please inspect your order on delivery and
              report any issues within 48 hours.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              5. Returns
            </h2>
            <p>
              You may return unworn, unwashed items with tags attached within 7 days of delivery.
              See our Returns &amp; Exchanges policy for the full process.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              6. Liability and governing law
            </h2>
            <p>
              Our total liability is limited to the amount you paid for the affected order.
              These terms are governed by the laws of Pakistan, and any dispute will be subject
              to the exclusive jurisdiction of its courts.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
