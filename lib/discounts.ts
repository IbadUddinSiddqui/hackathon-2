import { serverClient } from "@/sanity/lib/server-client";

export type DiscountCodeDoc = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active?: boolean;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
};

export type DiscountValidation =
  | { valid: true; discountAmount: number; code: string }
  | { valid: false; message: string };

/**
 * Validate a discount code server-side against Sanity and compute the discount
 * amount in dollars for the given subtotal. This is the ONLY place discount
 * codes are trusted — clients can never decide their own discount.
 */
export async function validateDiscountCode(
  rawCode: string | undefined,
  subtotal: number
): Promise<DiscountValidation> {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, message: "Enter a discount code" };
  }

  const code = rawCode.trim().toUpperCase();

  const doc: DiscountCodeDoc | null = await serverClient.fetch(
    `*[_type == "discountCode" && code == $code][0]`,
    { code }
  );

  if (!doc) {
    return { valid: false, message: "Invalid discount code" };
  }

  if (doc.active === false) {
    return { valid: false, message: "This discount code is no longer active" };
  }

  if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
    return { valid: false, message: "This discount code has expired" };
  }

  const maxUses = doc.maxUses ?? 0;
  if (maxUses > 0 && (doc.usedCount || 0) >= maxUses) {
    return { valid: false, message: "This discount code has reached its usage limit" };
  }

  const discountAmount =
    doc.type === "percent"
      ? (subtotal * doc.value) / 100
      : doc.value;

  // A discount can never exceed the subtotal. Round to cents so stored order
  // records match the charged amount exactly.
  return {
    valid: true,
    discountAmount: Math.round(Math.min(discountAmount, subtotal) * 100) / 100,
    code,
  };
}

/**
 * Increment a discount code's usage counter. Called by the webhook once an
 * order is actually paid (not when it's merely validated). Uses an atomic
 * increment so concurrent orders never lose an update.
 */
export async function incrementDiscountUsage(code: string) {
  const doc: { _id: string } | null = await serverClient.fetch(
    `*[_type == "discountCode" && code == $code][0]{_id}`,
    { code }
  );

  if (!doc) return;

  await serverClient.patch(doc._id).inc({ usedCount: 1 }).commit();
}
