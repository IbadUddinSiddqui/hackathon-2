"use client";

// app/components/Recommendations/HomeRecommendations.tsx
// P4-12 — homepage "Recommended for you": seeds the engine from the cart's
// first item; if the cart is empty it recommends top-rated products instead.
// Renders nothing if there is nothing to recommend.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { useCartStore } from "@/lib/stores/cartStore";
import { clientTenantId } from "@/lib/tenant-client";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

type RecProduct = {
  _id: string;
  name: string;
  price: number;
  category_slug?: string;
  slug?: { current?: string };
  images?: { asset?: { _ref?: string } }[];
};

export default function HomeRecommendations() {
  const { locale } = useLocale();
  const { items } = useCartStore();
  const [products, setProducts] = useState<RecProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { client } = await import("@/sanity/lib/client");
      const tenantId = clientTenantId();
      let docs: RecProduct[] = [];

      if (items.length > 0) {
        // Seed from the cart via the recommendations engine.
        try {
          const seed = items[0];
          const res = await fetch(
            `/api/recommendations?productId=${encodeURIComponent(seed._id)}&limit=4`
          );
          const data = await res.json();
          const ids = Array.isArray(data.recommendations)
            ? data.recommendations.map((r: { productId: string }) => r.productId)
            : [];
          if (ids.length > 0) {
            docs = await client.fetch(
              `*[_id in $ids]{_id, name, price, category_slug, slug, images}`,
              { ids }
            );
          }
        } catch {
          /* fall through to top-rated */
        }
      }

      if (docs.length === 0) {
        // Empty cart or engine failure — show top-rated products for the tenant.
        try {
          docs = await client.fetch(
            `*[_type == "product" && (!defined(tenantId) || tenantId == $tenantId)]{_id, name, price, category_slug, slug, images} | order(ratings desc) [0...4]`,
            { tenantId }
          );
        } catch {
          /* silent */
        }
      }

      if (!cancelled) setProducts(docs);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">
        {t(locale, "product.completeYourLook")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const imgRef = p.images?.[0]?.asset?._ref;
          const slug = p.slug?.current || p._id;
          return (
            <Link
              key={p._id}
              href={`/products/${p.category_slug || "all"}/${slug}`}
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
                <p className="font-medium text-green-700">Rs {Number(p.price || 0).toFixed(2)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
