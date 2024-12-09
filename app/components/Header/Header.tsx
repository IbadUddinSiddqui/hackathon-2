"use client";
import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { RiAccountCircleLine } from "react-icons/ri";

import { IoMenu } from "react-icons/io5";

import { FaSearch } from "react-icons/fa";
 
const Header = () => {
  const [isMenu, setisMenu] = useState(false);
  const handleMenu = () => setisMenu(!isMenu);

  return (
    <div>
      <div className="bg-black  h-12 flex justify-center items-center">
        <p className="text-white  text-center ml-16">
          Sign Up and get 20% off to your first order .
        </p>
      </div>
     

      {/* Main Header */}
      <header className="bg-gray-100 px-5 w-full border-b border-gray-900">
        <div className="flex justify-between items-center h-16 px-4 lg:px-8 ">
          
          {/* Hamburger Menu for Small Screens */}
          <button onClick={handleMenu} className="lg:hidden">
            <IoMenu  size={50} className="mr-4 "/>
          </button>
          {/* Logo */}
          <div>
            <Link href= "/">
            <Image src="/logo.svg" width={200} height={40} alt="logo" /></Link>
          </div>

          {/* Navigation Links for Large Screens */}
          <nav className="hidden lg:flex space-x-6 ml-12">
            {["Shop", "On Sales", "New Arrivals","Brands"].map((item) => (
              <Link href={`#${item.toLowerCase().replace(" ", "")}`} key={item}>
                <span className="relative text-lg font-medium text-gray-700 cursor-pointer group">
                  {item}
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
            ))}
          </nav>
          <div className="flex w-full md:w-auto md:flex-grow items-center justify-center p-4">
          <div className="relative w-full max-w-[300px] md:max-w-[500px] lg:max-w-[600px]">
          <FaSearch  className="absolute hidden md:block left-28 md:left-1 font-bold top-1/2 transform -translate-y-1/2 w-5 h-5 text-black"/>

            <input
              type="text"
              placeholder="Search for Products....."
              className="w-full hidden md:block px-8 py-2 pr-12 rounded-full text-gray-700 bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
          </div>
        </div>
        


          {/* Action Buttons */}
          <div className="flex">
          <FaSearch className="block md:hidden" size={25}/>
         <Link href="/cart"> <PiShoppingCartSimpleBold size={30} /></Link> 
          <RiAccountCircleLine size={30} />
          </div>

        </div>

        {/* Mobile Menu */}
        {isMenu && (
          <div className="fixed inset-0 bg-white z-50 p-4 items-center flex flex-col">
            <button
              onClick={handleMenu}
              className="absolute top-4 right-4 text-2xl font-bold"
            >
              ✕
            </button>
            <nav className="mt-12 space-y-4 text-center">
              {["Shop", "On Sales", "New Arrivals","Brands"].map((item) => (
                <Link href={`/${item.toLowerCase().replace(" ", "")}`} key={item}>
                  <span className="relative text-lg font-medium text-gray-700 cursor-pointer group block">
                    {item}
                    <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              ))}
            </nav>
        
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
