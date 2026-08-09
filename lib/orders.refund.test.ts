import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refundOrder } from './orders';
import { serverClient } from '@/sanity/lib/server-client';

// Mock Stripe so refundOrder never hits the network. The variable is referenced
// inside the vi.mock factory, so it must be prefixed with "mock". The default
// export must be a plain function (not an arrow) so `new Stripe()` works.
const mockStripeInstance = {
  refunds: { create: vi.fn().mockResolvedValue({ id: 're_1' }) },
};

vi.mock('stripe', () => ({
  __esModule: true,
  default: function () {
    return mockStripeInstance;
  },
}));

// Mock the Sanity client (fetch + patch + transaction).
vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: {
    fetch: vi.fn(),
    patch: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Sanity's fetch is generic and loses its type under vi.mocked; loosen it so
// test fixtures can be passed directly.
const mockFetch = vi.mocked(serverClient.fetch) as unknown as ReturnType<typeof vi.fn>;

const paidOrder = {
  _id: 'order_1',
  _rev: 'rev1',
  _type: 'order',
  order_id: 'abc-123',
  status: 'paid',
  stripe_payment_intent_id: 'pi_123',
  items: [
    {
      _key: 'p1',
      product: { _type: 'reference', _ref: 'p1' },
      name: 'Shirt',
      price: 20,
      quantity: 2,
    },
    {
      _key: 'p2',
      product: { _type: 'reference', _ref: 'p2' },
      name: 'Shorts',
      price: 30,
      quantity: 1,
    },
  ],
};

beforeEach(() => {
  mockFetch.mockReset();
  mockStripeInstance.refunds.create.mockClear();
  vi.mocked(serverClient.patch).mockReset();
  vi.mocked(serverClient.transaction).mockReset();
});

describe('refundOrder', () => {
  it('refunds via Stripe, restores stock, and marks the order refunded', async () => {
    // 1st fetch: the order; 2nd fetch: current stock for restore.
    mockFetch
      .mockResolvedValueOnce(paidOrder)
      .mockResolvedValueOnce([
        { _id: 'p1', stock: 8 },
        { _id: 'p2', stock: 4 },
      ]);

    const txPatch = vi.fn();
    const txCommit = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serverClient.transaction).mockReturnValue({
      patch: txPatch,
      commit: txCommit,
    } as any);

    const patchChain = {
      set: vi.fn(() => patchChain),
      commit: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(serverClient.patch).mockReturnValue(patchChain as any);

    const result = await refundOrder('order_1');

    // Real Stripe refund call with the recorded payment intent.
    expect(mockStripeInstance.refunds.create).toHaveBeenCalledTimes(1);
    expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_123',
      reason: 'requested_by_customer',
    });

    // Stock restored: 8+2=10 and 4+1=5 in one transaction.
    expect(txPatch).toHaveBeenCalledWith('p1', { set: { stock: 10 } });
    expect(txPatch).toHaveBeenCalledWith('p2', { set: { stock: 5 } });
    expect(txCommit).toHaveBeenCalledTimes(1);

    // Order marked refunded.
    expect(serverClient.patch).toHaveBeenCalledWith('order_1');
    expect(patchChain.set).toHaveBeenCalledWith({ status: 'refunded' });

    expect(result).toEqual({ refunded: true });
  });

  it('rejects orders that are not paid — no Stripe call, no stock change', async () => {
    mockFetch.mockResolvedValueOnce({ ...paidOrder, status: 'pending' });

    const result = await refundOrder('order_1');

    expect(mockStripeInstance.refunds.create).not.toHaveBeenCalled();
    expect(vi.mocked(serverClient.transaction)).not.toHaveBeenCalled();
    expect(result.refunded).toBe(false);
    if (!result.refunded) expect(result.message).toContain('paid');
  });

  it('treats an already-refunded Stripe error as success so retries still restore stock', async () => {
    mockFetch
      .mockResolvedValueOnce(paidOrder)
      .mockResolvedValueOnce([{ _id: 'p1', stock: 8 }]);

    mockStripeInstance.refunds.create.mockRejectedValueOnce(
      Object.assign(new Error('charge already refunded'), { code: 'charge_already_refunded' })
    );

    const txPatch = vi.fn();
    const txCommit = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serverClient.transaction).mockReturnValue({
      patch: txPatch,
      commit: txCommit,
    } as any);

    const patchChain = {
      set: vi.fn(() => patchChain),
      commit: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(serverClient.patch).mockReturnValue(patchChain as any);

    const result = await refundOrder('order_1');

    expect(txPatch).toHaveBeenCalledWith('p1', { set: { stock: 10 } });
    expect(patchChain.set).toHaveBeenCalledWith({ status: 'refunded' });
    expect(result).toEqual({ refunded: true });
  });
});
