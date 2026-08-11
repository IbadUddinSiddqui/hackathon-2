// lib/loyalty.ts
// P3-14 — loyalty points. Paid orders earn points (1 point per Rs 100 spent);
// points can be redeemed as store credit at checkout. Server-side math only.

import { findCustomerByEmail } from "@/lib/customers";

export const POINTS_PER_RS = 100; // 1 point per Rs 100 of order total
export const RS_PER_POINT = 1; // 1 point = Rs 1 of credit when redeemed

/** Points earned for a paid order total. */
export function pointsEarned(orderTotal: number): number {
  if (orderTotal <= 0) return 0;
  return Math.floor(orderTotal / POINTS_PER_RS);
}

/**
 * How much credit a given points balance can redeem (whole-rupee multiples).
 */
export function redeemableCredit(points: number): number {
  if (points <= 0) return 0;
  return Math.floor(points) * RS_PER_POINT;
}

/**
 * Redeem points for credit: verifies the customer's balance covers the
 * request, converts points → credit (grantStoreCredit), and deducts the
 * points. Returns the credit granted (0 on failure).
 */
export async function redeemPointsAsCredit(
  email: string,
  pointsToRedeem: number
): Promise<number> {
  const emailKey = (email || "").trim().toLowerCase();
  if (!emailKey || pointsToRedeem <= 0) return 0;

  const customer = await findCustomerByEmail(emailKey);
  if (!customer || (customer.points || 0) < pointsToRedeem) return 0;

  const credit = redeemableCredit(pointsToRedeem);
  if (credit <= 0) return 0;

  const { grantStoreCredit } = await import("@/lib/credit");
  const { serverClient } = await import("@/sanity/lib/server-client");

  await grantStoreCredit(emailKey, credit);
  await serverClient.patch(customer._id).inc({ points: -pointsToRedeem }).commit();
  return credit;
}
