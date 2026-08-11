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

// The route now resolves its tenant via @/lib/tenants -> @/auth -> next-auth
// (which vitest can't resolve). Mock the module so the tenant is a constant
// and the server-client fetch sequences below stay stable.
vi.mock('@/lib/tenants', () => ({
  getActiveTenantId: vi.fn(async () => 'tenant-anks'),
  DEFAULT_TENANT_ID: 'tenant-anks',
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

// The pricing helper fetches, in order: products, active flash sales, then
// (when a code is given) the discount doc. linkCustomerToOrder then fetches
// the customer, and markCartCompleted fetches open carts.
function mockSanityForCod(order: { discount?: unknown; customer?: unknown; carts?: unknown }) {
  mockFetch
    .mockResolvedValueOnce([product]) // fetchProductsByIds
    .mockResolvedValueOnce([]) // getActiveFlashSales
    .mockResolvedValueOnce(order.discount ?? null) // validateDiscountCode (null when none)
    .mockResolvedValueOnce(order.customer ?? null) // findCustomerByEmail
    .mockResolvedValueOnce(order.carts ?? []); // markCartCompleted
}

beforeEach(() => {
  mockFetch.mockReset();
  mockCreate.mockReset();
});

describe('Cash on Delivery order creation', () => {
  it('stores a pending order with payment_method cod and the correct total (incl. delivery fee)', async () => {
    mockSanityForCod({});
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
    expect(created.credit_applied).toBe(0);
    expect(created.gift_card_applied).toBe(0);
  });

  it('applies a server-validated discount and still includes the delivery fee', async () => {
    mockSanityForCod({
      discount: { _id: 'd1', code: 'FIXED5', type: 'fixed', value: 5 },
    });
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

  it('applies a gift card and store credit, both deducted from the total', async () => {
    // gift card fetch happens inside priceCheckout before the customer fetch.
    mockFetch
      .mockResolvedValueOnce([product]) // products
      .mockResolvedValueOnce([]) // flash sales
      .mockResolvedValueOnce({ _id: 'g1', code: 'GIFT50', balance: 50, active: true }) // gift card
      .mockResolvedValueOnce({ _id: 'cust_1', creditBalance: 50 }) // credit balance
      .mockResolvedValueOnce(null) // findCustomerByEmail (link)
      .mockResolvedValueOnce([]); // markCartCompleted
    mockCreate.mockResolvedValue({ _id: 'doc_3' });
    // patch chain for gift-card decrement + credit deduction.
    const patchChain = {
      inc: vi.fn(() => patchChain),
      commit: vi.fn(async () => ({})),
    };
    vi.mocked(serverClient.patch).mockReturnValue(patchChain as any);

    const res = await POST(
      codRequest({
        items: [{ id: 'p1', quantity: 1 }],
        customerEmail: 'cod@example.com',
        giftCardCode: 'gift50',
        creditAmount: 30,
      })
    );

    expect(res.status).toBe(200);
    const created = mockCreate.mock.calls[0][0];
    // subtotal 20 → gift card 20 (full) → credit 0 left → delivery fee.
    expect(created.gift_card_code).toBe('GIFT50');
    expect(created.gift_card_applied).toBe(20);
    expect(created.credit_applied).toBe(0);
    expect(created.total).toBe(0 + DELIVERY_FEE);
  });

  it('rejects an empty cart', async () => {
    const res = await POST(codRequest({ items: [], customerEmail: 'cod@example.com' }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
