// lib/product-sale.ts
// Product-level sale + new-arrival helpers (pure, testable).
//
// "On Sale" (TopSale section) is driven by a real flag on the product doc:
//   on_sale: true  +  sale_price: < price
// A sale only counts when the flag is set AND the price is actually lower —
// otherwise it's ignored everywhere (cards, detail page, checkout).
//
// "New Arrivals" is driven by a recency window on created_at, with a fallback
// to the newest products overall so the section never renders empty on a
// catalog that predates the window (e.g. old seed data).

export const NEW_ARRIVALS_DAYS = 30;

/** ISO timestamp marking the start of the new-arrivals window. */
export function newArrivalsSince(now: Date = new Date(), days: number = NEW_ARRIVALS_DAYS): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

type SaleCandidate = {
  on_sale?: boolean;
  sale_price?: number | null;
  price?: number;
};

/**
 * The effective sale price for a product, or null when it isn't genuinely on
 * sale (flag off, no sale price, or sale price not lower than list price).
 */
export function salePriceFor(p: SaleCandidate): number | null {
  if (!p.on_sale) return null;
  const sale = p.sale_price;
  if (typeof sale !== "number" || !Number.isFinite(sale)) return null;
  if (typeof p.price !== "number" || sale >= p.price) return null;
  return sale;
}

/** Display price (sale when active, otherwise list). */
export function displayPriceFor(p: SaleCandidate): number {
  return salePriceFor(p) ?? (typeof p.price === "number" ? p.price : 0);
}
