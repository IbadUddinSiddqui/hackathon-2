import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { serverClient } from '@/sanity/lib/server-client';

export type OrderItemInput = {
  id: string; // Sanity product _id
  name: string;
  price: number; // dollars
  quantity: number;
  size?: string[];
};

export type OrderDocument = {
  _id: string;
  _rev?: string;
  _type: 'order';
  order_id: string;
  status: string;
  customer_email?: string;
  customer_name?: string;
  items: {
    _key: string;
    product?: { _type: 'reference'; _ref: string };
    name: string;
    price: number;
    quantity: number;
    size?: string[];
  }[];
  subtotal?: number;
  discount_code?: string;
  discount_amount?: number;
  total?: number;
  currency?: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  created_at?: string;
};

export type SanityProductRef = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  size?: string[];
};

/**
 * Fetch products from Sanity by id. Used server-side so prices/names in orders
 * come from the database, never from the browser.
 */
export async function fetchProductsByIds(ids: string[]): Promise<SanityProductRef[]> {
  if (ids.length === 0) return [];
  return serverClient.fetch(
    `*[_id in $ids]{_id, name, price, stock, size}`,
    { ids }
  );
}

/**
 * Create a "pending" order document in Sanity BEFORE the customer pays.
 * The generated `order_id` is passed to Stripe via metadata so the webhook can
 * find this document and mark it paid.
 */
export async function createPendingOrder(input: {
  items: OrderItemInput[];
  subtotal: number;
  total: number;
  customerEmail?: string;
  discountCode?: string;
  discountAmount?: number;
  paymentMethod?: 'card' | 'cod';
}): Promise<{ orderId: string; docId: string }> {
  const orderId = uuidv4();
  const doc = await serverClient.create({
    _type: 'order',
    order_id: orderId,
    status: 'pending',
    payment_method: input.paymentMethod || 'card',
    customer_email: input.customerEmail || '',
    items: input.items.map((i) => ({
      _key: i.id,
      _type: 'orderItem',
      product: { _type: 'reference', _ref: i.id },
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size || [],
    })),
    subtotal: input.subtotal,
    discount_code: input.discountCode || '',
    discount_amount: input.discountAmount || 0,
    total: input.total,
    currency: 'usd',
    created_at: new Date().toISOString(),
  });

  return { orderId, docId: doc._id };
}

export async function findOrderByOrderId(orderId: string): Promise<OrderDocument | null> {
  return serverClient.fetch(
    `*[_type == "order" && order_id == $orderId][0]`,
    { orderId }
  );
}

/**
 * Persist a customer email onto the order if it's missing (e.g. Checkout
 * Session flow, where Stripe's hosted page collects it after order creation).
 */
export async function persistCustomerEmail(orderId: string, email: string) {
  if (!email) return;
  const order = await findOrderByOrderId(orderId);
  // createPendingOrder stores customer_email as '' when none was provided at
  // order-creation time, so check for a NON-EMPTY value here — an empty string
  // must be overwritten with the email Stripe collected at checkout.
  if (!order || order.customer_email?.trim()) return;
  await serverClient
    .patch(order._id)
    .set({ customer_email: email })
    .commit();
}

/**
 * Atomically transition an order from pending → paid. Uses the document
 * revision as an optimistic lock: if another webhook delivery already changed
 * the document, the patch fails with a conflict and we return false, so stock
 * is never decremented twice.
 */
