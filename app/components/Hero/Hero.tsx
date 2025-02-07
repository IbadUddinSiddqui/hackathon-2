// components/FashionHero.tsx
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FashionHero() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 5, minutes: 30 });
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  const categories = [
    { name: "Women's Wear", color: "bg-pink-500" },
    { name: "Men's Style", color: "bg-blue-500" },
    { name: "Kids Collection", color: "bg-green-500" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => ({
        days: prev.hours === 0 ? prev.days - 1 : prev.days,
        hours: prev.minutes === 0 ? prev.hours - 1 : prev.hours,
        minutes: prev.minutes === 0 ? 59 : prev.minutes - 1
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Parallax Background */}
      <motion.div 
        style={{ scale }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/fabric-texture.jpg"
          alt="Fabric Texture"
          fill
          className="object-cover opacity-20"
        />
      </motion.div>

      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Text Content */}
          <div className="relative z-10 space-y-8">
            {/* Seasonal Offer Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-lg"
            >
              <FlashSaleIcon />
              <div className="flex gap-2 font-medium text-gray-800">
                <span className="text-red-500">FLASH SALE:</span>
                <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-6xl font-bold text-gray-900"
            >
              Elevate Your<br />
              <span className="text-pink-500">Everyday Style</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl text-gray-600 max-w-xl"
            >
              Discover premium quality apparel crafted for comfort and designed for confidence.
            </motion.p>

            {/* Category Selector */}
            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {categories.map((category, index) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(index)}
                  className={`${
                    activeCategory === index 
                    ? `${category.color} text-white` 
                    : 'bg-gray-100 hover:bg-gray-200'
                  } px-6 py-3 rounded-full transition-colors`}
                >
                  {category.name}
                </button>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-gray-900 text-white px-8 py-4 rounded-full font-medium"
              >
                Shop New Arrivals
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-white border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-full font-medium"
              >
                Explore Collections
              </motion.button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[
                { icon: <FreeReturnsIcon />, text: 'Free Returns' },
                { icon: <EcoFriendlyIcon />, text: 'Eco-Friendly' },
                { icon: <QualityIcon />, text: 'Premium Quality' },
                { icon: <SupportIcon />, text: '24/7 Support' },
              ].map((item, index) => (
               
                <motion.div
                  key={index+item.text}
                  className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm"
                  whileHover={{ y: -5 }}
                >
                  
                  <span className="text-pink-500">{item.icon}</span>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Product Showcase */}
          <motion.div
            className="relative hidden lg:block h-[600px] bg-gray-50 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ rotate: -5 }}
            animate={{ rotate: 5 }}
            transition={{
              repeat: Infinity,
              repeatType: 'mirror',
              duration: 8
            }}
          >
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4">
              
              <motion.div
                className="relative bg-white rounded-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
              ><Link href={`/products/womens-clothing`}>
                <Image
                  src="/womens-clothing.jpg"
                  alt="Summer Dress"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-4">
                  <span className="text-white font-medium">Womens Clothing</span>
                </div></Link>
              </motion.div>
              <motion.div
                className="relative bg-white rounded-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
              ><Link href={`/products/mens-clothing`}>
                <Image
                  src="/mens-clothing.webp"
                  alt="Summer Dress"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-4">
                  <span className="text-white font-medium">Mens Clothing</span>
                </div></Link>
              </motion.div>
              <motion.div
                className="relative bg-white rounded-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
              ><Link href={`/products/wearables`}>
                <Image
                  src="/wearables.jpg"
                  alt="Summer Dress"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-4">
                  <span className="text-white font-medium">Wearables</span>
                </div></Link>
              </motion.div>
              <motion.div
                className="relative bg-white rounded-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
              ><Link href={`/products/children`}>
                <Image
                  src="/children.jpg"
                  alt="Summer Dress"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-4">
                  <span className="text-white font-medium">Chlidren</span>
                </div></Link>
              </motion.div>
              
              {/* Add 3 more image blocks with different clothing items */}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-1/4 left-10 opacity-30"
        animate={{ y: [-20, 20, -20] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <FloatingThread />
      </motion.div>
    </section>
  );
}

// Custom Clothing SVGs
const FlashSaleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M13 2V4.12602C15.7252 4.57006 18 6.89616 18 9.75933C18 10.8271 17.7011 11.8295 17.1779 12.687M11 21.874C8.27477 21.4299 6 19.1038 6 16.2407C6 15.1729 6.2989 14.1705 6.82214 13.313M13 2L11 7M11 21.874L13 17M21 10L19 12L17 10M7 14L5 16L3 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FreeReturnsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 17L4 12M4 12L9 7M4 12H20M15 7L20 12M20 12L15 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EcoFriendlyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M7.5 7.5C7.5 7.5 9 9 9 12C9 15 7.5 16.5 7.5 16.5M16.5 7.5C16.5 7.5 15 9 15 12C15 15 16.5 16.5 16.5 16.5M12 12H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const QualityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M14 10L12 11M12 11L10 10M12 11V13.5M20 7L18 8M18 8L16 7M18 8V10.5M8 7L6 8M6 8L4 7M6 8V10.5M18 16L16 17M16 17L14 16M16 17V19.5M8 16L6 17M6 17L4 16M6 17V19.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SupportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 14V12M8 10V8M16 14V12M16 10V8M3 10V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V10C21 6.22876 21 4.34315 19.8284 3.17157C18.6569 2 16.7712 2 13 2H11C7.22876 2 5.34315 2 4.17157 3.17157C3 4.34315 3 6.22876 3 10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const FloatingThread = () => (
  <svg width="100" height="100" viewBox="0 0 100 100">
    <path
      d="M10 50 Q25 30 40 50 T70 50 T90 30"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeDasharray="4 4"
    />
    <circle cx="10" cy="50" r="3" fill="currentColor" />
    <circle cx="90" cy="30" r="3" fill="currentColor" />
  </svg>
);