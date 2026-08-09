"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import  AppSidebar  from '@/app/components/Sidebar/AppSidebar';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import { searchClient } from '@/lib/typesense';
import { Product } from '@/types/products'; // Define proper types in types.ts

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const ITEMS_PER_PAGE = 9;

const CategoryPage = ({ params }: CategoryPageProps) => {
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const category = use(params).category

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Sanity.io Query
      const sanityQuery = `*[_type == "product" && category_slug == $categorySlug]{
        _id,
        name,
        ratings,
        price,
        images,
        category_slug,
        slug,
        brand,
        size,
        tags
      }`;

      const sanityProducts: Product[] = await client.fetch(sanityQuery, {
        categorySlug: category,
      });

      // Typesense Search
      let typesenseProducts: Product[] = [];
      try {
        const typesenseResponse = await searchClient
          .collections('products')
          .documents()
          .search({
            q: '*',
            query_by: 'name,brand,tags',
            filter_by: `category_slug:${category}`,
            per_page: 100,
          });

        typesenseProducts = typesenseResponse.hits?.map((hit: any) => ({
          ...hit.document,
          _id: hit.document.id, // Ensure ID mapping if needed
        })) || [];
      } catch (typesenseError) {
        console.warn('Typesense search failed, using Sanity data only',typesenseError);
      }

      // Merge and deduplicate products
      const combinedProducts = [...sanityProducts, ...typesenseProducts]
        .filter((product, index, self) =>
          self.findIndex(p => p._id === product._id) === index
        );

      setCategoryProducts(combinedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters or category change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, selectedSizes, selectedTags, category]);

  const filteredProducts = categoryProducts.filter(product => {
    const brandMatch = selectedBrands.length === 0 || 
      (product.brand && selectedBrands.includes(product.brand));
    const sizeMatch = selectedSizes.length === 0 || 
      (product.size && product.size.some((size:any ) => selectedSizes.includes(size)));
    const tagMatch = selectedTags.length === 0 || 
      (product.tags && product.tags.some((tag : any )=> selectedTags.includes(tag)));
      
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
    <div className="min-h-screen bg-white  dark:bg-[#212020] flex flex-col">
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
          <h1 className="text-3xl font-bold mb-8">
            {generateCategoryName(category)}
          </h1>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-96" />
              ))}
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No products found matching your criteria
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentProducts.map(product => (
                      <ProductCard key={product._id} product={product} category={category} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center items-center mt-8 gap-4">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-100 text-black-2 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-100 rounded text-black-2 disabled:opacity-50"
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

// Product Card Component
const ProductCard = ({ product, category }: { product: Product; category: string }) => {
  const firstImage = product.images?.[0]?.asset?._ref;
  const productSlug = product.slug?.current || product._id;

  return (
    <Link
      href={`/products/${category}/${productSlug}`}
      className="group bg-white lg:w-56 md:w-40 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-square  relative bg-gray-50 rounded-t-lg">
        {firstImage ? (
          <Image
            src={urlFor(firstImage).url()}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-xl text-black-2 truncate">{product.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-yellow-700">
              {product.ratings?.toFixed(1) || 'N/A'}
            </span>
          </div>
          <span className="font-medium text-green-700">Rs {product.price?.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
};

export default CategoryPage;