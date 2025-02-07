import React from "react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Image from "next/image";
import Link from "next/link";

export default function Denied() {
  return (
    <>
    <Header></Header>
    <div className="min-h-screen bg-gradient-to-r from-gray-100 via-red-50 to-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        {/* Logo: Replace "/logo.png" with your actual logo path */}
        <Image
        width={100}
        height={100}
          src="/logo-black.svg"
          alt="Ecommerce Logo"
          className="mx-auto w-20 h-20 mb-4"
        />

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          You do not have the necessary permissions to access this admin panel.
          If you believe this is an error, please contact your administrator.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
        >
          Back to Home
        </Link>
      </div>
    </div>
    <Footer></Footer>
    </>
  );
}
