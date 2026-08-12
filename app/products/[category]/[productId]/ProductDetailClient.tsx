"use client";

import React from "react";
import ProductGallery from "@/app/components/ProductImages/ProductGallery";
import AddToCartButton from "@/app/components/AddToCartButton/AddToCartButton";
import Recommendations from "@/app/components/Recommendations/Recommendations";
import ReviewSection from "@/app/components/Reviews/ReviewSection";
import SizeQuiz from "@/app/components/SizeQuiz/SizeQuiz";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { Button } from "@/components/ui/button";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { motion } from "framer-motion";
import { Star, Timer, Check } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { isHexColor } from "@/lib/is-hex-color";
import type { ColorSibling } from "@/lib/product-colors";
import { displayPriceFor } from "@/lib/product-sale";

// P3-13 — live countdown to the flash-sale end. P10: editorial bar styling.
function FlashSaleCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-2 border border-brand-sale/40 bg-brand-sale-soft px-3 py-1.5 text-xs font-semibold tabular-nums text-brand-sale">
      <Timer className="h-3.5 w-3.5" />
      Ends in {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export type ProductDetail = {
  _id: string;
  name: string;
  ratings: number;
  description: string;
  price: number;
  stock: number;
  images: string[]; // already-resolved CDN URLs
  category_slug: string;
  size: string[];
  qcom_availability: boolean;
  brand: string;
  color?: string;
  tags: string[];
  created_at: string;
  // P3-14 product-level sale.
  on_sale?: boolean;
  sale_price?: number | null;
};

// P10 — cinematic entrance register for the PDP (slow, quiet; per Brand Brief).
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.08 },
  }),
};

