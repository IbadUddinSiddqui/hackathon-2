// lib/site.ts
// Single source of truth for SEO/brand constants (P2-SEO-01).
// Resolve the canonical site URL from env, falling back through PUBLIC_BASE_URL
// (used by Safepay webhooks) to localhost for local dev.

export const SITE_NAME = "AnK's";

export const SITE_DESCRIPTION =
  "AnK's — a Pakistani fashion and clothing brand. Shop the latest t-shirts, kurtas and streetwear with nationwide delivery.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.PUBLIC_BASE_URL ||
  "http://localhost:3000";
