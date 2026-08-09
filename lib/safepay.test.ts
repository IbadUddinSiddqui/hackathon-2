// lib/safepay.test.ts
// Tests for the Safepay integration: webhook HMAC-SHA256 signature verification
// (the security-critical piece) and checkout session creation (recon shape).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  verifySafepaySignature,
  createSafepayCheckout,
  buildCheckoutUrl,
  isSafepayConfigured,
} from './safepay';

// A real base64 secret, like the one Safepay shows when you register a webhook.
const WEBHOOK_SECRET = Buffer.from('test-webhook-secret-value').toString('base64');

function makeSignature(rawBody: string, timestamp: string, secret: string) {
  const mac = createHmac('sha256', Buffer.from(secret, 'base64'));
  mac.update(timestamp);
  mac.update('.');
  mac.update(rawBody);
  return `sha256=${mac.digest('hex')}`;
}

describe('verifySafepaySignature', () => {
  const rawBody = JSON.stringify({ event: 'transfer:succeeded', tracker: { token: 't_123' } });
  const timestamp = '1720000000';

  it('accepts a correctly signed request', () => {
    const signature = makeSignature(rawBody, timestamp, WEBHOOK_SECRET);
    expect(
      verifySafepaySignature({ rawBody, signature, timestamp, webhookSecret: WEBHOOK_SECRET })
    ).toBe(true);
  });

  it('rejects a tampered body', () => {
    const signature = makeSignature(rawBody, timestamp, WEBHOOK_SECRET);
    const tamperedBody = rawBody.replace('t_123', 't_EVIL');
    expect(
      verifySafepaySignature({
        rawBody: tamperedBody,
        signature,
        timestamp,
        webhookSecret: WEBHOOK_SECRET,
      })
    ).toBe(false);
  });

  it('rejects a replayed/mismatched timestamp', () => {
    const signature = makeSignature(rawBody, timestamp, WEBHOOK_SECRET);
    expect(
      verifySafepaySignature({
        rawBody,
        signature,
        timestamp: '1720000001',
        webhookSecret: WEBHOOK_SECRET,
      })
    ).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const otherSecret = Buffer.from('someone-elses-secret').toString('base64');
    const signature = makeSignature(rawBody, timestamp, otherSecret);
    expect(
      verifySafepaySignature({ rawBody, signature, timestamp, webhookSecret: WEBHOOK_SECRET })
    ).toBe(false);
  });

  it('rejects missing signature/timestamp/secret without throwing', () => {
    expect(
      verifySafepaySignature({ rawBody, signature: null, timestamp, webhookSecret: WEBHOOK_SECRET })
    ).toBe(false);
    expect(
      verifySafepaySignature({ rawBody, signature: 'x', timestamp: null, webhookSecret: WEBHOOK_SECRET })
    ).toBe(false);
    expect(
      verifySafepaySignature({ rawBody, signature: 'x', timestamp, webhookSecret: undefined })
    ).toBe(false);
  });

  it('reads the webhook secret from the environment when not passed in', () => {
    const oldSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
    process.env.SAFEPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
    try {
      const signature = makeSignature(rawBody, timestamp, WEBHOOK_SECRET);
      expect(verifySafepaySignature({ rawBody, signature, timestamp })).toBe(true);
    } finally {
      if (oldSecret === undefined) delete process.env.SAFEPAY_WEBHOOK_SECRET;
      else process.env.SAFEPAY_WEBHOOK_SECRET = oldSecret;
    }
  });
});

