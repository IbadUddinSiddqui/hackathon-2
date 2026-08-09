// lib/safepay.ts
// Safepay (getsafepay.com) — SBP-licensed Pakistani payment gateway.
//
// Recon-first integration: this code is sandbox-default, and the webhook
// handler logs the RAW payload until SAFEPAY_WEBHOOK_SECRET is set. Safepay's
// docs are known to drift from reality, so the first real sandbox transaction
// is what confirms the true request/response shapes before we build the
// fulfillment logic (the same pattern the P1-16 recon plan prescribes).
//
// Env vars:
//   SAFEPAY_ENV            sandbox (default) | production
//   SAFEPAY_API_KEY        the API key shown in the dashboard (sandbox key for tests)
//   SAFEPAY_WEBHOOK_SECRET the signing secret Safepay shows when you register a webhook
//   SAFEPAY_CURRENCY       PKR (default) | USD — must match the store's pricing decision

import { createHmac, timingSafeEqual } from 'node:crypto';

export const SAFEPAY_ENV = (process.env.SAFEPAY_ENV === 'production' ? 'production' : 'sandbox') as
  | 'sandbox'
  | 'production';

export const SAFEPAY_API_BASE =
  SAFEPAY_ENV === 'production'
    ? 'https://api.getsafepay.com'
    : 'https://sandbox.api.getsafepay.com';

// VERIFIED 2026-08-09 against the live sandbox: the docs' `sandbox.getsafepay.com`
// is a DEAD domain (DNS NXDOMAIN). The hosted checkout page is served from the
// same API host at /checkout/pay — confirmed returning the real "Safepay
// Checkout" page (title + payment scripts) with a sandbox token.
export const SAFEPAY_CHECKOUT_BASE = SAFEPAY_API_BASE;

export const SAFEPAY_CURRENCY = process.env.SAFEPAY_CURRENCY || 'PKR';

export function isSafepayConfigured(): boolean {
  return Boolean(process.env.SAFEPAY_API_KEY);
}

export type SafepayCheckoutInput = {
  orderId: string; // our Sanity order.order_id
  amount: number; // lowest currency unit (paisa for PKR, cents for USD)
  currency?: string;
  redirectUrl: string; // where the customer lands after paying
  cancelUrl: string; // where the customer lands if they cancel
  webhookUrl: string; // our server-to-server notification endpoint
};

/**
 * Create a hosted Safepay Checkout session and return the URL to redirect the
 * customer to. The response shape has varied between Safepay API versions, so
 * we parse it defensively and log the raw response whenever the shape is
 * unexpected — that log is exactly what tells us what the live API returns.
 */
export async function createSafepayCheckout(
  input: SafepayCheckoutInput
): Promise<{ redirectUrl: string; token?: string }> {
  const apiKey = process.env.SAFEPAY_API_KEY;
  if (!apiKey) {
    throw new Error('SAFEPAY_API_KEY is not set');
  }

  const body = {
    client: apiKey,
    amount: input.amount,
    currency: input.currency || SAFEPAY_CURRENCY,
    environment: SAFEPAY_ENV,
    order_id: input.orderId,
    redirect_url: input.redirectUrl,
    webhook: input.webhookUrl,
  };

  console.log('[Safepay] creating checkout session', {
    amount: body.amount,
    currency: body.currency,
    environment: body.environment,
    order_id: body.order_id,
  });

  const res = await fetch(`${SAFEPAY_API_BASE}/order/v1/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    // non-JSON response — fall through to the error path below
  }

  if (!res.ok) {
    console.error('[Safepay] init failed', res.status, text.slice(0, 500));
    throw new Error(`Safepay checkout init failed (${res.status})`);
  }

  // Defensive parse: accept the shapes seen across Safepay API versions.
  const token = data?.data?.token || data?.token || data?.tracker?.token;
  const redirectUrl =
    data?.data?.redirect_url || data?.redirect_url || data?.tracker?.url;

  if (redirectUrl) return { redirectUrl, token };
  if (token) return { redirectUrl: buildCheckoutUrl(token, input.orderId), token };

  // Unexpected shape — surface the real response so the recon log shows it.
  console.warn('[Safepay] unexpected init response:', text.slice(0, 1000));
  throw new Error('Safepay checkout init returned an unexpected response');
}

/**
 * Build the hosted checkout URL from a tracker token when the init response
 * only returns the token (the classic Safepay flow). The signature is the
 * HMAC-SHA256 of the tracker token keyed with the API key.
 */
export function buildCheckoutUrl(token: string, orderId: string): string {
  const signature = createHmac('sha256', process.env.SAFEPAY_API_KEY || '')
    .update(token)
    .digest('hex');
  return `${SAFEPAY_CHECKOUT_BASE}/checkout/pay?token=${encodeURIComponent(
    token
  )}&order_id=${encodeURIComponent(orderId)}&env=${SAFEPAY_ENV}&signature=${signature}`;
}

/**
 * Verify an incoming Safepay webhook. Documented scheme: HMAC-SHA256 over
 * `${timestamp}.${rawBody}` using the BASE64-DECODED webhook secret, compared
 * against the `X-SFPY-SIGNATURE` header (formatted `sha256=<hex>`). Timing-safe
 * comparison. Returns false on any missing/invalid input — never throws.
 */
export function verifySafepaySignature(params: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  webhookSecret?: string;
}): boolean {
  const secret = params.webhookSecret || process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!secret || !params.signature || !params.timestamp) return false;

  let decodedSecret: Buffer;
  try {
    decodedSecret = Buffer.from(secret, 'base64');
  } catch {
    return false;
  }

  const mac = createHmac('sha256', decodedSecret);
  mac.update(params.timestamp);
  mac.update('.');
  mac.update(params.rawBody);
  const expected = `sha256=${mac.digest('hex')}`;

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(params.signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
