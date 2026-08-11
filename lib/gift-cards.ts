// lib/gift-cards.ts
// P3-11 — gift cards. Admin creates a code + balance; customers redeem at
// checkout. Balance is validated and decremented server-side (never client-
// decided), mirroring the discount-code trust model.

import { serverClient } from "@/sanity/lib/server-client";

export type GiftCardDoc = {
  _id: string;
  code: string;
  balance: number;
  active?: boolean;
  expiresAt?: string;
};

export type GiftCardValidation =
  | { valid: true; card: GiftCardDoc; code: string }
  | { valid: false; message: string };

/** Normalize a gift-card code (trim + uppercase, like discount codes). */
export function normalizeGiftCardCode(raw: string): string {
  return (raw || "").trim().toUpperCase();
}

/** Find a gift card by exact normalized code. */
export async function findGiftCard(code: string): Promise<GiftCardDoc | null> {
  const normalized = normalizeGiftCardCode(code);
  if (!normalized) return null;
  return serverClient.fetch(
    `*[_type == "giftCard" && code == $code][0]`,
    { code: normalized }
  );
}

/**
 * Validate a gift card for use against a subtotal. Returns the card on
 * success; rejects inactive, expired, or zero-balance cards.
 */
export async function validateGiftCard(
  rawCode: string | undefined
): Promise<GiftCardValidation> {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, message: "Enter a gift card code" };
  }
  const code = normalizeGiftCardCode(rawCode);
  const card = await findGiftCard(code);
  if (!card) return { valid: false, message: "Invalid gift card code" };
  if (card.active === false) return { valid: false, message: "This gift card is no longer active" };
  if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
    return { valid: false, message: "This gift card has expired" };
  }
  if ((card.balance || 0) <= 0) {
    return { valid: false, message: "This gift card has no remaining balance" };
  }
  return { valid: true, card, code };
}

/**
 * Apply a gift card toward an order: validate, then atomically decrement its
 * balance by the amount used (capped at the card's balance). Returns the
 * amount applied, or 0 with the failure reason.
 */
export async function redeemGiftCard(input: {
  code: string;
  amount: number;
}): Promise<{ applied: number; message?: string }> {
  const result = await validateGiftCard(input.code);
  if (!result.valid) return { applied: 0, message: result.message };

  const applied = Math.min(input.amount, result.card.balance || 0);
  if (applied <= 0) return { applied: 0, message: "Gift card balance is empty" };

  await serverClient
    .patch(result.card._id)
    .inc({ balance: -applied })
    .commit();

  return { applied };
}
