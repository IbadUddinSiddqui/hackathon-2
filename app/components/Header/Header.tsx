"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { RiAccountCircleLine } from "react-icons/ri";
import { IoMenu, IoClose, IoChevronDown } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import ProductSearch from "../ProductSearch/ProductSearch";
import ClickOutside from "../ClickOutside";
import { useCartStore } from "@/lib/stores/cartStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { useTenant } from "@/lib/tenant-provider";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

const NAV_LINKS = [
  { href: "/products", key: "nav.shop" },
  { href: "/about", key: "header.about" },
  { href: "/contact", key: "header.contact" },
];

const Header = () => {
  const router = useRouter();
  const { items } = useCartStore();
  const wishlist = useWishlistStore();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const wishItemCount = wishlist.items.length;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const { locale } = useLocale();
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";

  // Subtle shadow once the page scrolls, and auto-hide: the bar slides away
  // when scrolling down and drops back in the moment you scroll up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > lastY.current && y > 160) setHidden(true);
      else if (y < lastY.current) setHidden(false);
      lastY.current = y;
    };
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

  const handleLogout = async () => {
    setAccountOpen(false);
    setIsMenuOpen(false);
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  const accountItems = loggedIn
    ? [
        { href: "/dashboard", key: "header.dashboard" },
        { href: "/profile", key: "account.profile" },
        { href: "/settings", key: "account.settings" },
      ]
    : [
        { href: "/login", key: "header.login" },
        { href: "/register", key: "account.register" },
      ];

  return (
    <>
    <div
      className={`sticky top-0 z-50 transition-transform duration-300 ${
        hidden && !isMenuOpen ? "-translate-y-full" : "translate-y-0"
      }`}
    >
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
        className={`border-b border-gray-100 bg-white/95 backdrop-blur transition-shadow dark:border-gray-800 dark:bg-gray-900/95 ${
          scrolled ? "shadow-md" : "shadow-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Open menu"
          >
            <IoMenu size={24} />
          </button>

          {/* Logo — compact so it doesn't dominate the bar */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo-text-black.svg"
              width={132}
              height={26}
              alt={tenant.name}
              className="h-auto w-auto transition-opacity hover:opacity-75 dark:invert"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className="group relative text-[15px] font-medium text-gray-700 transition-colors hover:text-black dark:text-gray-300 dark:hover:text-white"
              >
                {t(locale, key)}
                <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full dark:bg-white" />
              </Link>
            ))}
          </nav>

          {/* Search (md+) */}
          <div className="hidden max-w-md flex-1 md:block lg:max-w-sm xl:max-w-md">
            <ProductSearch />
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <Link
              href="/wishlist"
              className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Wishlist"
            >
              <FaHeart className="h-[21px] w-[21px] text-red-400 transition-colors hover:text-red-600" />
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
              className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
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

            {/* Login button (desktop, signed out) */}
            {!loggedIn && status !== "loading" && (
              <Link
                href="/login"
                className="ml-1 hidden items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black md:inline-flex"
              >
                {t(locale, "header.login")}
              </Link>
            )}

            {/* Account dropdown */}
            <ClickOutside onClick={() => setAccountOpen(false)} className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-0.5 rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label={t(locale, "account.menu")}
                aria-expanded={accountOpen}
              >
                <RiAccountCircleLine size={25} />
                <IoChevronDown
                  className={`hidden h-3.5 w-3.5 transition-transform sm:block ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+10px)] w-56 origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
                  >
                    {loggedIn && session?.user?.email && (
                      <div className="border-b border-gray-100 px-3 pb-2 pt-1.5 dark:border-gray-700">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">
                          {t(locale, "account.signedInAs")}
                        </p>
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                          {session.user.email}
                        </p>
                      </div>
                    )}
                    {accountItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        {t(locale, item.key)}
                      </Link>
                    ))}
                    {loggedIn && (
                      <>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          {t(locale, "account.logout")}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </ClickOutside>
          </div>
        </div>
      </header>
      </div>

      {/* Mobile drawer — sibling of the transformed wrapper so the `position:
          fixed` overlay/drawer keep the viewport as their containing block. */}
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
              className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl lg:hidden dark:bg-gray-900"
            >
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
                <Image src="/logo-text-black.svg" width={120} height={24} alt={tenant.name} className="dark:invert" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
                      className="border-b border-gray-50 py-3.5 text-base font-medium text-gray-800 transition-colors hover:text-black dark:border-gray-800 dark:text-gray-100 dark:hover:text-white"
                    >
                      {t(locale, key)}
                    </Link>
                  ))}
                </nav>

                {/* Account block */}
                <div className="mt-6 space-y-3">
                  {loggedIn ? (
                    <>
                      <p className="truncate px-1 text-xs text-gray-400">
                        {t(locale, "account.signedInAs")} {session?.user?.email}
                      </p>
                      {accountItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between rounded-full border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                        >
                          {t(locale, item.key)}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full rounded-full border border-red-200 px-4 py-3 text-center text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        {t(locale, "account.logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="block rounded-full bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-black"
                      >
                        {t(locale, "header.login")}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="block rounded-full border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
                      >
                        {t(locale, "account.register")}
                      </Link>
                    </>
                  )}
                </div>

                <div className="mt-6">
                  <LanguageSwitcher />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
