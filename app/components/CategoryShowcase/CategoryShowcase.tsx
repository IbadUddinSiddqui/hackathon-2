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

/** Bento spans that adapt to however many categories exist.
 *
 * Left-weighted cinematic pattern (21st.dev-style): the featured tile owns
 * 4 of the 6 columns (a ~67% hero) and the supporting tiles stack a tight
 * 2-column rail beside it — more dramatic than a 50/50 split, still on the
 * same grid system (just col-span arithmetic, no new tokens). */
function tileLayout(index: number, count: number): { span: string; sizes: string } {
  // A single category spans the full grid on every breakpoint.
  if (count === 1) {
    return { span: "col-span-2 lg:col-span-6 lg:row-span-2", sizes: "(max-width: 1024px) 100vw, 100vw" };
  }
  // Featured tile — the dominant hero.
  if (index === 0) {
    return { span: "lg:col-span-4 lg:row-span-2", sizes: "(max-width: 1024px) 50vw, 67vw" };
  }
  if (count === 2) {
    // Companion tile fills the whole right rail.
    return { span: "lg:col-span-2 lg:row-span-2", sizes: "(max-width: 1024px) 50vw, 33vw" };
  }
  if (index === 1 || (count === 3 && index === 2)) {
    // Wide tile on the rail's first row; with exactly 3 categories the last
    // tile goes wide too so row 2 has no hole.
    return { span: "lg:col-span-2 lg:row-span-1", sizes: "(max-width: 1024px) 50vw, 33vw" };
  }
  // Two compact tiles share the rail's second row.
  return { span: "lg:col-span-1 lg:row-span-1", sizes: "(max-width: 1024px) 50vw, 17vw" };
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
            className="mb-3 text-eyebrow"
            style={{ color: accent }}
          >
            {t(locale, "category.eyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-brand-ink  sm:text-4xl">
            {t(locale, "category.title")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-brand-muted">
            {t(locale, "category.subtitle")}
          </p>
        </div>
        <Link
          href="/products"
          className="group hidden items-center gap-3 text-sm font-medium tracking-wide text-brand-muted transition-colors hover:text-brand-ink dark:hover:text-brand-ink-inverse sm:inline-flex"
        >
          {t(locale, "category.viewAll")}
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-px w-8 bg-brand-line-strong transition-all duration-300 group-hover:w-12 group-hover:bg-brand-ink dark:group-hover:bg-brand-ink-inverse" />
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Bento grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:h-[520px] lg:grid-flow-dense lg:grid-cols-6 lg:grid-rows-2"
      >
        {tiles.length === 0
          ? // Loading skeleton (matches the 4-tile layout) so the section
            // doesn't jump when the data arrives.
            Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={`skeleton-${i}`} variants={cardVariants} className={tileLayout(i, 4).span}>
                <div className="h-44 animate-pulse bg-brand-surface-alt dark:bg-brand-charcoal sm:h-60 lg:h-full" />
              </motion.div>
            ))
          : tiles.map((tile, index) => {
              const label = KNOWN_LABEL_KEYS[tile.slug]
                ? t(locale, KNOWN_LABEL_KEYS[tile.slug])
                : tile.category || humanizeSlug(tile.slug);
              return (
                <motion.div key={tile.slug} variants={cardVariants} className={tile.span}>
                  <Link
                    href={tile.href}
                    className="group relative block h-44 overflow-hidden bg-brand-ink-soft sm:h-60 lg:h-full"
                  >
                    <Image
                      src={tile.src}
                      alt={label}
                      fill
                      sizes={tile.sizes}
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                    {/* Legibility gradient — editorial, bottom-weighted */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/85 via-brand-ink/10 to-transparent" />

                    {/* Editorial label — featured tile gets display-serif type;
                        rail tiles get a compact index + name. No card chrome. */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-6">
                      <div>
                        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-ink-inverse/60">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3
                          className={
                            index === 0
                              ? "font-display text-3xl font-normal leading-tight text-brand-ink-inverse sm:text-4xl"
                              : "text-base font-semibold tracking-wide text-brand-ink-inverse sm:text-lg"
                          }
                        >
                          {label}
                        </h3>
                        {/* Hairline underline reveal instead of the accent wash */}
                        <span
                          aria-hidden
                          className={`mt-3 block h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 ${
                            accent === "#000000" ? "bg-brand-ink-inverse/70" : ""
                          }`}
                          style={
                            accent === "#000000" ? undefined : { backgroundColor: accent }
                          }
                        />
                      </div>
                      <span className="hidden items-center gap-1.5 pb-1 text-xs font-medium uppercase tracking-[0.15em] text-brand-ink-inverse/80 sm:flex">
                        {t(locale, "category.shopNow")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
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
          className="inline-flex items-center gap-2 bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-ink-inverse transition-opacity hover:opacity-85 dark:bg-brand-ink-inverse dark:text-brand-ink"
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
