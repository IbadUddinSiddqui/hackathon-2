"use client";
import React, { use, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import ProductGallery from "@/app/components/ProductImages/ProductGallery";
import { urlFor } from "@/sanity/lib/image";
import { client } from "@/sanity/lib/client";
import AddToCartButton from "@/app/components/AddToCartButton/AddToCartButton";
import ProductsGrid from "@/app/components/ProductsGrid/ProductsGrid";
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import { Button } from "@/components/ui/button";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { motion} from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

// Add proper type definitions
type Product = {
  _id: string;
  name: string;
  ratings: number;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category_slug: string;
  slug?: { current: string };
  size: string[];
  qcom_availability: boolean;
  brand: string;
  tags: string[];
  created_at: string;
};
type SanityProductResponse = Omit<Product, "images"> & {
  images: SanityImageAsset[]; // Original Sanity format
};
type SanityImageAsset = {
  asset: {
    _ref: string;
    // Add these if you use image hotspots/crops
    _type?: "reference";
    _key?: string;
  };
};

const ProductDetailPage = ({ params }: { params: Promise<{ productId: string }> }) => {
  const { addToWishlist, items: wishlistItems } = useWishlistStore();
  const resolvedParams = use(params);
  const productId = resolvedParams.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isInWishlist = wishlistItems.some(item => item._id === product?._id);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const sanityProduct = await client.fetch<SanityProductResponse>(
          `*[_type == "product" && _id == $prodId][0]{
            _id,
            name,
            ratings,    // Must be included
            description,
            price,      // Must be included
            stock,
            images,
            category_slug,
            slug,
            size,
            qcom_availability,
            brand,
            tags,
            created_at,
          }`,
          { prodId: productId }
        );

        const productWithImageUrls: Product = {
          ...sanityProduct,
          images: sanityProduct.images?.map(image => urlFor(image).url())
        };

        await new Promise(resolve => setTimeout(resolve)); // Simulated delay for demo
        setProduct(productWithImageUrls);
        setError(null);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  if (error) {
    return (
      <div className="min-h-screen   dark:bg-[#212020] flex flex-col items-center justify-center">
        <Header />
        <div className="text-red-500 text-xl p-8 text-center">{error}</div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen  dark:bg-[#212020]">
        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <div className="flex gap-2">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-6 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="flex gap-4 mt-8">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        ) : product ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ x: -50 }}
                animate={{ x: 0 }}
                className="aspect-square"
              >
                <ProductGallery images={product.images} />
              </motion.div>

              <motion.div
                initial={{ x: 50 }}
                animate={{ x: 0 }}
                className="space-y-6"
              >
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
                      className={`w-6 h-6 ${i < product.ratings ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                 <span className="text-muted-foreground">
  ({(product?.ratings ?? 0).toFixed(1)})
</span>

                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold">
  ${(product?.price ?? 0).toFixed(2)}
</span>
                    <Badge variant="outline" className="text-lg py-1 px-3">
                      -40%
                    </Badge>
                  </div>

                  {product?.stock ? (
  product.stock > 0 ? (
    <Badge className="bg-green-100 text-green-800">
      In Stock ({product.stock} left)
    </Badge>
  ) : (
    <Badge variant="destructive">Out of Stock</Badge>
  )
) : null}

                  <p className="text-lg leading-relaxed text-gray-600">
                    {product.description}
                  </p>
                </motion.div>

                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Select Color</h3>
                    {/* Add your ColorPicker component */}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Choose Size</h3>
                    {/* Add your Size component */}
                  </div>
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4 pt-6"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                >
                  <AddToCartButton product={product} />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex"
                  >
                    <Button
                      variant="outline"
                      onClick={() => addToWishlist(product)}
                      disabled={isInWishlist}
                      className=  {isInWishlist ? 'bg-red-400 text-red-700' : 'hover:bg-red-400 hover:text-red-700'}
                    >
                      <HeartIcon className="w-5 h-5 hover:bg-red-600 " />
                      {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 px-6 max-w-7xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            You May Also Like
          </h2>
          <ProductsGrid category={product?.category_slug} />
        </motion.section>
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

export default ProductDetailPage;