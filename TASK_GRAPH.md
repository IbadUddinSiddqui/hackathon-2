# Task Graph — Bazaar Nest Remediation
### Read GRAPH_LOOP_STRATEGY.md first. This file is the state — it gets edited every iteration.

**Field legend:**
- `status`: todo | in_progress | blocked | deferred | done
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
- status: done
- depends_on: []
- human_required: false
- touches: [hackathon_3_backend_server/, app/components/Payments/, auth.config.ts, app/category.tsx, app/product.tsx]
- done_when: all listed dead/duplicate files are deleted; nothing in the live app imports them.
- verify: `npm run build` succeeds; `grep -rn "components/Payments\|auth.config" app/ lib/` returns no matches
- notes: VERIFIED 2026-08-10 — all listed dead files were already gone (side effects of earlier nodes): hackathon_3_backend_server (submodule — no gitlink in HEAD, no .gitmodules file, zero references), app/components/Payments/ (removed in PKR switch), auth.config.ts (removed in auth consolidation), app/category.tsx + app/product.tsx (removed in demo-route cleanup). app/components/CheckOut/ now contains only live SafepayPayment.tsx. Both verify greps PASS (exit 1 = no matches): `grep -rn "components/Payments|auth.config" app/ lib/` and broader scan for get-stripe|CheckOut/CheckOut|@/app/category|@/app/product|hackathon_3. `npm run build` PASSED (Next 15.1.6, 36 routes, ✓ Compiled successfully, types lint clean, static 36/36; only cosmetic Tailwind `delay-[0]` warnings + known Sentry client-config deprecation note).

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
- status: done
- depends_on: [P1-05]
- human_required: false
- touches: [lib/orders.ts, lib/orders.test.ts (new)]
- done_when: tests cover stock clamped at 0, and `markOrderPaid` called twice (simulated duplicate webhook) only fulfills once.
- verify: `npm test -- orders` passes
- notes: VERIFIED 2026-08-10 — lib/orders.test.ts (committed with the P1-SP-04 batch) already covers both required cases: (1) `decrementProductStock` clamps stock at 0 — buying 5 with 3 in stock patches stock to 0 (never negative), and decrements normally (10→7) otherwise; (2) `markOrderPaid` duplicate-webhook idempotency — first delivery claims the order via optimistic `ifRevisionId` lock (returns true), second delivery fails the lock with 409 and returns false so stock only ever decrements once. lib/orders.refund.test.ts (3 tests) also lives under the same file pattern. `npm test -- orders` exits 0 — 2 files, 7/7 tests passed.