describe('createSafepayCheckout', () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SAFEPAY_API_KEY;

  beforeEach(() => {
    process.env.SAFEPAY_API_KEY = 'sec_test_key';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SAFEPAY_API_KEY;
    else process.env.SAFEPAY_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it('throws a clear error when SAFEPAY_API_KEY is missing', async () => {
    delete process.env.SAFEPAY_API_KEY;
    await expect(
      createSafepayCheckout({
        orderId: 'abc',
        amount: 100,
        redirectUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cart',
        webhookUrl: 'https://example.com/api/payments/safepay/webhook',
      })
    ).rejects.toThrow('SAFEPAY_API_KEY');
  });

  it('returns the redirect_url from the init response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            token: 't_123',
            redirect_url: 'https://sandbox.api.getsafepay.com/checkout/pay?token=t_123',
          },
        }),
    }) as unknown as typeof fetch;

    const result = await createSafepayCheckout({
      orderId: 'order-1',
      amount: 4098,
      redirectUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cart',
      webhookUrl: 'https://example.com/api/payments/safepay/webhook',
    });

    expect(result.redirectUrl).toContain('sandbox.api.getsafepay.com/checkout/pay');
    expect(result.token).toBe('t_123');

    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/order/v1/init');
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.amount).toBe(4098);
    expect(sent.currency).toBe('PKR');
    expect(sent.order_id).toBe('order-1');
    expect(sent.webhook).toContain('/api/payments/safepay/webhook');
    // the API key must be sent as `client` and never logged
    expect(sent.client).toBe('sec_test_key');
  });

  it('builds a checkout URL from the token when no redirect_url is returned', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: { token: 't_456' } }),
    }) as unknown as typeof fetch;

    const result = await createSafepayCheckout({
      orderId: 'order-2',
      amount: 100,
      redirectUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cart',
      webhookUrl: 'https://example.com/api/payments/safepay/webhook',
    });

    // VERIFIED URL shape (reverse-engineered from the live checkout SPA):
    // `beacon` + lowercase `env` + snake_case ids.
    expect(result.redirectUrl).toContain('beacon=t_456');
    expect(result.redirectUrl).toContain('env=sandbox');
    expect(result.redirectUrl).toContain('order_id=order-2');
    expect(result.redirectUrl).toContain('redirect_url=');
    expect(result.redirectUrl).toContain('cancel_url=');
    expect(result.redirectUrl).not.toContain('signature=');
    expect(result.redirectUrl).not.toContain('token=');
    expect(result.redirectUrl).not.toContain('tracker=');
  });

  it('throws when the init response is an error status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'invalid api key' }),
    }) as unknown as typeof fetch;

    await expect(
      createSafepayCheckout({
        orderId: 'order-3',
        amount: 100,
        redirectUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cart',
        webhookUrl: 'https://example.com/api/payments/safepay/webhook',
      })
    ).rejects.toThrow('401');
  });
});

describe('buildCheckoutUrl', () => {
  it('produces a URL matching the LIVE checkout page contract', () => {
    const url = buildCheckoutUrl({
      token: 't_abc',
      orderId: 'order-x',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cart',
      source: 'web',
    });
    expect(url).toContain('sandbox.api.getsafepay.com/checkout/pay');
    expect(url).toContain('beacon=t_abc');
    expect(url).toContain('env=sandbox');
    expect(url).toContain('order_id=order-x');
    expect(url).toContain('redirect_url=https%3A%2F%2Fexample.com%2Fsuccess');
    expect(url).toContain('cancel_url=https%3A%2F%2Fexample.com%2Fcart');
    expect(url).toContain('source=web');
    // no HMAC signature is required by the new checkout page
    expect(url).not.toContain('signature=');
    expect(url).not.toContain('token=');
    expect(url).not.toContain('tracker=');
  });
});

describe('isSafepayConfigured', () => {
  it('is false without an API key and true with one', () => {
    const original = process.env.SAFEPAY_API_KEY;
    delete process.env.SAFEPAY_API_KEY;
    expect(isSafepayConfigured()).toBe(false);
    process.env.SAFEPAY_API_KEY = 'sec_test';
    expect(isSafepayConfigured()).toBe(true);
    if (original === undefined) delete process.env.SAFEPAY_API_KEY;
    else process.env.SAFEPAY_API_KEY = original;
  });
});
