"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
import ThemeToggle from "../ThemeToggle/ThemeToggle";

const NAV_LINKS = [
  { href: "/products", key: "nav.shop" },
  { href: "/about", key: "header.about" },
  { href: "/contact", key: "header.contact" },
];

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
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

  // P04 — transparent-over-hero: only on the homepage while the page is at
  // the very top (y <= 8). Any scroll past that switches to the solid bar;
  // the transition is 300ms ease, matching the auto-hide timing.
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  // Subtle elevation once the page scrolls, and auto-hide: the bar slides
  // away when scrolling down and drops back in the moment you scroll up.
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

  // Shared treatment for icon buttons — white-on-dark when transparent,
  // brand ink on brand surface otherwise.
  const actionBtn = transparent
    ? "text-white hover:bg-white/10"
    : "text-brand-ink hover:bg-brand-surface-alt dark:text-brand-ink-soft dark:hover:bg-brand-charcoal";

  return (
    <>
    <div
      className={`sticky top-0 z-50 transition-transform duration-300 ${
        hidden && !isMenuOpen ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* P04 — contrast-safety scrim: a near-solid gradient behind the nav
          bar itself (not full-bar opacity). It must stay strong across the
          whole bar height so white nav text passes AA over ANY campaign
          imagery — a weak gradient leaves the nav row over ~230 luminance
          on light pages (measured). Strengthened: 95→90→80%. NOTE: uses
          the literal brand-ink value, NOT `black` — this project's config
          overrides black.DEFAULT to TailAdmin's #1C2434 navy, which would
          tint the scrim blue. #0b0b0c stays dark in BOTH modes so white
          nav text keeps contrast on the light hero in light mode and the
          dark hero in dark mode. */}
      {transparent && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0b0b0c]/95 via-[#0b0b0c]/90 to-[#0b0b0c]/80"
        />
      )}

      {/* Top banner */}
      <div
        className={`flex h-8 items-center justify-center px-4 transition-colors duration-300 ${
          transparent ? "bg-transparent" : "bg-brand-charcoal"
        }`}
      >
        <p className="truncate text-center text-xs font-medium text-white sm:text-sm" dir="auto">
          {tenant.name} — {t(locale, "header.banner")}{" "}
          <Link
            href="/register"
            className="ml-1 underline decoration-white/60 decoration-1 underline-offset-4 transition-colors hover:decoration-white"
          >
            {t(locale, "header.claim")}
          </Link>
        </p>
      </div>

      {/* Main header */}
      <header
        className={`border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          transparent
            ? "border-transparent bg-transparent"
            : "border-brand-line bg-brand-surface/95 backdrop-blur dark:border-brand-line dark:bg-brand-surface-alt/95"
        } ${scrolled && !transparent ? "shadow-brand-2" : ""}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`rounded-full p-2 transition-colors ${actionBtn} lg:hidden`}
            aria-label="Open menu"
          >
            <IoMenu size={24} />
          </button>

          {/* Logo — compact so it doesn't dominate the bar. The brand logo
              (logo.svg) is a full-color mark on a black tile, so it never
              inverts: it blends into the dark hero scrim and reads as a black
              tile on light surfaces. */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.svg"
              width={40}
              height={40}
              alt={tenant.name}
              className="h-10 w-auto rounded-sm transition-opacity hover:opacity-80"
            />
          </Link>

          {/* Desktop nav — Nav-type typography (small, wide-tracked, uppercase) */}
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className={`group relative text-nav transition-colors ${
                  transparent
                    ? "text-white/90 hover:text-white"
                    : "text-brand-muted hover:text-brand-ink dark:text-brand-muted dark:hover:text-brand-ink-soft"
                }`}
              >
                {t(locale, key)}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px w-0 transition-all duration-300 group-hover:w-full ${
                    transparent ? "bg-white" : "bg-brand-ink dark:bg-brand-ink-soft"
                  }`}
                />
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

            {/* P22.5 — dark/light toggle, visible at every breakpoint */}
            <ThemeToggle className={actionBtn} />

            <Link
              href="/wishlist"
              className={`relative rounded-full p-2 transition-colors ${actionBtn}`}
              aria-label="Wishlist"
            >
              <FaHeart className="h-[21px] w-[21px] text-brand-heart transition-opacity hover:opacity-80" />
              <AnimatePresence>
                {wishItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-bad text-[11px] font-bold text-white"
                  >
                    {wishItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link
              href="/cart"
              className={`relative rounded-full p-2 transition-colors ${actionBtn}`}
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
                className={`ml-1 hidden items-center rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 md:inline-flex ${
                  transparent
                    ? "bg-white text-brand-ink"
                    : "bg-brand-ink text-brand-ink-inverse dark:bg-brand-ink-inverse dark:text-brand-ink"
                }`}
              >
                {t(locale, "header.login")}
              </Link>
            )}

            {/* Account dropdown */}
            <ClickOutside onClick={() => setAccountOpen(false)} className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className={`flex items-center gap-0.5 rounded-full p-2 transition-colors ${actionBtn}`}
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
                    className="absolute right-0 top-[calc(100%+10px)] w-56 origin-top-right rounded-brand-lg border border-brand-line bg-brand-surface p-1.5 shadow-brand-3 dark:border-brand-line dark:bg-brand-surface-alt"
                  >
                    {loggedIn && session?.user?.email && (
                      <div className="border-b border-brand-line px-3 pb-2 pt-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-brand-muted">
                          {t(locale, "account.signedInAs")}
                        </p>
                        <p className="truncate text-sm font-medium text-brand-ink dark:text-brand-ink-soft">
                          {session.user.email}
                        </p>
                      </div>
                    )}
                    {accountItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 rounded-brand px-3 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-surface-alt hover:text-brand-ink dark:text-brand-ink-soft dark:hover:bg-brand-charcoal"
                      >
                        {t(locale, item.key)}
                      </Link>
                    ))}
                    {loggedIn && (
                      <>
                        <div className="my-1 border-t border-brand-line dark:border-brand-line" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-brand px-3 py-2 text-left text-sm font-medium text-brand-bad transition-colors hover:bg-brand-bad-soft dark:hover:bg-brand-bad-soft"
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
              className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-brand-surface shadow-2xl lg:hidden dark:bg-brand-surface-alt"
            >
              <div className="flex items-center justify-between border-b border-brand-line p-4">
                <Image src="/logo.svg" width={40} height={40} alt={tenant.name} className="h-10 w-auto rounded-sm" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full p-2 text-brand-muted transition-colors hover:bg-brand-surface-alt dark:text-brand-muted dark:hover:bg-brand-charcoal"
                  aria-label="Close menu"
                >
                  <IoClose size={26} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {/* Priority 1: search */}
                <div className="mb-6">
                  <ProductSearch />
                </div>
                {/* Priority 2: navigation */}
                <nav className="flex flex-col">
                  {NAV_LINKS.map(({ href, key }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsMenuOpen(false)}
                      className="border-b border-brand-line py-3.5 text-base font-medium text-brand-ink transition-colors hover:text-brand-ink-soft dark:text-brand-ink-soft dark:hover:text-white"
                    >
                      {t(locale, key)}
                    </Link>
                  ))}
                </nav>

                {/* Priority 3: account */}
                <div className="mt-6 space-y-3">
                  {loggedIn ? (
                    <>
                      <p className="truncate px-1 text-xs text-brand-muted">
                        {t(locale, "account.signedInAs")} {session?.user?.email}
                      </p>
                      {accountItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between rounded-full border border-brand-line-strong px-4 py-3 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-surface-alt dark:text-brand-ink-soft dark:hover:bg-brand-charcoal"
                        >
                          {t(locale, item.key)}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full rounded-full border border-brand-bad-soft px-4 py-3 text-center text-sm font-semibold text-brand-bad transition-colors hover:bg-brand-bad-soft"
                      >
                        {t(locale, "account.logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="block rounded-full bg-brand-ink px-4 py-3 text-center text-sm font-semibold text-brand-ink-inverse transition-opacity hover:opacity-90 dark:bg-brand-ink-soft dark:text-brand-ink"
                      >
                        {t(locale, "header.login")}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="block rounded-full border border-brand-line-strong px-4 py-3 text-center text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-surface-alt dark:text-brand-ink-soft dark:hover:bg-brand-charcoal"
                      >
                        {t(locale, "account.register")}
                      </Link>
                    </>
                  )}
                </div>

                {/* Priority 4: language + theme */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <LanguageSwitcher />
                  <ThemeToggle className="border border-brand-line text-brand-ink transition-colors hover:bg-brand-surface-alt dark:border-brand-line dark:text-brand-ink-soft dark:hover:bg-brand-charcoal" />
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
