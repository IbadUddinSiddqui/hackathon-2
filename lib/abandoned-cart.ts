// lib/abandoned-cart.ts
// P3-06/P3-07 — abandoned-cart capture + recovery-email logic. Pure-ish
// helpers (testable) plus the Sanity persistence and email triggers.

import { serverClient } from "@/sanity/lib/server-client";
import { normalizeEmail } from "@/lib/customers";
import { sendOrderReceipt } from "@/lib/email";

export type CartItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string[];
};

export type AbandonedCartDoc = {
  _id: string;
  email: string;
  items?: CartItemInput[];
  subtotal?: number;
  checkoutUrl?: string;
  status?: string;
  remindedAt?: string;
  createdAt?: string;
};

/** Subtotal of a cart, client-independent (prices passed server-side). */
export function computeSubtotal(items: CartItemInput[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

/** Find the most recent abandoned-cart doc for an email, or null. */
export async function findAbandonedCartByEmail(
  email: string,
  tenantId: string = "tenant-anks"
): Promise<AbandonedCartDoc | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return serverClient.fetch(
    `*[_type == "abandonedCart" && email == $email && (!defined(tenantId) || tenantId == $tenantId)] | order(createdAt desc) [0]`,
    { email: normalized, tenantId }
  );
}

/**
 * P3-06 — Capture (or refresh) an abandoned cart. Upserts by email so repeated
 * saves during one checkout session don't create duplicates. Idempotent.
 */
export async function saveAbandonedCart(input: {
  tenantId?: string;
  email: string;
  items: CartItemInput[];
  subtotal?: number;
  checkoutUrl?: string;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!email) return;
  const tenantId = input.tenantId || "tenant-anks";

  const existing = await findAbandonedCartByEmail(email, tenantId);
  const doc = {
    _type: "abandonedCart",
    tenantId,
    email,
    items: input.items.map((i) => ({
      _key: i.id,
      _type: "abandonedItem",
      productId: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size || [],
    })),
    subtotal: input.subtotal ?? computeSubtotal(input.items),
    checkoutUrl: input.checkoutUrl || "",
    status: existing?.status === "reminded" ? "reminded" : "abandoned",
    createdAt: existing?.createdAt || new Date().toISOString(),
  } as {
    _type: string;
    email: string;
    items: { _key: string; _type: string; productId: string; name: string; price: number; quantity: number; size: string[] }[];
    subtotal: number;
    checkoutUrl: string;
    status: string;
    createdAt: string;
  };

  if (existing) {
    await serverClient.patch(existing._id).set(doc).commit();
  } else {
    await serverClient.create(doc);
  }
}

/**
 * P3-06 — Mark carts for this email as recovered/completed once an order is
 * actually placed (called by the order-creation routes).
 */
export async function markCartCompleted(
  email: string,
  tenantId: string = "tenant-anks"
): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  const docs = await serverClient.fetch(
    `*[_type == "abandonedCart" && email == $email && (!defined(tenantId) || tenantId == $tenantId) && status in ["abandoned", "reminded"]]{_id}`,
    { email: normalized, tenantId }
  );
  if (!docs?.length) return;
  const tx = serverClient.transaction();
  for (const d of docs) tx.patch(d._id, { set: { status: "completed" } });
  await tx.commit();
}

const ABANDON_MS = 24 * 60 * 60 * 1000; // 24h without update = abandoned

/** Select carts old enough to recover (untouched for > 24h, not yet reminded). */
export async function findRecoverableCarts(now: Date = new Date()): Promise<AbandonedCartDoc[]> {
  const cutoff = new Date(now.getTime() - ABANDON_MS).toISOString();
  return serverClient.fetch(
    `*[_type == "abandonedCart" && status == "abandoned" && createdAt < $cutoff] | order(createdAt asc)`,
    { cutoff }
  );
}

/**
 * P3-07 — Send the recovery email for a cart and mark it reminded (no
 * double-send). Returns true when the email was sent. Reuses the Brevo
 * transport from lib/email.ts (via sendOrderReceipt's transporter config by
 * sending through nodemailer directly here for a custom subject/body).
 */
export async function remindCart(cart: AbandonedCartDoc): Promise<boolean> {
  if (!cart?.email || !cart.items?.length) return false;
  if (cart.status === "reminded") return false;

  const transporter = await getEmailTransporter();
  if (!transporter) return false;

  const itemRows = cart.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}${i.size?.length ? ` (${i.size.join(", ")})` : ""}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">Rs ${(i.price * i.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `AnK's <${process.env.SMTP_USER || "no-reply@localhost"}>`,
    to: cart.email,
    subject: "Your cart is waiting! 🛍️",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#000;color:#fff;padding:20px;text-align:center;">
          <h1 style="margin:0;font-size:20px;">AnK's</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="margin-top:0;">You left something behind 👀</h2>
          <p>Your cart is still waiting for you. Complete your order and it ships right away!</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #333;">Item</th><th style="padding:8px;border-bottom:2px solid #333;">Qty</th><th style="padding:8px;border-bottom:2px solid #333;text-align:right;">Price</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p style="text-align:right;font-size:18px;font-weight:bold;">Subtotal: Rs ${(cart.subtotal || 0).toFixed(2)}</p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${cart.checkoutUrl || "/checkout"}" style="background:#000;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Complete my order</a>
          </p>
          <p style="color:#777;font-size:13px;margin-top:24px;">Questions? Reply to this email and we'll help you out.</p>
        </div>
      </div>
    `,
  });

  // Mark reminded AFTER a successful send so a crash never double-sends.
  await serverClient.patch(cart._id).set({ status: "reminded", remindedAt: new Date().toISOString() }).commit();
  return true;
}

async function getEmailTransporter() {
  if (!process.env.SMTP_HOST) {
    console.warn("SMTP_HOST not set — skipping abandoned-cart reminder.");
    return null;
  }
  const nodemailer = (await import("nodemailer")).default;
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

// Re-export so callers can share the same receipt type.
export type { ReceiptItem } from "@/lib/email";
export { sendOrderReceipt };
