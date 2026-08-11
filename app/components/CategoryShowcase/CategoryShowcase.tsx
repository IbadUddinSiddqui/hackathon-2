"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { useTenant } from "@/lib/tenant-provider";
import { client } from "@/sanity/lib/client";
import { clientTenantId } from "@/lib/tenant-client";

// Category data is derived from the tenant's products (multi-tenant safe):
// every product carries a category_slug + display name, and the first image of
// its highest-rated product represents the category. No hardcoded slugs/images.
type CategoryGroup = {
  slug: string;
  category: string;
  image: string;
};

type CategoryTile = CategoryGroup & { href: string; src: string; span: string; sizes: string };

const MAX_TILES = 4;

// Known slugs get translated labels; anything else falls back to the Sanity
// display name (or a humanized slug).
const KNOWN_LABEL_KEYS: Record<string, string> = {
  "womens-clothing": "category.women",
  "mens-clothing": "category.men",
  // The catalog's real slug is the plural form.
  "mens-clothings": "category.men",
  children: "category.kids",
  footwear: "category.footwear",
};

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Bento spans that adapt to however many categories exist. */
function tileLayout(index: number, count: number): { span: string; sizes: string } {
  // A single category spans the full grid on every breakpoint.
  if (count === 1) {
    return { span: "col-span-2 lg:col-span-4 lg:row-span-2", sizes: "(max-width: 1024px) 100vw, 100vw" };
  }
  if (count === 2) {
    return { span: "lg:col-span-2 lg:row-span-2", sizes: "(max-width: 1024px) 50vw, 50vw" };
  }
  if (index === 0) {
    return { span: "lg:col-span-2 lg:row-span-2", sizes: "(max-width: 1024px) 50vw, 50vw" };
  }
  if (index === 1 || (count === 3 && index === 2)) {
    // Row 1 fills with the featured (2) + wide (2) tiles; with exactly 3
    // categories the last tile goes wide too so row 2 has no hole.
    return { span: "lg:col-span-2 lg:row-span-1", sizes: "(max-width: 1024px) 50vw, 50vw" };
  }
  return { span: "lg:col-span-1 lg:row-span-1", sizes: "(max-width: 1024px) 50vw, 25vw" };
}

async function fetchCategoryGroups(): Promise<CategoryGroup[]> {
  const tenantId = clientTenantId();
  const docs = await client.fetch<{ category: string; category_slug: string | null; image: string | null }[]>(
    `*[_type == "product" && (!defined(tenantId) || tenantId == $tenantId) && defined(category_slug)] | order(ratings desc) {
      category,
      category_slug,
      "image": images[0].asset->url
    }`,
    { tenantId }
  );

  // Group by slug: count products, keep the highest-rated image + first name.
  const bySlug = new Map<string, CategoryGroup & { count: number }>();
  for (const doc of docs) {
    const slug = doc.category_slug;
    if (!slug || !slug.trim()) continue;
    const entry = bySlug.get(slug) ?? { slug, category: "", image: "", count: 0 };
    entry.count += 1;
    if (!entry.image && doc.image) entry.image = doc.image;
    if (!entry.category && doc.category) entry.category = doc.category;
    bySlug.set(slug, entry);
  }

  return [...bySlug.values()]
    .filter((g) => g.image) // only tiles with an image to show
    .sort((a, b) => b.count - a.count) // most products first = featured tile
    .slice(0, MAX_TILES)
    .map(({ slug, category, image }) => ({ slug, category, image }));
}

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
  const [groups, setGroups] = useState<CategoryGroup[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCategoryGroups()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err) => {
        // Fail quietly: the section simply hides if categories can't load.
        if (!cancelled) {
          console.error("Failed to load categories:", err);
          setGroups([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the whole section when the tenant has no product categories.
  if (groups !== null && groups.length === 0) return null;

  const tiles: CategoryTile[] =
    groups?.map((g, i) => ({
      ...g,
      href: `/products/${g.slug}`,
      src: g.image,
      ...tileLayout(i, groups.length),
    })) ?? [];

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
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:h-[520px] lg:grid-flow-dense lg:grid-cols-4 lg:grid-rows-2"
      >
        {tiles.length === 0
          ? // Loading skeleton (matches the 4-tile layout) so the section
            // doesn't jump when the data arrives.
            Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={`skeleton-${i}`} variants={cardVariants} className={tileLayout(i, 4).span}>
                <div className="h-44 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800 sm:h-60 lg:h-full" />
              </motion.div>
            ))
          : tiles.map((tile) => {
              const label = KNOWN_LABEL_KEYS[tile.slug]
                ? t(locale, KNOWN_LABEL_KEYS[tile.slug])
                : tile.category || humanizeSlug(tile.slug);
              return (
                <motion.div key={tile.slug} variants={cardVariants} className={tile.span}>
                  <Link
                    href={tile.href}
                    className="group relative block h-44 overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-900/5 transition-shadow duration-300 hover:shadow-xl dark:bg-gray-800 sm:h-60 lg:h-full"
                  >
                    <Image
                      src={tile.src}
                      alt={label}
                      fill
                      sizes={tile.sizes}
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
