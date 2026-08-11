import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverClient } from "@/sanity/lib/server-client";
import { pointsEarned, redeemableCredit } from "./loyalty";

vi.mock("@/sanity/lib/server-client", () => ({
  serverClient: {
    fetch: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(serverClient.fetch).mockReset();
  vi.mocked(serverClient.patch).mockReset();
});

describe("pointsEarned", () => {
  it("earns 1 point per Rs 100, floor", () => {
    expect(pointsEarned(0)).toBe(0);
    expect(pointsEarned(99)).toBe(0);
    expect(pointsEarned(100)).toBe(1);
    expect(pointsEarned(2199)).toBe(21);
  });
});

describe("redeemableCredit", () => {
  it("converts points to rupees 1:1", () => {
    expect(redeemableCredit(0)).toBe(0);
    expect(redeemableCredit(50)).toBe(50);
    expect(redeemableCredit(50.5)).toBe(50);
  });
});
