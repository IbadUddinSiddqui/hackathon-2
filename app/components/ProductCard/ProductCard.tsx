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
 * (homepage sections via ProductsGrid, /products, /products/[category],
 * recommendations). P08: a fashion-object expression — sharp corners, no card
 * chrome (the image IS the card), tabular price numerals, a full-width
 * quick-add bar that slides up on hover, and a slow quiet entrance.
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

/** Entrance — P08 re-time: slow, quiet cinematic fade (entrance register).
    The grid container provides the stagger; interaction springs stay in the
    buttons/badges where they belong. */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
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
      {/* The image is the card — no rounded chrome, no ring, no shadow. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-surface-alt dark:bg-brand-charcoal">
        <Link href={href} aria-label={product.name} className="absolute inset-0 z-10">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-surface-alt text-brand-muted dark:bg-brand-charcoal">
              <span className="text-xs font-medium">{t(locale, "common.loading")}</span>
            </div>
          )}
        </Link>

        {/* Top-left editorial metadata: sale flag (sharp, brand-sale) */}
        {salePrice !== null && inStock && (
          <span className="absolute left-0 top-0 z-20 bg-brand-sale px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
            {t(locale, "product.sale")}
          </span>
        )}

        {/* Out of stock veil */}
        {!inStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-ink/55 backdrop-blur-[2px]">
            <span className="border border-brand-ink-inverse/30 bg-brand-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse">
              {t(locale, "product.outOfStock")}
            </span>
          </div>
        )}

        {/* Quick add — full-width bar sliding up on hover (fashion standard),
            always visible on touch. Adds the EFFECTIVE price (sale when on
            sale) so the cart never shows a price the customer isn't charged. */}
        <button
          type="button"
          onClick={() =>
            inStock &&
            addItem(salePrice !== null ? { ...product, price: salePrice } : product)
          }
          disabled={!inStock}
          className="absolute inset-x-0 bottom-0 z-20 bg-brand-ink py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink-inverse transition-transform duration-[400ms] hover:bg-brand-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink-inverse disabled:cursor-not-allowed disabled:opacity-0 sm:translate-y-full sm:group-hover:translate-y-0 dark:bg-brand-ink-inverse dark:text-brand-ink dark:hover:bg-brand-charcoal"
        >
          {t(locale, "product.addToCart")}
        </button>
      </div>

      {/* Typographic detail — name + tabular price, no pill, no stock line
          noise on the card (stock lives on the PDP). */}
      <div className="flex flex-1 flex-col gap-1 pt-3">
        <Link
          href={href}
          className="line-clamp-1 text-sm font-medium text-brand-ink transition-colors hover:opacity-70 "
        >
          {product.name}
        </Link>
        <p className="text-price text-[15px] font-semibold text-brand-ink ">
          {formatPrice(displayPrice)}
          {salePrice !== null && (
            <span className="ml-2 text-xs font-medium text-brand-muted line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
