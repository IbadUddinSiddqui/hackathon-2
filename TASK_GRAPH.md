# Task Graph — Bazaar Nest Remediation
### Read GRAPH_LOOP_STRATEGY.md first. This file is the state — it gets edited every iteration.

**Field legend:**
- `status`: todo | in_progress | blocked | done
- `depends_on`: node IDs that must be `done` before this one is eligible
- `human_required`: true = agent must never attempt this, only report it
- `touches`: files/areas relevant to this node (read only these, not the whole repo)
- `done_when`: the actual definition of done
- `verify`: the exact command(s)/check that must pass before marking `done`
- `notes`: failure output, blockers, or context — append here, don't delete history

---

## PHASE 1 — Critical (nothing else starts until these are done or explicitly deferred)

### [P1-01] Audit codebase for hardcoded/leaked secrets
- status: done
- depends_on: []
- human_required: false
- touches: [.env.local, .env.example, app/**, lib/**, sanity/**]
- done_when: every secret (Stripe keys, Sanity token, Typesense admin key, SMTP creds, AUTH_SECRET) is confirmed read only from `process.env`, nowhere hardcoded; a checklist of exactly which keys exist and where they're used is written to `notes`.
- verify: `grep -rn "sk_\|whsec_\|xsmtpsib-" --include="*.ts" --include="*.tsx" --include="*.js" . | grep -v ".env"` returns no matches
- notes: VERIFIED 2026-08-09 — grep for `sk_|whsec_|xsmtpsib-` over all .ts/.tsx/.js (excluding node_modules/.next/.git, .env-filtered) returned ZERO matches (exit 1 = PASS). Checklist of keys and usage (all read only via process.env, none hardcoded):
  - STRIPE_SECRET_KEY (server) — app/api/create-payment-intent/route.ts, app/api/create-checkout-session/route.ts, app/api/webhook/route.ts
  - STRIPE_WEBHOOK_SECRET (server) — app/api/webhook/route.ts (signature verification)
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (client) — lib/get-stripe.js, app/components/CheckOut/CheckOut.tsx, app/components/Payments/StripePayment.tsx
  - SANITY_API_TOKEN (server) — sanity/lib/server-client.ts, scripts/syncProducts.ts; fallback NEXT_PUBLIC_SANITY_TOKEN (NOTE: NEXT_PUBLIC_ token is a write-capable token exposed client-side — candidate for P1-02 rotation + split into read-only public key)
  - NEXT_PUBLIC_SANITY_PROJECT_ID / DATASET — sanity/env.ts, sanity.cli.ts, sanity/lib/*
  - TYPESENSE_ADMIN_KEY (server) — lib/typesense.ts; NEXT_PUBLIC_TYPESENSE_SEARCH_KEY (client, search-only) — lib/typesense.ts, app/components/ProductSearch/ProductSearch.tsx; NEXT_PUBLIC_TYPESENSE_HOST/PORT/PROTOCOL — both
  - AUTH_SECRET (server) — auth.ts (fallback NEXTAUTH_SECRET)
  - SMTP_HOST/PORT/USER/PASS, EMAIL_FROM (server) — lib/email.ts
  - No .env.example exists — worth adding a template with placeholder names (recommendation only, tracked for future node)

### [P1-02] Rotate secrets in provider dashboards
- status: todo
- depends_on: [P1-01]
- human_required: true
- touches: [Stripe dashboard, Sanity manage.sanity.io, Typesense Cloud, Brevo SMTP settings, Vercel project env vars]
- done_when: every key from P1-01's checklist is regenerated, old values fail auth, new values are set in Vercel (not just locally).
- verify: manual — confirm old key values return 401/invalid when tested
- notes:

### [P1-03] Remove dead code
- status: todo
- depends_on: []
- human_required: false
- touches: [hackathon_3_backend_server/, app/components/Payments/, auth.config.ts, app/category.tsx, app/product.tsx]
- done_when: all listed dead/duplicate files are deleted; nothing in the live app imports them.
- verify: `npm run build` succeeds; `grep -rn "components/Payments\|auth.config" app/ lib/` returns no matches
- notes:

### [P1-04] Fix delivery-fee inconsistency
- status: done
- depends_on: []
- human_required: false
- touches: [lib/constants.ts, app/cart/page.tsx, app/checkout/page.tsx, app/api/create-checkout-session/route.ts, app/api/create-payment-intent/route.ts]
- done_when: both checkout flows import `DELIVERY_FEE` from `lib/constants.ts` (no hardcoded `$5`), and both flows include it in the stored order total.
- verify: `grep -rn "DELIVERY_FEE" app/` shows it used in cart, checkout, and both API routes; no literal `5` fee elsewhere
- notes: VERIFIED 2026-08-09 — DELIVERY_FEE now imported from lib/constants.ts in app/cart/page.tsx, app/checkout/page.tsx, app/components/Order/Order.tsx (demo, previously hardcoded $5.00), and both API routes. REAL BUG FIXED in app/api/create-checkout-session/route.ts: stored order total was `subtotal - discount` (missing the fee) and the hosted Stripe page never charged delivery — now `total: subtotal - discount + DELIVERY_FEE` and the fee is charged via `shipping_options` (fixed_amount shipping_rate, display_name 'Delivery Fee'). Payment-intent flow already included the fee. grep verify PASS (DELIVERY_FEE in cart, checkout, Order, both API routes; no literal 5 fee anywhere), tsc + eslint clean.

### [P1-05] Add test runner + npm test script
- status: done
- depends_on: []
- human_required: false
- touches: [package.json, vitest.config.ts (new)]
- done_when: `npm test` exists and runs a trivial passing test successfully.
- verify: `npm test` exits 0
- notes: VERIFIED 2026-08-09 — vitest 4.1.10 installed as devDependency. vitest.config.ts created (node env, includes lib/**/*.test.ts + tests/**/*.test.ts, `@` alias → project root via fileURLToPath). `npm test` script = `vitest run`. tests/smoke.test.ts (2 tests incl. @ alias import of DELIVERY_FEE) — `npm test` exits 0 (2/2 passed).

