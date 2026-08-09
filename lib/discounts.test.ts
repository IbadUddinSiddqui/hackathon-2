import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateDiscountCode } from './discounts';
import { serverClient } from '@/sanity/lib/server-client';

// The Sanity client is mocked so tests never touch the network. The mock must
// be declared before the imports above are evaluated — vitest hoists it.
vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: {
    fetch: vi.fn(),
    patch: vi.fn(() => ({ inc: vi.fn(() => ({ commit: vi.fn() })) })),
  },
}));

const mockFetch = vi.mocked(serverClient.fetch);

const baseDoc = {
  _id: 'disc_1',
  code: 'WELCOME10',
  type: 'percent' as const,
  value: 10,
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('validateDiscountCode', () => {
  it('percent: computes subtotal * value / 100, rounded to cents', async () => {
    mockFetch.mockResolvedValue(baseDoc);
    const res = await validateDiscountCode('welcome10', 99.99);
    expect(res).toEqual({ valid: true, discountAmount: 10, code: 'WELCOME10' });
    // 99.99 * 10% = 9.999 -> Math.round(999.9) / 100 = 10.00
  });

  it('fixed: returns the fixed dollar value unchanged', async () => {
    mockFetch.mockResolvedValue({ ...baseDoc, code: 'FIXED5', type: 'fixed', value: 5 });
    const res = await validateDiscountCode('fixed5', 100);
    expect(res).toEqual({ valid: true, discountAmount: 5, code: 'FIXED5' });
  });

  it('expired: rejects codes past their expiresAt', async () => {
    mockFetch.mockResolvedValue({
      ...baseDoc,
      code: 'OLDBUTGOLD',
      expiresAt: '2020-01-01T00:00:00Z',
    });
    const res = await validateDiscountCode('OLDBUTGOLD', 100);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.message).toContain('expired');
  });

  it('over maxUses: rejects codes that have reached their usage limit', async () => {
    mockFetch.mockResolvedValue({
      ...baseDoc,
      code: 'LIMIT5',
      maxUses: 5,
      usedCount: 5,
    });
    const res = await validateDiscountCode('LIMIT5', 100);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.message).toContain('usage limit');
  });

  it('cap-at-subtotal: never discounts more than the subtotal', async () => {
    mockFetch.mockResolvedValue({ ...baseDoc, code: 'BIG50', type: 'fixed', value: 50 });
    const res = await validateDiscountCode('BIG50', 10);
    expect(res).toEqual({ valid: true, discountAmount: 10, code: 'BIG50' });
  });

  it('invalid: unknown codes are rejected', async () => {
    mockFetch.mockResolvedValue(null);
    const res = await validateDiscountCode('NOPE', 100);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.message).toContain('Invalid');
  });
});
