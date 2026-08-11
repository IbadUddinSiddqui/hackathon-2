import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { getActiveBundles, bundleSubtotal, bundleSavings, type BundleDoc } from "@/lib/bundles";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Bundles | AnK's",
  description: "Save more with AnK's product bundles",
};

export default async function BundlesPage() {
  const bundles = await getActiveBundles().catch(() => []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="mx-auto max-w-screen-xl px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bundles</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Curated sets at a better price than buying separately.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.length === 0 ? (
              <p className="text-gray-400 dark:text-bodydark2">No bundles available right now.</p>
            ) : (
              bundles.map((bundle: BundleDoc) => {
                const savings = bundleSavings(bundle);
                return (
                  <div
                    key={bundle._id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    {bundle.image?.asset?.url ? (
                      <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bundle.image.asset.url}
                          alt={bundle.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {bundle.name}
                      </h2>
                      {bundle.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {bundle.description}
                        </p>
                      )}
                      <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-bodydark2">
                        {bundle.items.map((item, i) => (
                          <li key={i}>
                            {item.product.name} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {CURRENCY_SYMBOL} {bundle.bundlePrice.toLocaleString()}
                          </span>
                          <span className="ml-2 text-sm text-gray-400 line-through">
                            {CURRENCY_SYMBOL} {bundleSubtotal(bundle.items).toLocaleString()}
                          </span>
                        </div>
                        {savings > 0 && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            Save {CURRENCY_SYMBOL} {savings.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Link
                        href="/cart"
                        className="mt-4 block w-full rounded-lg bg-gray-900 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                      >
                        Add bundle to cart
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
