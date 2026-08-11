// lib/checkout-pricing.ts
// Shared server-side order pricing used by ALL order-creation routes (COD,
// Safepay). Centralizes the trust rules so they never drift:
//   1. prices come from Sanity (flash-sale price when a sale is active)
//   2. discount code is validated server-side
//   3. gift card is validated + balance decremented server-side (P3-11)
//   4. store credit is validated + deducted server-side (P3-10)
//   5. DELIVERY_FEE is added once, last
// Returns the fully-priced order breakdown + line items.

import { fetchProductsByIds, type SanityProductRef } from "@/lib/orders";
import { validateDiscountCode } from "@/lib/discounts";
import { redeemGiftCard } from "@/lib/gift-cards";
import { applyStoreCredit } from "@/lib/credit";
import { DELIVERY_FEE } from "@/lib/constants";
import { getActiveFlashSales, buildSalePriceMap } from "@/lib/flash-sales";
import { pointsEarned } from "@/lib/loyalty";

export type CheckoutLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string[];
  color?: string;
};

export type PricedOrder = {
  items: CheckoutLineItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  giftCardCode?: string;
  giftCardApplied: number;
  creditApplied: number;
  deliveryFee: number;
  total: number;
  pointsEarned: number;
};

export type PricingError = { error: string };

export async function priceCheckout(input: {
  tenantId?: string; // P4-03 — isolate pricing to the active SaaS tenant
  // NOTE: `color` is accepted but deliberately IGNORED — the order's color
  // always comes from the Sanity product (server-truth), never the browser.
  items: { id: string; quantity: number; size?: string[]; color?: string }[];
  customerEmail?: string;
  discountCode?: string;
  giftCardCode?: string;
  creditAmount?: number;
}): Promise<PricedOrder | PricingError> {
  const tenantId = input.tenantId || "tenant-anks";
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { error: "Cart is empty" };
  }

  // Fetch real products AND active flash sales in parallel (server-truth).
  const [products, sales] = await Promise.all([
    fetchProductsByIds(input.items.map((i) => i.id), tenantId),
    getActiveFlashSales(tenantId),
  ]);
  const productMap = new Map(products.map((p) => [p._id, p]));
  const salePriceMap = buildSalePriceMap(sales);

  const items: CheckoutLineItem[] = [];
  let subtotal = 0;
  for (const item of input.items) {
    const product: SanityProductRef | undefined = productMap.get(item.id);
    if (!product) {
      return { error: `Product no longer available: ${item.id}` };
    }
    const quantity = Math.max(1, Math.min(item.quantity, product.stock || 0));
    // P3-13: use the active flash-sale price when one exists for this product.
    const price = salePriceMap.has(product._id) ? salePriceMap.get(product._id)! : product.price;
    subtotal += price * quantity;
    items.push({
      id: product._id,
      name: product.name,
      price,
      quantity,
      size: Array.isArray(item.size) ? item.size : undefined,
      // Server-truth: the color comes from Sanity, never from the browser, so
      // the right color variant is always recorded on the order.
      color: product.color || undefined,
    });
  }

  // Discount (server-validated).
  const discountResult = input.discountCode
    ? await validateDiscountCode(input.discountCode, subtotal, tenantId)
    : { valid: true as const, discountAmount: 0, code: "" };
  if (!discountResult.valid) {
    return { error: discountResult.message };
  }

  let total = subtotal - discountResult.discountAmount;

  // Gift card (P3-11) — applied to the remaining balance, balance decremented.
  let giftCardApplied = 0;
  let giftCardCode: string | undefined;
  if (input.giftCardCode && input.giftCardCode.trim()) {
    const redeemed = await redeemGiftCard({
      code: input.giftCardCode,
      amount: Math.max(0, total),
      tenantId,
    });
    if (redeemed.applied <= 0) {
      return { error: redeemed.message || "Gift card could not be applied" };
    }
    giftCardApplied = redeemed.applied;
    giftCardCode = input.giftCardCode.trim().toUpperCase();
    total -= giftCardApplied;
  }

  // Store credit (P3-10) — capped at the remaining total, deducted atomically.
  let creditApplied = 0;
  if (input.customerEmail && input.creditAmount && input.creditAmount > 0) {
    creditApplied = await applyStoreCredit({
      tenantId,
      email: input.customerEmail,
      requested: input.creditAmount,
      remainingTotal: Math.max(0, total),
    });
    total -= creditApplied;
  }

  // Delivery fee added once, after all discounts.
  total = Math.max(0, total) + DELIVERY_FEE;

  return {
    items,
    subtotal,
    discountCode: discountResult.code || undefined,
    discountAmount: discountResult.discountAmount,
    giftCardCode,
    giftCardApplied,
    creditApplied,
    deliveryFee: DELIVERY_FEE,
    total: Math.round(total * 100) / 100,
    pointsEarned: pointsEarned(total),
  };
}
