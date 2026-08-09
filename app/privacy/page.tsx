import type { Metadata } from "next";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Bazaar Nest",
  description: "How Bazaar Nest collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Last updated: August 2026 · This is a draft for review.
        </p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              1. Information we collect
            </h2>
            <p>
              When you place an order or create an account we collect the information you
              provide directly: your name, email address, delivery address, phone number, and
              order details (items, sizes, quantities, totals). We do not store full card
              numbers — card payments are processed by Stripe and never touch our servers.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              2. How we use your information
            </h2>
            <p>
              We use your information to fulfil and deliver orders, send order confirmations and
              receipts by email, process returns and refunds, and provide customer support. With
              your consent we may send marketing offers; you can opt out at any time.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              3. Service providers
            </h2>
            <p>
              We share only the minimum data required with the processors that run the store:
              Stripe (payments), Brevo (transactional email), Sanity (content and order
              database), and our delivery courier (name, address, phone). Each processor is
              contractually bound to protect your data.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              4. Cookies and analytics
            </h2>
            <p>
              Our site may use essential cookies to keep your cart and session working. Any
              analytics or advertising cookies are only used with your consent.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              5. Your rights
            </h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any
              time by emailing us. We will respond within a reasonable time and in accordance
              with applicable data protection law.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              6. Contact
            </h2>
            <p>
              Questions about this policy? Contact us at support@bazaarnest.com.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
