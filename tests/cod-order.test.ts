import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/create-cod-order/route';
import { serverClient } from '@/sanity/lib/server-client';
import { DELIVERY_FEE } from '@/lib/constants';

// The COD route must never touch Stripe — only the Sanity client is mocked.
vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: {
    fetch: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
    transaction: vi.fn(),
  },
}));

const mockFetch = vi.mocked(serverClient.fetch) as unknown as ReturnType<typeof vi.fn>;
const mockCreate = vi.mocked(serverClient.create) as unknown as ReturnType<typeof vi.fn>;

const product = { _id: 'p1', name: 'Shirt', price: 20, stock: 5 };

function codRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/create-cod-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockCreate.mockReset();
});

describe('Cash on Delivery order creation', () => {
  it('stores a pending order with payment_method cod and the correct total (incl. delivery fee)', async () => {
    // fetch: products (fetchProductsByIds), then null (no discount code given).
    mockFetch.mockResolvedValueOnce([product]).mockResolvedValueOnce(null);
    mockCreate.mockResolvedValue({ _id: 'doc_1' });

    const res = await POST(
      codRequest({
        items: [{ id: 'p1', quantity: 2 }],
        customerEmail: 'cod@example.com',
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.orderId).toBeTruthy();

    const created = mockCreate.mock.calls[0][0];
    expect(created.status).toBe('pending');
    expect(created.payment_method).toBe('cod');
    expect(created.subtotal).toBe(40); // 2 × $20
    expect(created.total).toBe(40 + DELIVERY_FEE); // subtotal + delivery, no discount
    expect(created.customer_email).toBe('cod@example.com');
  });

  it('applies a server-validated discount and still includes the delivery fee', async () => {
    mockFetch
      .mockResolvedValueOnce([product])
      .mockResolvedValueOnce({ _id: 'd1', code: 'FIXED5', type: 'fixed', value: 5 });
    mockCreate.mockResolvedValue({ _id: 'doc_2' });

    const res = await POST(
      codRequest({
        items: [{ id: 'p1', quantity: 1 }],
        customerEmail: 'cod@example.com',
        discountCode: 'FIXED5',
      })
    );

    expect(res.status).toBe(200);
    const created = mockCreate.mock.calls[0][0];
    expect(created.discount_code).toBe('FIXED5');
    expect(created.discount_amount).toBe(5);
    expect(created.total).toBe(20 - 5 + DELIVERY_FEE);
    // No Stripe anywhere: assert only the Sanity client was used.
    expect(vi.mocked(serverClient.transaction)).not.toHaveBeenCalled();
  });

  it('rejects an empty cart', async () => {
    const res = await POST(codRequest({ items: [], customerEmail: 'cod@example.com' }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
