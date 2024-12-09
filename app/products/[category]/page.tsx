"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/app/components/Header/Header';
import Image from 'next/image';
import { AppSidebar } from '@/app/components/Sidebar/Sidebar';
import { categories, productImages, products } from '@/app/category';

// Define the CategoryPageProps interface

const itemsPerPage = 9; // Number of items to display per page

const CategoryPage = ({ params }: any) => {
  const [categoryData, setCategoryData] = useState<any>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // State to track the current page
  const [category, setCategory] = useState<string | null>(null); // New state to store the category

  useEffect(() => {
    // Make sure `params` is handled correctly (unwrap promise)
    const unwrapParams = async () => {
      if (params && params.category) {
        setCategory(params.category); // Set the category value once params are available
      }
    };
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (category) {
      const categoryInfo = categories[category]; // Retrieve category data
      const categoryProductsData = categoryInfo ? products[category] : []; // Get related products

      setCategoryData(categoryInfo);
      setCategoryProducts(categoryProductsData);
    }
  }, [category]);

  const totalPages = Math.ceil(categoryProducts.length / itemsPerPage); // Calculate total pages

  // Get products for the current page
  const currentProducts = categoryProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!categoryData) {
    return <div>Category not found!</div>;
  }

  return (
    <>
      <Header />
      <div className="grid grid-cols-5 items-start w-full min-h-screen">
        {/* Sidebar */}
        <div className="col-span-1 min-w-[200px] p-6">
          <AppSidebar />
        </div>

        {/* Main Content */}
        <div className="p-6 col-span-5 lg:col-span-4 grid-rows-1 top-120 absolute md:static min-w-screen">
          <h2 className="text-3xl font-extrabold mb-6">{categoryData.name} Wear</h2>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {currentProducts.map((product) => (
              <Link
                href={`/products/${category}/${product.id}`}
                key={product.id}
                className="flex flex-col items-center justify-between bg-white shadow-lg h-[25rem] w-full md:w-[16rem] rounded-lg transform transition-transform hover:scale-105 hover:shadow-xl"
              >
                {/* Product Image */}
                <div className="flex items-center justify-center w-full mb-4">
                  <Image
                    src={productImages[(product.id - 1) % productImages.length]}
                    alt={`Image of ${product.name}`}
                    width={300}
                    height={100}
                    className="object-contain cover rounded-md"
                  />
                </div>

                {/* Product Info */}
                <div className="flex flex-col items-start w-full px-4">
                  <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                  <div className="flex items-center justify-between w-full mt-2">
                    <Image
                      width={80}
                      height={15}
                      src="/star-rating.svg"
                      alt="Star Rating"
                    />
                    <p className="text-sm text-gray-500">{product.rating}</p>
                  </div>
                  <p className="mt-2 text-gray-700 font-bold">Price: {product.price}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 bg-gray-300 text-gray-800 rounded ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'
              }`}
            >
              Previous
            </button>
            <p>
              Page {currentPage} of {totalPages}
            </p>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 bg-gray-300 text-gray-800 rounded ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