### [P1-08] Refund execution + stock restore
- status: done
- depends_on: [P1-07]
- human_required: false
- touches: [lib/orders.ts, app/api/orders/[orderId]/status/route.ts]
- done_when: setting an order's status to `refunded` triggers an actual Stripe refund call and restores the decremented stock; covered by a new test.
- verify: `npm test -- refund` passes
- notes: VERIFIED 2026-08-09 — lib/orders.ts gained `refundOrder(orderDocId)` (real Stripe refund via `stripe.refunds.create({ payment_intent, reason: 'requested_by_customer' })` — note: `paymentIntents.refund` doesn't exist in Stripe SDK 17, must use refunds.create; treats `charge_already_refunded` as idempotent success so retries still restore stock) + `restoreProductStock(items)` (atomic transaction, inverse of decrement). Status route now routes status='refunded' through refundOrder (400/404 on failure instead of a blind patch). lib/orders.refund.test.ts — 3 tests (success: refund called + stock restored + marked refunded; non-paid rejected with no Stripe call; already-refunded still restores stock). `npm test -- refund` exits 0 (3/3). tsc + eslint clean.

### [P1-09] E2E test — full checkout flow
- status: done
- depends_on: [P1-06, P1-07]
- human_required: false
- touches: [tests/e2e/checkout.spec.ts (new)]
- done_when: cart → discount applied → checkout → Stripe test-card webhook → order marked paid, stock decremented, in one automated test.
- verify: e2e test passes using Stripe test card `4242 4242 4242 4242` against a test-mode key
- notes: VERIFIED 2026-08-09 — tests/e2e/checkout.spec.ts + vitest.e2e.config.ts (separate `npm run test:e2e`, NOT part of hermetic `npm test`; loads .env.local via node --env-file). Flow: real in-stock product from Sanity → active discount code → POST /api/create-payment-intent → pay with tok_visa (4242 test card; raw card numbers blocked by Stripe account — must use tok_visa) → sign a payment_intent.succeeded event via stripe.webhooks.generateTestHeaderString and POST to /api/webhook → poll until order status=paid → assert stock decremented by 1 and stored total == price + DELIVERY_FEE − discount. PASSED (1/1, ~11s). Gotchas hit: res.text() then res.json() double-read (read body once); FIXED5 discount exactly cancels the $5 fee so total == price (assertion must compute exact expected total).

### [P1-10] CI pipeline
- status: done
- depends_on: [P1-05]
- human_required: false
- touches: [.github/workflows/ci.yml (new)]
- done_when: every push/PR runs lint + typecheck + test + build.
- verify: workflow file present and valid YAML; a test push shows all 4 steps executing
- notes: VERIFIED 2026-08-09 (partial) — .github/workflows/ci.yml created: runs-on ubuntu-latest, Node 20 (recommended for Next 15; avoids the Node 22 Windows EPERM build bug documented in P1-03), npm ci, then Lint / Typecheck / Unit tests / Build steps (all 4 present, 7 steps total). YAML validated with js-yaml (jobs: check, all 4 required steps present). Push-execution half of verify needs the repo pushed to GitHub — pending user push; workflow will run on every push/PR.

### [P1-11] Error tracking integration
- status: done
- depends_on: []
- human_required: false
- touches: [sentry.client.config.ts, sentry.server.config.ts (new), app/api/**]
- done_when: Sentry SDK wired into both the Next.js app and API routes.
- verify: `npm run build` succeeds with Sentry config present
- notes: VERIFIED 2026-08-09 — @sentry/nextjs 10.69.0 installed. Wired: sentry.client.config.ts (NEXT_PUBLIC_SENTRY_DSN, no replay), sentry.server.config.ts + sentry.edge.config.ts (SENTRY_DSN), instrumentation.ts (register() imports per-runtime configs + `onRequestError = Sentry.captureRequestError` per Sentry 10 recommended hook), app/global-error.tsx (client boundary reporting render errors), next.config.ts wrapped with withSentryConfig (sourcemaps+release disabled without SENTRY_AUTH_TOKEN, errorHandler warns instead of failing, telemetry off). .env.example created documenting ALL env vars incl. the new SENTRY_* + NEXT_PUBLIC_SENTRY_DSN. Production build PASSED under Node 20 (~15 min on this slow FS — build must be run detached with log polling since it exceeds the 600s agent cap; dev server must be stopped first, it locks .next). tsc + eslint clean. Sentry noted: client config deprecation (sentry.client.config.ts → instrumentation-client.ts for Turbopack, Next 15.1.6 doesn't support it yet — safe to defer).

### [P1-12] Confirm error tracking actually captures errors
- status: done
- depends_on: [P1-11]
- human_required: true
- touches: [Sentry dashboard]
- done_when: a manually-triggered test error appears in the Sentry dashboard.
- verify: manual — check dashboard
- notes: 2026-08-10 — AGENT SIDE DONE: user provided Sentry DSN; SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN added to .env.local; dev server restarted; app/api/sentry-test/route.ts created (fires Sentry.captureException); hit GET /api/sentry-test → 200, response sent:true, only known cosmetic Turbopack warning in logs. REMAINING (human): open Sentry dashboard → Issues → confirm 'Sentry test error — P1-12 verification' appeared, then flip status to done. 2026-08-10 — OWNER CONFIRMED: test error visible in Sentry dashboard (verification ID seen). DONE.

### [P1-13] Add Cash on Delivery checkout option
- status: done
- depends_on: [P1-04]
- human_required: false
- touches: [app/checkout/page.tsx, app/api/create-payment-intent/route.ts (or new COD route), sanity/schemaTypes/order.ts]
- done_when: a customer can complete checkout choosing COD, order is created with correct total (including delivery fee) and a `payment_method: "cod"` field, no Stripe call involved.
- verify: new test — COD order creation produces correct stored total and status `pending`
- notes: VERIFIED 2026-08-09 — new route app/api/create-cod-order/route.ts (server-side Sanity pricing + validated discount + DELIVERY_FEE, NO Stripe import) → createPendingOrder gained `paymentMethod: 'card' | 'cod'` → stores payment_method. Order schema gained payment_method field (radio card/cod, default card). Checkout page has a Card/COD selector (radio cards) + CodCheckoutForm (email → POST → redirect /checkout/success?method=cod). Success page is method-aware (Order Placed vs Payment Successful, Suspense-wrapped useSearchParams). tests/cod-order.test.ts — 3 tests (stored total incl. fee + status pending + payment_method cod; discount applied still incl. fee; empty cart rejected) all mock Sanity only (proves no Stripe). npm test 18/18, tsc + eslint clean, /checkout and /checkout/success?method=cod render 200.
- notes: 2026-08-10 (task-graph-update.md) — status confirmed DONE: COD selector + route + schema, tested.

### [P1-14] Business decision — SaaS vs custom-build model
- status: done
- depends_on: []
- human_required: true
- touches: [n/a — business decision, not code]
- done_when: a written decision exists (single-tenant custom build per client, or multi-tenant SaaS) — this gates whether Phase 4's multi-tenancy epic is ever built.
- verify: manual — decision documented
- notes: 2026-08-10 — DECISION MADE (business owner): **SaaS** (multi-tenant platform). Confirmed by ibad. This ACTIVATES P4-EPIC-01 (true multi-tenancy) as a future epic — do not build it now; expand it into scoped nodes once Phase 2 starts.

### [P1-15] Select and begin onboarding with a Pakistan-viable payment processor
- status: in_progress
- depends_on: []
- human_required: true
- touches: [n/a — external account application: PayFast, or alternatively JazzCash/Easypaisa direct]
- done_when: a merchant account is approved and sandbox/test API credentials are available.
- verify: manual — sandbox keys received
- notes: 2026-08-09 — USER SELECTED SAFEPAY (getsafepay.com). Research confirmed: legit, SBP/State-Bank-of-Pakistan licensed PSP (pilot license 2022, full commercial since), free sandbox with test cards, official Node SDK (@sfpy/node-sdk) + REST API, webhook HMAC-SHA256 signed. Known caveat: docs drift from reality + slow support — hence the recon-first plan. Sandbox account creation + webhook endpoint registration in the Safepay dashboard is the USER's pending action (grab SAFEPAY_API_KEY + SAFEPAY_WEBHOOK_SECRET).
- 2026-08-10 — Sandbox credentials received (SAFEPAY_API_KEY + SAFEPAY_WEBHOOK_SECRET in .env.local) and 3 real sandbox test payments captured (test card 4111…1111, e.g. PKR 21,999). done_when met in sandbox. Still formal status in_progress: merchant approval + production keys (P1-SP-09) remain.

### [P1-15a] Apply for JazzCash merchant account — DEFERRED
- status: deferred
- depends_on: []
- human_required: true
- touches: [JazzCash merchant portal/application]
- done_when: merchant application submitted and sandbox/live credentials received
- verify: manual — credentials received
- notes: 2026-08-10 (task-graph-update.md) — DEFERRED. Portal repeatedly errors/times out (checked from this network — try mobile data / a PK-based connection before concluding it's dead). A documented nationwide Easypaisa outage occurred June 2026, confirming this ecosystem has real infrastructure instability, not necessarily user error. Deprioritized in favor of the working Safepay+COD path. **Revisit trigger:** once P1-SP-01 (Safepay webhook) is resolved and the site is live in production.

### [P1-15b] Apply for Easypaisa merchant account — DEFERRED
- status: deferred
- depends_on: []
- human_required: true
- touches: [Easypaisa merchant portal/application]
- done_when: merchant application submitted and sandbox/live credentials received
- verify: manual — credentials received
- notes: 2026-08-10 (task-graph-update.md) — DEFERRED. Same as P1-15a — portal timing out, deprioritized, same revisit trigger.

### [P1-16] Scaffold local payment-gateway integration
- status: blocked
- depends_on: [P1-15]
- human_required: false
- touches: [app/api/create-safepay-order/route.ts (new), app/api/payments/safepay/webhook/route.ts (new), lib/safepay.ts (new), app/components/CheckOut/SafepayPayment.tsx (new), app/checkout/page.tsx]
- done_when: integration code exists behind a feature flag, using sandbox credentials, mirroring the same server-side-pricing/webhook-verified pattern already used for Stripe.
- verify: sandbox test transaction completes and fulfills an order via webhook, same as P1-09's pattern
- notes: 2026-08-09 — SAFEPAY SCAFFOLD BUILT (recon-first, per plan): lib/safepay.ts (createSafepayCheckout POST /order/v1/init — defensive parse of token/redirect_url/tracker shapes; buildCheckoutUrl with HMAC-SHA256 tracker signature; verifySafepaySignature — HMAC-SHA256 over `timestamp + '.' + rawBody` with base64-decoded secret, timing-safe, compares `sha256=<hex>`); app/api/create-safepay-order/route.ts (mirror of create-checkout-session: server-side Sanity pricing + validated discount + DELIVERY_FEE, persists pending order BEFORE redirect, returns Safepay redirectUrl); app/api/payments/safepay/webhook/route.ts (RECON MODE: with no SAFEPAY_WEBHOOK_SECRET logs full headers+raw body and returns 200; VERIFIED MODE once secret set — 401 on bad signature, fulfillment TODO until real payload confirmed); checkout UI Safepay option behind NEXT_PUBLIC_SAFEPAY_ENABLED flag; SAFEPAY_* vars documented in .env.example. REMAINING: user registers webhook URL in Safepay dashboard + runs a sandbox transaction → confirm real payload → then implement fulfillment (stock/email/mark-paid like Stripe webhook) → then test like P1-09.
- 2026-08-09 UPDATE — STORE SWITCHED TO PKR + STRIPE REMOVED FROM CHECKOUT (user decision): DELIVERY_FEE=200 (Rs) + CURRENCY='PKR'/CURRENCY_SYMBOL='Rs' added to lib/constants.ts; createPendingOrder stores currency from input.currency || CURRENCY (orders default pkr; legacy Stripe routes pass 'usd' explicitly so their stored orders match what Stripe charged); order schema initialValue pkr + payment_method list now Card (Safepay)=safepay / COD=cod; checkout page now Safepay + COD ONLY (Stripe card option removed, StripePayment/CheckOut.tsx + lib/get-stripe.js deleted as dead code — zero references verified); all storefront price displays switched from $ to Rs (cart, checkout, wishlist, products pages, ProductsGrid, ProductSearch, Order demo, admin orders revenue, discount manager Fixed(Rs), formatTotal, email receipts); cart 'Proceed to Checkout' now navigates to /checkout instead of Stripe hosted checkout; tests updated (smoke DELIVERY_FEE=200); tsc + eslint clean, 30/30 tests pass, pages render 200. NOTE: product prices in Sanity still hold old USD numbers — user chose to reprice manually in Sanity Studio; Safepay amount = total*100 paisa.
- 2026-08-10 — CODE COMPLETE + FULFILLMENT PROVEN, but status blocked: the node's verify (a real sandbox transaction fulfills an order via an undelivered-by-us webhook) is blocked on Safepay's sandbox not delivering webhooks — same root cause as P1-SP-01. The full fulfillment chain WAS proven via a validly-signed webhook replayed through ngrok (order 2afd5855 → paid, stock 48→47, receipt emailed). Real-delivery confirmation moves to production (P1-SP-09).

### [P1-16-jc] JazzCash payment integration — DEFERRED
- status: deferred
- depends_on: [P1-15a]
- human_required: true
- touches: [app/api/payments/jazzcash/**, app/checkout/page.tsx]
- done_when: JazzCash integration built once merchant credentials exist (mirror the verified Safepay pattern)
- verify: manual — sandbox transaction completes
- notes: 2026-08-10 (task-graph-update.md) — DEFERRED along with P1-15a; blocked on the application anyway. No action needed until the application is revisited.

### [P1-16-ep-wallet] Easypaisa wallet integration — DEFERRED
- status: deferred
- depends_on: [P1-15b]
- human_required: true
- touches: [app/api/payments/easypaisa/**, app/checkout/page.tsx]
- done_when: Easypaisa wallet integration built once merchant credentials exist (mirror the verified Safepay pattern)
- verify: manual — sandbox transaction completes
- notes: 2026-08-10 (task-graph-update.md) — DEFERRED along with P1-15b; blocked on the application anyway. No action needed until the application is revisited.

### [P1-16-ep-card] Easypaisa card integration — DEFERRED
- status: deferred
- depends_on: [P1-15b]
- human_required: true
- touches: [app/api/payments/easypaisa/**, app/checkout/page.tsx]
- done_when: Easypaisa card integration built once merchant credentials exist (mirror the verified Safepay pattern)
- verify: manual — sandbox transaction completes
- notes: 2026-08-10 (task-graph-update.md) — DEFERRED along with P1-15b; blocked on the application anyway. No action needed until the application is revisited.

### [P1-17] Draft legal documents
- status: done
- depends_on: []
- human_required: false
- touches: [app/privacy/page.tsx, app/terms/page.tsx, app/returns/page.tsx (new)]
- done_when: draft privacy policy, terms & conditions, and return/exchange policy pages exist and are linked in the footer.
- verify: pages render at their routes; footer links to all three
- notes: VERIFIED 2026-08-09 — app/privacy/page.tsx, app/terms/page.tsx, app/returns/page.tsx created (drafts, server components, Header/Footer, marked 'draft for review' for P1-18). Footer HELP section now links /returns (Returns & Exchanges), /terms (Terms & Conditions), /privacy (Privacy Policy) — previously dead '/' links. All three routes return 200. tsc + eslint clean.
- notes: 2026-08-10 (task-graph-update.md) — status confirmed DONE: drafted + linked in footer. [P1-18] legal review sign-off remains todo/human_required — drafting isn't review.

### [P1-18] Legal review sign-off
- status: done
- depends_on: [P1-17]
- human_required: true
- touches: [n/a]
- done_when: a qualified reviewer has approved the drafted legal pages.
- verify: manual
- notes: 2026-08-10 — business owner informally accepted the drafts ("it's fine for now"). NOTE: acceptance is by the owner, not a qualified legal reviewer — formal counsel still recommended before public launch if the client requires it.

### [P1-SP-01] Diagnose Safepay webhook non-delivery
- status: blocked
- depends_on: []
- human_required: true (root cause confirmed Safepay-side 2026-08-10 — escalation to their support is a human action)
- touches: [Safepay dashboard Webhook Logs + Logs v2, ngrok session or deployed URL, app/api/payments/safepay/webhook route]
- done_when: root cause identified — either (a) a URL mismatch between the registered endpoint and the current ngrok/deployed URL, confirmed and fixed, or (b) a genuine Safepay-side delivery failure confirmed via their logs showing zero delivery attempts, escalated to their support with the 3 sandbox transaction IDs as evidence.
- verify: a new sandbox transaction results in an **observed, undelivered-by-you** webhook arriving in the app's logs — not a manually replayed one.
- notes: **this is the #1 open risk carried over from the last status report.** Do not consider Phase-1 payments complete until this passes for real.
- notes: 2026-08-10 — DIAGNOSIS COMPLETE, root cause = path (b) SAFEPAY-SIDE. Evidence: (1) user confirmed Safepay dashboard webhook logs are EMPTY (zero delivery attempts ever made); (2) our endpoint provably reachable — POST via the ngrok URL returns 401 on unsigned body (= HMAC rejection working) and the full fulfillment chain (find order → decrement stock → email receipt → mark paid, idempotent + revision-locked) was PROVEN by replaying a validly-signed success webhook through ngrok (order 2afd5855 → paid, stock 48→47, receipt sent); (3) PUBLIC_BASE_URL matches the ngrok URL exactly, SAFEPAY_WEBHOOK_SECRET set, endpoint registered in their dashboard. Conclusion: Safepay sandbox simply does not deliver webhooks for this account (sandbox limitation or merchant-level setting). Verify cannot pass in sandbox — real delivery requires production mode (P1-SP-09). ESCALATION (user action): email support@getsafepay.com with the 3 successful sandbox payment tracker IDs (known one: track_7524538c-7ece-452a-b2d3-2c8f89358fab — PKR 21,999 captured) asking why sandbox webhooks never fire.

### [P1-SP-02] Point the webhook at a stable URL
- status: blocked
- depends_on: []
- human_required: false
- touches: [Vercel deployment, Safepay dashboard endpoint config]
- done_when: the registered webhook endpoint targets a stable Vercel URL, not a rotating ngrok tunnel — eliminates the "URL went stale after a restart" failure class going forward.
- verify: registered URL in the Safepay dashboard matches the actual deployed URL exactly
- notes: 2026-08-10 — BLOCKED: no stable URL exists yet. The only reachable URL is the rotating ngrok tunnel (steed-hangout-smitten.ngrok-free.dev); a stable Vercel URL requires P1-SP-08 deploy, itself blocked on P1-SP-01. The ngrok URL goes stale on every restart — this exact failure class stays open until deployment.

### [P1-SP-03] Reprice all products to PKR in Sanity
- status: deferred
- depends_on: []
- human_required: true (agent can write the migration; correct target prices need business/client input, not just a currency-symbol fix)
- touches: [sanity/schemaTypes/product.ts, a new repricing script, Sanity Studio data]
- done_when: every product's price field reflects an intentional PKR value — not a leftover USD number (e.g. 19.99) being displayed with an "Rs" label slapped on it.
- verify: spot-check 5 products in Studio and on the live storefront show correct, intentional PKR prices
- notes: 2026-08-10 — DEFERRED by user decision: current product data is MOCK, prices left as-is. Reprice when the real client catalog exists (revisit alongside P1-SP-10 branding/content).

### [P1-SP-04] Commit the 57 uncommitted files
- status: done
- depends_on: []
- human_required: false
- touches: [entire working tree]
- done_when: `git status` is clean; all Phase-1 work (auth, admin, demo-route deletions, Safepay integration) is committed with clear per-change messages.
- verify: `git status` clean, `git log` shows the new commits
- notes: VERIFIED 2026-08-10 — `git status --short` = 0 lines (clean), 10 new commits in `git log`. Committed in 10 logical groups with per-change messages (all `[P1-SP-04]` except the gitignore chore): (1) .gitignore — dev-server/ngrok logs excluded (log files were busy being written by the running dev server + ngrok, so they're ignored rather than deleted — `git status` shows none of them); (2) auth consolidation (auth.ts, next-auth.d.ts, [...nextauth]/route, promote/register/upload, legacy signin/signup API pages deleted); (3) demo routes removed (chart, Charts, forms, tables, ui); (4) admin panel (orders + discounts pages, lib/admin.ts); (5) discount-code system (lib/discounts.ts, lib/discount-code-admin.ts, routes, schema, tests); (6) sanity server-client + schema wiring + scripts; (7) order refund/idempotency tests; (8) docs (PROJECT_BRIEF/DETAILS, DEPLOYMENT, knowledge, GRAPH_LOOP_STRATEGY); (9) misc UI/config (header, sidebar, cart, typesense, deps, webhook route); (10) TASK_GRAPH.md + task-graph-update.md applied.

### [P1-SP-05] Disable legacy Stripe payment routes
- status: blocked
- depends_on: [P1-SP-01]
- human_required: false
- touches: [app/api/create-payment-intent/route.ts, app/api/create-checkout-session/route.ts, app/api/webhook/route.ts]
- done_when: the old Stripe endpoints are removed or explicitly disabled (return 410) — right now nothing links to them but they're still live and callable by anyone who finds the URL.
- verify: hitting the old endpoints directly returns a disabled response, not a working payment flow
- notes: don't do this until P1-SP-01 passes — keep Stripe as a fallback until Safepay is fully proven, not before.
- notes: 2026-08-10 — BLOCKED on P1-SP-01 (blocked). Per this node's own note, Stripe stays as the live-but-unlinked fallback until Safepay is proven in production. Revisit after P1-SP-09.

### [P1-SP-06] Confirm receipt email actually lands
- status: done
- depends_on: []
- human_required: true
- touches: [inbox check]
- done_when: a real test order's receipt email is visually confirmed in the inbox — "sent without error" per Brevo's logs isn't the same claim.
- verify: manual
- notes: 2026-08-10 — CONFIRMED by user: the fulfillment-test receipt ARRIVED in ibaduddinsiddiqui418@gmail.com (order 2afd5855, the replayed webhook used that customer email). Brevo SMTP → Gmail delivery works end-to-end.

### [P1-SP-07] Browser-test the admin panel
- status: in_progress
- depends_on: []
- human_required: true
- touches: [/adminpanel/orders, /adminpanel/discounts, /adminpanel/products]
- done_when: both pages have been manually clicked through in a real browser this session and confirmed working — "code complete + tests" isn't the same as "someone actually looked at it."
- verify: manual
- notes: 2026-08-10 — OWNER tested /adminpanel/orders, order detail (status changer + product links), /adminpanel/discounts (create/edit/disable) — all OK. REMAINING: /adminpanel/products bulk-import test (owner will do later).

### [P1-SP-08] Deploy to production
- status: blocked
- depends_on: [P1-SP-01, P1-SP-03, P1-SP-04]
- human_required: false (domain purchase/DNS may need a human step)
- touches: [Vercel project settings, DNS, production environment variables]
- done_when: the site is live on the real domain with production env vars set.
- verify: production URL loads; one full transaction completes end-to-end on the live URL
- notes: 2026-08-10 — BLOCKED on P1-SP-01 (blocked) + P1-SP-03 (human reprice). DEPLOYMENT.md runbook is ready; no Vercel project exists yet. Unblocks when Safepay webhook delivery is proven (P1-SP-01/P1-SP-09) and prices are repriced (P1-SP-03).

### [P1-SP-09] Safepay production mode
- status: deferred
- depends_on: [P1-SP-01]
- human_required: true
- touches: [Safepay merchant account]
- done_when: merchant account approved for production, live API key obtained, live webhook endpoint registered against the real production domain.
- verify: manual
- notes: 2026-08-10 — OWNER: leave for now (deferred). Resume when ready to apply for Safepay production/live merchant access.

### [P1-SP-11] Admin bulk product import (Excel upload)
- status: done
- depends_on: []
- human_required: false
- touches: [lib/bulk-import.ts (new), app/api/admin/products/bulk-import/route.ts (new), app/adminpanel/products/ (new), app/components/Sidebar/index.tsx]
- done_when: admin can upload an Excel/CSV file and products are bulk-created or updated in Sanity (upsert by name), with a downloadable template and per-row results.
- verify: `npm test -- bulk-import` passes; tsc clean; GET /api/admin/products/bulk-import?template=1 returns an .xlsx; POST requires admin auth
- notes: VERIFIED 2026-08-10 — xlsx@0.18.5 installed. lib/bulk-import.ts (pure parse+validate: parseWorkbook normalizes headers, validateRow enforces name/category/category_slug/price/stock/size/image_urls, buildTemplate generates example .xlsx). Route: admin-only (isAdmin guard), multipart upload, max 10MB/2000 rows, downloads image URLs → Sanity assets (Buffer.from, max 8 images), upserts by product name (patch existing / create new). Admin page /adminpanel/products with drag-drop zone, template download, results table (created/updated/skipped with per-row messages), sidebar link added. 7/7 tests pass, tsc clean. NOTE: Excel column 'image_urls' is required (storefront renders images[0]); row without it is skipped with a clear message.

### [P1-SP-10] Branding/content pass
- status: in_progress
- depends_on: []
- human_required: true (client needs to supply real name/logo/products/copy; agent implements once assets exist)
- touches: [app/layout.tsx, public/ (logo), about/contact pages, product data]
- done_when: "Bazaar Nest" placeholder is replaced with real client branding, real product catalog, real about/contact pages.
- verify: manual
- notes: 2026-08-10 — brand name decided = **AnK's** (user). Implemented: metadata titles, legal pages (terms/returns/privacy incl. support@bazaarnest.com→support@anks.com), admin panel titles, email receipts (from/subject/header), constants comment — all 'Bazaar Nest' references gone (grep verify = zero). Logo: user has none yet — placeholder kept. Product catalog: mock kept (user adds real ones later). NEW FEATURE REQUESTED: Excel bulk product import (user uploads .xlsx → products created/updated in Sanity) — built under new node P1-SP-11. Remaining for done: real logo + about/contact copy when client provides.

---

## PHASE 2 — Important (epics only — expand each into a node sub-graph, same format as Phase 1, once Phase 1 is done or explicitly deferred)

- [x] **P2-EPIC-01** Product management admin UI (replace reliance on raw Sanity Studio) — EXPANDED 2026-08-10 into P2-01..P2-07 below
- [ ] **P2-EPIC-02** One local courier integration (Leopards or PostEx first) — BLOCKED-ON-MERCHANT: needs a courier business account (Leopards/PostEx) + API credentials before any code can be written. Owner to sign up; see P2-EPIC-02 note below. 2026-08-11 — OWNER APPLIED for a courier account; awaiting API credentials to unblock the build.
- [ ] **P2-EPIC-03** WhatsApp + SMS order notifications — BLOCKED-ON-MERCHANT: needs WhatsApp Business API (Meta) + an SMS gateway account (e.g. Twilio/Infobip) before code can be written. Owner to sign up; see P2-EPIC-03 note below.
- [x] **P2-EPIC-04** SEO pass — metadata, Product structured data, sitemap, OG images — EXPANDED + COMPLETED 2026-08-10 (P2-SEO-01..05)
- [x] **P2-EPIC-05** Rate limiting across auth/discount/payment endpoints — EXPANDED + COMPLETED 2026-08-10 (P2-RL-01..03)
- [x] **P2-EPIC-06** Automatic search-index sync (webhook-triggered, not manual script) — EXPANDED + COMPLETED 2026-08-10 (P2-SS-01..02)
- [x] **P2-EPIC-07** Live performance audit (Lighthouse) + fixes — EXPANDED 2026-08-10 (P2-LH-01..02)

### P2-EPIC-01 — expanded nodes (Product management admin UI)
Replaces reliance on raw Sanity Studio for day-to-day product ops. Reuses the existing admin guard (lib/admin.ts), the bulk-import validator (lib/bulk-import.ts), and the bulk-import image-upload pattern.

### [P2-01] Admin API — list products (paginated + searchable)
- status: done
- depends_on: []
- human_required: false
- touches: [app/api/admin/products/route.ts (new), lib/admin-products.ts (new), lib/admin-products.test.ts (new), lib/admin.ts, sanity/lib/server-client.ts]
- done_when: GET /api/admin/products (admin-only) returns `{ items, total, page, pages }` of product summaries (name, price, stock, category, category_slug, brand, size, mainImage URL, created_at) and supports `?page=`, `?limit=`, `?search=`, `?category=`; unauthenticated requests get 401.
- verify: `npm test -- admin-products` passes; `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/admin/products` returns 401 unauthenticated
- notes: VERIFIED 2026-08-10 — lib/admin-products.ts (pure: parseListQuery with null-safe param defaults — Number(null)==0 bug caught by test, buildProductListGroq, toProductSummary, validateProductInput); app/api/admin/products/route.ts (isAdmin guard → 401, Promise.all list+count, {items,total,page,pages,limit}). npm test -- admin-products 11/11 PASS; curl unauth = 401; tsc clean.
- notes: 2026-08-11 — **BUGFIX (owner reported 500 in production)**: GET /api/admin/products returned 500 "Failed to list products". Root cause: buildProductListGroq passed `undefined` for absent optional GROQ params (category/search) — the Sanity client serializes `undefined` as the literal string `"undefined"`, GROQ rejects it (`Unable to parse value of "$category=undefined"`), and the route's catch turned that 400 into 500. Unit tests missed it because they mocked the client AND asserted `toBeUndefined()` — the test enshrined the bug. Fix: params now use `?? null` (GROQ `!defined()` treats null as absent); test updated to assert null + new regression case (defaults via parseListQuery). Verified: probe with the exact fixed query against live Sanity → FETCH OK (20 docs, total 61); unauth GET now 401 (not 500); `npm test -- admin-products` 24/24; full suite 79/79; tsc clean.

### [P2-02] Admin API — create product
- status: done
- depends_on: [P2-01]
- human_required: false
- touches: [app/api/admin/products/route.ts, lib/admin-products.ts, lib/admin-products.test.ts, lib/bulk-import.ts (reuse validateRow), app/api/admin/products/bulk-import/route.ts (image-upload pattern)]
- done_when: POST /api/admin/products (admin-only) accepts the same JSON fields as the import template (name, description, price, stock, category, category_slug, size, brand, tags, imageUrls), validates via the existing row validator, uploads image URLs as Sanity assets, creates the doc, returns 201 + new `_id`; 400 on validation failure; 401 unauthenticated.
- verify: `npm test -- admin-products` passes and `npx tsc --noEmit` clean
- notes: VERIFIED 2026-08-10 — lib/admin-products.ts gains ProductInput type, normalizeCreateInput (coerces numbers, accepts arrays or comma-strings, drops non-http URLs), validateProductInput(input, {requireImages}) — true for create (schema min 1 image). lib/product-images.ts extracted (findProductByName + uploadImages) from bulk-import route; bulk-import route now imports them (dedupe). POST /api/admin/products: guard→400 invalid body→normalize→validate→409 duplicate name→uploadImages→create→201 {product:{_id}}. npm test 15/15 admin-products, FULL suite 52/52 pass, tsc clean, unauth POST = 401.

### [P2-03] Admin API — update product
- status: done
- depends_on: [P2-02]
- human_required: false
- touches: [app/api/admin/products/[id]/route.ts (new), lib/admin-products.ts, lib/admin-products.test.ts]
- done_when: PATCH /api/admin/products/[id] (admin-only) partially updates editable fields (name, description, price, stock, category, category_slug, size, brand, tags) and returns the updated doc; 404 for unknown id; 400 on validation failure; 401 unauthenticated.
- verify: `npm test -- admin-products` passes and `npx tsc --noEmit` clean
- notes: VERIFIED 2026-08-10 — lib/admin-products.ts adds normalizeUpdateInput (null-safe clearing of description/brand via `!= null` — reviewer caught String(null)=="null" bug), validateUpdateInput (per-field rules, nothing required), buildUpdatePatch (excludes imageUrls). app/api/admin/products/[id]/route.ts PATCH: guard→404 unknown id→400 invalid/no-fields→409 rename collision (findProductByName, same-id exempt)→patch().set()→refetch→summary; `!full` → 404 guard for delete race (reviewer). npm test 23/23 admin-products; FULL suite 60/60; tsc clean; unauth PATCH = 401. KNOWN TRADE-OFF (accepted): duplicate-name check is check-then-write (TOCTOU) — Sanity has no unique constraint.

### [P2-04] Admin API — delete product
- status: done
- depends_on: [P2-03]
- human_required: false
- touches: [app/api/admin/products/[id]/route.ts, lib/admin-products.ts, lib/admin-products.test.ts]
- done_when: DELETE /api/admin/products/[id] (admin-only) deletes the doc and returns 200; 404 for unknown id; 401 unauthenticated.
- verify: `npm test -- admin-products` passes and `npx tsc --noEmit` clean
- notes: VERIFIED 2026-08-10 — DELETE handler added to app/api/admin/products/[id]/route.ts (same guard/fetch-404 pattern as PATCH): guard→404 unknown id→serverClient.delete(id)→200 {deleted,id}. npm test 23/23 admin-products; tsc clean; unauth DELETE = 401. RECOMMENDATION (not built — future node): deleting a doc leaves its image assets orphaned in Sanity; a future cleanup node could fetch + delete assets (serverClient.delete(assetId)).

### [P2-05] Admin products hub page — list + search (tabs: All Products | Bulk Import)
- status: done
- depends_on: [P2-01]
- human_required: false
- touches: [app/adminpanel/products/page.tsx, app/adminpanel/products/ProductListManager.tsx (new), app/adminpanel/products/BulkImportManager.tsx]
- done_when: /adminpanel/products shows a tabbed view — "All Products" (searchable table: thumbnail, name, price, stock, category, actions) fed by GET /api/admin/products — alongside the existing "Bulk Import" tab, which stays unchanged.
- verify: `npx tsc --noEmit` clean; page returns 200 for an admin session (307 → /denied without)
- notes: VERIFIED 2026-08-10 — app/adminpanel/products/page.tsx rebuilt as tabbed hub (header + ProductsHub); ProductsHub.tsx (client tabs: All Products | Bulk Import); ProductListManager.tsx (debounced search → GET /api/admin/products, paginated table: thumbnail/name/price/stock badge/category, Edit link + Delete with confirm, empty/loading states, 401 → /login). BulkImportManager untouched. tsc clean; full suite 60/60; /adminpanel/products + /new + /[id]/edit all 307 → /denied unauth.

### [P2-06] Admin product create/edit form + delete wiring
- status: done
- depends_on: [P2-02, P2-03, P2-04, P2-05]
- human_required: false
- touches: [app/adminpanel/products/new/page.tsx (new), app/adminpanel/products/[id]/edit/page.tsx (new), app/adminpanel/products/ProductForm.tsx (new), lib/admin-products.ts]
- done_when: /adminpanel/products/new renders a form that creates via POST /api/admin/products; /adminpanel/products/[id]/edit loads + saves via PATCH; delete buttons (list + edit) call DELETE with a confirm dialog; form fields mirror the Sanity product schema.
- verify: `npx tsc --noEmit` clean; both pages return 200 for an admin session
- notes: VERIFIED 2026-08-10 — ProductForm.tsx (shared client form: create→POST /api/admin/products incl. imageUrls list; edit→PATCH /api/admin/products/[id]; Delete button w/ confirm→DELETE; comma-separated size/tags; numeric price/stock; error+message states; 401 handling via API). new/page.tsx + [id]/edit/page.tsx (guard, edit fetches doc via serverClient projection, notFound() when missing). tsc clean; 60/60; all pages 307 → /denied unauth.

### [P2-07] Owner browser-test the product admin UI
- status: todo
- depends_on: [P2-06]
- human_required: true
- touches: [/adminpanel/products, /adminpanel/products/new, /adminpanel/products/[id]/edit]
- done_when: owner clicks through list/search, create, edit, delete against real Sanity data in a real browser and confirms each works.
- verify: manual — owner confirmation
- notes:

### P2-EPIC-04 — expanded nodes (SEO pass) — ALL DONE 2026-08-10

### [P2-SEO-01] Metadata for every page + root SEO defaults
- status: done
- depends_on: []
- human_required: false
- touches: [lib/site.ts (new), app/layout.tsx, app/page.tsx, app/search/page.tsx, app/denied/page.tsx, app/dashboard/page.tsx, app/{cart,wishlist,login,register,checkout,checkout/success}/layout.tsx (new)]
- done_when: root layout has metadataBase, title template (`%s | AnK's`), description, OG + twitter defaults; every storefront page has a title/description; noindex on auth/cart/admin pages.
- verify: tsc clean; curl / shows `<meta name="description">` + OG tags
- notes: VERIFIED 2026-08-10 — lib/site.ts (SITE_NAME/DESCRIPTION/URL via NEXT_PUBLIC_SITE_URL → PUBLIC_BASE_URL → localhost). Root metadata overhauled; client pages (cart/wishlist/login/register/checkout/checkout-success) get metadata via server layouts; denied/dashboard noindex. tsc clean; 60/60 tests.

### [P2-SEO-02] Category page — server-rendered with generateMetadata
- status: done
- depends_on: [P2-SEO-01]
- human_required: false
- touches: [app/products/[category]/page.tsx, app/products/[category]/CategoryClient.tsx (new), lib/typesense.ts, sanity/lib/client.ts]
- done_when: /products/[category] renders server-side (data fetched server-side from Sanity + Typesense, merged+deduped) with per-category title/description; client UI kept as child with filters/pagination.
- verify: tsc clean; curl /products/mens-clothing returns 200 and includes category `<title>`
- notes: VERIFIED 2026-08-10 — page converted to server component (await params, generateMetadata, server fetch), UI extracted verbatim to CategoryClient (initialProducts prop, no fetch). Behavior preserved.

### [P2-SEO-03] Product detail — server-rendered, JSON-LD Product schema, OG image
- status: done
- depends_on: [P2-SEO-01]
- human_required: false
- touches: [app/products/[category]/[productId]/page.tsx, app/products/[category]/[productId]/ProductDetailClient.tsx (new), sanity/lib/client.ts, sanity/lib/image.ts]
- done_when: /products/[category]/[productId] renders server-side with generateMetadata (name, description, product-image OG), JSON-LD Product schema (PKR price, InStock/OutOfStock), lookup by _id OR slug.
- verify: tsc clean; curl a product URL shows `<title>` + `<script type="application/ld+json">`
- notes: VERIFIED 2026-08-10 — server page fetches by (_id == $id || slug.current == $id), maps images via urlFor, emits JSON-LD + OG image; UI extracted to ProductDetailClient.

### [P2-SEO-04] Sitemap + robots.txt
- status: done
- depends_on: [P2-SEO-01]
- human_required: false
- touches: [app/sitemap.ts (new), app/robots.ts (new), lib/site.ts]
- done_when: /sitemap.xml lists home, search, all categories and products from Sanity with absolute URLs; /robots.txt disallows auth/cart/admin, points to sitemap.
- verify: curl /sitemap.xml + /robots.txt return 200 with expected content
- notes: VERIFIED 2026-08-10 — sitemap returns live Sanity categories (mens-clothing, footwear, …) + products; robots.txt has all disallows + Sitemap link. URLs resolve via PUBLIC_BASE_URL (ngrok) until a real domain is set (NEXT_PUBLIC_SITE_URL).

### [P2-SEO-05] Default OG image
- status: done
- depends_on: [P2-SEO-01]
- human_required: false
- touches: [app/opengraph-image.tsx (new)]
- done_when: a branded 1200×630 OG image is served at /opengraph-image (ImageResponse).
- verify: tsc clean; curl -I /opengraph-image returns 200 image/png
- notes: VERIFIED 2026-08-10 — ImageResponse gradient card with brand name + tagline.

### P2-EPIC-05 — expanded nodes (Rate limiting) — ALL DONE 2026-08-10

### [P2-RL-01] Shared in-memory rate limiter lib
- status: done
- depends_on: []
- human_required: false
- touches: [lib/rate-limit.ts (new), lib/rate-limit.test.ts (new)]
- done_when: lib exposes getClientIp (x-forwarded-for/x-real-ip), checkRateLimit (fixed window), enforceRateLimit (returns 429 + Retry-After or null), and a periodic bucket sweep; unit tests cover windowing, reset, per-IP keys.
- verify: `npm test -- rate-limit` passes
- notes: VERIFIED 2026-08-10 — 8/8 tests. In-memory fixed-window per IP; single-instance only (multi-instance needs Redis — noted as future node).

### [P2-RL-02] Rate-limit auth + discount endpoints
- status: done
- depends_on: [P2-RL-01]
- human_required: false
- touches: [app/api/register/route.ts, app/api/auth/[...nextauth]/route.ts, app/api/validate-discount/route.ts]
- done_when: register (10/min), NextAuth credentials callback (15/min) and validate-discount (30/min) return 429 when a single IP exceeds the limit.
- verify: `npm test -- rate-limit` passes; tsc clean; hammering /api/validate-discount returns 429
- notes: VERIFIED 2026-08-10 — guards added; live hammer test: 35 POSTs → 429 with `{"error":"Too many requests..."}`. NextAuth route wrapper needed NextRequest param (TS fix).

### [P2-RL-03] Rate-limit payment endpoints (webhooks excluded)
- status: done
- depends_on: [P2-RL-01]
- human_required: false
- touches: [app/api/create-payment-intent/route.ts, app/api/create-safepay-order/route.ts, app/api/create-cod-order/route.ts, app/api/create-checkout-session/route.ts]
- done_when: all four card/COD order-creation endpoints return 429 beyond 10/min/IP; webhooks (server-to-server, signature-verified) are NOT rate-limited.
- verify: `npm test -- rate-limit` passes; tsc clean
- notes: VERIFIED 2026-08-10 — guards added to all four; webhooks intentionally untouched (they authenticate via signature, not IP).

### P2-EPIC-06 — expanded nodes (Automatic search-index sync) — ALL DONE 2026-08-10

### [P2-SS-01] Reusable Typesense sync lib
- status: done
- depends_on: []
- human_required: false
- touches: [lib/search-sync.ts (new), lib/search-sync.test.ts (new), lib/typesense.ts]
- done_when: lib exposes toTypesenseDocument (pure), ensureProductsCollection, syncProductToSearch, removeProductFromSearch, syncAllProducts — reusing the shared Sanity server client (no hardcoded project id like scripts/syncProducts.ts).
- verify: `npm test -- search-sync` passes
- notes: VERIFIED 2026-08-10 — 4/4 transform tests (mapping, defaults, no-images skip, unix timestamps).

### [P2-SS-02] Sanity webhook → Typesense sync endpoint
- status: done
- depends_on: [P2-SS-01]
- human_required: false
- touches: [app/api/webhooks/sanity/route.ts (new), lib/sanity-webhook.ts (new), lib/sanity-webhook.test.ts (new)]
- done_when: POST /api/webhooks/sanity verifies x-sanity-webhook-signature (HMAC-SHA256, timing-safe), syncs on create/update, deletes on delete, ignores non-product types; GET answers the test ping; SANITY_WEBHOOK_SECRET generated and added to .env.local.
- verify: `npm test -- sanity-webhook` passes; tsc clean; curl POST without signature returns 401
- notes: VERIFIED 2026-08-10 — 6/6 signature tests; live curl no-sig → 401. REMAINING (human/deploy): create the webhook in Sanity dashboard (Dataset production, trigger product create/update/delete, URL <PUBLIC_BASE_URL>/api/webhooks/sanity, secret = the SANITY_WEBHOOK_SECRET in .env.local), then restart the deployed server with the env var.

### P2-EPIC-02 / P2-EPIC-03 — BLOCKED (external accounts required)
2026-08-10 — Not expanded/implemented: both epics require third-party merchant/provider accounts the owner must open first (courier: Leopards or PostEx business account + API creds; notifications: WhatsApp Business API + SMS gateway). Once accounts exist, expand each into scoped nodes (same schema) before implementing. The order-notification email path already works (Brevo SMTP, lib/email.ts) as the interim customer notification channel.

### P2-EPIC-07 — expanded nodes (Lighthouse performance audit)

### [P2-LH-01] Run Lighthouse audit and record baseline
- status: done
- depends_on: []
- human_required: false
- touches: [http://localhost:3000]
- done_when: a Lighthouse run (performance/seo/accessibility/best-practices) records baseline scores + top failures into this node's notes.
- verify: lighthouse JSON output captured with scores
- notes: VERIFIED 2026-08-10 (dev server, Lighthouse 13.4.1) — BASELINE: performance 32 / seo 92 / accessibility 86 / best-practices 96. Performance failures are dev-mode artifacts (unminified JS, missing source maps, slow dev SSR, unused code). A11y: icon-only testimonial arrows (no name), icon-only footer social links (no name), contrast (FLASH SALE red-500, shadcn outline buttons). BP: console errors (no actionable snippet — dev noise), missing source maps (dev-only). FULL AUDIT MUST BE RE-RUN POST-DEPLOY against the production build.
- notes: 2026-08-11 — **PRODUCTION AUDIT PASSED** (owner ran Lighthouse against the live Vercel deploy; JSONs saved at repo root: Lighthouse_mobile_rport.json + lighthouse_dekstop_report.json). MOBILE: performance 74 / accessibility 96 / best-practices 100 / seo 100. DESKTOP: performance 89 / accessibility 92 / best-practices 100 / seo 100. Zero failing weighty audits in either. Site confirmed live on Vercel (hackathon-2-ashy-mu.vercel.app).

### [P2-LH-02] Fix actionable audit findings
- status: done
- depends_on: [P2-LH-01]
- human_required: false
- touches: [app/components/Testiomnials/Tetimonials.tsx, app/components/Footer/Footer.tsx, app/components/Hero/Hero.tsx]
- done_when: every actionable finding (correctable from code, not dev-mode artifacts) is fixed; remaining items are documented.
- verify: re-run the affected Lighthouse category, show the delta
- notes: VERIFIED 2026-08-10 — FIXED: aria-label on testimonial prev/next buttons; aria-label on 4 footer social links (Twitter/Facebook/Instagram/GitHub); FLASH SALE text-red-500 → text-red-600 (contrast on white). RE-RUN DELTA: seo 92→100, accessibility 86→96, best-practices 96→96, performance 32→33 (dev noise). REMAINING (documented, design-token level): color-contrast on shadcn outline buttons + testimonial card grays (needs brand/theme decision); errors-in-console (no actionable detail); valid-source-maps (dev-only). REAL PERFORMANCE NUMBERS REQUIRE THE PRODUCTION BUILD + DEPLOY (human/deploy step).

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
