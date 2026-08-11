"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { useTenant } from "@/lib/tenant-provider";

const SALE_MS = 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000;

function useCountdown(): {
  days: number;
  hours: number;
  minutes: number;
  ready: boolean;
} {
  // `ready` gates the rendered numbers until mount: seeding useState with
  // Date.now() during SSR would mismatch the client-hydrated HTML, so the
  // server always renders the stable "--" placeholder instead.
  const [end] = useState(() => Date.now() + SALE_MS);
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(0, end - now);
  const totalMinutes = Math.floor(remaining / 60_000);
  return {
    days: Math.floor(totalMinutes / (24 * 60)),
    hours: Math.floor((totalMinutes % (24 * 60)) / 60),
    minutes: totalMinutes % 60,
    ready,
  };
}

export default function FashionHero() {
  const { locale } = useLocale();
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const { days, hours, minutes, ready } = useCountdown();

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Parallax background */}
      <motion.div style={{ scale }} className="absolute inset-0 z-0">
        <Image
          src="/fabric-texture.jpg"
          alt="Fabric Texture"
          fill
          priority
          className="object-cover opacity-20"
        />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text content */}
          <div className="space-y-8">
            {/* Flash sale badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 shadow-lg ring-1 ring-gray-100"
            >
              <span style={{ color: accent }}>
                <FlashSaleIcon />
              </span>
              <p className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <span style={{ color: accent }}>{t(locale, "hero.sale")}:</span>
                <span className="tabular-nums text-gray-500">
                  {ready ? `${days}d ${hours}h ${minutes}m` : "--d --h --m"}
                </span>
              </p>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
            >
              {t(locale, "hero.title1")}
              <br />
              <span style={{ color: accent }}>{t(locale, "hero.title2")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl text-lg text-gray-600 md:text-xl"
            >
              {t(locale, "hero.subtitle")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/products"
                className="rounded-full bg-gray-900 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-xl"
              >
                {t(locale, "hero.shopNew")}
              </Link>
              <Link
                href="/products/womens-clothing"
                className="rounded-full border-2 border-gray-900 bg-white/70 px-8 py-4 text-sm font-semibold text-gray-900 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-gray-900 hover:text-white"
              >
                {t(locale, "hero.explore")}
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[
                { icon: <FreeReturnsIcon />, text: t(locale, "hero.freeReturns") },
                { icon: <EcoFriendlyIcon />, text: t(locale, "hero.eco") },
                { icon: <QualityIcon />, text: t(locale, "hero.quality") },
                { icon: <SupportIcon />, text: t(locale, "hero.support") },
              ].map((item) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-2.5 rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-gray-100 backdrop-blur"
                  whileHover={{ y: -5 }}
                >
                  <span style={{ color: accent }}>{item.icon}</span>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Category showcase */}
          <motion.div
            className="relative hidden h-[560px] overflow-hidden rounded-3xl bg-gray-50 shadow-2xl ring-1 ring-gray-100 lg:block"
            initial={{ rotate: -5, opacity: 0 }}
            animate={{ rotate: 5, opacity: 1 }}
            transition={{ rotate: { repeat: Infinity, repeatType: "mirror", duration: 8 }, opacity: { delay: 0.2 } }}
          >
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4">
              {[
                { href: "/products/womens-clothing", src: "/womens-clothing.jpg", label: t(locale, "hero.womens") },
                { href: "/products/mens-clothing", src: "/mens-clothing.webp", label: t(locale, "hero.mens") },
                { href: "/products/wearables", src: "/wearables.jpg", label: t(locale, "hero.wearables") },
                { href: "/products/children", src: "/children.jpg", label: t(locale, "hero.children") },
              ].map((item) => (
                <motion.div
                  key={item.href}
                  className="relative overflow-hidden rounded-xl bg-white"
                  whileHover={{ scale: 1.04 }}
                >
                  <Link href={item.href} className="group absolute inset-0 block">
                    <Image
                      src={item.src}
                      alt={item.label}
                      fill
                      sizes="(max-width: 1024px) 0vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating decoration */}
      <motion.div
        className="absolute left-10 top-1/4 z-0 opacity-30"
        animate={{ y: [-20, 20, -20] }}
        transition={{ duration: 8, repeat: Infinity }}
        aria-hidden
      >
        <FloatingThread />
      </motion.div>
    </section>
  );
}

// --- Inline SVG icons -----------------------------------------------------

const FlashSaleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
