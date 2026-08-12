"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSanityProducts, getNewArrivals, getOnSaleProducts, SanityProduct } from "@/lib/sanity/product";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import ProductCard from "../ProductCard/ProductCard";

interface ProductsGridProps {
  category?: string | undefined;
  // Homepage section modes: real "new arrivals" / "on sale" queries instead
  // of a plain category grid.
  mode?: "new" | "sale";
  // Hide the whole section when the query returns nothing (used by the
  // homepage sections so a ghost heading never renders).
  hideWhenEmpty?: boolean;
}

const INITIAL_VISIBLE = 10;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const ProductsGrid = ({
  category,
  mode,
  hideWhenEmpty = false,
}: ProductsGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const [productData, setProductData] = useState<SanityProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();

  useEffect(() => {
    let cancelled = false;
    setProductData([]);
    setLoaded(false);
    setShowAll(false);
    // Homepage sections use REAL queries: new arrivals (recency window) and
    // on-sale (flag + lower price). Everything else is a plain category grid.
    const loader =
      mode === "new"
        ? getNewArrivals()
        : mode === "sale"
          ? getOnSaleProducts()
          : getSanityProducts(category);
    loader
      .then((data) => {
        if (!cancelled) {
          setProductData(data);
          setLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        if (!cancelled) {
          setLoaded(true);
          setError(t(locale, "common.loadError"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [category, mode, locale]);

  if (error) {
    return <div className="container mx-auto px-4 py-10 text-center text-red-500">{error}</div>;
  }

  // Homepage sections disappear entirely when they have nothing to show
  // (only after the query settles — never during the loading flash).
  if (hideWhenEmpty && loaded && !productData.length) return null;

  const visible = showAll ? productData : productData.slice(0, INITIAL_VISIBLE);

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6">
      <motion.div
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {visible.map((product) => (
          <ProductCard key={product._id} product={product} category={category} />
        ))}
      </motion.div>

      {productData.length > INITIAL_VISIBLE && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all hover:border-black hover:bg-black hover:text-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-white dark:hover:bg-white dark:hover:text-gray-900"
          >
            {showAll ? t(locale, "product.viewLess") : t(locale, "product.viewMore")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsGrid;
