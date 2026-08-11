// lib/flash-sales.ts
// P3-13 — flash sales: products sold at a discounted price during a window.
// The storefront and payment endpoints read the ACTIVE sale to price items
// server-side (sale price is trusted, never client-decided).

import { serverClient } from "@/sanity/lib/server-client";

export type FlashSaleDoc = {
  _id: string;
  name: string;
  products?: { _ref: string }[] | { _id: string }[];
  salePrice: number;
  startsAt: string;
  endsAt: string;
  active?: boolean;
};

/** True when the sale is enabled and now is inside [startsAt, endsAt). */
export function isSaleActive(sale: FlashSaleDoc, now: Date = new Date()): boolean {
  if (sale.active === false) return false;
  const start = new Date(sale.startsAt);
  const end = new Date(sale.endsAt);
  return now >= start && now < end;
}

/** The sale price during the window, otherwise the list price. */
export function effectivePrice(
  sale: FlashSaleDoc | null | undefined,
  listPrice: number,
  now: Date = new Date()
): number {
  if (!sale || !isSaleActive(sale, now)) return listPrice;
  return sale.salePrice;
}

/** End timestamp for countdowns. */
export function saleEndsAt(sale: FlashSaleDoc): string {
  return sale.endsAt;
}

/** Fetch all enabled sales (active flag true). */
export async function getActiveFlashSales(): Promise<FlashSaleDoc[]> {
  return serverClient.fetch(
    `*[_type == "flashSale" && active != false]{
      _id,
      name,
      salePrice,
      startsAt,
      endsAt,
      "products": products[]{_ref}
    }`
  );
}

/** Build a productId → sale map from the active sales (for pricing lookups). */
export function buildSalePriceMap(sales: FlashSaleDoc[]): Map<string, number> {
  const map = new Map<string, number>();
  const now = new Date();
  for (const sale of sales) {
    if (!isSaleActive(sale, now)) continue;
    for (const ref of sale.products || []) {
      const id = (ref as any)?._ref || (ref as any)?._id;
      if (id) map.set(id, sale.salePrice);
    }
  }
  return map;
}
