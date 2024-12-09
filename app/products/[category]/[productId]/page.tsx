"use client";
import React, { useEffect, useState } from "react";
import { products } from "@/app/product"; // Assuming you have a mock data file
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductGallery from "@/app/components/ProductImages/ProductGallery";
import Header from "@/app/components/Header/Header";
import ColorPicker from "@/app/components/ColorPicker/ColorPicker";
import Size from "@/app/components/Size/Size";
import Counter from "@/app/components/Counter/Counter";
import CourseTabs from "@/app/components/Ratings/Ratings";
import MayAlsoLike from "@/app/components/MayAlsoLike/MayAlsoLike";
import Footer from "@/app/components/Footer/Footer";
import { useParams } from "next/navigation";

const ProductDetailPage = () => {
  const params = useParams();

  const [category, setCategory] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      const category = Array.isArray(resolvedParams?.category)
        ? resolvedParams.category[0]
        : resolvedParams.category;
  
      const productId = Array.isArray(resolvedParams?.productId)
        ? resolvedParams.productId[0]
        : resolvedParams.productId;
  
      setCategory(category || null);
      setProductId(productId || null);
    });
  }, [params]);
  

  if (!category || !productId) {
    return <div>Loading...</div>;
  }

  const categoryProducts = products[category] || [];
  const product = categoryProducts.find((p) => p.id === parseInt(productId));

  if (!product) {
    return <div>Product not found!</div>;
  }

  return (
    <>
      <Header />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 justify-between">
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
                fill={i < parseFloat(product.rating) ? "gold" : "gray"}
                className="w-6 h-6 flex"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-lg mb-4">Rating: {product.rating}</p>
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
            <Counter />
            <Button className="bg-black w-44 md:w-72 text-white rounded-full mt-1">
              Add To Cart
            </Button>
          </div>
        </div>
      </div>
      <CourseTabs />
      <MayAlsoLike />
      <Footer />
    </>
  );
};

export default ProductDetailPage;
