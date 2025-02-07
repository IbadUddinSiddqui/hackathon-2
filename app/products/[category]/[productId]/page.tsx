"use client";
import React, { use, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import ProductGallery from "@/app/components/ProductImages/ProductGallery";
import ColorPicker from "@/app/components/ColorPicker/ColorPicker";
import Size from "@/app/components/Size/Size";
import CourseTabs from "@/app/components/Ratings/Ratings";
import { urlFor } from "@/sanity/lib/image";
import { client } from "@/sanity/lib/client";
import AddToCartButton from "@/app/components/AddToCartButton/AddToCartButton";
import ProductsGrid from "@/app/components/ProductsGrid/ProductsGrid";
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import { Button } from "@/components/ui/button";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";

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
  const isInWishlist = wishlistItems.some(item => item._id === product?._id);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        // Fixed the query syntax (removed extra comma) and added [0] to get first result
        const sanityProduct = await client.fetch<SanityProductResponse>(
          `*[_type == "product" && _id == $prodId][0]{
          _id,
          name,
          ratings,
          description,
          price,
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
          images: sanityProduct.images.map(image => urlFor(image).url())
        };

        setProduct(productWithImageUrls);

      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProductData(); // Added missing function invocation
  }, [productId]); // Added dependency


  return (
    <>
      <Header></Header>
      {product && <div className="p-6 grid grid-cols-1 md:grid-cols-2 justify-between">
        <div>
          <ProductGallery images={product.images} />
        </div>
        <div className="md:w-[50vw] mt-12">
          <h1 className="text-4xl font-extrabold mb-4">{product.name}</h1>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill={i < product.ratings ? "gold" : "gray"}
                className="w-6 h-6 flex"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-lg mb-4">Rating: {product.ratings}</p>
          <div className="flex gap-2 items-center">
            <p className="text-4xl font-bold mb-4">{product.price}</p>
            <p className="text-4xl font-bold mb-4 text-gray-600 line-through">$400</p>
            <Badge
              variant="destructive"
              className="bg-red-200 rounded-full mb-4 text-red-600 py-0 px-1 h-7"
            >
              -40%
            </Badge>
          </div>
          <p className="text-lg mb-4">{product.description}</p>
          <div>
            <div className="max-w-screen">
              <p className="text-lg mb-4">Select Colors</p>
              <ColorPicker />
              <p>Choose Size</p>
              <Size />
            </div>
          </div>
          <div className="flex justify-around mt-2 border-t border-gray-500 max-w-screen">
            
            <AddToCartButton product={product} />
             <Button
              variant="outline"
              onClick={() => addToWishlist(product)}
              disabled={isInWishlist}
            >
              {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </Button>

          </div>
        </div>
      </div>}
      <CourseTabs />
      <div className="text-center mb-10">
        <h2 className="text-5xl font-extrabold mb-4">YOU MAY ALSO LIKE</h2>
      </div>
      <ProductsGrid category={product?.category_slug} />
      <Footer/>
    </>
  );
};

export default ProductDetailPage;
