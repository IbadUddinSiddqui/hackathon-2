// lib/merchant-feed.ts
// P3-19 — Google Merchant Center shopping feed (XML). Pure generator +
// Sanity fetch. Prices are PKR (Google requires the ISO currency code).

import { serverClient } from "@/sanity/lib/server-client";
import { tenantFilter, DEFAULT_TENANT_ID } from "@/lib/tenants";

export type FeedProduct = {
  id: string;
  name: string;
  description: string;
  link: string;
  image: string;
  price: string; // e.g. "1499.00 PKR"
  availability: "in stock" | "out of stock";
  brand: string;
  condition: "new";
};

export function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function priceString(price: number): string {
  return `${Number(price || 0).toFixed(2)} PKR`;
}

/**
 * Fetch products from Sanity for the feed. P4-03 — tenant-scoped: the feed
 * served on a tenant's domain only lists that tenant's products (legacy docs
 * without tenantId still match via tenantFilter).
 */
export async function fetchFeedProducts(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<FeedProduct[]> {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://anks.com";
  const docs: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    brand?: string;
    images?: { asset?: { url?: string } }[];
  }[] = await serverClient.fetch(
    `*[_type == "product" && ${tenantFilter()}]{_id, name, description, price, stock, brand, "images": images[]{asset->{url}}}`,
    { tenantId }
  );

  return docs.map((doc) => ({
    id: doc._id,
    name: doc.name,
    description: (doc.description || "").slice(0, 500),
    link: `${baseUrl}/products/${encodeURIComponent("all")}/${encodeURIComponent(doc._id)}`,
    image: doc.images?.[0]?.asset?.url || "",
    price: priceString(doc.price),
    availability: doc.stock > 0 ? "in stock" : "out of stock",
    brand: doc.brand || "AnK's",
    condition: "new",
  }));
}

/** Generate the full RSS 2.0 shopping feed XML. */
export function buildFeedXml(products: FeedProduct[]): string {
  const items = products
    .map(
      (p) => `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description)}</g:description>
      <g:link>${escapeXml(p.link)}</g:link>
      <g:image_link>${escapeXml(p.image)}</g:image_link>
      <g:availability>${p.availability}</g:availability>
      <g:price>${escapeXml(p.price)}</g:price>
      <g:brand>${escapeXml(p.brand)}</g:brand>
      <g:condition>${p.condition}</g:condition>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AnK's Products</title>
    <link>${escapeXml(process.env.PUBLIC_BASE_URL || "https://anks.com")}</link>
    <description>AnK's clothing store product feed</description>
${items}
  </channel>
</rss>`;
}
