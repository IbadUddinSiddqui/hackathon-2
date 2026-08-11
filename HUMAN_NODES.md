# 🧑‍💻 HUMAN NODES — What Only You Can Do

**Project:** AnK's (hackathon-2) — Next.js 15 + Sanity + Safepay + Typesense e-commerce platform

Every code-buildable task in the roadmap is **done** (68/93 nodes, 182 tests passing, tsc clean).
The **25 nodes below** are the ones that need a human: credentials, decisions, content, or
manual verification. Work them in priority order — each section says exactly what to do and
where to paste the credential.

> **Where to put credentials:**
> - **Local dev:** `.env.local` (same names as below, never commit it)
> - **Production (Vercel):** Project → Settings → Environment Variables (paste the same NAME=VALUE pairs)
> - Names already present in `.env.local` are marked `(exists locally)`

---

## 🔴 PRIORITY 1 — Go Live (unblocks everything else)

### P1-SP-08 — Deploy the site on the real domain ⭐ *THE most important node*
**Done when:** the site is live on the real domain with production env vars set.

1. In Vercel: **Settings → Domains** → add the client's domain (e.g. `anks.pk` or `www.anks.pk`)
2. Follow Vercel's DNS instructions at your domain registrar (add the CNAME / A record)
3. Wait for SSL to provision (Vercel does it automatically, ~1 min)
4. In **Vercel → Settings → Environment Variables**, paste ALL of the names from `.env.local`
   (they're listed at the bottom of this file) with their **production values**
5. Redeploy → confirm `https://<your-domain>` loads

### P1-02 — Regenerate auth keys in production
**Done when:** old auth values fail, new values set in Vercel (not just locally).

1. Generate a new secret: run `openssl rand -base64 32` (or use any random string ≥ 32 chars)
2. In **Vercel → Environment Variables** set `AUTH_SECRET` = that new value
   (also `NEXTAUTH_SECRET` if any old code references it)
3. Redeploy. Existing login sessions will be invalidated — that's expected and correct.

### P3-09 — Schedule the abandoned-cart cron in Vercel
**Done when:** the endpoint is on a daily (or 6-hourly) schedule. **Handler is already built.**

1. In **Vercel → Settings → Cron Jobs** (Pro plan) create a job:
   - **Path:** `/api/cron/abandoned-cart`
   - **Schedule:** `0 */6 * * *` (every 6 hours) or `0 2 * * *` (daily 2am)
2. Set `CRON_SECRET` in Vercel env vars to any random string (e.g. `openssl rand -base64 24`)
3. **Security note:** the route rejects requests without a matching `Authorization: Bearer <CRON_SECRET>`
   header, which Vercel Cron automatically sends.

---

## 🟠 PRIORITY 2 — Manual QA (30 minutes, closes the loop)

### P1-SP-07 — Click through the payment flows in a real browser
**Done when:** both payment pages manually confirmed working in a browser this session.

1. Run `npm run dev`, open `http://localhost:3000`
2. Add an item to cart → checkout → **Cash on Delivery**: submit, confirm you land on the success page
3. With `NEXT_PUBLIC_SAFEPAY_ENABLED=true` in `.env.local`: repeat with **Safepay card**, pay with
   the sandbox test card (`4111 1111 1111 1111`, any future expiry), confirm you land back on success
4. Check the admin panel → Orders shows the new orders; the paid one has **stock decremented**

### P2-07 — Click through the admin product flow against real data
**Done when:** list/search + create + edit + delete all confirmed working in a browser.

1. Log in at `/login` (admin account), go to `/adminpanel/products`
2. **Search** for a real product → **Create** a product → **Edit** it → **Delete** it
3. Confirm each change appears/disappears in the storefront listing

---

## 🟡 PRIORITY 3 — Branding & Content (client deliverables)

### P1-SP-10 — Replace placeholder branding with the real client brand
**Done when:** "Bazaar Nest" placeholder replaced; real catalog, about, and contact pages live.

- [ ] Real logo files → `public/` (currently `logo-text-black.svg`, `logo-full-black.svg`)
- [ ] Real product catalog → Sanity Studio (or Excel bulk import in `/adminpanel/products`)
- [ ] Homepage hero image + copy → `app/components/Hero/Hero.tsx`
- [ ] About page + Contact page with real details (currently placeholder links in the footer)
- [ ] Real brand name in metadata: `app/layout.tsx` (title/description) and `lib/site.ts`

### P3-17 — Meta + TikTok pixels
**Done when:** pixel scripts load when the env vars are set; events fire on key actions.
**Paste these into `.env.local` (local) and Vercel env vars (prod):**
```
NEXT_PUBLIC_META_PIXEL_ID=<your-meta-pixel-id>
NEXT_PUBLIC_TIKTOK_PIXEL_ID=<your-tiktok-pixel-id>
```
Then tell the developer to run the one-line build — the event layer (ViewContent, AddToCart,
InitiateCheckout, Purchase) is already written and activates automatically when the IDs are set.

### P3-18 — GA4 analytics
**Paste this into `.env.local` (local) and Vercel env vars (prod):**
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
Same as above — the loader + page_view + ecommerce events are written; adding the ID activates them.

### P4-17 — The client's ~20 real FAQ Q&As
**Done when:** real Q&As are loaded into the knowledge base. The chat widget + matching engine
already work with a seeded default set (shipping, returns, sizing, payments).

- Collect ~20 real Q&As from the client (shipping times, return policy, sizing, payment methods,
  COD, tracking, cancellations, fabric care, discounts, stock)
- Paste them into `lib/faq.ts` → the `DEFAULT_FAQS` array (each entry: `id`, `keywords`,
  `question`, `answer`) — format is shown in the file
- Nothing else changes; the widget + WhatsApp escalation already work

---

## 🟢 PRIORITY 4 — Merchant Accounts (Pakistan gateways)

### P1-15 — Safepay production merchant account
**Done when:** merchant account approved and **live** credentials available.
**Apply at:** https://getsafepay.com (or via your Safepay contact)
Once approved, paste into `.env.local` + Vercel:
```
SAFEPAY_ENV=production
SAFEPAY_API_KEY=<live-api-key>          (exists locally — replace sandbox value)
SAFEPAY_WEBHOOK_SECRET=<live-webhook-secret>   (exists locally — replace sandbox value)
```
Then register the **live webhook endpoint** in the Safepay dashboard pointing at
`https://<your-domain>/api/payments/safepay/webhook`.

### P1-16 — Switch the Safepay integration to production (blocked on P1-15)
**Done when:** integration code runs against live credentials behind the existing feature flag,
mirroring the same server-side-pricing + webhook-verified pattern already in use (it's the same
code — `SAFEPAY_ENV=production` + live keys is what activates it). No new code needed;
the developer flips it once P1-15 credentials + P1-SP-01 (stable webhook URL) are done.

### P1-15a / P1-15b — JazzCash & Easypaisa merchant applications (optional)
**Done when:** applications submitted and sandbox/live credentials received.
Apply for a merchant account on each provider's site (JazzCash / Easypaisa merchant portal).
When credentials arrive, the integrations (P1-16-jc, P1-16-ep-wallet, P1-16-ep-card) mirror the
already-proven Safepay pattern — give the developer the API key, secret, and webhook secret.

### P1-16-jc / P1-16-ep-wallet / P1-16-ep-card — build the gateway integrations
**Deferred until the merchant credentials above exist.** No action needed now.

### P1-SP-09 — Production Safepay webhook
**Done when:** live API key obtained + live webhook registered against the real production domain.
Depends on P1-15 + P1-SP-08. Same dashboard steps, but against the production domain.

---

## 🔵 PRIORITY 5 — SaaS Platform Decisions (Phase 4)

### P4-09 — SaaS pricing + billing gateway ⭐ *decision that makes you money*
**Done when:** written pricing (free/trial/pro tiers in PKR), a billing gateway choice, and where
platform fees are collected.

1. Confirm the draft pricing already coded in `lib/billing.ts`:
   - **Free** — 20 products, 50 orders/mo, ₹0
   - **Trial** — 50 products, 200 orders/mo, ₹0
   - **Pro** — 2,000 products, 10,000 orders/mo, **₹4,999/mo** (draft — change as you like)
2. Decide the **billing gateway** for collecting subscription fees (e.g. Safepay recurring, Stripe
   (if available), or manual invoicing) and tell the developer
3. Decide where platform fees are collected (per-tenant subscription vs transaction %)

### P4-10 — First real tenant onboarding
**Done when:** the documented checklist is followed for the first client.
Full steps are in `docs/onboarding-checklist.md`. Short version:
1. Create the tenant in `/adminpanel/tenants`
2. Have the client add a **CNAME** (subdomain) or **A record** (apex) pointing at your Vercel domain
3. Add the client's domain to their tenant's `domains[]` field
4. Wait for SSL, set their payment keys, seed their catalog, verify isolation

### P4-16 — AI provider + budget (fully optional)
**Done when:** provider chosen, keys provisioned, monthly cost approved.
Everything already works without AI (rule-based). If you want semantic search/LLM ranking,
full instructions are in `docs/ai-provider-decision.md`. Cheapest on-ramp: a free/local
embedding service for search only.

---

## ⚪ PRIORITY 6 — Deferred / Cleanup

### P1-SP-01 — Fix the Safepay webhook URL mismatch ⭐ *blocking P1-16/P1-SP-08*
**Done when:** root cause identified — either (a) the registered endpoint URL doesn't match the
current ngrok/deployed URL (fix: register a **stable** URL), or (b) a genuine signing-secret issue.

1. Open the Safepay dashboard → Developer → Webhooks, note the exact registered URL
2. Compare it to the actual `PUBLIC_BASE_URL` used when the order was created
3. If they differ, re-register the endpoint to match production, or set `PUBLIC_BASE_URL`
   in Vercel env vars to the real domain
4. Pay another sandbox test order and confirm the webhook log shows a 200

### P1-SP-02 — Stable webhook endpoint (depends on P1-SP-01)
The webhook must point at a **stable Vercel URL**, not a rotating ngrok tunnel. Once the site is
deployed (P1-SP-08) and `PUBLIC_BASE_URL` is set, re-register the endpoint at
`https://<your-domain>/api/payments/safepay/webhook`.

### P1-SP-05 — Remove/disable old Stripe endpoints
**Done when:** the old Stripe endpoints are removed or return 410. Nothing links to them, but they
still exist and are callable. The developer can do this in one pass once you confirm Stripe is
fully retired (it is — Safepay + COD are the payment methods).

### P1-SP-03 — PKR price audit
**Done when:** every product's price is an intentional PKR value (not a leftover USD number like
19.99 displayed as "Rs 19.99"). Audit products in Sanity and fix any USD-scale prices.

