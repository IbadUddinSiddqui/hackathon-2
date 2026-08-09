# 🚀 Deployment Guide — Bazaar Nest (client site)

This guide takes the app from local to **live on Vercel** with the free `*.vercel.app`
domain. Everything was verified locally before writing this:

- ✅ `npm run build` passes (26 routes, types + lint checked)
- ✅ `npx eslint .` passes with zero errors
- ✅ `npx tsc --noEmit` passes with zero errors

---

## 0. Prerequisites

- A **GitHub** account (the repo is already at
  `https://github.com/IbadUddinSiddqui/hackathon-2`)
- A **Vercel** account (free tier is fine) — sign up via the button below
- Your existing third-party services (already configured):
  - **Sanity** — project `xphvex0e`, dataset `production`
  - **Typesense Cloud** — cluster `015dvlkq3mbheg9zp-1.a1.typesense.net`
  - **Stripe** — test/live keys

---

## 1. Push the current code

All secrets live in `.env.local` (gitignored) — nothing sensitive is committed:

```bash
git add -A
git commit -m "Production prep: clean demo pages, fix auth & checkout, secure API keys"
git push origin main
```

> ⚠️ **Rotate the API keys** before going live. The old Sanity/Typesense keys were
> previously committed in git history, so anyone with repo access had them. Generate
> new keys in Sanity Manage, Typesense Cloud, and Stripe, and update `.env.local` +
> the Vercel env vars below.

---

## 2. Deploy on Vercel

1. Go to **Vercel → Add New → Project** and **import the `hackathon-2` GitHub repo**.
2. Framework preset: **Next.js** (auto-detected). Build command stays `npm run build`.
3. Add the **Environment Variables** from the table below (Settings → Environment Variables).
4. Click **Deploy**. Vercel builds and serves it at `https://hackathon-2-<hash>.vercel.app`.

### Environment variables (must match what the code reads)

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `xphvex0e` | Public — inlined into the browser bundle |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` | Public |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2025-01-27` | Optional; defaults to this |
| `SANITY_API_TOKEN` | (Sanity API token) | **Server-only.** Used by register/promote/upload |
| `NEXT_PUBLIC_SANITY_TOKEN` | (Sanity API token) | Fallback used by server-client if `SANITY_API_TOKEN` unset |
| `NEXT_PUBLIC_TYPESENSE_HOST` | `015dvlkq3mbheg9zp-1.a1.typesense.net` | Public |
| `NEXT_PUBLIC_TYPESENSE_PORT` | `443` | Public |
| `NEXT_PUBLIC_TYPESENSE_PROTOCOL` | `https` | Public |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | (Typesense search key) | Public by design |
| `TYPESENSE_ADMIN_KEY` | (Typesense admin key) | Server-only; only needed for the sync script |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_...` | Public |
| `STRIPE_SECRET_KEY` | `sk_...` | Server-only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Server-only, for `/api/webhook`. From `stripe listen` (local) or the Stripe Dashboard webhook signing secret (prod) |
| `AUTH_SECRET` | (32+ random chars) | Generate: `openssl rand -base64 32` |
| `SMTP_HOST` | `smtp-relay.brevo.com` | **Brevo** (free: 300 emails/day) — enables receipt emails (nodemailer). Generate an SMTP key at https://app.brevo.com/settings/keys/smtp (use the **SMTP tab** → "Generate a new SMTP key" — not the API Keys tab) |
| `SMTP_PORT` | `587` | SMTP port (`465` for SSL — the code auto-detects, and sets `requireTLS` on 587/25 since Brevo requires STARTTLS) |
| `SMTP_USER` | `b4c98d001@smtp-brevo.com` | The **login shown on Brevo's SMTP tab** (`xxx@smtp-brevo.com`) — NOT your account email. Wrong user = `535 Authentication failed` |
| `SMTP_PASS` | (Brevo SMTP key) | The SMTP key starting with `xsmtpsib-` |
| `EMAIL_FROM` | e.g. `Bazaar Nest <orders@yourdomain.com>` | From-address shown on receipt emails |

> **Discount codes:** managed as Sanity documents (type `discountCode`). Create them in
> Studio (`/studio`), e.g. `WELCOME10` (10% off) or `FIXED5` ($5 off). They are validated
> **server-side only** at payment time — clients can never set their own discount. The
> seed script (`npm run import-data`) creates `WELCOME10` and `FIXED5` for you.

> Paste the same values that are already working in your local `.env.local`.

---

## 3. Post-deploy checklist (do these once live)

1. **Sanity CORS + public reads**
   - Add `https://<your-app>.vercel.app` to **Sanity Manage → API → CORS origins**.
   - If product pages show "Failed to load products", enable **Public read access** on the
     dataset (Sanity Manage → Project → Dataset → Access), since the storefront reads
     products directly from the browser without a token.
2. **Stripe webhook**
   - Stripe Dashboard → Developers → Webhooks → Add endpoint:
     `https://<your-app>.vercel.app/api/webhook`
   - Subscribe to at least `payment_intent.succeeded` and
     `checkout.session.completed`. Copy the signing secret into
     `STRIPE_WEBHOOK_SECRET`.
   - The webhook now **persists orders in Sanity** (`order` documents), **decrements
     product stock**, and **emails receipts** (requires the `SMTP_*` vars above).
     Deploy the new `order` schema to Sanity Studio before testing (`npx sanity deploy`
     or use the local `/studio` route).
3. **Test the flow**
   - `/register` → `/login` → `/dashboard` (avatar upload) → browse `/products` →
     `/cart` → checkout with Stripe **test** card `4242 4242 4242 4242`.
4. **Custom domain (later)**
   - Vercel → Project → Settings → Domains → add the client's domain and follow the
     DNS instructions (A record `76.76.21.21` or CNAME to `cname.vercel-dns.com`).

---

## 4. Day-to-day maintenance

| Task | How |
|---|---|
| Add/edit products | Sanity Studio at `/studio` on the live site (or sanity.io/manage) |
| Rebuild search index | After product changes, run `node scripts/syncProducts.ts` locally (needs `TYPESENSE_ADMIN_KEY`) |
| Update the site | Push to `main` — Vercel auto-deploys |
| Local dev | `npm run dev` (needs `.env.local` populated) |

---

## 5. Troubleshooting

- **Login fails with "Invalid email or password"** — check `AUTH_SECRET` is set and
  identical across deploys; confirm the user exists in Sanity with a bcrypt-hashed
  password (create via `/register`, not manually).
- **Products don't load** — Sanity dataset access (see checklist) or
  `NEXT_PUBLIC_SANITY_*` vars are wrong.
- **Search empty** — Typesense collection `products` must exist (`syncProducts.ts`)
  and `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` must be the search-only key.
- **Checkout 500s** — verify `STRIPE_SECRET_KEY` and that the success URL now reads
  `?session_id=...` (fixed).
- **Checkout session errors with `Invalid non-negative integer`** — this was a bug where
  discount codes added a negative "Discount" line item, which Stripe's hosted Checkout
  rejects. Fixed: the discount is now folded into the line-item amounts (totals remain
  exact to the cent). If you ever see it again, it means a stale build is still running
  the old code — redeploy.
