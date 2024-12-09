
"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/app/components/Header/Header';
import Image from 'next/image';
import { AppSidebar } from '@/app/components/Sidebar/Sidebar';

interface Product {
  id: number;
  name: string;
  rating: string;
  price: string;
}

interface Categories {
  [key: string]: {
    name: string;
    image: string;
  };
}

interface Products {
  [key: string]: Product[];
}

const categories: Categories = {
  casual: { name: 'Casual', image: '/image-11.svg' },
  formal: { name: 'Formal', image: '/image-13.svg' },
  party: { name: 'Party', image: '/image-12.svg' },
  gym: { name: 'Gym', image: '/image-14.svg' },
};

const products: Products = {
  casual: [
    { id: 1, name: 'Tshirt', rating: '4.5/5', price: '120$' },
    { id: 2, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
    { id: 3, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
    { id: 4, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
    { id: 5, name: 'Tshirt', rating: '4.5/5', price: '120$' },
    { id: 6, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
    { id: 7, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
    { id: 8, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
    { id: 9, name: 'Tshirt', rating: '4.5/5', price: '120$' },
    { id: 10, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
    { id: 11, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
    { id: 12, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
    { id: 13, name: 'Tshirt', rating: '4.5/5', price: '120$' },
    { id: 14, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
    { id: 15, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
    { id: 16, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
  ],
  formal: [
    { id: 1, name: 'Formal Suit', rating: '4/5', price: '500$' },
    { id: 2, name: 'Formal Shirt', rating: '4.2/5', price: '80$' },
    { id: 3, name: 'Blazer', rating: '4.5/5', price: '300$' },
    { id: 4, name: 'Slim Fit Trousers', rating: '4.6/5', price: '120$' },
    { id: 5, name: 'Oxford Shoes', rating: '4.7/5', price: '200$' },
    { id: 6, name: 'Formal Vest', rating: '4.3/5', price: '150$' },
    { id: 7, name: 'Tie and Pocket Square Set', rating: '4.8/5', price: '50$' },
    { id: 8, name: 'Classic White Shirt', rating: '4.4/5', price: '70$' },
    { id: 9, name: 'Cufflinks', rating: '4.1/5', price: '30$' },
    { id: 10, name: 'Formal Belt', rating: '4.2/5', price: '40$' },
    { id: 11, name: 'Black Suit', rating: '4.9/5', price: '600$' },
    { id: 12, name: 'Leather Briefcase', rating: '4.3/5', price: '250$' },
    { id: 13, name: 'Formal Socks', rating: '4.0/5', price: '25$' },
    { id: 14, name: 'Formal Coat', rating: '4.6/5', price: '400$' },
    { id: 15, name: 'Button-Up Dress Shirt', rating: '4.4/5', price: '90$' },
    { id: 16, name: 'Polished Leather Shoes', rating: '4.8/5', price: '220$' },
  ],
  party: [
    { id: 1, name: 'Sequined Dress', rating: '4.8/5', price: '250$' },
  { id: 2, name: 'Party Blazer', rating: '4.7/5', price: '320$' },
  { id: 3, name: 'Cocktail Dress', rating: '4.9/5', price: '300$' },
  { id: 4, name: 'Party Tuxedo', rating: '4.5/5', price: '500$' },
  { id: 5, name: 'Shimmer Top', rating: '4.4/5', price: '120$' },
  { id: 6, name: 'Velvet Suit', rating: '4.6/5', price: '450$' },
  { id: 7, name: 'Party Skirt', rating: '4.3/5', price: '180$' },
  { id: 8, name: 'Beaded Gown', rating: '4.7/5', price: '550$' },
  { id: 9, name: 'Embroidered Saree', rating: '4.9/5', price: '400$' },
  { id: 10, name: 'Glitter Shoes', rating: '4.6/5', price: '150$' },
  { id: 11, name: 'Bow Tie Tuxedo', rating: '4.8/5', price: '520$' },
  { id: 12, name: 'Lace Dress', rating: '4.5/5', price: '270$' },
  { id: 13, name: 'Ruffle Top', rating: '4.3/5', price: '90$' },
  { id: 14, name: 'Statement Earrings', rating: '4.7/5', price: '50$' },
  { id: 15, name: 'Sequin Mini Skirt', rating: '4.2/5', price: '110$' },
  { id: 16, name: 'Metallic Blouse', rating: '4.4/5', price: '100$' },
  ],
  gym: [
    { id: 1, name: 'Gym T-Shirt', rating: '4.6/5', price: '25$' },
    { id: 2, name: 'Workout Shorts', rating: '4.7/5', price: '30$' },
    { id: 3, name: 'Compression Pants', rating: '4.8/5', price: '40$' },
    { id: 4, name: 'Training Hoodie', rating: '4.5/5', price: '60$' },
    { id: 5, name: 'Athletic Tank Top', rating: '4.4/5', price: '20$' },
    { id: 6, name: 'Sweatpants', rating: '4.6/5', price: '35$' },
    { id: 7, name: 'Sports Bra', rating: '4.7/5', price: '25$' },
    { id: 8, name: 'Performance Leggings', rating: '4.9/5', price: '45$' },
    { id: 9, name: 'Gym Gloves', rating: '4.5/5', price: '15$' },
    { id: 10, name: 'Headband', rating: '4.3/5', price: '10$' },
    { id: 11, name: 'Training Sneakers', rating: '4.8/5', price: '80$' },
    { id: 12, name: 'Fitness Tracker', rating: '4.9/5', price: '100$' },
    { id: 13, name: 'Weightlifting Belt', rating: '4.7/5', price: '50$' },
    { id: 14, name: 'Resistance Bands', rating: '4.4/5', price: '15$' },
    { id: 15, name: 'Water Bottle', rating: '4.6/5', price: '12$' },
    { id: 16, name: 'Gym Bag', rating: '4.8/5', price: '40$' },
  ],
};

const productImages = [
  '/arrival.svg',
  '/arrival1.svg',
  '/arrival2.svg',
  '/arrival3.svg',
  '/arrival4.svg',
  '/arrival5.svg',
  '/arrival6.svg',
  '/arrival7.svg',
];

interface CategoryPageProps {
  params: {
    category: string; // The category name coming from the dynamic URL
  };
}

const itemsPerPage = 9; // Number of items to display per page

const CategoryPage = ({ params }: CategoryPageProps) => {
  
  const { category } = params; // Access category from params
  const categoryData = categories[category]; // Retrieve category data
  const categoryProducts = categoryData ? products[category] : []; // Get products related to that category

  const [currentPage, setCurrentPage] = useState(1); // State to track the current page
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
