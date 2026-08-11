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
import { Star, Timer } from "lucide-react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

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
  tags: string[];
  created_at: string;
};

const ProductDetailClient = ({
  product,
  flashSale,
}: {
  product: ProductDetail;
  flashSale?: { salePrice: number; endsAt: string };
}) => {
  const { addToWishlist, items: wishlistItems } = useWishlistStore();
  const { locale } = useLocale();
  const isInWishlist = wishlistItems.some((item) => item._id === product?._id);
  const displayPrice = flashSale ? flashSale.salePrice : product?.price ?? 0;

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
                        Sale
                      </Badge>
                      <FlashSaleCountdown endsAt={flashSale.endsAt} />
                    </>
                  ) : (
                    <Badge variant="outline" className="text-lg py-1 px-3">
                      -40%
                    </Badge>
                  )}
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
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Select Color</h3>
                  {/* Add your ColorPicker component */}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Choose Size</h3>
                  {/* Add your Size component */}
                </div>

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
                    onClick={() => addToWishlist(product)}
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
