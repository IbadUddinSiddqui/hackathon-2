# Safepay (Pakistan Card Payments) — Sandbox → Production

AnK's accepts card payments via **Safepay** in PKR (Stripe cannot process PKR, so the
Stripe routes were removed). Checkout also supports **Cash on Delivery**.

> **Status: running on the SAFEPAY SANDBOX.** Real money requires the production
> switch below. COD is unaffected and works in production today.

## How it's wired

- `app/api/create-safepay-order/route.ts` — creates the Safepay checkout session,
  stores a `pending` order in Sanity with the tracker token.
- `app/components/CheckOut/SafepayPayment.tsx` — checkout UI (Card vs COD toggle).
- `app/api/payments/safepay/webhook/route.ts` — verifies the HMAC-SHA256 signature
  (`X-SFPY-SIGNATURE: sha256=<hex>` over `timestamp + '.' + rawBody`), then fulfils:
  decrement stock → email receipt → mark paid (revision-locked) → loyalty points.
- `lib/safepay.ts` — client helpers (create checkout, verify signature).
- `lib/tenants.ts` → `getPaymentConfig()` — per-tenant keys, falling back to env vars.

## Env vars (all in `.env.local` AND Vercel)

| Var | Sandbox value | Production value |
|---|---|---|
| `SAFEPAY_ENV` | `sandbox` | `production` |
| `SAFEPAY_API_KEY` | sandbox key | production key |
| `SAFEPAY_SECRET` | sandbox secret | production secret |
| `SAFEPAY_WEBHOOK_SECRET` | sandbox webhook secret | production webhook secret |
| `SAFEPAY_CURRENCY` | `PKR` | `PKR` |
| `NEXT_PUBLIC_SAFEPAY_ENABLED` | `true` | `true` |
| `PUBLIC_BASE_URL` | your Vercel URL | your Vercel URL |

## Sandbox testing (current)

- Test card: `4111 1111 1111 1111`, expiry `12/26`, any CVV.
- Checkout → Card (Safepay) → pay on Safepay's sandbox page → order appears in
  `/adminpanel/orders` as `paid`, stock decrements, receipt email is sent via Brevo.
- Webhook events land in the Safepay dashboard → **Webhook Logs**. The endpoint URL
  registered there must be publicly reachable:
  `https://<your-app>.vercel.app/api/payments/safepay/webhook`.

## Switch to production (when the merchant account is approved)

1. **Safepay dashboard → Development → API keys** — copy the *production* API key +
   secret into `SAFEPAY_API_KEY` / `SAFEPAY_SECRET` in Vercel (and `.env.local`).
2. **Safepay dashboard → Webhooks** — create/point the endpoint at
   `https://<your-domain>/api/payments/safepay/webhook`, select payment
   succeeded/completed + failed events, copy the **production webhook secret** into
   `SAFEPAY_WEBHOOK_SECRET`.
3. **Set `SAFEPAY_ENV=production`** in Vercel + `.env.local`.
4. **Set `PUBLIC_BASE_URL`** to the real domain (used for the merchant feed + Safepay
   callbacks — it currently may point at an old ngrok URL).
5. Redeploy. Verify with a small real transaction, then a real webhook delivery.
6. Keep sandbox values nowhere in Vercel production env once live.

## Notes

- Refunds for Safepay/COD orders are marked in the admin panel (stock is restored
  automatically); the gateway money movement is done manually in the Safepay
  dashboard until a refund API call is added.
- The webhook is rate-limited and verifies the platform secret before any Sanity
  read (P4-06), so unauthenticated traffic can't trigger order lookups.
