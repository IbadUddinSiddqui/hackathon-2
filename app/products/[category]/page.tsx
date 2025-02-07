"use client"
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppSidebar } from '@/app/components/Sidebar/Sidebar';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
type Product = {
  _id: string;
  name: string;
  ratings: number;
  price: number;
  images: { asset: { _ref: string } }[];
  category_slug: string;
  slug?: { current: string };
};

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const itemsPerPage = 9;

const CategoryPage = ({ params }: CategoryPageProps) => {


  const resolvedParams = use(params) // Unwrap the promise
  console.log("params object",resolvedParams)
  const category = resolvedParams.category; // Get resolved value

  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
       
        const sanityProducts: Product[] = await client.fetch(
          `*[_type == "product" && category_slug == $categorySlug]{
            _id,
            name,
            ratings,
            price,
            images,
            category_slug,
            slug
          }`,
          { categorySlug: category } // Match URL param to category_slug
        );
        setCategoryProducts(sanityProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  const totalPages = Math.ceil(categoryProducts.length / itemsPerPage);
  const currentProducts = categoryProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const categoryName = category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (isLoading) return (<>
   
  <div className="text-center p-8">Loading...</div>
  <AppSidebar /></>);
  if (!categoryProducts.length) return (<>
   
  <div className="text-center p-8">
    No products found in this category</div>
    <AppSidebar /></>);

  return (
    <>
      <Header></Header>
      <div className="grid grid-cols-5 items-start w-full min-h-screen">
        <div className="col-span-1 min-w-[200px] p-6">
          <AppSidebar />
        </div>

        <div className="p-6 col-span-5 lg:col-span-4 grid-rows-1 top-120 absolute md:static min-w-screen">
          <h2 className="text-3xl font-extrabold mb-6">{categoryName} Wear</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {currentProducts.map((product) => (
              <Link
                href={`/products/${category}/${ product._id}`}
                key={product._id}
                className="flex flex-col items-center justify-between bg-white shadow-lg h-[25rem] w-full md:w-[16rem] rounded-lg transform transition-transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-center justify-center w-full mb-4 h-48">
                  {product.images?.length > 0 ? (
                    <Image
                      src={urlFor(product.images[0].asset._ref).url()}
                      alt={`Image of ${product.name}`}
                      width={300}
                      height={300}
                      className="object-contain h-full w-full rounded-md"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-md">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start w-full px-4 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate w-full">{product.name}</h3>
                  <div className="flex items-center justify-between w-full mt-2">
                    <div className="flex items-center">
                      <Image
                        width={80}
                        height={15}
                        src="/star-rating.svg"
                        alt="Star Rating"
                        className="mr-1"
                      />
                      <span className="text-sm text-gray-500">({product.ratings})</span>
                    </div>
                    <p className="text-gray-700 font-bold">${product.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

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

      <Footer></Footer>
    </>
  );
};

export default CategoryPage;