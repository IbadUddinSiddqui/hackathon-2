# TASK_GRAPH.md update — apply these changes

## 1. Status changes on existing nodes

### [P1-13] Add Cash on Delivery — mark DONE
- status: done
- notes: confirmed in last status report — COD selector + route + schema, tested.

### [P1-17] Draft legal documents — mark DONE
- status: done
- notes: privacy/terms/returns drafted and linked in footer, confirmed in last status report. [P1-18] legal review sign-off remains todo/human_required — drafting isn't review.

### [P1-15a] Apply for JazzCash — DEFER
- status: deferred
- notes: portal repeatedly errors/times out (checked from this network — try mobile data / a PK-based connection before concluding it's dead). A documented nationwide Easypaisa outage occurred June 2026, confirming this ecosystem has real infrastructure instability, not necessarily user error. Deprioritized in favor of the working Safepay+COD path. **Revisit trigger:** once P1-SP-01 (Safepay webhook) is resolved and the site is live in production.

### [P1-15b] Apply for Easypaisa — DEFER
- status: deferred
- notes: same as P1-15a — portal timing out, deprioritized, same revisit trigger.

### [P1-16-jc], [P1-16-ep-wallet], [P1-16-ep-card] — DEFER
- status: deferred (all three)
- notes: blocked on P1-15a/P1-15b anyway; deferred along with them. No action needed on these until the applications are revisited.

## 2. New nodes — append to Phase 1

### [P1-SP-01] Diagnose Safepay webhook non-delivery
- status: todo
- depends_on: []
- human_required: false (may escalate to human_required if root cause is Safepay-side)
- touches: [Safepay dashboard Webhook Logs + Logs v2, ngrok session or deployed URL, app/api/payments/safepay/webhook route]
- done_when: root cause identified — either (a) a URL mismatch between the registered endpoint and the current ngrok/deployed URL, confirmed and fixed, or (b) a genuine Safepay-side delivery failure confirmed via their logs showing zero delivery attempts, escalated to their support with the 3 sandbox transaction IDs as evidence.
- verify: a new sandbox transaction results in an **observed, undelivered-by-you** webhook arriving in the app's logs — not a manually replayed one.
- notes: **this is the #1 open risk carried over from the last status report.** Do not consider Phase-1 payments complete until this passes for real.

### [P1-SP-02] Point the webhook at a stable URL
- status: todo
- depends_on: []
- human_required: false
- touches: [Vercel deployment, Safepay dashboard endpoint config]
- done_when: the registered webhook endpoint targets a stable Vercel URL, not a rotating ngrok tunnel — eliminates the "URL went stale after a restart" failure class going forward.
- verify: registered URL in the Safepay dashboard matches the actual deployed URL exactly

### [P1-SP-03] Reprice all products to PKR in Sanity
- status: todo
- depends_on: []
- human_required: true (agent can write the migration; correct target prices need business/client input, not just a currency-symbol fix)
- touches: [sanity/schemaTypes/product.ts, a new repricing script, Sanity Studio data]
- done_when: every product's price field reflects an intentional PKR value — not a leftover USD number (e.g. 19.99) being displayed with an "Rs" label slapped on it.
- verify: spot-check 5 products in Studio and on the live storefront show correct, intentional PKR prices

### [P1-SP-04] Commit the 57 uncommitted files
- status: todo
- depends_on: []
- human_required: false
- touches: [entire working tree]
- done_when: `git status` is clean; all Phase-1 work (auth, admin, demo-route deletions, Safepay integration) is committed with clear per-change messages.
- verify: `git status` clean, `git log` shows the new commits
- notes: do this one first, independent of everything else — it's pure risk sitting there for no reason.

### [P1-SP-05] Disable legacy Stripe payment routes
- status: todo
- depends_on: [P1-SP-01]
- human_required: false
- touches: [app/api/create-payment-intent/route.ts, app/api/create-checkout-session/route.ts, app/api/webhook/route.ts]
- done_when: the old Stripe endpoints are removed or explicitly disabled (return 410) — right now nothing links to them but they're still live and callable by anyone who finds the URL.
- verify: hitting the old endpoints directly returns a disabled response, not a working payment flow
- notes: don't do this until P1-SP-01 passes — keep Stripe as a fallback until Safepay is fully proven, not before.

### [P1-SP-06] Confirm receipt email actually lands
- status: todo
- depends_on: []
- human_required: true
- touches: [inbox check]
- done_when: a real test order's receipt email is visually confirmed in the inbox — "sent without error" per Brevo's logs isn't the same claim.

### [P1-SP-07] Browser-test the admin panel
- status: todo
- depends_on: []
- human_required: true
- touches: [/adminpanel/orders, /adminpanel/discounts]
- done_when: both pages have been manually clicked through in a real browser this session and confirmed working — "code complete + tests" isn't the same as "someone actually looked at it."

### [P1-SP-08] Deploy to production
- status: todo
- depends_on: [P1-SP-01, P1-SP-03, P1-SP-04]
- human_required: false (domain purchase/DNS may need a human step)
- touches: [Vercel project settings, DNS, production environment variables]
- done_when: the site is live on the real domain with production env vars set.
- verify: production URL loads; one full transaction completes end-to-end on the live URL

### [P1-SP-09] Safepay production mode
- status: todo
- depends_on: [P1-SP-01]
- human_required: true
- touches: [Safepay merchant account]
- done_when: merchant account approved for production, live API key obtained, live webhook endpoint registered against the real production domain.

### [P1-SP-10] Branding/content pass
- status: todo
- depends_on: []
- human_required: true (client needs to supply real name/logo/products/copy; agent implements once assets exist)
- touches: [app/layout.tsx, public/ (logo), about/contact pages, product data]
- done_when: "Bazaar Nest" placeholder is replaced with real client branding, real product catalog, real about/contact pages.
