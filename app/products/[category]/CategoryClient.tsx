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
    <div className="min-h-screen bg-brand-surface text-brand-ink  flex flex-col">
      <Header />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 mx-auto w-full max-w-7xl px-4 lg:px-8 py-10">
        {/* Sidebar */}
        <div className="lg:col-span-1 mb-8 lg:mb-0">
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
        </div>

        {/* Main Content */}
        <main className="lg:col-span-4">
          <div className="mb-10">
            <p className="text-eyebrow mb-3">Shop</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {generateCategoryName(category)}
            </h1>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-brand-muted">
              No products found matching your criteria
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
                {currentProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination — de-pilled, editorial */}
              <div className="flex items-center justify-center gap-6 mt-12">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink disabled:opacity-40 dark:hover:text-brand-ink-inverse"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Previous
                </button>
                <span className="text-sm tabular-nums text-brand-muted">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink disabled:opacity-40 dark:hover:text-brand-ink-inverse"
                >
                  Next
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default CategoryClient;
