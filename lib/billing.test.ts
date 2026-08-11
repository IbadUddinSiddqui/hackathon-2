import { describe, it, expect, vi } from "vitest";

// billing.ts imports @/lib/tenants -> @/auth -> next-auth (vitest can't
// resolve next/server). These tests are pure, so mock the server-only deps.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn(() => true) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { planLimits, checkPlanLimit, currentMonth, PLANS } from "./billing";

describe("planLimits", () => {
  it("returns per-plan limits and defaults to free", () => {
    expect(planLimits("pro").productLimit).toBe(PLANS.pro.productLimit);
    expect(planLimits("trial").monthlyOrderLimit).toBe(PLANS.trial.monthlyOrderLimit);
    expect(planLimits("free").bandwidthGB).toBe(PLANS.free.bandwidthGB);
    expect(planLimits("nope")).toBe(PLANS.free);
    expect(planLimits(null)).toBe(PLANS.free);
  });
});

describe("checkPlanLimit", () => {
  it("flags over-limit and allows under-limit", () => {
    expect(checkPlanLimit("free", "products", 19).ok).toBe(true);
    expect(checkPlanLimit("free", "products", 20).ok).toBe(false);
    expect(checkPlanLimit("pro", "orders", 9999).ok).toBe(true);
  });
});

describe("currentMonth", () => {
  it("formats YYYY-MM", () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});
