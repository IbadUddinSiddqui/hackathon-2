"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { useTenant } from "@/lib/tenant-provider";

type Category = {
  href: string;
  src: string;
  labelKey: string;
  span: string;
  sizes: string;
};

const CATEGORIES: Category[] = [
  {
    href: "/products/womens-clothing",
    src: "/womens-clothing.jpg",
    labelKey: "category.women",
    span: "lg:col-span-2 lg:row-span-2",
    sizes: "(max-width: 1024px) 50vw, 50vw",
  },
  {
    href: "/products/mens-clothing",
    src: "/mens-clothing.webp",
    labelKey: "category.men",
    span: "lg:col-span-2 lg:row-span-1",
    sizes: "(max-width: 1024px) 50vw, 50vw",
  },
  {
    href: "/products/children",
    src: "/children.jpg",
    labelKey: "category.kids",
    span: "lg:col-span-1 lg:row-span-1",
    sizes: "(max-width: 1024px) 50vw, 25vw",
  },
  {
    href: "/products/footwear",
    src: "/footwear.jpg",
    labelKey: "category.footwear",
    span: "lg:col-span-1 lg:row-span-1",
    sizes: "(max-width: 1024px) 50vw, 25vw",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

export default function CategoryShowcase() {
  const { locale } = useLocale();
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
      {/* Section header */}
      <div className="mb-10 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
        <div className="text-center sm:text-left">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            {t(locale, "category.eyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t(locale, "category.title")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {t(locale, "category.subtitle")}
          </p>
        </div>
        <Link
          href="/products"
          className="group hidden items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-900 hover:text-white dark:border-gray-600 dark:text-gray-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-gray-900 sm:inline-flex"
        >
          {t(locale, "category.viewAll")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Bento grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:h-[520px]"
      >
        {CATEGORIES.map((cat) => {
          const label = t(locale, cat.labelKey);
          return (
            <motion.div key={cat.href} variants={cardVariants} className={`${cat.span}`}>
              <Link
                href={cat.href}
                className="group relative block h-44 overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-900/5 transition-shadow duration-300 hover:shadow-xl dark:bg-gray-800 sm:h-60 lg:h-full"
              >
                <Image
                  src={cat.src}
                  alt={label}
                  fill
                  sizes={cat.sizes}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Legibility gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                {/* Hover accent wash */}
                <div
                  className="absolute inset-0 opacity-0 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-30"
                  style={{ backgroundColor: accent }}
                />

                {/* Label */}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
                  <div>
                    <h3 className="text-lg font-bold text-white drop-shadow sm:text-2xl">
                      {label}
                    </h3>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 sm:text-sm">
                      {t(locale, "category.shopNow")}
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5"
                        style={{ color: accent === "#000000" ? "#ffffff" : accent }}
                      />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Mobile view-all */}
      <div className="mt-8 text-center sm:hidden">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          {t(locale, "category.viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

const ArrowRight = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={style}
    aria-hidden
  >
    <path
      d="M5 12H19M19 12L13 6M19 12L13 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