### P2-08 — Product image editing in the admin panel
**Deferred.** Current edit form doesn't manage images (add-by-URL / remove / replace). The PATCH
endpoint already accepts `imageUrls` — this is just a small UI addition when you want it.

---

## 📋 Full env var reference (names only — paste values into `.env.local` + Vercel)

Already in `.env.local` (verify production values in Vercel):
```
AUTH_SECRET                      SANITY_API_TOKEN
EMAIL_FROM                       SANITY_WEBHOOK_SECRET
PUBLIC_BASE_URL                  SENTRY_DSN
SAFEPAY_API_KEY                  NEXT_PUBLIC_SENTRY_DSN
SAFEPAY_CURRENCY                 STRIPE_SECRET_KEY
SAFEPAY_ENV                      STRIPE_WEBHOOK_SECRET
SAFEPAY_WEBHOOK_SECRET           NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
SMTP_HOST                        TYPESENSE_ADMIN_KEY
SMTP_PASS                        NEXT_PUBLIC_TYPESENSE_HOST
SMTP_PORT                        NEXT_PUBLIC_TYPESENSE_PORT
SMTP_USER                        NEXT_PUBLIC_TYPESENSE_PROTOCOL
NEXT_PUBLIC_SANITY_PROJECT_ID    NEXT_PUBLIC_TYPESENSE_SEARCH_KEY
NEXT_PUBLIC_SANITY_DATASET       NEXT_PUBLIC_SAFEPAY_ENABLED
NEXT_PUBLIC_SANITY_TOKEN
```

