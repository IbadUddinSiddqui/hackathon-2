# Bazaar Nest — Project Knowledge

## What this is

A Next.js 15 (App Router) e-commerce storefront for a Pakistani clothing brand — Sanity CMS as the database, Stripe for payments (currently the only payment method — being replaced/supplemented, see "Active Remediation" below), Typesense for search, NextAuth v5 for auth, Zustand for cart/wishlist. Full technical reference lives in `ProjectDetails.md` in the repo root — read that before touching anything unfamiliar, it's authoritative and kept current.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.1.6, App Router, React 19, TypeScript 5 |
| Styling | Tailwind CSS 3.4, TailAdmin theme (admin only), shadcn-style `components/ui/*` |
| Database/CMS | Sanity (`@sanity/client`, `next-sanity`) — project `xphvex0e`, dataset `production` |
| Auth | NextAuth v5 beta, Credentials provider, bcrypt |
| Payments | Stripe (being supplemented with a Pakistan-viable processor — see Active Remediation) |
| Search | Typesense Cloud |
| State | Zustand, persisted to localStorage |
| Email | Nodemailer via Brevo SMTP |

## Commands

```
npm run dev          # local dev server (turbopack)
npm run build         # production build
npm run lint          # eslint
npm run import-data   # seed products/discount codes into Sanity
npm test              # DOES NOT EXIST YET — see task P1-05 in TASK_GRAPH.md, add this before writing any tests
```

Always run `npm run build` and `npm run lint` before considering any change finished. Once `npm test` exists (P1-05), run that too.

## The one rule that matters most in this codebase

**The server never trusts the client.** Product prices come from Sanity, discount codes are validated server-side, the delivery fee is a server constant (`lib/constants.ts`), and the charged amount is computed entirely server-side in cents. The client only ever sends item IDs, quantities, and a discount-code string. Every change to checkout, pricing, or discount logic must preserve this — it's the single most important invariant in the project.

Related invariants, same reasoning:
- Order state (`paid`, `refunded`, etc.) changes **only** from a verified Stripe webhook (`/api/webhook`), never from a client redirect.
- Stock decrements and order-paid transitions use optimistic locking (`ifRevisionId`) / atomic Sanity transactions — never a read-then-write pattern that could race under concurrent orders.
- Webhook fulfillment must stay idempotent — a duplicate Stripe event must not double-fulfill an order.

## Where things live (quick reference)

| Need to... | Go to |
|---|---|
| Change the delivery fee | `lib/constants.ts` (single source of truth — don't hardcode it elsewhere) |
| Change payment/checkout logic | `app/api/create-payment-intent/route.ts`, `app/api/create-checkout-session/route.ts` |
| Change webhook fulfillment | `app/api/webhook/route.ts`, `lib/orders.ts` |
| Change discount logic | `lib/discounts.ts` |
| Change admin gating | `lib/admin.ts` (`isAdmin()`, `requireAdmin()`) |
| Add/edit a product | Sanity Studio (`/studio`) — there is no admin product-CRUD UI yet |
| Change order admin UI | `app/adminpanel/orders/*` |
| Sync search index | `node scripts/syncProducts.ts` (currently manual — not triggered automatically on product changes) |

## Known dead code — do not extend, do not copy patterns from these

- `hackathon_3_backend_server/` — legacy Express/Mongo backend, not called by the live app
- `app/components/Payments/` (`StripePayment.tsx`, `Payments.tsx`) — superseded duplicate of `app/components/CheckOut/CheckOut.tsx`, uses an old amount-only API shape. Use `CheckOut.tsx` as the reference pattern for payment UI, never this.
- `auth.config.ts` — dead, `auth.ts` is the authoritative NextAuth config
- `app/category.tsx`, `app/product.tsx` — unrouted stray files

These are scheduled for removal in task `P1-03` — if you're not actively working that task, just don't touch or build on them.

## Active remediation work

This project went through a full production-readiness audit. The findings are tracked as a dependency graph in `TASK_GRAPH.md`, and the execution protocol for working through it is in `GRAPH_LOOP_STRATEGY.md` — **both in the repo root.**

**Before starting any remediation, bug-fix, or audit-driven task, read `GRAPH_LOOP_STRATEGY.md` and `TASK_GRAPH.md` first and follow that protocol exactly** — pick one eligible node, verify it with its actual `verify` command before marking it done, never touch scope outside that node, never attempt anything tagged `human_required: true`.

For everything else (new feature requests unrelated to the audit), this file's conventions still apply, but you don't need to consult the task graph.

## Security non-negotiables

- Secrets only via environment variables, never hardcoded. (Note: this repo has a known history of committed keys — see `TASK_GRAPH.md` task `P1-01`/`P1-02`. Never add a new one the same way.)
- Every admin-only route/page must go through `isAdmin()` / `requireAdmin()` — don't build a parallel check.
- Any new endpoint handling money or stock must follow the same server-side-computation + webhook-confirmed + idempotent pattern as the existing Stripe flow.
