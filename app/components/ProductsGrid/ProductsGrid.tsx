"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSanityProducts, SanityProduct } from "@/lib/sanity/product";
import { urlFor } from "@/sanity/lib/image";
import { useCartStore } from "@/lib/stores/cartStore";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

interface ProductsGridProps {
  category: string | undefined;
}

const INITIAL_VISIBLE = 10;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
};

function formatPrice(price: unknown): string {
  const n = Number(price);
  return Number.isFinite(n) && n > 0 ? `Rs ${n.toLocaleString()}` : "";
}

function ProductCard({
  product,
  category,
}: {
  product: SanityProduct;
  category: string | undefined;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { locale } = useLocale();
  const href = `/products/${category || "all"}/${product._id}`;
  const inStock = product.stock > 0;
  const imageUrl = product.images?.[0] ? urlFor(product.images[0]).url() : null;

  return (
    <motion.div variants={cardVariants} className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-100 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/10">
        <Link href={href} aria-label={product.name} className="absolute inset-0 z-10">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
              <span className="text-xs font-medium">No image</span>
            </div>
          )}
        </Link>

        {!inStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black">
              {t(locale, "product.outOfStock")}
            </span>
          </div>
        )}

        {/* Quick add — always visible on touch, reveal-on-hover on desktop */}
        <button
          type="button"
          onClick={() => inStock && addItem(product)}
          disabled={!inStock}
          className="absolute inset-x-3 bottom-3 z-20 rounded-xl bg-black/85 py-2.5 text-xs font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-0 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
        >
          {t(locale, "product.addToCart")}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 pt-3">
        <Link
          href={href}
          className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors hover:text-black"
        >
          {product.name}
        </Link>
        <p className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</p>
        <p className="text-xs">
          {inStock ? (
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t(locale, "product.inStock")}
            </span>
          ) : (
            <span className="text-red-500">{t(locale, "product.outOfStock")}</span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

const ProductsGrid = ({ category }: ProductsGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const [productData, setProductData] = useState<SanityProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();

  useEffect(() => {
    let cancelled = false;
    setProductData([]);
    setShowAll(false);
    getSanityProducts(category)
      .then((data) => {
        if (!cancelled) setProductData(data);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        if (!cancelled) setError(t(locale, "common.loadError"));
      });
    return () => {
      cancelled = true;
    };
  }, [category, locale]);

  if (error) {
    return <div className="container mx-auto px-4 py-10 text-center text-red-500">{error}</div>;
  }

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
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all hover:border-black hover:bg-black hover:text-white"
          >
            {showAll ? t(locale, "product.viewLess") : t(locale, "product.viewMore")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsGrid;
