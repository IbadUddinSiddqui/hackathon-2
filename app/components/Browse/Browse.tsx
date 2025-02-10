"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { client } from '@/sanity/lib/client';

// Fetch unique category slugs directly from Sanity
const fetchCategorySlugs = async (): Promise<string[]> => {
  const slugs = await client.fetch<string[]>(
    `*[_type == "product"].category_slug`
  );
  return Array.from(new Set(slugs.filter((slug): slug is string => typeof slug === 'string'))).slice(0, 4);
};

function Browse() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const loadSlugs = async () => {
      const categorySlugs = await fetchCategorySlugs();
      setSlugs(categorySlugs);
    };
    loadSlugs();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  };

  return (
    <div className="min-w-screen flex justify-center items-center dark:bg-black-2">
      <div className="w-[85%] rounded-md shadow-md bg-[#F0F0F0] dark:bg-[#3f3c3c] p-12">
        <div className="text-center mb-10 mt-12">
          <h2 className="text-5xl font-extrabold mb-4 dark:text-white">BROWSE BY CATEGORIES</h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {slugs.length >= 3 && (
              <>
                {/* Casual */}
                <motion.div variants={cardVariants}>
                  <Link href={`/products/${slugs[0]}`} className="block">
                    <motion.div
                      className="bg-white dark:bg-gray-700 text-bold text-start p-6 bg-cover bg-bottom h-[290px] text-xl rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                      style={{ backgroundImage: 'url("/mensclothing.jpg")' }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-bold text-white  text-3xl">Mens Category</p>
                    </motion.div>
                  </Link>
                </motion.div>

                {/* Formal */}
                <motion.div variants={cardVariants} className="md:col-span-2">
                  <Link href={`/products/${slugs[1]}`} className="block">
                    <motion.div
                      className="bg-white dark:bg-gray-700 text-bold text-start p-6 bg-cover bg-center h-[290px] text-xl rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                      style={{ backgroundImage: 'url("/footwear.jpg")' }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-bold text-gray-800 text-3xl">Footwear</p>
                    </motion.div>
                  </Link>
                </motion.div>

                {/* Party */}
                <motion.div variants={cardVariants} className="md:col-span-2">
                  <Link href={`/products/${slugs[2]}`} className="block">
                    <motion.div
                      className="bg-white dark:bg-gray-700 text-bold text-start p-6 bg-cover bg-center h-[290px] text-xl rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                      style={{ backgroundImage: 'url("/acces.jpg")' }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-bold text-white text-3xl">Accessories</p>
                    </motion.div>
                  </Link>
                </motion.div>

                {/* Gym */}
                <motion.div variants={cardVariants}>
                  <Link href={`/products/${slugs[3]}`} className="block">
                    <motion.div
                      className="bg-white dark:bg-gray-700 text-bold text-start p-6 bg-cover bg-center h-[290px] text-xl rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                      style={{ backgroundImage: 'url("/womensclothing.webp")' }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-bold text-gray-800 text-3xl">Womens Category</p>
                    </motion.div>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Browse;