const ProductDetailClient = ({
  product,
  flashSale,
  colorSiblings = [],
}: {
  product: ProductDetail;
  flashSale?: { salePrice: number; endsAt: string };
  colorSiblings?: ColorSibling[];
}) => {
  const { addToWishlist, items: wishlistItems } = useWishlistStore();
  const { locale } = useLocale();
  const isInWishlist = wishlistItems.some((item) => item._id === product?._id);
  // Flash-sale price wins; otherwise the product-level sale (or list price).
  const displayPrice = flashSale ? flashSale.salePrice : displayPriceFor(product);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-brand-surface text-brand-ink ">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 md:grid-cols-2 lg:px-8">
            {/* Gallery — full-bleed editorial frame (P10) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductGallery images={product.images} />
            </motion.div>

            {/* Detail column — editorial type roles */}
            <motion.div className="space-y-7 pt-2">
              <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible">
                {product.brand && (
                  <p className="text-eyebrow mb-3 text-brand-muted">{product.brand}</p>
                )}
                <h1 className="text-product-name text-brand-ink ">
                  {product.name}
                </h1>
              </motion.div>

              <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < product.ratings ? "fill-brand-warn text-brand-warn" : "text-brand-line-strong"
                    }`}
                  />
                ))}
                <span className="text-sm text-brand-muted">
                  ({(product?.ratings ?? 0).toFixed(1)})
                </span>
              </motion.div>

              <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-brand-line py-5">
                  <span className="text-price text-brand-ink ">
                    Rs {displayPrice.toFixed(2)}
                  </span>
                  {(flashSale || (product.on_sale && product.sale_price != null)) && (
                    <>
                      <span className="text-base text-brand-muted line-through">
                        Rs {(product?.price ?? 0).toFixed(2)}
                      </span>
                      <span className="bg-brand-sale px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                        {t(locale, "product.sale")}
                      </span>
                      {flashSale && (
                        <span className="border border-brand-line-strong px-2.5 py-1 text-[11px] font-semibold tabular-nums">
                          {Math.round((1 - displayPrice / (product?.price || 1)) * 100)}% OFF
                        </span>
                      )}
                      {flashSale?.endsAt && <FlashSaleCountdown endsAt={flashSale.endsAt} />}
                    </>
                  )}
                </div>

                {product?.stock ? (
                  product.stock > 0 ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-ok">
                      <span className="h-1.5 w-1.5 bg-brand-ok" />
                      {t(locale, "product.inStock")} ({product.stock} {t(locale, "product.left")})
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-brand-bad">
                      {t(locale, "product.outOfStock")}
                    </span>
                  )
                ) : null}

                <p className="text-base leading-relaxed text-brand-muted">{product.description}</p>
              </motion.div>

              <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">
                {/* Color picker: current product color plus a swatch per sibling
                    listing (same family, different color). Picking navigates to
                    that listing (server-truth color on the order). No siblings →
                    single read-only chip. Nothing when no color set. */}
                {product?.color ? (
                  <div className="space-y-3">
                    <h3 className="text-eyebrow text-brand-ink ">
                      {t(locale, "product.color")}
                    </h3>
                    {colorSiblings.length >= 1 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          colorSwatch({
                            _id: product._id,
                            name: product.name,
                            color: product.color,
                            category_slug: product.category_slug,
                          }),
                          ...colorSiblings.map((s) => colorSwatch(s)),
                        ].map((sw) =>
                          sw.id === product._id ? (
                            <span
                              key={sw.id}
                              title={sw.color}
                              aria-current="page"
                              className="inline-flex cursor-default items-center gap-2 border border-brand-ink px-3.5 py-2 text-sm font-medium text-brand-ink  "
                            >
                              <SwatchDot color={sw.color} />
                              {sw.color}
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <Link
                              key={sw.id}
                              href={`/products/${sw.categorySlug}/${sw.id}`}
                              title={`${sw.color} — ${sw.name}`}
                              className="inline-flex items-center gap-2 border border-brand-line px-3.5 py-2 text-sm text-brand-muted transition-colors hover:border-brand-line-strong hover:text-brand-ink dark:hover:text-brand-ink-inverse"
                            >
                              <SwatchDot color={sw.color} />
                              {sw.color}
                            </Link>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 border border-brand-line px-3.5 py-2 text-sm font-medium text-brand-ink ">
                        <SwatchDot color={product.color} />
                        {product.color}
                      </span>
                    )}
                  </div>
                ) : null}

                {/* P4-14 — measurement-based size recommendation. */}
                <SizeQuiz availableSizes={product?.size || []} />
              </motion.div>

              <motion.div
                className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center"
                custom={4}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <AddToCartButton product={product} />
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    onClick={() =>
                      addToWishlist(
                        displayPrice !== (product?.price ?? 0)
                          ? { ...product, price: displayPrice }
                          : product
                      )
                    }
                    disabled={isInWishlist}
                    className={
                      isInWishlist
                        ? "border-brand-bad bg-brand-bad-soft text-brand-bad hover:bg-brand-bad-soft"
                        : "border-brand-line-strong text-brand-ink hover:border-brand-bad hover:text-brand-bad "
                    }
                  >
                    <HeartIcon className="h-5 w-5" />
                    {isInWishlist ? t(locale, "product.inWishlist") : t(locale, "product.addToWishlist")}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* P4-12 — AI/rule-based recommendations (co-purchase), with the old
            category grid as the automatic fallback. */}
        <Recommendations productId={product?._id} categorySlug={product?.category_slug} />

        <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <ReviewSection productId={product?._id} />
        </div>
      </div>
      <Footer />
    </>
  );
};

/** A hex swatch dot, or a plain-text fallback for non-hex color names. */
function SwatchDot({ color }: { color: string }) {
  return isHexColor(color) ? (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-brand-ink/20"
      style={{ backgroundColor: color }}
    />
  ) : null;
}

/** Normalize a current product or sibling into the swatch shape. */
function colorSwatch(p: { _id: string; name: string; color: string; category_slug?: string }) {
  return {
    id: p._id,
    name: p.name,
    color: p.color,
    categorySlug: p.category_slug || "all",
  };
}

// Add this icon component
const HeartIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

export default ProductDetailClient;
