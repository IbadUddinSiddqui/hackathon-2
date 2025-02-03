"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { client } from '@/sanity/lib/client';

// Fetch unique category slugs directly from Sanity
const fetchCategorySlugs = async () :  Promise<string[]> => {
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

  return (
    <div className="min-w-screen flex justify-center items-center">
      <div className="w-[85%] rounded-md shadow-md bg-[#F0F0F0] p-12">
        <div className="text-center mb-10 mt-12">
          <h2 className="text-5xl font-extrabold mb-4">BROWSE BY DRESS STYLE</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
            {slugs.length >= 3 && (
              <>
                <Link href={`/products/${slugs[0]}`} className="bg-[#FFFFFF] text-bold text-start bg-cover bg-bottom h-[290px] text-xl">
                  <div className="bg-[#FFFFFF] text-bold text-start p-6 bg-cover bg-bottom h-[290px] text-xl" style={{ backgroundImage: 'url("/image-11.svg")' }}>
                    <p className='font-bold'>Casual</p>
                  </div>
                </Link>
                <Link href={`/products/${slugs[1]}`} className='bg-[#FFFFFF] text-bold text-start md:col-span-2 bg-cover bg-center h-[290px] text-xl md:bg-left-top'>
                  <div className='bg-[#FFFFFF] text-bold text-start p-6 md:col-span-2 bg-cover bg-center h-[290px] text-xl md:bg-left-top' style={{ backgroundImage: 'url("/image-13.svg")' }}>
                    <p className='font-bold'>Formal</p>
                  </div>
                </Link>
                <Link href={`/products/${slugs[2]}`} className='bg-[#FFFFFF] text-bold text-start md:col-span-2 bg-cover bg-center h-[290px] text-xl'>
                  <div className='bg-[#FFFFFF] text-bold text-start p-6 md:col-span-2 bg-cover bg-center h-[290px] text-xl' style={{ backgroundImage: 'url("/image-12.svg")' }}>
                    <p className='font-bold'>Party</p>
                  </div>
                </Link>
                <Link href={`/products/${slugs[3]}`} className="bg-[#FFFFFF] text-bold text-start bg-cover bg-center h-[290px] text-xl">
                  <div className="bg-[#FFFFFF] text-bold text-start p-6 bg-cover bg-center h-[290px] text-xl" style={{ backgroundImage: 'url("/image-14.svg")' }}>
                    <p className='font-bold absolute'>Gym</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Browse;