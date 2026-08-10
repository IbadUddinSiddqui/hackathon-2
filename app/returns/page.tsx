import type { Metadata } from "next";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Returns & Exchanges | AnK's",
  description: "How to return or exchange an order from AnK's.",
};

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Returns &amp; Exchanges
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Last updated: August 2026 · This is a draft for review.
        </p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              1. Return window
            </h2>
            <p>
              You have 7 days from the date of delivery to request a return or exchange.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              2. Condition of items
            </h2>
            <p>
              Items must be unworn, unwashed, and unaltered, with all original tags attached.
              Items returned in used condition may be rejected or subject to a restocking fee.
              Underwear and face masks cannot be returned for hygiene reasons unless faulty.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              3. How to start a return
            </h2>
            <p>
              Email us at support@anks.com with your order number and the items you wish
              to return. We will confirm eligibility and share the return address and any
              pickup instructions. Please do not ship items back without confirmation.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              4. Refunds
            </h2>
            <p>
              Once the returned items are received and inspected, refunds are issued to the
              original payment method. Card refunds can take 5–10 business days to appear.
              Cash on Delivery orders are refunded via bank transfer or store credit, your
              choice.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              5. Exchanges
            </h2>
            <p>
              To exchange for a different size or colour, start a return as above and mention
              the replacement you want. Exchanges are processed once the original item is
              received; any price difference is charged or refunded.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              6. Faulty or damaged items
            </h2>
            <p>
              If an item arrived damaged or faulty, contact us within 48 hours of delivery with
              photos. We will replace the item or refund in full, including any delivery costs
              you paid.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
