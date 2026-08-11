import { describe, it, expect, vi } from "vitest";

// The module imports @/auth -> next-auth (which vitest can't resolve). These
// tests only exercise the pure helpers, so mock the server-only modules.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn(() => true) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import {
  tenantFilter,
  tenantSlug,
  tenantIdFromSession,
  isPlatformAdmin,
  PLATFORM_HOSTS,
  DEFAULT_TENANT_SLUG,
} from "./tenants";

describe("tenantFilter", () => {
  it("matches owned + legacy docs via the $tenantId param", () => {
    const f = tenantFilter();
    expect(f).toContain("tenantId");
    expect(f).toContain("$tenantId");
    expect(f).toContain("!defined(tenantId)");
  });
});

describe("tenantSlug", () => {
  it("handles slug object, string, and null", () => {
    expect(tenantSlug({ slug: { current: "abc" } } as any)).toBe("abc");
    expect(tenantSlug({ slug: "xyz" } as any)).toBe("xyz");
    expect(tenantSlug(null)).toBe(DEFAULT_TENANT_SLUG);
  });
});

describe("tenantIdFromSession", () => {
  it("uses session tenantId and defaults otherwise", () => {
    expect(tenantIdFromSession({ user: { tenantId: "t2" } })).toBe("t2");
    expect(tenantIdFromSession({ user: {} })).toBe("tenant-anks");
    expect(tenantIdFromSession(null)).toBe("tenant-anks");
  });
});

describe("isPlatformAdmin", () => {
  it("only the owner email is platform admin", () => {
    expect(isPlatformAdmin({ user: { email: "ibaduddinsiddiqui418@gmail.com" } })).toBe(true);
    expect(isPlatformAdmin({ user: { email: "x@y.com" } })).toBe(false);
    expect(isPlatformAdmin(null)).toBe(false);
  });
});

describe("PLATFORM_HOSTS", () => {
  it("treats local dev hosts as platform hosts", () => {
    expect(PLATFORM_HOSTS.has("localhost")).toBe(true);
    expect(PLATFORM_HOSTS.has("127.0.0.1")).toBe(true);
  });
});
