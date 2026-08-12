"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/stores/cartStore";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { salePriceFor, displayPriceFor } from "@/lib/product-sale";
import { urlFor } from "@/sanity/lib/image";

/**
 * The single standardized product card used by EVERY storefront product grid
 * (homepage sections via ProductsGrid, /products, /products/[category]).
 *
 * `ProductCardData` is structural on purpose so both the Sanity-typed product
 * (lib/sanity/product) and the merged Sanity + Typesense Product
 * (types/products) can be passed directly. `images` accepts Sanity asset refs
 * ({ asset: { _ref } }) OR plain CDN URL strings (how Typesense stores them).
 */
export type ProductCardData = {
  _id: string;
  name: string;
  price: number;
  stock?: number | null;
  images?: Array<{ asset?: { _ref?: string } | null } | string> | null;
  category_slug?: string | null;
  slug?: { current?: string } | null;
  on_sale?: boolean;
  sale_price?: number | null;
};

/** Entrance animation — drives the stagger when a motion parent provides it. */
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

/** First product image — a Sanity asset ref OR a plain URL (Typesense). */
function resolveImageUrl(images?: ProductCardData["images"]): string | null {
  const first = Array.isArray(images) ? images[0] : undefined;
  if (!first) return null;
  if (typeof first === "string") return first;
  return first?.asset?._ref ? urlFor(first).url() : null;
}

export default function ProductCard({
  product,
  category,
}: {
  product: ProductCardData;
  category?: string | undefined;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { locale } = useLocale();
  const href = `/products/${product.category_slug || category || "all"}/${product._id}`;
  // Unknown stock (e.g. a Typesense-only doc without stock data) defaults to
  // in-stock rather than wrongly locking the card.
  const inStock = product.stock == null || product.stock > 0;
  const imageUrl = resolveImageUrl(product.images);
  // Genuine product-level sale (on_sale flag + lower sale price).
  const salePrice = salePriceFor(product);
  const displayPrice = displayPriceFor(product);

  return (
    <motion.div variants={cardVariants} className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-100 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/10 dark:bg-gray-800/70 dark:ring-gray-700/60">
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
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 dark:from-gray-800 dark:to-gray-700 dark:text-gray-500">
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

        {salePrice !== null && inStock && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
            {t(locale, "product.sale")}
          </span>
        )}

        {/* Quick add — always visible on touch, reveal-on-hover on desktop.
            Adds the EFFECTIVE price (sale when on sale) so the cart never
            shows a price the customer isn't charged. */}
        <button
          type="button"
          onClick={() =>
            inStock &&
            addItem(salePrice !== null ? { ...product, price: salePrice } : product)
          }
          disabled={!inStock}
          className="absolute inset-x-3 bottom-3 z-20 rounded-xl bg-black/85 py-2.5 text-xs font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-0 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
        >
          {t(locale, "product.addToCart")}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 pt-3">
        <Link
          href={href}
          className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors hover:text-black dark:text-gray-100 dark:hover:text-white"
        >
          {product.name}
        </Link>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatPrice(displayPrice)}
          {salePrice !== null && (
            <span className="ml-1.5 text-xs font-medium text-gray-400 line-through dark:text-gray-500">
              {formatPrice(product.price)}
            </span>
          )}
        </p>
        <p className="text-xs">
          {inStock ? (
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
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
