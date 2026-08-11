// lib/billing.ts
// P4-07 — plan limits + usage metering. Pure limit tables + helpers (unit
// tested); Sanity writes (recordUsage, usageForMonth) use serverClient.
// Actual payment collection is a P4-09 (human) decision — this module is the
// metering/enforcement half that works regardless of the gateway.

import { serverClient } from "@/sanity/lib/server-client";
import { DEFAULT_TENANT_ID, type TenantPlan } from "@/lib/tenants";

export type PlanLimits = {
  productLimit: number;
  monthlyOrderLimit: number;
  bandwidthGB: number;
  // P4-09 (human decision) — PKR pricing. Defaults are DRAFT figures; the
  // owner confirms final numbers before platform billing goes live.
  pricePkr: number;
  billingPeriod: "monthly" | "yearly";
};

export const PLANS: Record<TenantPlan, PlanLimits> = {
  free: { productLimit: 20, monthlyOrderLimit: 50, bandwidthGB: 5, pricePkr: 0, billingPeriod: "monthly" },
  trial: { productLimit: 50, monthlyOrderLimit: 200, bandwidthGB: 15, pricePkr: 0, billingPeriod: "monthly" },
  pro: { productLimit: 2000, monthlyOrderLimit: 10000, bandwidthGB: 200, pricePkr: 4999, billingPeriod: "monthly" },
};

/** Human-readable plan summary (used by the platform console later). */
export function planSummary(plan: TenantPlan | string): {
  plan: TenantPlan;
  limits: PlanLimits;
  label: string;
} {
  const p = plan === "free" || plan === "trial" || plan === "pro" ? plan : "free";
  return { plan: p, limits: PLANS[p], label: p === "free" ? "Free" : p === "trial" ? "Trial" : "Pro" };
}

export function planLimits(plan?: string | null): PlanLimits {
  if (plan === "free" || plan === "trial" || plan === "pro") return PLANS[plan];
  return PLANS.free;
}

export type LimitCheck = {
  ok: boolean;
  limit: number;
  current: number;
  metric: string;
};

/** Pure check: is `current` within the plan's `metric` limit? */
export function checkPlanLimit(
  plan: string | null | undefined,
  metric: "products" | "orders",
  current: number
): LimitCheck {
  const limits = planLimits(plan);
  const limit = metric === "products" ? limits.productLimit : limits.monthlyOrderLimit;
  return { ok: current < limit, limit, current, metric };
}

/** Current billing month key (YYYY-MM). */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type UsageDoc = {
  _id: string;
  usage?: { month?: string; orders?: number; products?: number; bandwidthProxy?: number };
  plan?: TenantPlan;
};

async function getTenantUsageDoc(tenantId: string): Promise<UsageDoc | null> {
  return serverClient.fetch<UsageDoc | null>(
    `*[_type == "tenant" && _id == $id]{_id, plan, usage}[0]`,
    { id: tenantId }
  );
}

/**
 * Read this month's usage counters. If the tenant's counter is from an older
 * month (or missing), returns zeros for the current month.
 */
export async function usageForMonth(tenantId: string): Promise<{
  orders: number;
  products: number;
  bandwidthProxy: number;
  plan: TenantPlan | null;
}> {
  if (!tenantId || tenantId === DEFAULT_TENANT_ID) {
    // The default/platform tenant is not metered against a plan.
    return { orders: 0, products: 0, bandwidthProxy: 0, plan: null };
  }
  const doc = await getTenantUsageDoc(tenantId);
  const usage = doc?.usage;
  const fresh = usage && usage.month === currentMonth();
  return {
    orders: fresh ? usage.orders || 0 : 0,
    products: fresh ? usage.products || 0 : 0,
    bandwidthProxy: fresh ? usage.bandwidthProxy || 0 : 0,
    plan: doc?.plan || null,
  };
}

/**
 * Increment a usage counter for the current month (resets on month change).
 * P4-07 fix: setIfMissing alone can't reset a STALE month (the `usage` key
 * already exists) — so read the stored month first and write fresh counters
 * when it differs, then inc the metric.
 */
export async function recordUsage(
  tenantId: string,
  metric: "orders" | "products" | "bandwidthProxy",
  n = 1
): Promise<void> {
  if (!tenantId || tenantId === DEFAULT_TENANT_ID || n <= 0) return;
  const month = currentMonth();
  try {
    const doc = await getTenantUsageDoc(tenantId);
    const stored = doc?.usage?.month;
    const patch = serverClient.patch(tenantId);
    if (stored === month) {
      // Same month — increment in place.
      patch.inc({ [`usage.${metric}`]: n });
    } else {
      // Missing or stale month — reset fresh for the current month.
      patch.set({
        usage: { month, orders: 0, products: 0, bandwidthProxy: 0, [metric]: n },
      });
    }
    await patch.commit();
  } catch {
    // Metering is best-effort — never block a sale on it.
  }
}
