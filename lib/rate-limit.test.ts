import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
} from "./rate-limit";

describe("getClientIp", () => {
  it("parses the first x-forwarded-for entry", () => {
    const req = new Request("http://localhost/api/x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(getClientIp(new Request("http://localhost/", { headers: { "x-real-ip": "9.9.9.9" } }))).toBe("9.9.9.9");
    expect(getClientIp(new Request("http://localhost/"))).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks", () => {
    const key = "test:1.2.3.4";
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports remaining budget", () => {
    const first = checkRateLimit("k:1.1.1.1", 5, 60_000);
    expect(first.remaining).toBe(4);
    const second = checkRateLimit("k:1.1.1.1", 5, 60_000);
    expect(second.remaining).toBe(3);
  });

  it("resets after the window elapses", () => {
    const key = "k:2.2.2.2";
    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null while under the limit", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "3.3.3.3" },
    });
    expect(enforceRateLimit(req, { key: "login", limit: 2, windowMs: 60_000 })).toBeNull();
  });

  it("returns a 429 Response with Retry-After when over the limit", async () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "4.4.4.4" },
    });
    enforceRateLimit(req, { key: "login", limit: 1, windowMs: 60_000 });
    const blocked = enforceRateLimit(req, { key: "login", limit: 1, windowMs: 60_000 });
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get("Retry-After")).toBeTruthy();
    const body = await blocked!.json();
    expect(body.error).toContain("Too many requests");
  });

  it("keys per IP — a different IP is not blocked", () => {
    const a = new Request("http://localhost/", { headers: { "x-forwarded-for": "5.5.5.5" } });
    const b = new Request("http://localhost/", { headers: { "x-forwarded-for": "6.6.6.6" } });
    enforceRateLimit(a, { key: "login", limit: 1, windowMs: 60_000 });
    expect(enforceRateLimit(b, { key: "login", limit: 1, windowMs: 60_000 })).toBeNull();
  });
});
