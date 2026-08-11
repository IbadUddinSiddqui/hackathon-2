# 🤝 HUMAN NODES — Owner Action List

> **What this is:** every task in [`TASK_GRAPH.md`](./TASK_GRAPH.md) tagged `human_required: true` — things a coding agent **cannot** do for you (dashboard clicks, external accounts, business decisions, real-browser testing). The agent will never attempt these; this file is your checklist so nothing silently sits stuck.
>
> **How to use it:** pick a node below, do the steps, then tell the AI agent *"I did [node-id]"* with any credentials/screenshots it asks for. The agent will verify, flip the node to `done` in the graph, and commit.
>
> **Status legend:** 🔴 blocked · 🟡 in progress · 🟢 ready to do now · ⏸ deferred (come back later)

---

## Quick summary

| Node | Status | What you need |
|---|---|---|
| [P1-SP-01](#p1-sp-01--diagnose-safepay-webhook-non-delivery) | 🔴 blocked | Send 1 email to Safepay support |
| [P1-02](#p1-02--rotate-secrets-in-provider-dashboards) | 🟢 ready | Regenerate 5 provider keys + update Vercel |
| [P1-SP-07](#p1-sp-07--browser-test-the-admin-panel) | 🟡 in progress | Test the bulk-import upload |
| [P2-07](#p2-07--owner-browser-test-the-product-admin-ui) | 🟡 in progress | Create / edit / delete a product in admin |
| [P1-SP-10](#p1-sp-10--brandingcontent-pass) | 🟡 in progress | Real logo + about/contact copy from client |
| [P1-15](#p1-15--select-and-begin-onboarding-with-a-pakistan-viable-payment-processor) | 🟡 in progress | Safepay production approval (later) |
| [P3-17](#p3-17--metatik-tok-pixel-events) | 🟢 ready | Meta + TikTok pixel IDs |
| [P3-18](#p3-18--google-analytics-4) | 🟢 ready | GA4 measurement ID |
| [P3-09](#p3-09--owner-set-up-cron-schedule-vercel-cron) | ⏸ later | Vercel Cron — only after P3-06/07 built |
| [P1-SP-09](#p1-sp-09--safepay-production-mode) | ⏸ deferred | Safepay live-account application |
| [P1-SP-03](#p1-sp-03--reprice-all-products-to-pkr-in-sanity) | ⏸ deferred | Real catalog prices (when client data exists) |
| [P1-15a](#p1-15a--apply-for-jazzcash-merchant-account--deferred) | ⏸ deferred | JazzCash application (retry on PK network) |
| [P1-15b](#p1-15b--apply-for-easypaisa-merchant-account--deferred) | ⏸ deferred | Easypaisa application (retry on PK network) |
| [P1-16-jc](#p1-16-jc--jazzcash-payment-integration--deferred) | ⏸ deferred | Nothing — blocked on P1-15a |
| [P1-16-ep-wallet](#p1-16-ep-wallet--easypaisa-wallet-integration--deferred) | ⏸ deferred | Nothing — blocked on P1-15b |
| [P1-16-ep-card](#p1-16-ep-card--easypaisa-card-integration--deferred) | ⏸ deferred | Nothing — blocked on P1-15b |

---

## 🔴 P1-SP-01 — Diagnose Safepay webhook non-delivery

**This is the #1 open risk. It blocks the whole production-deploy chain (P1-SP-02, P1-SP-05, P1-SP-08).**

**Status:** root cause already proven Safepay-side (their sandbox webhook logs are empty — zero delivery attempts ever made; our endpoint is provably reachable and rejects unsigned bodies correctly).

**Your action — one email:**

1. Open your email client, send **to:** `support@getsafepay.com`
2. **Subject:** `Sandbox webhooks never delivered — account [your merchant id]`
3. **Body — copy/paste this:**

> Hi Safepay team,
>
> I'm testing your sandbox payment integration. I successfully captured several test payments (test card 4111 1111 1111 1111), including:
> - Tracker ID: `track_7524538c-7ece-452a-b2d3-2c8f89358fab` (PKR 21,999, captured)
> - plus two other successful sandbox transactions from the same account
>
> I registered a webhook endpoint in the dashboard and configured the signing secret. However, **no webhook has ever been delivered** — your "Webhook Logs" tab shows zero delivery attempts, and my endpoint receives nothing (I confirmed the endpoint is publicly reachable; unsigned POSTs to it return 401, so HMAC verification works).
>
> Is webhook delivery supported in the sandbox environment? If so, is there an account-level or merchant-level setting I'm missing? If sandbox webhooks aren't delivered, please confirm so I know testing must happen in production.
>
> Thanks,<br>[Your name]

4. Reply here with their answer. If they confirm sandbox doesn't deliver webhooks → node unblocks (we'll verify for real in production, P1-SP-09).

---

## 🟢 P1-02 — Rotate secrets in provider dashboards

**Security hardening — regenerate every API key, then update Vercel so production isn't running on old keys.**

The 5 keys (all confirmed to be read only from env vars, never hardcoded):

| # | Provider | Key(s) | Dashboard |
|---|---|---|---|
| 1 | **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → Developers → API keys + Webhooks |
| 2 | **Sanity** | `SANITY_API_TOKEN` | manage.sanity.io → project → API → Tokens |
| 3 | **Typesense** | `TYPESENSE_ADMIN_KEY` | Typesense Cloud dashboard |
| 4 | **Brevo (SMTP)** | `SMTP_USER`, `SMTP_PASS` | app.brevo.com → SMTP & API → SMTP keys |
| 5 | **Auth** | `AUTH_SECRET` | generate a new one: `openssl rand -base64 32` |

**Steps:**

1. For each provider, **revoke the old key** and generate a new one (Stripe: also copy the new webhook signing secret from the webhook endpoint).
2. Update **`.env.local`** locally with the new values (or just paste them all to the AI agent — it will update the file).
3. Update the **Vercel project** → Settings → Environment Variables with the same new values (this is the part that matters for production).
4. Verify the *old* key now returns 401/invalid when used.
5. Tell the agent *"secrets rotated"* and paste the new values.

> ⚠️ Do **not** commit real keys. `.env.local` is gitignored; only share values in chat.

---

## 🟡 P1-SP-07 — Browser-test the admin panel

**Already done:** orders page, order detail (status changer + product links), discounts (create/edit/disable) — all OK.

**Remaining — test the bulk product import:**

1. Open `/adminpanel/products` → **Bulk Import** tab
2. Click **Download template** (gets an `.xlsx`)
3. Fill 2–3 rows (name, category, category_slug, price, stock, size, image_urls — image URLs must be direct http(s) links)
4. Upload the file → confirm the results table shows `created` rows
5. Confirm the new products appear in the **All Products** tab
6. Tell the agent the result (works / error message)

---

## 🟡 P2-07 — Owner browser-test the product admin UI

**Already done:** product list loads and searches (fixed the 500 bug, 2026-08-11).

**Remaining — exercise create / edit / delete against real data:**

1. **Create:** `/adminpanel/products/new` → fill the form (name, price, stock, category, category_slug, sizes, 1+ image URL) → Save → confirm it lands in the list
2. **Edit:** open the created product → change price/stock/name → Save → confirm the list reflects the change
3. **Delete:** open a product → Delete → confirm the dialog → confirm it disappears
4. Tell the agent each step worked (or paste any error)

---

## 🟡 P1-SP-10 — Branding/content pass

**Already done:** brand name = **AnK's** applied everywhere (metadata, legal pages, emails, admin). Excel bulk import built (P1-SP-11) so you can load the real catalog yourself.

**Remaining — need from the client:**

1. **Logo** — any format (SVG/PNG). The agent will drop it in `public/` and wire it into the header + footer + OG image.
2. **About / Contact copy** — a paragraph or two + contact details (address, phone, email, socials) for `/about` and `/contact` pages.
3. **Real product catalog** — use the Bulk Import tab (P1-SP-07) or Studio to replace mock data.
4. Hand any of these to the agent whenever they arrive.

---

## 🟡 P1-15 — Select and begin onboarding with a Pakistan-viable payment processor

**Status:** Safepay selected ✅ — sandbox keys received, 3 real sandbox payments captured, webhook fulfillment chain proven (replayed signature-verified webhook → order paid, stock decremented, receipt emailed).

**Remaining:** production merchant approval — that's the separate node [P1-SP-09](#p1-sp-09--safepay-production-mode) (deferred until the webhook question is settled).

---

## 🟢 P3-17 — Meta/TikTok Pixel events

**Needed:** your **Meta (Facebook) Pixel ID** and **TikTok Pixel ID** from the ad accounts.

1. Meta: business.facebook.com → Events Manager → your pixel → copy the 16-digit ID
2. TikTok: ads.tiktok.com → Events → your pixel → copy the ID
3. Paste both to the agent (e.g. `META_PIXEL_ID=1234567890123456`) — it will wire `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_TIKTOK_PIXEL_ID` and the ViewContent/AddToCart/Purchase events.

---

## 🟢 P3-18 — Google Analytics 4

**Needed:** a **GA4 Measurement ID** (`G-XXXXXXXXXX`).

1. analytics.google.com → create an account/property for the site
2. Data Streams → your web stream → copy the Measurement ID
3. Paste it to the agent — it will wire `NEXT_PUBLIC_GA_MEASUREMENT_ID` + page_view/ecommerce events.

---

## ⏸ P3-09 — Owner: set up cron schedule (Vercel Cron)

**Do later** — only after the abandoned-cart code exists (P3-06/P3-07). Then: add `crons` to `vercel.json` (e.g. daily at 6am) or use an external scheduler, and confirm it fires.

---

## ⏸ P1-SP-09 — Safepay production mode

**Deferred by you (2026-08-10).** When ready: apply for Safepay production/live merchant access, get the live API key, register the live webhook endpoint against the real domain. This is where webhook delivery gets confirmed for real (resolves P1-SP-01's verify).

---

## ⏸ P1-SP-03 — Reprice all products to PKR in Sanity

**Deferred — current data is mock.** When the real client catalog exists: set intentional PKR prices (not leftover USD like `19.99` with an "Rs" label). The agent can write a migration script; you supply the real prices.

---

## ⏸ P1-15a / P1-15b — JazzCash & Easypaisa merchant applications

**Deferred.** Both portals errored/timed out from the current network — retry from a Pakistan-based connection (mobile data) before concluding they're dead. **Revisit trigger:** after P1-SP-01 is resolved and the site is live.

- P1-15a → JazzCash merchant portal → sandbox/live credentials
- P1-15b → Easypaisa merchant portal → sandbox/live credentials

---

## ⏸ P1-16-jc / P1-16-ep-wallet / P1-16-ep-card — payment integrations

**Nothing to do.** These become real only after the corresponding merchant application (P1-15a / P1-15b) succeeds and credentials exist.

---

## ✅ Already done (for reference)

| Node | Result |
|---|---|
| P1-12 — Confirm error tracking captures errors | Test error visible in Sentry dashboard ✅ |
| P1-14 — SaaS vs custom-build decision | **SaaS / multi-tenant** decided ✅ |
| P1-18 — Legal review sign-off | Owner accepted drafts (formal counsel still recommended pre-launch) ✅ |
| P1-SP-06 — Confirm receipt email lands | Receipt arrived in ibaduddinsiddiqui418@gmail.com ✅ |

---

*Generated 2026-08-11 from TASK_GRAPH.md. If the graph changes, regenerate this file.*