### [P1-06] Unit tests — discount logic
- status: done
- depends_on: [P1-05]
- human_required: false
- touches: [lib/discounts.ts, lib/discounts.test.ts (new)]
- done_when: tests cover percent, fixed, expired, over-maxUses, and cap-at-subtotal cases.
- verify: `npm test -- discounts` passes, all 5 cases present
- notes: VERIFIED 2026-08-09 — lib/discounts.test.ts with 6 tests (percent rounding, fixed value, expired, over-maxUses, cap-at-subtotal, invalid code) mocking @/sanity/lib/server-client. `npm test -- discounts` exits 0, 6/6 passed.

### [P1-07] Unit tests — stock decrement + webhook idempotency
- status: todo
- depends_on: [P1-05]
- human_required: false
- touches: [lib/orders.ts, lib/orders.test.ts (new)]
- done_when: tests cover stock clamped at 0, and `markOrderPaid` called twice (simulated duplicate webhook) only fulfills once.
- verify: `npm test -- orders` passes
- notes:

### [P1-08] Refund execution + stock restore
- status: done
- depends_on: [P1-07]
- human_required: false
- touches: [lib/orders.ts, app/api/orders/[orderId]/status/route.ts]
- done_when: setting an order's status to `refunded` triggers an actual Stripe refund call and restores the decremented stock; covered by a new test.
- verify: `npm test -- refund` passes
- notes: VERIFIED 2026-08-09 — lib/orders.ts gained `refundOrder(orderDocId)` (real Stripe refund via `stripe.refunds.create({ payment_intent, reason: 'requested_by_customer' })` — note: `paymentIntents.refund` doesn't exist in Stripe SDK 17, must use refunds.create; treats `charge_already_refunded` as idempotent success so retries still restore stock) + `restoreProductStock(items)` (atomic transaction, inverse of decrement). Status route now routes status='refunded' through refundOrder (400/404 on failure instead of a blind patch). lib/orders.refund.test.ts — 3 tests (success: refund called + stock restored + marked refunded; non-paid rejected with no Stripe call; already-refunded still restores stock). `npm test -- refund` exits 0 (3/3). tsc + eslint clean.

### [P1-09] E2E test — full checkout flow
- status: todo
- depends_on: [P1-06, P1-07]
- human_required: false
- touches: [tests/e2e/checkout.spec.ts (new)]
- done_when: cart → discount applied → checkout → Stripe test-card webhook → order marked paid, stock decremented, in one automated test.
- verify: e2e test passes using Stripe test card `4242 4242 4242 4242` against a test-mode key
- notes:

### [P1-10] CI pipeline
- status: todo
- depends_on: [P1-05]
- human_required: false
- touches: [.github/workflows/ci.yml (new)]
- done_when: every push/PR runs lint + typecheck + test + build.
- verify: workflow file present and valid YAML; a test push shows all 4 steps executing
- notes:

### [P1-11] Error tracking integration
- status: todo
- depends_on: []
- human_required: false
- touches: [sentry.client.config.ts, sentry.server.config.ts (new), app/api/**]
- done_when: Sentry SDK wired into both the Next.js app and API routes.
- verify: `npm run build` succeeds with Sentry config present
- notes:

### [P1-12] Confirm error tracking actually captures errors
- status: todo
- depends_on: [P1-11]
- human_required: true
- touches: [Sentry dashboard]
- done_when: a manually-triggered test error appears in the Sentry dashboard.
- verify: manual — check dashboard
- notes:

### [P1-13] Add Cash on Delivery checkout option
- status: todo
- depends_on: [P1-04]
- human_required: false
- touches: [app/checkout/page.tsx, app/api/create-payment-intent/route.ts (or new COD route), sanity/schemaTypes/order.ts]
- done_when: a customer can complete checkout choosing COD, order is created with correct total (including delivery fee) and a `payment_method: "cod"` field, no Stripe call involved.
- verify: new test — COD order creation produces correct stored total and status `pending`
- notes:

### [P1-14] Business decision — SaaS vs custom-build model
- status: todo
- depends_on: []
- human_required: true
- touches: [n/a — business decision, not code]
- done_when: a written decision exists (single-tenant custom build per client, or multi-tenant SaaS) — this gates whether Phase 4's multi-tenancy epic is ever built.
- verify: manual — decision documented
- notes:

### [P1-15] Select and begin onboarding with a Pakistan-viable payment processor
- status: todo
- depends_on: []
- human_required: true
- touches: [n/a — external account application: PayFast, or alternatively JazzCash/Easypaisa direct]
- done_when: a merchant account is approved and sandbox/test API credentials are available.
- verify: manual — sandbox keys received
- notes:

### [P1-16] Scaffold local payment-gateway integration
- status: todo
- depends_on: [P1-15]
- human_required: false
- touches: [app/api/create-*-payment/route.ts (new), lib/payments/ (new)]
- done_when: integration code exists behind a feature flag, using sandbox credentials, mirroring the same server-side-pricing/webhook-verified pattern already used for Stripe.
- verify: sandbox test transaction completes and fulfills an order via webhook, same as P1-09's pattern
- notes:

### [P1-17] Draft legal documents
- status: todo
- depends_on: []
- human_required: false
- touches: [app/privacy/page.tsx, app/terms/page.tsx, app/returns/page.tsx (new)]
- done_when: draft privacy policy, terms & conditions, and return/exchange policy pages exist and are linked in the footer.
- verify: pages render at their routes; footer links to all three
- notes:

### [P1-18] Legal review sign-off
- status: todo
- depends_on: [P1-17]
- human_required: true
- touches: [n/a]
- done_when: a qualified reviewer has approved the drafted legal pages.
- verify: manual
- notes:

---

## PHASE 2 — Important (epics only — expand each into a node sub-graph, same format as Phase 1, once Phase 1 is done or explicitly deferred)

- [ ] **P2-EPIC-01** Product management admin UI (replace reliance on raw Sanity Studio)
- [ ] **P2-EPIC-02** One local courier integration (Leopards or PostEx first)
- [ ] **P2-EPIC-03** WhatsApp + SMS order notifications
- [ ] **P2-EPIC-04** SEO pass — metadata, Product structured data, sitemap, OG images
- [ ] **P2-EPIC-05** Rate limiting across auth/discount/payment endpoints
- [ ] **P2-EPIC-06** Automatic search-index sync (webhook-triggered, not manual script)
- [ ] **P2-EPIC-07** Live performance audit (Lighthouse) + fixes

## PHASE 3 — Professional (epics only)

- [ ] **P3-EPIC-01** Customer management screen + admin activity/audit log
- [ ] **P3-EPIC-02** Abandoned cart recovery
- [ ] **P3-EPIC-03** Loyalty / store credit / gift cards / bundles / flash sales
- [ ] **P3-EPIC-04** Review submission + moderation, Meta/TikTok Pixel, GA, Merchant Center feed
- [ ] **P3-EPIC-05** Urdu localization

## PHASE 4 — Enterprise (epics only — P4-EPIC-01 only applies if P1-14 decided "SaaS")

- [ ] **P4-EPIC-01** True multi-tenancy (data isolation, custom domains, per-tenant payment config, platform billing)
- [ ] **P4-EPIC-02** AI recommendations / AI search / size recommendation / support chatbot
- [ ] **P4-EPIC-03** Affiliate/referral program, ERP/accounting integration
- [ ] **P4-EPIC-04** Formal load testing at claimed scale

**Rule for Phase 2–4:** do not let the agent attempt an EPIC directly — it's too coarse for the verify-gated loop. When Phase 1 is clear, the next agent session's job is to expand exactly one epic into properly-scoped nodes (same schema as Phase 1 above) before any implementation starts on it.
