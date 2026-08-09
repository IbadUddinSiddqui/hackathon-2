import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  findOrderByOrderId,
  markOrderPaid,
  persistCustomerEmail,
  decrementProductStock,
  type OrderDocument,
} from '@/lib/orders';
import { sendOrderReceipt } from '@/lib/email';
import { incrementDiscountUsage } from '@/lib/discounts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27.acacia',
});

/**
 * Fulfil an order that has been paid: decrement stock, email the receipt, then
 * atomically mark the order paid. Stock/email run FIRST so that if any of them
 * throws, the webhook returns an error, Stripe retries, and the order is still
 * 'pending' when retried. The final mark-paid uses an optimistic revision lock
 * so two concurrent webhook deliveries can never both decrement stock.
 */
async function fulfilOrder(
  order: OrderDocument,
  stripeIds: { sessionId?: string; paymentIntentId?: string },
  customerEmailFromStripe?: string
) {
  if (order.status === 'paid') {
    console.log('Order already fulfilled, skipping:', order.order_id);
    return;
  }

  // Persist the email Stripe collected (Checkout Session flow) so order
  // records in Sanity always have a customer email.
  if (customerEmailFromStripe) {
    await persistCustomerEmail(order.order_id, customerEmailFromStripe);
  }

  // 1. Decrement stock (throws → webhook 500 → Stripe retries).
  const orderItems = order.items.map((item) => ({
    id: item.product?._ref || '',
    quantity: item.quantity,
  }));
  await decrementProductStock(orderItems.filter((i) => i.id));

  // 2. Email receipt (never fails the webhook — failures are logged).
  const recipientEmail = customerEmailFromStripe || order.customer_email;
  if (recipientEmail) {
    await sendOrderReceipt({
      to: recipientEmail,
      orderId: order.order_id,
      items: order.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
      })),
      total: order.total || 0,
    }).catch((err) => console.error('Receipt email failed:', err.message));
  }

  // 3. Mark paid LAST, atomically (ifRevisionId prevents double-fulfil).
  const claimed = await markOrderPaid(order, stripeIds);
  if (!claimed) {
    console.log('Order already claimed by a concurrent webhook:', order.order_id);
    return;
  }

  // 4. Bump the discount code's usage counter now that the order is paid.
  if (order.discount_code) {
    try {
      await incrementDiscountUsage(order.discount_code);
    } catch (err: any) {
      console.error('Failed to increment discount usage:', err.message);
    }
  }
}

export async function POST(request: Request) {
  // Read the raw body as a Buffer
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    // Construct the event using the raw body and signature
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event (e.g., payment succeeded)
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      console.log('Checkout session completed:', session.id, 'order:', orderId);

      if (orderId) {
        const order = await findOrderByOrderId(orderId);
        if (order) {
          await fulfilOrder(
            order,
            {
              sessionId: session.id,
              paymentIntentId:
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id,
            },
            session.customer_details?.email || undefined
          );
        } else {
          console.warn('Order not found for checkout session:', orderId);
        }
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.order_id;
      console.log('PaymentIntent succeeded:', paymentIntent.id, 'order:', orderId);

      if (orderId) {
        const order = await findOrderByOrderId(orderId);
        if (order) {
          await fulfilOrder(
            order,
            { paymentIntentId: paymentIntent.id },
            paymentIntent.receipt_email || undefined
          );
        } else {
          console.warn('Order not found for payment intent:', orderId);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
