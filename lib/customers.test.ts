import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverClient } from "@/sanity/lib/server-client";
import {
  normalizeEmail,
  upsertCustomerFromOrder,
  getCreditBalance,
  deductCredit,
  addLoyaltyPoints,
} from "./customers";

vi.mock("@/sanity/lib/server-client", () => ({
  serverClient: {
    fetch: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(),
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
  vi.mocked(serverClient.create).mockReset();
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});

describe("upsertCustomerFromOrder", () => {
  it("returns null for a missing email", async () => {
    expect(await upsertCustomerFromOrder({ email: "  " })).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("increments orderCount + totalSpent on an existing customer", async () => {
    mockFetch.mockResolvedValue({
      _id: "cust_1",
      email: "a@b.com",
      orderCount: 2,
      totalSpent: 100,
    });
    const chain = mockPatchChain();

    const id = await upsertCustomerFromOrder({ email: "A@B.com", orderTotal: 250 });

    expect(id).toBe("cust_1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("email == $email"), {
      email: "a@b.com",
      tenantId: "tenant-anks",
    });
    expect(serverClient.patch).toHaveBeenCalledWith("cust_1");
    expect(chain.inc).toHaveBeenCalledWith({ orderCount: 1, totalSpent: 250 });
  });

  it("creates a new customer on first order", async () => {
    mockFetch.mockResolvedValue(null);
    vi.mocked(serverClient.create).mockResolvedValue({ _id: "cust_new" } as any);

    const id = await upsertCustomerFromOrder({ email: "new@b.com", name: "Sam", orderTotal: 500 });

    expect(id).toBe("cust_new");
    expect(serverClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: "customer",
        email: "new@b.com",
        name: "Sam",
        orderCount: 1,
        totalSpent: 500,
        creditBalance: 0,
        points: 0,
      })
    );
  });
});

describe("getCreditBalance", () => {
  it("returns the stored balance", async () => {
    mockFetch.mockResolvedValue({ _id: "c", creditBalance: 120 });
    expect(await getCreditBalance("x@y.com")).toBe(120);
  });

  it("returns 0 for unknown customers", async () => {
    mockFetch.mockResolvedValue(null);
    expect(await getCreditBalance("x@y.com")).toBe(0);
  });
});

describe("deductCredit", () => {
  it("deducts when the balance is sufficient", async () => {
    mockFetch.mockResolvedValue({ _id: "c", creditBalance: 100 });
    const chain = mockPatchChain();

    expect(await deductCredit("x@y.com", 40)).toBe(true);
    expect(chain.inc).toHaveBeenCalledWith({ creditBalance: -40 });
  });

  it("refuses when the balance is insufficient (no deduction)", async () => {
    mockFetch.mockResolvedValue({ _id: "c", creditBalance: 10 });
    expect(await deductCredit("x@y.com", 40)).toBe(false);
    expect(serverClient.patch).not.toHaveBeenCalled();
  });

  it("returns false for unknown customers", async () => {
    mockFetch.mockResolvedValue(null);
    expect(await deductCredit("x@y.com", 40)).toBe(false);
  });
});

describe("addLoyaltyPoints", () => {
  it("adds points to an existing customer", async () => {
    mockFetch.mockResolvedValue({ _id: "c", points: 5 });
    const chain = mockPatchChain();
    await addLoyaltyPoints("x@y.com", 30);
    expect(chain.inc).toHaveBeenCalledWith({ points: 30 });
  });

  it("no-ops for missing email or non-positive points", async () => {
    await addLoyaltyPoints("  ", 10);
    await addLoyaltyPoints("x@y.com", 0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
