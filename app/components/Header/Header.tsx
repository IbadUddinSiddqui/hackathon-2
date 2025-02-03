"use client";
import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { RiAccountCircleLine } from "react-icons/ri";
import { IoMenu } from "react-icons/io5";
import { FaHeart, FaSearch } from "react-icons/fa";
import ProductSearch from "../ProductSearch/ProductSearch";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div>
      {/* Top Banner */}
      <div className="bg-black h-12 flex justify-center items-center">
        <p className="text-white text-center text-sm sm:text-base">
          Sign Up and get 20% off on your first order.
        </p>
      </div>

      {/* Main Header */}
      <header className="bg-gray-100 border-b border-gray-900">
        <div className="container mx-auto flex justify-between items-center h-16 px-4 lg:px-8">
          {/* Hamburger Menu for Small Screens */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 focus:outline-none"
            aria-label="Open menu"
          >
            <IoMenu size={30} />
          </button>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image src="/logo.svg" width={200} height={40} alt="logo" />
            </Link>
          </div>

          {/* Navigation Links for Large Screens */}
          <nav className="hidden lg:flex space-x-6 ml-12">
            {["Shop", "On Sale", "New Arrivals", "Brands"].map((item) => (
              <Link
                href={`#${item.toLowerCase().replace(" ", "")}`}
                key={item}
                className="relative text-lg font-medium text-gray-700 hover:text-black transition-colors duration-200"
              >
                {item}
                <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="flex-grow mx-4 max-w-[600px] hidden md:block">
            <ProductSearch />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              className="p-2 hover:text-yellow-700 transition-colors"
              aria-label="Search"
            >
              <FaSearch size={20} />
            </button>
            <Link
              href="/cart"
              className="p-2 hover:text-yellow-700 transition-colors"
              aria-label="Cart"
            >
              <PiShoppingCartSimpleBold size={24} />
            </Link>
            <button
              className="p-2 hover:text-blue-700 transition-colors"
              aria-label="Account"
            >
              <RiAccountCircleLine size={24} />
            </button>
            <Link
              href="/wishlist"
              className="p-2 hover:text-red-500 transition-colors"
              aria-label="Wishlist"
            >
              <FaHeart size={22} />
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col items-center p-4">
          {/* Close Button */}
          <button
            onClick={toggleMenu}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 focus:outline-none"
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
          <div className="w-full max-w-sm mt-16">
            {/* Search Bar */}
            <div className="relative mb-8">
              <ProductSearch></ProductSearch>
            </div>
        
            {/* Navigation Links */}
            <nav className="space-y-4">
              {["Shop", "On Sale", "New Arrivals", "Brands"].map((item) => (
                <Link
                  href={`#${item.toLowerCase().replace(" ", "")}`}
                  key={item}
                  className="block px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {item}
                </Link>
              ))}
            </nav>
        
            {/* Social Links or Additional Actions */}
            <div className="mt-8 flex justify-center space-x-6">
              <a
                href="#"
                className="text-gray-500 hover:text-blue-500 transition-colors duration-200"
                aria-label="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-pink-500 transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        )}

        {/* Search Bar for Mobile */}
        <div className="md:hidden p-4 border-t border-gray-200">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;