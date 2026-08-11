import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverClient } from "@/sanity/lib/server-client";
import { normalizeGiftCardCode, validateGiftCard, redeemGiftCard } from "./gift-cards";

vi.mock("@/sanity/lib/server-client", () => ({
  serverClient: {
    fetch: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockFetch = vi.mocked(serverClient.fetch) as unknown as ReturnType<typeof vi.fn>;

function mockPatchChain() {
  const chain = {
    inc: vi.fn(() => chain),
    commit: vi.fn(async () => ({})),
  };
  vi.mocked(serverClient.patch).mockReturnValue(chain as any);
  return chain;
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.mocked(serverClient.patch).mockReset();
});

describe("normalizeGiftCardCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeGiftCardCode("  gift-1 ")).toBe("GIFT-1");
  });
});

describe("validateGiftCard", () => {
  it("accepts an active card with balance", async () => {
    mockFetch.mockResolvedValue({
      _id: "g1",
      code: "GIFT-1",
      balance: 500,
      active: true,
    });
    const result = await validateGiftCard("gift-1");
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.card.balance).toBe(500);
  });

  it("rejects unknown / inactive / expired / empty cards", async () => {
    mockFetch.mockResolvedValue(null);
    expect((await validateGiftCard("NOPE")).valid).toBe(false);

    mockFetch.mockResolvedValue({ _id: "g", code: "G", balance: 100, active: false });
    expect((await validateGiftCard("G")).valid).toBe(false);

    mockFetch.mockResolvedValue({
      _id: "g",
      code: "G",
      balance: 100,
      active: true,
      expiresAt: "2020-01-01",
    });
    expect((await validateGiftCard("G")).valid).toBe(false);

    mockFetch.mockResolvedValue({ _id: "g", code: "G", balance: 0, active: true });
    expect((await validateGiftCard("G")).valid).toBe(false);
  });

  it("rejects a missing code", async () => {
    const result = await validateGiftCard(undefined);
    expect(result.valid).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("redeemGiftCard", () => {
  it("deducts min(amount, balance)", async () => {
    mockFetch.mockResolvedValue({ _id: "g1", code: "G1", balance: 500, active: true });
    const chain = mockPatchChain();

    const { applied } = await redeemGiftCard({ code: "g1", amount: 300 });
    expect(applied).toBe(300);
    expect(chain.inc).toHaveBeenCalledWith({ balance: -300 });
  });

  it("caps at the balance", async () => {
    mockFetch.mockResolvedValue({ _id: "g1", code: "G1", balance: 100, active: true });
    const chain = mockPatchChain();

    const { applied } = await redeemGiftCard({ code: "g1", amount: 500 });
    expect(applied).toBe(100);
    expect(chain.inc).toHaveBeenCalledWith({ balance: -100 });
  });

  it("returns 0 for an invalid card (no deduction)", async () => {
    mockFetch.mockResolvedValue(null);
    const { applied } = await redeemGiftCard({ code: "NOPE", amount: 100 });
    expect(applied).toBe(0);
    expect(serverClient.patch).not.toHaveBeenCalled();
  });
});
