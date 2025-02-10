"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { getSanityProducts } from '@/lib/sanity/product';
import { SanityProduct } from '@/lib/sanity/product';
import { urlFor } from '@/sanity/lib/image';

interface MayAlsoLikeProps {
  category: string | undefined;
}

const ProductsGrid = ({ category }: MayAlsoLikeProps) => {
  const [showAll, setShowAll] = useState(false);
  const [productData, setProductData] = useState<SanityProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from Sanity
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getSanityProducts(category);
        setProductData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
      }
    };

    fetchProducts();
  }, [category]);

  // Toggle visibility of products
  const toggleProducts = () => setShowAll(!showAll);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 20 
      } 
    },
  };

  // ProductCard component with responsive design
  const ProductCard = ({ product, category }: { product: SanityProduct; category: string | undefined }) => (
    <motion.div
      className="flex justify-center p-2 sm:p-3 md:p-6 w-full "
      variants={cardVariants}
    >
      <motion.div
        className="relative w-[48rem] h-[300px] perspective-1000 group"
        whileHover="hover"
        initial="rest"
      >
        <motion.div
          className="absolute inset-0 w-full h-full preserve-3d transition-transform duration-500 ease-in-out"
          variants={{
            rest: { rotateY: 0 },
            hover: { rotateY: 180 }
          }}
        >
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full bg-white shadow-md rounded-xl p-4 backface-hidden flex flex-col items-center border border-gray-100">
            <Link 
              href={`/products/${category}/${product._id}`}
              className="w-full h-40 relative mb-4 hover:scale-105 transition-transform"
            >
              <Image
                src={urlFor(product.images[0]).url()}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                priority
              />
            </Link>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 text-center truncate w-full">
              {product.name}
            </h3>
            <p className="text-green-600 font-bold mt-2 text-sm sm:text-base">
              ${product.price}
            </p>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 w-full h-full bg-white shadow-md rounded-xl p-4 backface-hidden rotate-y-180 flex flex-col items-center justify-center border border-green-100">
            <div className="overflow-y-auto max-h-[180px] custom-scrollbar text-center">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed px-2">
                {product.description || 'No description available'}
              </p>
            </div>
            <Link 
              href={`/products/${category}/${product._id}`}
              className="mt-4 w-full max-w-[160px]"
            >
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm py-2 transition-all"
              >
                View Details
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  return (
    <>
    <div className="container mt-24 md:hidden lg:hidden mx-auto px-2 sm:px-4 py-8">
      <motion.div
        className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {productData.slice(0, showAll ? productData.length : 3).map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              category={category} 
              
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* View More / View Less Button */}
      {productData.length > 5 && (
        <div className="mt-8 text-center">
          <Button
            onClick={toggleProducts}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-sm sm:text-base"
          >
            {showAll ? 'View Less' : 'View More'}
          </Button>
        </div>
      )}
    </div>
    <div className="container mt-24 hidden md:block lg:hidden  mx-auto px-2 sm:px-4 py-8">
      <motion.div
        className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {productData.slice(0, showAll ? productData.length : 4).map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              category={category} 
              
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* View More / View Less Button */}
      {productData.length > 5 && (
        <div className="mt-8 text-center">
          <Button
            onClick={toggleProducts}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-sm sm:text-base"
          >
            {showAll ? 'View Less' : 'View More'}
          </Button>
        </div>
      )}
    </div>
    <div className="container hidden  mt-12 md:hidden lg:block  mx-auto px-2 sm:px-4 py-8">
      <motion.div
        className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {productData.slice(0, showAll ? productData.length : 5).map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              category={category} 
              
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* View More / View Less Button */}
      {productData.length > 5 && (
        <div className="mt-8 text-center">
          <Button
            onClick={toggleProducts}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-sm sm:text-base"
          >
            {showAll ? 'View Less' : 'View More'}
          </Button>
        </div>
      )}
    </div>
    </>
  );
};

export default ProductsGrid;