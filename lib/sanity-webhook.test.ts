import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifySanityWebhookSignature, getSanityDocumentId } from "./sanity-webhook";

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifySanityWebhookSignature", () => {
  const secret = "webhook-secret-123";

  it("accepts a valid signature over the raw body", () => {
    const body = JSON.stringify({ _type: "product", _id: "abc", operation: "create" });
    expect(verifySanityWebhookSignature(secret, body, sign(secret, body))).toBe(true);
  });

  it("rejects a wrong secret", () => {
    const body = JSON.stringify({ _type: "product" });
    expect(verifySanityWebhookSignature(secret, body, sign("other-secret", body))).toBe(false);
  });

  it("rejects tampered body", () => {
    const body = JSON.stringify({ _type: "product", _id: "abc" });
    const signature = sign(secret, body);
    const tampered = JSON.stringify({ _type: "product", _id: "xyz" });
    expect(verifySanityWebhookSignature(secret, tampered, signature)).toBe(false);
  });

  it("rejects missing signature", () => {
    expect(verifySanityWebhookSignature(secret, "{}", null)).toBe(false);
    expect(verifySanityWebhookSignature(secret, "{}", undefined)).toBe(false);
  });

  it("rejects a signature of a different length", () => {
    expect(verifySanityWebhookSignature(secret, "{}", "short")).toBe(false);
  });
});

describe("getSanityDocumentId", () => {
  it("strips the drafts. prefix", () => {
    expect(getSanityDocumentId("drafts.abc123")).toBe("abc123");
  });

  it("leaves published ids untouched", () => {
    expect(getSanityDocumentId("abc123")).toBe("abc123");
  });
});
