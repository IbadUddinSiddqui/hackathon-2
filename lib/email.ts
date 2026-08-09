import nodemailer from 'nodemailer';

export type ReceiptItem = {
  name: string;
  price: number;
  quantity: number;
  size?: string[];
};

/**
 * Send an order receipt email. If SMTP is not configured (SMTP_HOST missing),
 * logs a warning and returns without throwing so the webhook is never blocked
 * by email configuration.
 */
export async function sendOrderReceipt(input: {
  to: string;
  orderId: string;
  items: ReceiptItem[];
  total: number;
}) {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST not set — skipping receipt email. Configure SMTP_* env vars to enable.');
    return;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 = implicit SSL. Ports 587/25 use STARTTLS, which providers like
    // Brevo REQUIRE before accepting auth (without requireTLS, nodemailer may
    // authenticate in plaintext and get rejected with 535/EAUTH).
    secure: port === 465,
    requireTLS: port !== 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  const itemRows = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}${item.size?.length ? ` (${item.size.join(', ')})` : ''}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">Rs {(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `Bazaar Nest <${process.env.SMTP_USER || 'no-reply@localhost'}>`,
    to: input.to,
    subject: `Your Bazaar Nest order #${input.orderId.slice(0, 8).toUpperCase()} is confirmed!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333;">
        <div style="background:#000;color:#fff;padding:20px;text-align:center;">
          <h1 style="margin:0;font-size:20px;">Bazaar Nest</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="margin-top:0;">Thank you for your order! 🎉</h2>
          <p>Order <strong>#${input.orderId.slice(0, 8).toUpperCase()}</strong> has been confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #333;">Item</th>
                <th style="padding:8px;border-bottom:2px solid #333;">Qty</th>
                <th style="padding:8px;border-bottom:2px solid #333;text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p style="text-align:right;font-size:18px;font-weight:bold;">Total: Rs {input.total.toFixed(2)}</p>
          <p style="color:#777;font-size:13px;margin-top:24px;">
            Questions about your order? Reply to this email and we'll help you out.
          </p>
        </div>
      </div>
    `,
  });
}
