"use client";

// app/components/Recommendations/HomeRecommendations.tsx
// P4-12 — homepage "Recommended for you": seeds the engine from the cart's
// first item; if the cart is empty it recommends top-rated products instead.
// Renders nothing if there is nothing to recommend.
// P08 — now renders through the ONE standardized ProductCard (fashion-object
// expression) instead of its own bespoke white-card markup.

import React, { useEffect, useState } from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import { clientTenantId } from "@/lib/tenant-client";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import ProductCard, { ProductCardData } from "../ProductCard/ProductCard";
import SectionHead from "../SectionHead/SectionHead";

export default function HomeRecommendations() {
  const { locale } = useLocale();
  const { items } = useCartStore();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { client } = await import("@/sanity/lib/client");
      const tenantId = clientTenantId();
      let docs: ProductCardData[] = [];

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
              `*[_id in $ids]{_id, name, price, category_slug, slug, images, stock, on_sale, sale_price}`,
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
            `*[_type == "product" && (!defined(tenantId) || tenantId == $tenantId)]{_id, name, price, category_slug, slug, images, stock, on_sale, sale_price} | order(ratings desc) [0...4]`,
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
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHead
        eyebrow={t(locale, "product.completeYourLook")}
        title={t(locale, "product.youMayAlsoLike")}
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-6">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
