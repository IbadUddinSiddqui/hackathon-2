import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverClient } from "@/sanity/lib/server-client";
import { logAdminAction } from "./audit";

vi.mock("@/sanity/lib/server-client", () => ({
  serverClient: {
    create: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(serverClient.create).mockReset();
});

describe("logAdminAction", () => {
  it("writes an auditLog doc with the admin email", async () => {
    vi.mocked(serverClient.create).mockResolvedValue({ _id: "log_1" } as any);
    logAdminAction({
      adminEmail: "admin@anks.com",
      action: "update",
      targetType: "product",
      targetId: "p_1",
      targetLabel: "Classic Tee",
      details: "price 1000 -> 1200",
    });
    // Fire-and-forget: wait a microtask so the promise settles.
    await Promise.resolve();
    expect(serverClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: "auditLog",
        adminEmail: "admin@anks.com",
        action: "update",
        targetType: "product",
        targetId: "p_1",
        targetLabel: "Classic Tee",
        details: "price 1000 -> 1200",
      })
    );
  });

  it("skips writing when there is no admin email", () => {
    logAdminAction({
      adminEmail: "",
      action: "delete",
      targetType: "product",
      targetId: "p_1",
    });
    expect(serverClient.create).not.toHaveBeenCalled();
  });

  it("does not throw when the write fails", async () => {
    vi.mocked(serverClient.create).mockRejectedValue(new Error("down"));
    expect(() =>
      logAdminAction({
        adminEmail: "a@b.com",
        action: "create",
        targetType: "discountCode",
        targetLabel: "WELCOME10",
      })
    ).not.toThrow();
    await Promise.resolve();
  });
});
