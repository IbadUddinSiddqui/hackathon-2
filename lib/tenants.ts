// lib/tenants.ts
// P4-01..P4-06 — multi-tenancy core. One doc per client brand (Sanity
// `tenant`). Every tenant-scoped collection carries a `tenantId` string; this
// module is the single source of truth for:
//   - the default tenant + GROQ isolation fragment (legacy-tolerant)
//   - resolving the active tenant from the Host header (custom domains)
//   - admin/API scoping from the NextAuth session
//   - per-tenant payment config (Safepay keys + webhook secret)

import type { Session } from "next-auth";
import { serverClient } from "@/sanity/lib/server-client";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { headers } from "next/headers";

export const DEFAULT_TENANT_ID = "tenant-anks";
export const DEFAULT_TENANT_SLUG = "anks";
// Hosts that should always resolve to the default tenant (local dev, platform).
export const PLATFORM_HOSTS = new Set(["localhost", "127.0.0.1"]);

export type TenantPlan = "free" | "trial" | "pro";
export type BillingStatus = "active" | "trialing" | "past_due" | "paused";

export type TenantDoc = {
  _id: string;
  name: string;
  slug: { current?: string } | string;
  domains?: string[];
  plan?: TenantPlan;
  billingStatus?: BillingStatus;
  branding?: {
    tagline?: string;
    contactEmail?: string;
    whatsapp?: string;
    accentColor?: string;
  };
  features?: {
    flashSales?: boolean;
    reviews?: boolean;
    giftCards?: boolean;
    loyalty?: boolean;
    bundles?: boolean;
    credit?: boolean;
  };
  payments?: {
    safepayApiKey?: string;
    safepaySecret?: string;
    safepayWebhookSecret?: string;
    currency?: string;
  };
  usage?: {
    month?: string;
    orders?: number;
    products?: number;
    bandwidthProxy?: number;
  };
  createdAt?: string;
};

/** Normalize a tenant's slug (Sanity slug object or plain string). */
export function tenantSlug(tenant: TenantDoc | null | undefined): string {
  if (!tenant) return DEFAULT_TENANT_SLUG;
  if (typeof tenant.slug === "string") return tenant.slug;
  return tenant.slug?.current || DEFAULT_TENANT_SLUG;
}

/**
 * GROQ isolation fragment — matches docs owned by `tenantId` PLUS legacy docs
 * that predate multi-tenancy (no tenantId). Combined with the param
 * `{ tenantId }` in every query that uses `$tenantId`.
 */
export function tenantFilter(): string {
  return "(!defined(tenantId) || tenantId == $tenantId)";
}

// --- resolution ----------------------------------------------------------

// Tiny module-level TTL cache so we don't hit Sanity on every request.
const cache = new Map<string, { at: number; value: unknown }>();
const TTL_MS = 60_000;

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.value as T);
  return fn().then((value) => {
    cache.set(key, { at: Date.now(), value });
    return value;
  });
}

/** Test hook — clear the in-memory tenant cache. */
export function clearTenantCache(): void {
  cache.clear();
}

export async function getTenantById(id: string): Promise<TenantDoc | null> {
  if (!id) return null;
  return cached(`byId:${id}`, async () => {
    const doc = await serverClient.fetch<TenantDoc | null>(
      `*[_type == "tenant" && _id == $id][0]`,
      { id }
    );
    return doc || null;
  });
}

/** Resolve a tenant by one of its configured domains (exact or subdomain). */
export async function getTenantByDomain(host: string): Promise<TenantDoc | null> {
  const clean = String(host || "").toLowerCase().replace(/:\d+$/, "").trim();
  if (!clean) return null;
  return cached(`byDomain:${clean}`, async () => {
    const doc = await serverClient.fetch<TenantDoc | null>(
      `*[_type == "tenant" && $host in domains][0]`,
      { host: clean }
    );
    return doc || null;
  });
}

/** Resolve the active tenant for the current request (Host header). */
export async function resolveTenantByHost(host?: string | null): Promise<TenantDoc | null> {
  if (!host) return null;
  const clean = host.toLowerCase().replace(/:\d+$/, "").trim();
  if (!clean || PLATFORM_HOSTS.has(clean)) return null;
  return getTenantByDomain(clean);
}

