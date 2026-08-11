// lib/credit.ts
// P3-10 — store credit. Customers accrue a balance (admin-issued or refunds);
// at checkout they can apply it toward the order total. The server validates
// the requested amount against the real balance and deducts atomically.

import { getCreditBalance, deductCredit, findCustomerByEmail } from "@/lib/customers";

/**
 * Apply store credit toward an order. Returns the amount actually applied
 * (min(requested, balance, remaining total)); refuses (returns 0) when the
 * customer doesn't exist. Deducts only the applied amount.
 */
export async function applyStoreCredit(input: {
  tenantId?: string;
  email: string;
  requested: number;
  remainingTotal: number;
}): Promise<number> {
  const email = (input.email || "").trim().toLowerCase();
  if (!email || input.requested <= 0 || input.remainingTotal <= 0) return 0;
  const tenantId = input.tenantId || "tenant-anks";

  const balance = await getCreditBalance(email, tenantId);
  if (balance <= 0) return 0;

  const applied = Math.min(input.requested, balance, input.remainingTotal);
  if (applied <= 0) return 0;

  const ok = await deductCredit(email, applied, tenantId);
  return ok ? applied : 0;
}

/** P3-10 — give a customer store credit (admin refunds, promotions, etc.). */
export async function grantStoreCredit(
  email: string,
  amount: number,
  tenantId: string = "tenant-anks"
) {
  if (amount <= 0) return;
  const customer = await findCustomerByEmail(email, tenantId);
  if (!customer) return;
  // Import lazily to avoid a circular import (customers.ts doesn't import us).
  const { serverClient } = await import("@/sanity/lib/server-client");
  await serverClient.patch(customer._id).inc({ creditBalance: amount }).commit();
}

/** Round a PKR amount to 2dp for storage/display. */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
