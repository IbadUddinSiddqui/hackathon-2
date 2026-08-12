"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
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

// P3-13 — live countdown to the flash-sale end.
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
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
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
      <div className="min-h-screen dark:bg-[#212020]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            <motion.div initial={{ x: -50 }} animate={{ x: 0 }} className="aspect-square">
              <ProductGallery images={product.images} />
            </motion.div>

            <motion.div initial={{ x: 50 }} animate={{ x: 0 }} className="space-y-6">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-4xl font-bold tracking-tight"
              >
                {product.name}
              </motion.h1>

              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${i < product.ratings ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-muted-foreground">
                  ({(product?.ratings ?? 0).toFixed(1)})
                </span>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-4xl font-bold">Rs {displayPrice.toFixed(2)}</span>
                  {flashSale ? (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        Rs {(product?.price ?? 0).toFixed(2)}
                      </span>
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                        {t(locale, "product.sale")}
                      </Badge>
                      {/* Real discount % — never a hardcoded fake badge. */}
                      <Badge variant="outline" className="text-sm py-1 px-2.5">
                        {Math.round((1 - displayPrice / (product?.price || 1)) * 100)}% OFF
                      </Badge>
                      {/* Product-level sales have no end time — only flash sales
                          render the countdown. */}
                      {flashSale.endsAt && <FlashSaleCountdown endsAt={flashSale.endsAt} />}
                    </>
                  ) : null}
                </div>

                {product?.stock ? (
                  product.stock > 0 ? (
                    <Badge className="bg-green-100 text-green-800">
                      {t(locale, "product.inStock")} ({product.stock} {t(locale, "product.left")})
                    </Badge>
                  ) : (
                    <Badge variant="destructive">{t(locale, "product.outOfStock")}</Badge>
                  )
                ) : null}

                <p className="text-lg leading-relaxed text-gray-600">{product.description}</p>
              </motion.div>

              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Color picker: the current product's color plus a swatch per
                    sibling listing (same family, different color). Picking a
                    color navigates to that listing, whose color is then recorded
                    on the order (server-truth) — so the right color ships. When
                    there are no siblings, just show the single read-only chip.
                    Nothing renders when no color is set (flat-gallery products). */}
                {product?.color ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{t(locale, "product.color")}</h3>
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
                              className="inline-flex cursor-default items-center gap-1.5 rounded-full border-2 border-black px-3 py-1.5 text-sm font-semibold dark:border-white"
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
                              className="inline-flex items-center gap-1.5 rounded-full border border-stroke px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-black hover:text-black dark:border-strokedark dark:text-bodydark2 dark:hover:border-white dark:hover:text-white"
                            >
                              <SwatchDot color={sw.color} />
                              {sw.color}
                            </Link>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-stroke px-3 py-1 text-sm font-medium dark:border-strokedark">
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
                className="flex flex-col sm:flex-row gap-4 pt-6"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
              >
                <AddToCartButton product={product} />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex">
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
                    className={isInWishlist ? "bg-red-400 text-red-700" : "hover:bg-red-400 hover:text-red-700"}
                  >
                    <HeartIcon className="w-5 h-5 hover:bg-red-600" />
                    {isInWishlist ? t(locale, "product.inWishlist") : t(locale, "product.addToWishlist")}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* P4-12 — AI/rule-based recommendations (co-purchase), with the old
            category grid as the automatic fallback. */}
        <Recommendations
          productId={product?._id}
          categorySlug={product?.category_slug}
        />

        <div className="mx-auto max-w-7xl px-6 pb-16">
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
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
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
