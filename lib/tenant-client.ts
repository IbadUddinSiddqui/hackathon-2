// lib/tenant-client.ts
// Client-safe multi-tenancy helpers. MUST NOT import server-only modules
// (no serverClient/auth/headers) — this file is imported by client components.
// The server layout writes the `anks-tenant` cookie via the TenantProvider so
// client-side storefront fetches can scope to the active tenant.

export const TENANT_COOKIE = "anks-tenant";
export const DEFAULT_TENANT_ID = "tenant-anks";

/** Active tenant id for client-side code (cookie set by TenantProvider). */
export function clientTenantId(): string {
  if (typeof document === "undefined") return DEFAULT_TENANT_ID;
  const match = document.cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${TENANT_COOKIE}=`));
  if (!match) return DEFAULT_TENANT_ID;
  const value = match.split("=")[1];
  return value || DEFAULT_TENANT_ID;
}

/** Write the tenant cookie (used by TenantProvider after mount). */
export function writeTenantCookie(tenantId: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TENANT_COOKIE}=${tenantId}; path=/; max-age=31536000; samesite=lax`;
}
