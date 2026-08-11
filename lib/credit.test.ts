import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverClient } from "@/sanity/lib/server-client";
import { applyStoreCredit, roundMoney } from "./credit";

vi.mock("@/sanity/lib/server-client", () => ({
  serverClient: {
    fetch: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(),
  },
}));

const mockFetch = vi.mocked(serverClient.fetch) as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockFetch.mockReset();
  vi.mocked(serverClient.patch).mockReset();
});

describe("roundMoney", () => {
  it("rounds to 2dp", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10)).toBe(10);
  });
});

describe("applyStoreCredit", () => {
  it("applies min(requested, balance, remaining)", async () => {
    mockFetch.mockResolvedValue({ _id: "c1", creditBalance: 500 });
    const chain = {
      inc: vi.fn(() => chain),
      commit: vi.fn(async () => ({})),
    };
    vi.mocked(serverClient.patch).mockReturnValue(chain as any);

    const applied = await applyStoreCredit({
      email: "a@b.com",
      requested: 300,
      remainingTotal: 1000,
    });
    expect(applied).toBe(300);
    expect(chain.inc).toHaveBeenCalledWith({ creditBalance: -300 });
  });

  it("caps at the balance when requested exceeds it", async () => {
    mockFetch.mockResolvedValue({ _id: "c1", creditBalance: 100 });
    const chain = {
      inc: vi.fn(() => chain),
      commit: vi.fn(async () => ({})),
    };
    vi.mocked(serverClient.patch).mockReturnValue(chain as any);

    const applied = await applyStoreCredit({
      email: "a@b.com",
      requested: 500,
      remainingTotal: 1000,
    });
    expect(applied).toBe(100);
  });

  it("caps at the remaining total", async () => {
    mockFetch.mockResolvedValue({ _id: "c1", creditBalance: 500 });
    const chain = {
      inc: vi.fn(() => chain),
      commit: vi.fn(async () => ({})),
    };
    vi.mocked(serverClient.patch).mockReturnValue(chain as any);

    const applied = await applyStoreCredit({
      email: "a@b.com",
      requested: 500,
      remainingTotal: 250,
    });
    expect(applied).toBe(250);
  });

  it("returns 0 when the customer has no credit or no email", async () => {
    mockFetch.mockResolvedValue(null);
    expect(
      await applyStoreCredit({ email: "x@y.com", requested: 100, remainingTotal: 100 })
    ).toBe(0);
    expect(
      await applyStoreCredit({ email: "  ", requested: 100, remainingTotal: 100 })
    ).toBe(0);
    expect(
      await applyStoreCredit({ email: "x@y.com", requested: 0, remainingTotal: 100 })
    ).toBe(0);
    expect(serverClient.patch).not.toHaveBeenCalled();
  });
});
