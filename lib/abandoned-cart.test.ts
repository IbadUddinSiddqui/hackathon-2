import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverClient } from "@/sanity/lib/server-client";
import { computeSubtotal, findRecoverableCarts, saveAbandonedCart, markCartCompleted } from "./abandoned-cart";

vi.mock("@/sanity/lib/server-client", () => ({
  serverClient: {
    fetch: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(),
    transaction: vi.fn(),
  },
}));

const mockFetch = vi.mocked(serverClient.fetch) as unknown as ReturnType<typeof vi.fn>;

function mockPatchChain() {
  const chain = {
    set: vi.fn(() => chain),
    commit: vi.fn(async () => ({})),
  };
  vi.mocked(serverClient.patch).mockReturnValue(chain as any);
  return chain;
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.mocked(serverClient.patch).mockReset();
  vi.mocked(serverClient.create).mockReset();
  vi.mocked(serverClient.transaction).mockReset();
});

const items = [
  { id: "p1", name: "Tee", price: 1500, quantity: 2 },
  { id: "p2", name: "Hoodie", price: 3000, quantity: 1 },
];

describe("computeSubtotal", () => {
  it("sums price × quantity", () => {
    expect(computeSubtotal(items)).toBe(6000);
  });
});

describe("saveAbandonedCart", () => {
  it("creates a new cart when none exists (abandoned status)", async () => {
    mockFetch.mockResolvedValue(null);
    vi.mocked(serverClient.create).mockResolvedValue({ _id: "c" } as any);
    await saveAbandonedCart({ email: "A@B.com", items });
    expect(serverClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: "abandonedCart",
        email: "a@b.com",
        subtotal: 6000,
        status: "abandoned",
      })
    );
  });

  it("updates an existing cart (no duplicate docs)", async () => {
    mockFetch.mockResolvedValue({ _id: "c1", status: "abandoned", createdAt: "2026-01-01" });
    const chain = mockPatchChain();
    await saveAbandonedCart({ email: "a@b.com", items });
    expect(serverClient.create).not.toHaveBeenCalled();
    expect(serverClient.patch).toHaveBeenCalledWith("c1");
    expect(chain.set).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.com" }));
  });

  it("no-ops for a missing email", async () => {
    await saveAbandonedCart({ email: "  ", items });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("markCartCompleted", () => {
  it("marks all open carts for the email as completed", async () => {
    mockFetch.mockResolvedValue([{ _id: "c1" }, { _id: "c2" }]);
    const txPatch = vi.fn();
    const txCommit = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serverClient.transaction).mockReturnValue({ patch: txPatch, commit: txCommit } as any);

    await markCartCompleted("A@B.com");
    expect(txPatch).toHaveBeenCalledWith("c1", { set: { status: "completed" } });
    expect(txPatch).toHaveBeenCalledWith("c2", { set: { status: "completed" } });
    expect(txCommit).toHaveBeenCalledTimes(1);
  });
});

describe("findRecoverableCarts", () => {
  it("queries for abandoned carts older than 24h", async () => {
    mockFetch.mockResolvedValue([]);
    const now = new Date("2026-08-11T12:00:00Z");
    await findRecoverableCarts(now);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("status == \"abandoned\" && createdAt < $cutoff"),
      { cutoff: "2026-08-10T12:00:00.000Z" }
    );
  });
});