/** Server-only: active tenant for a server component / route. Never throws. */
export async function getActiveTenant(): Promise<TenantDoc> {
  try {
    const h = await headers();
    const host = h.get("host");
    const tenant = await resolveTenantByHost(host);
    if (tenant) return tenant;
  } catch {
    // headers() unavailable (e.g. called outside request scope) — default.
  }
  const fallback = await getTenantById(DEFAULT_TENANT_ID);
  return (
    fallback || {
      _id: DEFAULT_TENANT_ID,
      name: "AnK's",
      slug: DEFAULT_TENANT_SLUG,
      plan: "pro",
      billingStatus: "active",
    }
  );
}

export async function getActiveTenantId(): Promise<string> {
  return (await getActiveTenant())._id;
}

/** Create the default tenant doc if it doesn't exist (idempotent). */
export async function ensureDefaultTenant(): Promise<void> {
  const existing = await serverClient.fetch(
    `*[_type == "tenant" && _id == $id][0]`,
    { id: DEFAULT_TENANT_ID }
  );
  if (existing) return;
  try {
    await serverClient.createOrReplace({
      _id: DEFAULT_TENANT_ID,
      _type: "tenant",
      name: "AnK's",
      slug: { _type: "slug", current: DEFAULT_TENANT_SLUG },
      domains: [],
      plan: "pro",
      billingStatus: "active",
    } as any);
  } catch (err: any) {
    // Another instance may have created it concurrently — 409 is fine.
    if (err?.statusCode !== 409) throw err;
  }
}

// --- auth scoping (P4-02/P4-03) ------------------------------------------

/** Extract the tenant id from a session, defaulting for the owner. */
export function tenantIdFromSession(session: {
  user?: { tenantId?: string | null; email?: string | null } | null;
} | null): string {
  return session?.user?.tenantId || DEFAULT_TENANT_ID;
}

/** Platform super-admin (the owner) — sees all tenants. */
export function isPlatformAdmin(session: {
  user?: { email?: string | null } | null;
} | null): boolean {
  return Boolean(session?.user?.email === "ibaduddinsiddiqui418@gmail.com");
}

/**
 * Page guard: admin AND tenant-scoped. Returns { session, tenantId } or
 * redirects to /denied. Admin pages pass tenantId into every query.
 */
export async function requireTenantAdmin(): Promise<{
  session: Session | null;
  tenantId: string;
}> {
  const session = await auth();
  if (!isAdmin(session)) {
    const { redirect } = await import("next/navigation");
    redirect("/denied");
  }
  return { session, tenantId: tenantIdFromSession(session) };
}

/**
 * API guard: admin AND tenant-scoped. Returns the context or null (caller
 * responds 401). Used by every admin API route.
 */
export async function getTenantContext(): Promise<{
  session: Session | null;
  tenantId: string;
} | null> {
  const session = await auth();
  if (!isAdmin(session)) return null;
  return { session, tenantId: tenantIdFromSession(session) };
}

// --- payment config (P4-06) ----------------------------------------------

export type PaymentConfig = {
  safepayApiKey: string;
  safepaySecret: string;
  safepayWebhookSecret: string;
  safepayEnv: string;
  currency: string;
};

/** Per-tenant Safepay config, falling back to the platform env vars. */
export async function getPaymentConfig(tenantId: string): Promise<PaymentConfig> {
  let overrides: TenantDoc["payments"] | undefined;
  if (tenantId && tenantId !== DEFAULT_TENANT_ID) {
    const tenant = await getTenantById(tenantId);
    overrides = tenant?.payments;
  }
  return {
    safepayApiKey: overrides?.safepayApiKey || process.env.SAFEPAY_API_KEY || "",
    safepaySecret: overrides?.safepaySecret || process.env.SAFEPAY_SECRET || "",
    safepayWebhookSecret:
      overrides?.safepayWebhookSecret || process.env.SAFEPAY_WEBHOOK_SECRET || "",
    safepayEnv: process.env.SAFEPAY_ENV || "sandbox",
    currency: overrides?.currency || process.env.SAFEPAY_CURRENCY || "PKR",
  };
}
