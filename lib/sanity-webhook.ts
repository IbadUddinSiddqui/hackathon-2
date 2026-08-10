// lib/sanity-webhook.ts
// Pure helpers for verifying Sanity webhook payloads (P2-SS-02). Kept free of
// any client/server deps so they can be unit-tested. Sanity signs the raw
// request body with the webhook secret using HMAC-SHA256 (hex) and sends it in
// the `x-sanity-webhook-signature` header.

import { createHmac, timingSafeEqual } from "crypto";

export function verifySanityWebhookSignature(
  secret: string,
  rawBody: string | Buffer,
  signature: string | null | undefined
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Sanity uses `drafts.<id>` for unpublished docs. Search indexes should only
 * ever hold published products, so strip the prefix.
 */
export function getSanityDocumentId(rawId: string): string {
  return rawId.startsWith("drafts.") ? rawId.slice("drafts.".length) : rawId;
}
