"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppSidebar  from '@/app/components/Sidebar/AppSidebar';
import { client } from '@/sanity/lib/client';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import { searchClient } from '@/lib/typesense';
import { Product } from '@/types/products';
import { clientTenantId } from '@/lib/tenant-client';
import ProductCard from '@/app/components/ProductCard/ProductCard';

const ITEMS_PER_PAGE = 9;

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all products from Sanity (P4-03 — scoped to the active tenant)
      const sanityProducts: Product[] = await client.fetch(
        `*[_type == "product" && (!defined(tenantId) || tenantId == $tenantId)]{
          _id,
          name,
          ratings,
          price,
          images,
          slug,
          brand,
          size,
          tags,
          category_slug,
          stock,
          on_sale,
          sale_price
        }`,
        { tenantId: clientTenantId() }
      );

      // Fetch all products from Typesense
      let typesenseProducts: Product[] = [];
      try {
        const typesenseResponse = await searchClient
          .collections('products')
          .documents()
          .search({
            q: '*',
            query_by: 'name,brand,tags',
            per_page: 100,
          });

        typesenseProducts = typesenseResponse.hits?.map((hit: any) => ({
          ...hit.document,
          _id: hit.document.id,
        })) || [];
      } catch (typesenseError) {
        console.warn('Typesense search failed, using Sanity data only',typesenseError);
      }

      // Merge and deduplicate
      const combinedProducts = [...sanityProducts, ...typesenseProducts]
        .filter((product, index, self) =>
          self.findIndex(p => p._id === product._id) === index
        );

      setProducts(combinedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtering logic
  const filteredProducts = products.filter(product => {
    const brandMatch = selectedBrands.length === 0 || 
      (product.brand && selectedBrands.includes(product.brand));
    const sizeMatch = selectedSizes.length === 0 || 
      (product.size && product.size.some(size => selectedSizes.includes(size)));
    const tagMatch = selectedTags.length === 0 || 
      (product.tags && product.tags.some(tag => selectedTags.includes(tag)));
      
    return brandMatch && sizeMatch && tagMatch;
  });

  // Pagination
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center p-8">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-white dark:bg-[#212020] flex flex-col">
      <Header />
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 container mx-auto">
        {/* Filter Sidebar */}
        
          <AppSidebar
            brands={Array.from(new Set(
              products
                .map(p => p.brand)
                .filter((b): b is string => !!b)
            ))}
            sizes={Array.from(new Set(
              products
                .flatMap(p => p.size || [])
                .filter((s): s is string => !!s)
            ))}
            tags={Array.from(new Set(
              products
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
        <main className="lg:col-span-5 md:col-span-5  space-x-1 p-4">
          <h1 className="text-3xl font-bold tracking-tight mb-8">All Products</h1>

          {isLoading ? (
            <div className="grid grid-cols-2  md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-96" />
              ))}
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No products found matching your filters
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentProducts.map(product => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex justify-center items-center mt-8 gap-4">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-100  text-black-2 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-100 rounded text-black-2  disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage;