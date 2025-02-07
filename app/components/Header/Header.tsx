"use client";
import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { RiAccountCircleLine } from "react-icons/ri";
import { IoMenu } from "react-icons/io5";
import { FaHeart, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ProductSearch from "../ProductSearch/ProductSearch";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="sticky top-0 z-50">
      {/* Top Banner */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-black to-gray-900 h-12 flex justify-center items-center"
      >
        <p className="text-white text-center text-sm sm:text-base font-medium">
          🎉 Sign Up and get 20% off on your first order.{" "}
          <Link href="/signup" className="underline hover:text-yellow-400 transition-colors">
            Claim Offer
          </Link>
        </p>
      </motion.div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex justify-between items-center h-20 px-4 lg:px-8">
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
            {["Shop", "On Sale", "New Arrivals", "Brands"].map((item) => (
              <Link
                href={`#${item.toLowerCase().replace(" ", "")}`}
                key={item}
                className="relative group text-lg font-medium text-gray-700 hover:text-black transition-colors"
              >
                {item}
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="flex-grow mx-8 max-w-[600px] hidden md:block">
            <ProductSearch />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-6">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Search"
            >
              <FaSearch size={20} className="text-gray-700" />
            </button>
            
            <Link
              href="/wishlist"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Wishlist"
            >
              <FaHeart size={22} className="text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                3
              </span>
            </Link>
            
            <Link
              href="/cart"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Cart"
            >
              <PiShoppingCartSimpleBold size={24} className="text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5">
                2
              </span>
            </Link>
            
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Account"
            >
              <RiAccountCircleLine size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 bg-white z-50 flex flex-col items-center p-6"
            >
              {/* Close Button */}
              <button
                onClick={toggleMenu}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
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
              <div className="w-full max-w-sm mt-20">
                {/* Search Bar */}
                <div className="relative mb-8">
                  <ProductSearch />
                </div>

                {/* Navigation Links */}
                <nav className="space-y-4">
                  {["Shop", "On Sale", "New Arrivals", "Brands"].map((item) => (
                    <Link
                      href={`#${item.toLowerCase().replace(" ", "")}`}
                      key={item}
                      className="block px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                      onClick={toggleMenu}
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Search Bar */}
      <div className="md:hidden p-4 border-t border-gray-200 bg-white">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;