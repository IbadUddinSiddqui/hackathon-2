import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { SITE_URL } from "@/lib/site";
import { getActiveTenantId, tenantFilter } from "@/lib/tenants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.5 },
  ];

  // Indexable pages only — auth, cart/checkout and admin routes are noindex.
  // P4-03 — tenant-scoped: a tenant's sitemap only lists its own products.
  try {
    const tenantId = await getActiveTenantId();
    const products = await client.fetch<{ _id: string; category_slug?: string }[]>(
      `*[_type == "product" && ${tenantFilter()}]{_id, category_slug}`,
      { tenantId }
    );

    const categories = [
      ...new Set(products.map((p) => p.category_slug).filter(Boolean) as string[]),
    ];

    for (const category of categories) {
      staticEntries.push({
        url: `${SITE_URL}/products/${category}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const product of products) {
      if (!product.category_slug) continue;
      staticEntries.push({
        url: `${SITE_URL}/products/${product.category_slug}/${product._id}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("Sitemap generation failed:", error);
  }

  return staticEntries;
}
