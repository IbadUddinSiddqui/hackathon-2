"use client";

// app/components/Recommendations/Recommendations.tsx
// P4-12 — renders AI/rule-based recommendations from /api/recommendations.
// Shows a loading skeleton, falls back to a category grid on error/empty, and
// hides the whole section when there's nothing to recommend.
// P08 — renders through the ONE standardized ProductCard (fashion-object
// expression), matching every other grid on the site.

import React, { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { clientTenantId } from "@/lib/tenant-client";
import ProductCard, { ProductCardData } from "../ProductCard/ProductCard";
import SectionHead from "../SectionHead/SectionHead";

type Props = {
  productId: string;
  categorySlug?: string;
  titleKey?: string; // i18n key, default "product.youMayAlsoLike"
};

export default function Recommendations({ productId, categorySlug, titleKey }: Props) {
  const { locale } = useLocale();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [failed, setFailed] = useState(false);
  const title = t(locale, titleKey || "product.youMayAlsoLike");

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setFailed(false);

    (async () => {
      try {
        const res = await fetch(
          `/api/recommendations?productId=${encodeURIComponent(productId)}&limit=4`
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data.recommendations) || data.recommendations.length === 0) {
          setFailed(true);
          return;
        }
        // Resolve the recommended ids to displayable products via Sanity.
        const ids = data.recommendations.map((r: { productId: string }) => r.productId);
        const { client } = await import("@/sanity/lib/client");
        const docs: ProductCardData[] = await client.fetch(
          `*[_id in $ids]{_id, name, price, ratings, category_slug, slug, images, stock, on_sale, sale_price}`,
          { ids }
        );
        if (cancelled) return;
        setProducts(docs);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Engine failed → same-category grid (the pre-AI behaviour), tenant-scoped.
  if (failed && categorySlug) {
    return <CategoryFallback categorySlug={categorySlug} title={title} />;
  }

  // Engine failed and there's no category to fall back to — show nothing.
  if (failed) return null;

  if (!products) {
    // Loading skeleton
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHead title={title} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[26rem] animate-pulse bg-brand-surface-alt dark:bg-brand-charcoal" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">        <SectionHead title={title} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-6">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} category={categorySlug} />
        ))}
      </div>
    </section>
  );
}

/** Old behaviour: products from the same category (used as the error fallback). */
function CategoryFallback({ categorySlug, title }: { categorySlug: string; title: string }) {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { client } = await import("@/sanity/lib/client");
        const docs: ProductCardData[] = await client.fetch(
          `*[_type == "product" && category_slug == $categorySlug && (!defined(tenantId) || tenantId == $tenantId)]{_id, name, price, ratings, category_slug, slug, images, stock, on_sale, sale_price} | order(ratings desc) [0...4]`,
          { categorySlug, tenantId: clientTenantId() }
        );
        if (!cancelled) setProducts(docs);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">        <SectionHead title={title} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-6">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} category={categorySlug} />
        ))}
      </div>
    </section>
  );
}
