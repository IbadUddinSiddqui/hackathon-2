import { describe, it, expect, vi } from 'vitest';
import Stripe from 'stripe';
import { serverClient } from '@/sanity/lib/server-client';
import { DELIVERY_FEE } from '@/lib/constants';

/**
 * End-to-end checkout test against a RUNNING dev server (npm run dev) and live
 * test-mode Stripe + Sanity credentials in .env.local.
 *
 * Run with: npm run test:e2e   (loads .env.local, requires http://localhost:3000 up)
 *
 * Flow covered: cart item → server-side payment intent (with discount) →
 * pay with Stripe test card 4242 4242 4242 4242 → signed payment_intent.succeeded
 * webhook → order marked paid → stock decremented.
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`E2E test requires ${name} in .env.local`);
  }
  return value;
}

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-01-27.acacia',
});

async function fetchOrder(orderId: string) {
  return serverClient.fetch(
    `*[_type == "order" && order_id == $orderId][0]{status, total, customer_email}`,
    { orderId }
  );
}

describe('full checkout flow', () => {
  it('discount → pay with test card → webhook → order paid + stock decremented', async () => {
    // 1. Pick a real product that has stock; record its stock.
    const product: { _id: string; name: string; price: number; stock: number } | null =
      await serverClient.fetch(
        `*[_type == "product" && stock > 0][0]{_id, name, price, stock}`
      );
    expect(product, 'No in-stock product found in Sanity').toBeTruthy();
    const stockBefore = product!.stock;

    // 2. Pick an active, non-expired discount code with remaining uses (if any).
    const discount: { code: string } | null = await serverClient.fetch(
      `*[_type == "discountCode" && active != false && (!defined(maxUses) || usedCount < maxUses) && (!defined(expiresAt) || expiresAt > now())][0]{code}`
    );

    // 3. Create the payment intent through the app's own API (server-side pricing).
    const res = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: product!._id, quantity: 1 }],
        customerEmail: 'e2e-checkout@example.com',
        discountCode: discount?.code,
      }),
    });
    const resBody = await res.text();
    expect(res.ok, `create-payment-intent failed: ${resBody}`).toBe(true);
    const { clientSecret, orderId } = JSON.parse(resBody);
    expect(clientSecret).toBeTruthy();
    expect(orderId).toBeTruthy();

    // 4. Pay with the Stripe test card 4242 4242 4242 4242. Use the tok_visa
    //    test token (this account blocks raw card numbers — the safe default).
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: 'tok_visa' },
    });
    const paymentIntentId = String(clientSecret).split('_secret_')[0];
    const paid = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod.id,
    });
    expect(paid.status).toBe('succeeded');

    // 5. Deliver a *signed* payment_intent.succeeded event to the webhook, the
    //    same way the Stripe CLI / production Stripe would.
    const payload = JSON.stringify({
      id: `evt_e2e_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          metadata: { order_id: orderId },
          receipt_email: 'e2e-checkout@example.com',
        },
      },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: requireEnv('STRIPE_WEBHOOK_SECRET'),
    });
    const webhookRes = await fetch(`${BASE_URL}/api/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload,
    });
    expect(webhookRes.status).toBe(200);

    // 6. Webhook fulfilment is async — poll until the order flips to paid.
    await vi.waitFor(
      async () => {
        const order = await fetchOrder(orderId);
        expect(order?.status).toBe('paid');
      },
      { timeout: 30_000, interval: 1_000 }
    );

    // 7. Verify stock decremented and the stored total is exactly
    //    price + DELIVERY_FEE − discount (replicating validateDiscountCode).
    const order = await fetchOrder(orderId);
    const productAfter: { stock: number } | null = await serverClient.fetch(
      `*[_id == $id][0]{stock}`,
      { id: product!._id }
    );
    expect(order.customer_email).toBe('e2e-checkout@example.com');
    expect(productAfter?.stock).toBe(stockBefore - 1);

    let discountAmount = 0;
    if (discount) {
      const discountDoc: { type: 'percent' | 'fixed'; value: number } | null =
        await serverClient.fetch(
          `*[_type == "discountCode" && code == $code][0]{type, value}`,
          { code: discount.code }
        );
      if (discountDoc) {
        discountAmount =
          discountDoc.type === 'percent'
            ? (product!.price * discountDoc.value) / 100
            : discountDoc.value;
        discountAmount = Math.round(Math.min(discountAmount, product!.price) * 100) / 100;
      }
    }
    const expectedTotal = Math.round((product!.price - discountAmount + DELIVERY_FEE) * 100) / 100;
    expect(order.total).toBe(expectedTotal);
  });
});
