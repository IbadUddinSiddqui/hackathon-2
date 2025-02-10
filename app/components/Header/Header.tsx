"use client";
import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { RiAccountCircleLine } from "react-icons/ri";
import { IoMenu } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ProductSearch from "../ProductSearch/ProductSearch";
import { useCartStore } from "@/lib/stores/cartStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";

const Header = () => {
  const { items } = useCartStore();
  const wishlist = useWishlistStore()
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const wishItemCount = wishlist.items.length;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="sticky top-0 z-50">
      {/* Top Banner */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-black to-gray-900 h-8 flex justify-center items-center"
      >
        <p className="text-white text-center text-sm sm:text-base font-medium">
          🎉 Sign Up and get 20% off on your first order.{" "}
          <Link href="/signup" className="underline hover:text-yellow-400 transition-colors">
            Claim Offer
          </Link>
        </p>
      </motion.div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b  border-gray-200 shadow-sm">
        <div className="container mx-auto flex justify-between items-center h-16 px-4 lg:px-8">
          {/* Hamburger Menu */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <IoMenu size={28} className="text-gray-700" />
          </button>

          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0"
          >
            <Link href="/">
              <Image
                src="/logo-text-black.svg"
                width={200}
                height={40}
                alt="logo"
                className="hover:opacity-80 transition-opacity"
              />
            </Link>
          </motion.div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex space-x-8 ml-12">
           
             
              <Link
                href={`/dashboard`}
                
                className="relative group text-lg font-medium text-gray-700 hover:text-black transition-colors"
              >
                Dashboard
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href={`/login`}
                
                className="relative group text-lg font-medium text-gray-700 hover:text-black transition-colors"
              >
                Login
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>

          {/* Search Bar */}
          <div className="flex-grow mx-8 max-w-[600px] hidden md:block">
            <ProductSearch />
          </div>

          {/* Action Buttons */}
          <div className=" lg:flex hidden  items-center space-x-6">
           
            
            <Link
              href="/wishlist"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Wishlist"
            >
            <motion.div
    whileHover={{ scale: 1.1, rotate: -10 }}
    whileTap={{ scale: 0.9 }}
    className="relative"
  >
    <motion.div
      whileHover={{ 
        filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
      }}
      transition={{ duration: 0.3 }}
    >
      <FaHeart className="w-6 h-6 text-red-400 hover:text-red-700" />
    </motion.div>

    {/* Animated Cart Count Badge */}
    {wishItemCount > 0 && (
      <motion.span
        key={wishItemCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center"
      >
        <motion.span
          key={wishItemCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 10 }}
        >
          {wishItemCount}
        </motion.span>
      </motion.span>
    )}
  </motion.div>
            </Link>
            
            <Link href="/cart" className="relative">
  <motion.div
    whileHover={{ scale: 1.1, rotate: -10 }}
    whileTap={{ scale: 0.9 }}
    className="relative"
  >
    <motion.div
      whileHover={{ 
        filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
      }}
      transition={{ duration: 0.3 }}
    >
      <PiShoppingCartSimpleBold className="w-6 h-6 text-black-2 hover:text-yellow-700" />
    </motion.div>

    {/* Animated Cart Count Badge */}
    {cartItemCount > 0 && (
      <motion.span
        key={cartItemCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center"
      >
        <motion.span
          key={cartItemCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 10 }}
        >
          {cartItemCount}
        </motion.span>
      </motion.span>
    )}
  </motion.div>
</Link>
            <Link href='/dashboard'>
            <div
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Account"
            >
              <RiAccountCircleLine size={24} className="text-blue-700 hover:text-blue-900" />
            </div></Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 dark:bg-black bg-white z-99 w-[100vw] h-[100vh]  flex flex-col items-center p-6"
            >
              {/* Close Button */}
              <button
                onClick={toggleMenu}
                className="absolute top-6 right-6 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Menu Content */}
              <div className="w-full  max-w-sm mt-20">
                {/* Search Bar */}
                <div className="relative mb-8">
                  <ProductSearch />
                </div>

                {/* Navigation Links */}
                <nav className="space-y-4 flex flex-col">
                <Link
                href={`/dashboard`}
                
                className="relative group text-lg font-medium text-gray-700 hover:text-black transition-colors"
              >
                Dashboard
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href={`/login`}
                
                className="relative group text-lg font-medium text-gray-700 hover:text-black transition-colors"
              >
                Login
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
                </nav>
                <div className="flex items-center space-x-6">
           
            
            <Link
              href="/wishlist"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Wishlist"
            >
            <motion.div
    whileHover={{ scale: 1.1, rotate: -10 }}
    whileTap={{ scale: 0.9 }}
    className="relative"
  >
    <motion.div
      whileHover={{ 
        filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
      }}
      transition={{ duration: 0.3 }}
    >
      <FaHeart className="w-6 h-6 text-red-400 hover:text-red-700" />
    </motion.div>

    {/* Animated Cart Count Badge */}
    {wishItemCount > 0 && (
      <motion.span
        key={wishItemCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center"
      >
        <motion.span
          key={wishItemCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 10 }}
        >
          {wishItemCount}
        </motion.span>
      </motion.span>
    )}
  </motion.div>
            </Link>
            
            <Link href="/cart" className="relative">
  <motion.div
    whileHover={{ scale: 1.1, rotate: -10 }}
    whileTap={{ scale: 0.9 }}
    className="relative"
  >
    <motion.div
      whileHover={{ 
        filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
      }}
      transition={{ duration: 0.3 }}
    >
      <PiShoppingCartSimpleBold className="w-6 h-6 text-black-2 hover:text-yellow-700" />
    </motion.div>

    {/* Animated Cart Count Badge */}
    {cartItemCount > 0 && (
      <motion.span
        key={cartItemCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center"
      >
        <motion.span
          key={cartItemCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 10 }}
        >
          {cartItemCount}
        </motion.span>
      </motion.span>
    )}
  </motion.div>
</Link>
            <Link href='/dashboard'>
            <div
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Account"
            >
              <RiAccountCircleLine size={24} className="text-blue-700 hover:text-blue-900" />
            </div></Link>
          </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Search Bar */}
      
    </div>
  );
};

export default Header;