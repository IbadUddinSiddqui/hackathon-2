import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decrementProductStock, markOrderPaid, type OrderDocument } from './orders';
import { serverClient } from '@/sanity/lib/server-client';

// Mock the Sanity client so tests never hit the network. vitest hoists the
// mock above the imports that consume it.
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

beforeEach(() => {
  mockFetch.mockReset();
  vi.mocked(serverClient.patch).mockReset();
  vi.mocked(serverClient.transaction).mockReset();
});

describe('decrementProductStock', () => {
  it('clamps stock at 0 — it can never go negative', async () => {
    // Product has 3 in stock; the order buys 5.
    mockFetch.mockResolvedValue([{ _id: 'p1', stock: 3 }]);

    const txPatch = vi.fn();
    const txCommit = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serverClient.transaction).mockReturnValue({
      patch: txPatch,
      commit: txCommit,
    } as any);

    await decrementProductStock([{ id: 'p1', quantity: 5 }]);

    expect(txPatch).toHaveBeenCalledWith('p1', { set: { stock: 0 } });
    expect(txCommit).toHaveBeenCalledTimes(1);
  });

  it('decrements normally when stock remains positive', async () => {
    mockFetch.mockResolvedValue([{ _id: 'p1', stock: 10 }]);

    const txPatch = vi.fn();
    const txCommit = vi.fn().mockResolvedValue(undefined);
    vi.mocked(serverClient.transaction).mockReturnValue({
      patch: txPatch,
      commit: txCommit,
    } as any);

    await decrementProductStock([{ id: 'p1', quantity: 3 }]);

    expect(txPatch).toHaveBeenCalledWith('p1', { set: { stock: 7 } });
  });
});

describe('markOrderPaid (duplicate webhook idempotency)', () => {
  const order: OrderDocument = {
    _id: 'order_1',
    _rev: 'rev_old',
    _type: 'order',
    order_id: 'abc-123',
    status: 'pending',
    items: [],
  };

  function mockSanityFetch(doc: any) {
    mockFetch.mockResolvedValue(doc);
  }

  function mockPatchChain({ commitImpl }: { commitImpl: () => Promise<any> }) {
    const chain = {
      set: vi.fn(() => chain),
      ifRevisionId: vi.fn(() => chain),
      setIfMissing: vi.fn(() => chain),
      commit: vi.fn(commitImpl),
    };
    vi.mocked(serverClient.patch).mockReturnValue(chain as any);
    return chain;
  }

  it('first fulfillment claims the order (returns true)', async () => {
    mockSanityFetch({ _id: 'order_1', _rev: 'rev_fresh', status: 'pending' });
    const chain = mockPatchChain({ commitImpl: () => Promise.resolve({}) });

    const claimed = await markOrderPaid(order, { paymentIntentId: 'pi_1' });

    expect(claimed).toBe(true);
    expect(serverClient.patch).toHaveBeenCalledWith('order_1');
    expect(chain.set).toHaveBeenCalledWith({ status: 'paid' });
    expect(chain.ifRevisionId).toHaveBeenCalledWith('rev_fresh');
    expect(chain.setIfMissing).toHaveBeenCalledWith({ stripe_payment_intent_id: 'pi_1' });
  });

  it('duplicate delivery loses the revision lock (returns false) — stock only ever decrements once', async () => {
    // Second webhook delivery: the revision changed (first delivery committed),
    // so the optimistic lock patch fails with 409.
    mockSanityFetch({ _id: 'order_1', _rev: 'rev_newer', status: 'paid' });
    mockPatchChain({
      commitImpl: () =>
        Promise.reject(Object.assign(new Error('Document already changed'), { statusCode: 409 })),
    });

    const claimed = await markOrderPaid(order, { paymentIntentId: 'pi_1' });

    expect(claimed).toBe(false);
  });
});
