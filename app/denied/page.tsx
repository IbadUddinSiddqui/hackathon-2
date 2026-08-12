import React from "react";
import type { Metadata } from "next";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Access Denied",
  description: "You do not have permission to access this page.",
  robots: { index: false, follow: false },
};

export default function Denied() {
  return (
    <>
    <Header></Header>
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-surface px-4 text-brand-ink ">
      <div className="w-full max-w-md border border-brand-line bg-brand-surface p-9 text-center dark:bg-brand-surface-alt">
        {/* Logo */}
        <Image
          width={80}
          height={80}
          src="/logo.svg"
          alt="Store logo"
          className="mx-auto mb-5 h-16 w-16 rounded-sm object-contain"
        />

        <h1 className="mb-3 text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="mb-7 text-brand-muted">
          You do not have the necessary permissions to access this admin panel.
          If you believe this is an error, please contact your administrator.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-ink px-7 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse transition-opacity hover:opacity-90 dark:bg-brand-ink-inverse dark:text-brand-ink"
        >
          Back to Home
        </Link>
      </div>
    </div>
    <Footer></Footer>
    </>
  );
}
