"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { RiAccountCircleLine } from "react-icons/ri";
import { IoMenu, IoClose } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import ProductSearch from "../ProductSearch/ProductSearch";
import { useCartStore } from "@/lib/stores/cartStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { useTenant } from "@/lib/tenant-provider";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

const NAV_LINKS = [
  { href: "/about", key: "header.about" },
  { href: "/contact", key: "header.contact" },
  { href: "/products", key: "nav.shop" },
  { href: "/dashboard", key: "header.dashboard" },
  { href: "/login", key: "header.login" },
];

const Header = () => {
  const { items } = useCartStore();
  const wishlist = useWishlistStore();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const wishItemCount = wishlist.items.length;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { locale } = useLocale();
  // P4-05 — per-tenant branding (name + accent color) from the tenant doc.
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";

  // Subtle shadow once the page scrolls, so the header always reads as floating.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <div className="sticky top-0 z-50">
      {/* Top banner */}
      <div className="flex h-8 items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4">
        <p className="truncate text-center text-xs font-medium text-white sm:text-sm" dir="auto">
          {tenant.name} — {t(locale, "header.banner")}{" "}
          <Link
            href="/register"
            className="ml-1 underline decoration-yellow-400 decoration-2 underline-offset-2 hover:text-yellow-300"
          >
            {t(locale, "header.claim")}
          </Link>
        </p>
      </div>

      {/* Main header */}
      <header
        className={`border-b border-gray-100 bg-white/95 backdrop-blur transition-shadow ${
          scrolled ? "shadow-md" : "shadow-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
          {/* Hamburger */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <IoMenu size={26} />
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo-text-black.svg"
              width={180}
              height={36}
              alt={tenant.name}
              className="h-auto w-auto transition-opacity hover:opacity-75"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className="group relative text-[15px] font-medium text-gray-700 transition-colors hover:text-black"
              >
                {t(locale, key)}
                <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Search (md+) */}
          <div className="hidden max-w-md flex-1 md:block lg:max-w-sm xl:max-w-md">
            <ProductSearch />
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <Link
              href="/wishlist"
              className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100"
              aria-label="Wishlist"
            >
              <FaHeart className="h-[22px] w-[22px] text-red-400 transition-colors hover:text-red-600" />
              <AnimatePresence>
                {wishItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white"
                  >
                    {wishItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link
              href="/cart"
              className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100"
              aria-label="Cart"
            >
              <PiShoppingCartSimpleBold className="h-6 w-6" />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100"
              aria-label={t(locale, "header.dashboard")}
            >
              <RiAccountCircleLine size={26} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-100 p-4">
                <Image src="/logo-text-black.svg" width={140} height={28} alt={tenant.name} />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <IoClose size={26} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-6">
                  <ProductSearch />
                </div>
                <nav className="flex flex-col">
                  {NAV_LINKS.map(({ href, key }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsMenuOpen(false)}
                      className="border-b border-gray-50 py-3.5 text-base font-medium text-gray-800 transition-colors hover:text-black"
                    >
                      {t(locale, key)}
                    </Link>
                  ))}
                </nav>
                <div className="mt-6">
                  <LanguageSwitcher />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