export async function markOrderPaid(
  order: OrderDocument,
  stripeInfo: { sessionId?: string; paymentIntentId?: string }
): Promise<boolean> {
  // Re-fetch the document to get the CURRENT revision — earlier steps in the
  // webhook (e.g. persistCustomerEmail) may have bumped it, which would make a
  // stale ifRevisionId lock fail forever.
  const fresh = await serverClient.fetch(
    `*[_id == $id][0]`,
    { id: order._id }
  );
  if (!fresh) return false;

  let patch = serverClient.patch(fresh._id).set({ status: 'paid' });

  if (fresh._rev) {
    patch = patch.ifRevisionId(fresh._rev);
  }
  if (stripeInfo.sessionId) {
    patch = patch.setIfMissing({ stripe_session_id: stripeInfo.sessionId });
  }
  if (stripeInfo.paymentIntentId) {
    patch = patch.setIfMissing({ stripe_payment_intent_id: stripeInfo.paymentIntentId });
  }

  try {
    await patch.commit();
    return true;
  } catch (err: any) {
    // 409 = revision mismatch → a concurrent webhook already fulfilled it.
    if (err?.statusCode === 409 || err?.message?.includes('revision')) {
      return false;
    }
    throw err;
  }
}

/**
 * Decrement product stock by the purchased quantities. Uses a single Sanity
 * transaction so all products update atomically, and clamps at 0 so stock can
 * never go negative.
 */
export async function decrementProductStock(
  items: { id: string; quantity: number }[]
): Promise<void> {
  const ids = items.map((i) => i.id);
  if (ids.length === 0) return;

  const products: { _id: string; stock: number }[] = await serverClient.fetch(
    `*[_id in $ids]{_id, stock}`,
    { ids }
  );
  const stockMap = new Map(products.map((p) => [p._id, p.stock || 0]));

  const tx = serverClient.transaction();
  for (const item of items) {
    const current = stockMap.get(item.id);
    if (current === undefined) continue; // product no longer exists — skip
    tx.patch(item.id, { set: { stock: Math.max(0, current - item.quantity) } });
  }

  await tx.commit();
}

/**
 * Restore product stock after a refund. Inverse of `decrementProductStock`:
 * adds the purchased quantities back in a single atomic transaction.
 */
export async function restoreProductStock(
  items: { id: string; quantity: number }[]
): Promise<void> {
  const ids = items.map((i) => i.id);
  if (ids.length === 0) return;

  const products: { _id: string; stock: number }[] = await serverClient.fetch(
    `*[_id in $ids]{_id, stock}`,
    { ids }
  );
  const stockMap = new Map(products.map((p) => [p._id, p.stock || 0]));

  const tx = serverClient.transaction();
  for (const item of items) {
    const current = stockMap.get(item.id);
    if (current === undefined) continue; // product no longer exists — skip
    tx.patch(item.id, { set: { stock: current + item.quantity } });
  }

  await tx.commit();
}

/**
 * Refund a paid order: issue a real Stripe refund on its payment intent,
 * restore the decremented stock, then mark the order `refunded`. Returns a
 * result object instead of throwing so the API route can map it to a clean
 * HTTP response. Idempotent at the Stripe level: if the intent is already
 * refunded, stock is still restored and the status is still updated.
 */
export async function refundOrder(
  orderDocId: string
): Promise<{ refunded: boolean; message?: string }> {
  const order = await serverClient.fetch(
    `*[_type == "order" && _id == $id][0]`,
    { id: orderDocId }
  );

  if (!order) return { refunded: false, message: 'Order not found' };
  if (order.status !== 'paid') {
    return { refunded: false, message: 'Only paid orders can be refunded' };
  }
  const paymentIntentId = order.stripe_payment_intent_id;
  if (!paymentIntentId) {
    return { refunded: false, message: 'This order has no Stripe payment intent to refund' };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
  });

  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    });
  } catch (err: any) {
    // Already refunded → treat as success so a retry still restores stock.
    if (err?.code !== 'charge_already_refunded') {
      throw err;
    }
  }

  // Restore the stock that was decremented when the order was fulfilled.
  const items = (order.items || []).map((item: any) => ({
    id: item.product?._ref || '',
    quantity: item.quantity || 0,
  }));
  await restoreProductStock(
    items.filter((i: { id: string; quantity: number }) => i.id && i.quantity > 0)
  );

  await serverClient.patch(order._id).set({ status: 'refunded' }).commit();
  return { refunded: true };
}