To add when you have them (see nodes above):
```
CRON_SECRET                      NEXT_PUBLIC_META_PIXEL_ID
NEXT_PUBLIC_TIKTOK_PIXEL_ID      NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_TYPESENSE_EMBEDDER   NEXT_PUBLIC_TYPESENSE_EMBEDDING_KEY  (optional AI)
RECO_EMBEDDING_ENDPOINT          RECO_EMBEDDING_KEY                    (optional AI)
```

---

## ✅ Quick checklist — recommended order

| # | Node | Time | Owner |
|---|---|---|---|
| 1 | **P1-SP-08** Deploy to real domain | 30 min | Developer + you |
| 2 | **P1-02** Rotate auth secret in Vercel | 5 min | You |
| 3 | **P3-09** Vercel cron for abandoned carts | 5 min | You |
| 4 | **P1-SP-01/02** Stable webhook URL | 20 min | Developer |
| 5 | **P1-SP-07 + P2-07** Manual QA clicks | 30 min | You |
| 6 | **P3-17/18** Paste pixel + GA4 IDs | 5 min | You |
| 7 | **P1-SP-10** Real branding + catalog | 1–2 days | Client |
| 8 | **P4-17** Real FAQ Q&As | 1 hour | Client |
| 9 | **P1-15** Safepay production approval | days–weeks | You |
| 10 | **P4-09** Pricing + billing gateway | 1 hour | You |
| 11 | Deferred nodes (gateways, image edit, price audit) | when ready | Both |
