"use client";

// app/components/Recommendations/Recommendations.tsx
// P4-12 — renders AI/rule-based recommendations from /api/recommendations.
// Shows a loading skeleton, falls back to a category grid on error/empty, and
// hides the whole section when there's nothing to recommend.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { clientTenantId } from "@/lib/tenant-client";

type RecProduct = {
  _id: string;
  name: string;
  price: number;
  ratings?: number;
  category_slug?: string;
  slug?: { current?: string };
  images?: { asset?: { _ref?: string } }[];
};

type Props = {
  productId: string;
  categorySlug?: string;
  titleKey?: string; // i18n key, default "product.youMayAlsoLike"
};

export default function Recommendations({ productId, categorySlug, titleKey }: Props) {
  const { locale } = useLocale();
  const [products, setProducts] = useState<RecProduct[] | null>(null);
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
        const docs: RecProduct[] = await client.fetch(
          `*[_id in $ids]{_id, name, price, ratings, category_slug, slug, images}`,
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
    return (
      <CategoryFallback categorySlug={categorySlug} title={title} />
    );
  }

  // Engine failed and there's no category to fall back to — show nothing.
  if (failed) return null;

  if (!products) {
    // Loading skeleton
    return (
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-80" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const imgRef = p.images?.[0]?.asset?._ref;
          const slug = p.slug?.current || p._id;
          return (
            <Link
              key={p._id}
              href={`/products/${p.category_slug || categorySlug || "all"}/${slug}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative bg-gray-50 rounded-t-lg">
                {imgRef ? (
                  <Image
                    src={urlFor(imgRef).url()}
                    alt={p.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate">{p.name}</h3>
                <p className="font-semibold text-gray-900">Rs {Number(p.price || 0).toFixed(2)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Old behaviour: products from the same category (used as the error fallback). */
function CategoryFallback({ categorySlug, title }: { categorySlug: string; title: string }) {
  const [products, setProducts] = useState<RecProduct[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { client } = await import("@/sanity/lib/client");
        const docs: RecProduct[] = await client.fetch(
          `*[_type == "product" && category_slug == $categorySlug && (!defined(tenantId) || tenantId == $tenantId)]{_id, name, price, ratings, category_slug, slug, images} | order(ratings desc) [0...4]`,
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
    <section className="py-12 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const imgRef = p.images?.[0]?.asset?._ref;
          const slug = p.slug?.current || p._id;
          return (
            <Link
              key={p._id}
              href={`/products/${categorySlug}/${slug}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative bg-gray-50 rounded-t-lg">
                {imgRef ? (
                  <Image
                    src={urlFor(imgRef).url()}
                    alt={p.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate">{p.name}</h3>
                <p className="font-semibold text-gray-900">Rs {Number(p.price || 0).toFixed(2)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
