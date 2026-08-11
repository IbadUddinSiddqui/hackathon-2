// lib/customers.ts
// Server-only customer helpers. P3-01: upsert a customer document by email
// whenever an order is created; P3-10/P3-14 reuse the same doc for store
// credit and loyalty points.

import { serverClient } from "@/sanity/lib/server-client";

export type CustomerDoc = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  orderCount?: number;
  totalSpent?: number;
  creditBalance?: number;
  points?: number;
  createdAt?: string;
};

/** Normalize an email for storage/lookup (trim + lowercase). */
export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

/** Find a customer by normalized email, or null. P4-03 — tenant-scoped. */
export async function findCustomerByEmail(
  email: string,
  tenantId: string = "tenant-anks"
): Promise<CustomerDoc | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return serverClient.fetch(
    `*[_type == "customer" && email == $email && (!defined(tenantId) || tenantId == $tenantId)][0]`,
    { email: normalized, tenantId }
  );
}

/**
 * P3-01 — Upsert a customer from an order event. Creates the customer on first
 * order; otherwise increments orderCount/totalSpent atomically. Returns the
 * customer _id (or null when no email). Callers attach the returned id to the
 * order doc as `customer` reference.
 */
export async function upsertCustomerFromOrder(input: {
  tenantId?: string;
  email: string;
  name?: string;
  orderTotal?: number;
}): Promise<string | null> {
  const email = normalizeEmail(input.email);
  if (!email) return null;
  const tenantId = input.tenantId || "tenant-anks";

  const existing = await findCustomerByEmail(email, tenantId);
  if (existing) {
    const patch = serverClient
      .patch(existing._id)
      .inc({ orderCount: 1, totalSpent: input.orderTotal || 0 });
    await patch.commit();
    return existing._id;
  }

  const doc = await serverClient.create({
    _type: "customer",
    tenantId,
    email,
    name: (input.name || "").trim(),
    orderCount: 1,
    totalSpent: input.orderTotal || 0,
    creditBalance: 0,
    points: 0,
    createdAt: new Date().toISOString(),
  });
  return doc._id;
}

/**
 * P3-01 — Upsert the customer for an order AND attach the customer reference
 * to the order document. Fire-and-forget: a failure here must never break the
 * checkout/webhook flow, so errors are logged and swallowed.
 */
export async function linkCustomerToOrder(input: {
  orderDocId: string;
  tenantId?: string;
  email: string;
  name?: string;
  orderTotal?: number;
}) {
  try {
    const customerId = await upsertCustomerFromOrder({
      tenantId: input.tenantId,
      email: input.email,
      name: input.name,
      orderTotal: input.orderTotal,
    });
    if (!customerId) return;
    await serverClient
      .patch(input.orderDocId)
      .set({ customer: { _type: "reference", _ref: customerId } })
      .commit();
  } catch (err: any) {
    console.error("Failed to link customer to order:", err?.message || err);
  }
}

/** P3-10 — Read a customer's store-credit balance. */
export async function getCreditBalance(
  email: string,
  tenantId: string = "tenant-anks"
): Promise<number> {
  const customer = await findCustomerByEmail(email, tenantId);
  return customer?.creditBalance || 0;
}

/**
 * P3-10 — Atomically deduct store credit from a customer. Returns false if the
 * balance is insufficient (nothing is deducted). Used at checkout after the
 * server validates the requested amount.
 */
export async function deductCredit(
  email: string,
  amount: number,
  tenantId: string = "tenant-anks"
): Promise<boolean> {
  const customer = await findCustomerByEmail(email, tenantId);
  if (!customer || amount <= 0) return false;
  if ((customer.creditBalance || 0) < amount) return false;

  await serverClient
    .patch(customer._id)
    .inc({ creditBalance: -amount })
    .commit();
  return true;
}

/** P3-14 — Add loyalty points to a customer (e.g. after a paid order). */
export async function addLoyaltyPoints(
  email: string,
  points: number,
  tenantId: string = "tenant-anks"
) {
  if (!normalizeEmail(email) || points <= 0) return;
  const customer = await findCustomerByEmail(email, tenantId);
  if (!customer) return;
  await serverClient.patch(customer._id).inc({ points }).commit();
}
