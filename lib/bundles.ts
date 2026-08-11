// lib/bundles.ts
// P3-12 — product bundles. A bundle is a fixed set of products + quantities
// sold at a bundle price. Storefront renders bundles; checkout expands them
// into line items priced server-side (never client-computed).

import { serverClient } from "@/sanity/lib/server-client";

export type BundleItem = {
  product: { _id: string; name: string; price: number };
  quantity: number;
};

export type BundleDoc = {
  _id: string;
  name: string;
  description?: string;
  image?: { asset?: { url?: string } } | null;
  items: BundleItem[];
  bundlePrice: number;
  active?: boolean;
};

/** Fetch active bundles with their products expanded. */
export async function getActiveBundles(): Promise<BundleDoc[]> {
  return serverClient.fetch(
    `*[_type == "bundle" && active != false]{
      _id,
      name,
      description,
      bundlePrice,
      "image": image{asset->{url}},
      "items": items[]{
        quantity,
        "product": product->{_id, name, price}
      }
    }`
  );
}

/** Sum of the underlying products at list price. */
export function bundleSubtotal(items: BundleItem[]): number {
  return items.reduce((sum, i) => sum + (i.product?.price || 0) * (i.quantity || 1), 0);
}

/** How much the customer saves vs buying separately (0 when not cheaper). */
export function bundleSavings(bundle: Pick<BundleDoc, "items" | "bundlePrice">): number {
  return Math.max(0, bundleSubtotal(bundle.items) - (bundle.bundlePrice || 0));
}

/** Expand a bundle into checkout line items. */
export function toCheckoutItem(bundle: BundleDoc): {
  id: string;
  name: string;
  price: number;
  quantity: number;
}[] {
  return bundle.items.map((i) => ({
    id: i.product._id,
    name: i.product.name,
    price: i.product.price,
    quantity: i.quantity,
  }));
}
