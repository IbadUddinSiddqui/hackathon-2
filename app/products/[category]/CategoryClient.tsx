"use client";

import React, { useState, useEffect } from 'react';
import AppSidebar from '@/app/components/Sidebar/AppSidebar';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import { Product } from '@/types/products';
import ProductCard from '@/app/components/ProductCard/ProductCard';

interface CategoryClientProps {
  category: string;
  initialProducts: Product[];
}

const ITEMS_PER_PAGE = 9;

const CategoryClient = ({ category, initialProducts }: CategoryClientProps) => {
  const [categoryProducts] = useState<Product[]>(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Reset page when filters or category change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, selectedSizes, selectedTags, category]);

  const filteredProducts = categoryProducts.filter(product => {
    const brandMatch = selectedBrands.length === 0 ||
      (product.brand && selectedBrands.includes(product.brand));
    const sizeMatch = selectedSizes.length === 0 ||
      (product.size && product.size.some((size: any) => selectedSizes.includes(size)));
    const tagMatch = selectedTags.length === 0 ||
      (product.tags && product.tags.some((tag: any) => selectedTags.includes(tag)));

    return brandMatch && sizeMatch && tagMatch;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const generateCategoryName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#212020] flex flex-col">
      <Header />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 container mx-auto">
        {/* Sidebar */}
        <AppSidebar
          brands={Array.from(new Set(
            categoryProducts
              .map(p => p.brand)
              .filter((b): b is string => !!b)
          ))}
          sizes={Array.from(new Set(
            categoryProducts
              .flatMap(p => p.size || [])
              .filter((s): s is string => !!s)
          ))}
          tags={Array.from(new Set(
            categoryProducts
              .flatMap(p => p.tags || [])
              .filter((t): t is string => !!t)
          ))}
          selectedBrands={selectedBrands}
          selectedSizes={selectedSizes}
          selectedTags={selectedTags}
          onBrandChange={setSelectedBrands}
          onSizeChange={setSelectedSizes}
          onTagChange={setSelectedTags}
        />

        {/* Main Content */}
        <main className="lg:col-span-5 md:col-span-5 space-x-1 p-4">
          <h1 className="text-3xl font-bold tracking-tight mb-8">
            {generateCategoryName(category)}
          </h1>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No products found matching your criteria
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center mt-8 gap-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 text-black-2 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-100 rounded text-black-2 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default CategoryClient;
