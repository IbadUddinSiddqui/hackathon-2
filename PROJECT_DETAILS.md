# 📘 Project Details — Bazaar Nest (E-Commerce Clothing Store)

> **Complete technical reference for the codebase.** Everything from A→Z: what the project is, how the code is structured, every file's job, the user flows, the code flows, the database, the frontend, the backend, what's finished, what's missing, and what to do next.
>
> This document is meant to be handed to any developer (or AI) so they can understand and safely modify the codebase.

---

## 1. Project Overview

**Bazaar Nest** is a full-stack **e-commerce clothing store** for a local clothing brand. It is a Next.js 15 (App Router) application with:

- **Sanity CMS** as the database + content store (products, users, orders, discount codes)
- **Stripe** for payments (two flows: embedded card form + hosted Checkout)
- **Typesense Cloud** for product search (algolia-style instant search)
- **NextAuth v5 (Auth.js)** for authentication (email + bcrypt password)
- A **customer storefront** (browse, search, product pages, cart, wishlist, checkout)
- An **admin panel** (dashboard, orders management, discount-code management)

**Brand name used throughout:** Bazaar Nest. The site is deployed for a client as a local clothing brand.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 15.1.6** (App Router, React 19, TypeScript 5) |
| Styling | **Tailwind CSS 3.4**, TailAdmin dashboard theme (`css/satoshi.css`, `css/style.css`), Chakra UI, shadcn-style UI components (`components/ui/*`), Framer Motion, Swiper |
| Database / CMS | **Sanity** (`@sanity/client`, `next-sanity`) — project `xphvex0e`, dataset `production` |
| Auth | **NextAuth v5 beta** (`next-auth@5.0.0-beta.25`) with Credentials provider + bcryptjs |
| Payments | **Stripe** (`stripe` v17, `@stripe/stripe-js`, `@stripe/react-stripe-js`) |
| Search | **Typesense Cloud** (`typesense`, `react-instantsearch`, `typesense-instantsearch-adapter`) |
| State | **Zustand** (cart + wishlist, persisted to localStorage) |
| Email | **Nodemailer** via **Brevo SMTP** (order receipts) |
| Charts/Admin | ApexCharts, jsvectormap, flatpickr (TailAdmin leftovers) |
| Backend (legacy) | Express + Mongoose server in `hackathon_3_backend_server/` (see §10 — not used by the live site) |

**Key scripts** (`package.json`):

```json
"dev": "next dev --turbopack",
"build": "next build",
"start": "next start",
"lint": "eslint .",
"import-data": "node --env-file=.env.local scripts/importData.mjs"
```

---

## 3. Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    BROWSER (Next.js app)                        │
│  Storefront pages · Cart/Wishlist (Zustand) · Admin panel       │
└───────┬──────────────────┬──────────────────┬───────────────────┘
        │                  │                  │
        │ GROQ reads       │ fetch() API      │ loadStripe / Elements
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│   SANITY     │   │ Next.js API      │   │     STRIPE           │
│  (CMS/DB)    │◄──┤ routes (server)  │──►│  PaymentIntent /     │
│ products     │   │ /api/*           │   │  Checkout Session    │
│ users        │   └────────┬─────────┘   └──────────┬───────────┘
│ orders       │            │                        │
│ discountCodes│            │ webhook events         │
└──────────────┘            ▼                        │
                    ┌──────────────────┐              │
                    │  /api/webhook    │◄─────────────┘
                    │  (Stripe signed) │  payment_intent.succeeded
                    └────────┬─────────┘  checkout.session.completed
                             │ mark paid · decrement stock · email receipt
                             ▼
                       SANITY updates
```

**The security principle of the whole payment system:**
> The server NEVER trusts the client. Product prices come from Sanity, discount codes are validated server-side against Sanity, the delivery fee is a server constant, and the charged amount is computed entirely server-side in cents. The client only sends **item IDs + quantities + the discount code string**.

---

## 4. Directory Map (every file explained)

### 4.1 Root config files

| File | What it does |
|---|---|
| `next.config.ts` | Next config — allows `cdn.sanity.io` as an image domain |
| `package.json` | All dependencies + scripts |
| `tsconfig.json` | TypeScript config |
| `tailwind.config.ts` | Tailwind theme (TailAdmin colors: `primary`, `boxdark`, `stroke`, etc.) |
| `postcss.config.mjs` | PostCSS for Tailwind |
| `auth.ts` | **Single NextAuth v5 config** (see §5) |
| `auth.config.ts` | Legacy/partial NextAuth config (providers: []) — mostly unused; `auth.ts` is authoritative |
| `components.json` | shadcn/ui config |
| `.env.local` | Local secrets (gitignored) — see §13 |
| `DEPLOYMENT.md` | Deployment guide (Vercel + env vars + webhook setup) |
| `PROJECT_BRIEF.md` | Original brief/progress notes |

### 4.2 `app/` — pages & routes (Next App Router)

**Public storefront:**

| Route | File | What it does |
|---|---|---|
| `/` | `app/page.tsx` | Home page — composes Header, Hero, Sponsors, New Arrivals (MensClothing), Top Sale (Accessories), Browse, Testimonials, Footer |
| `/products` | `app/products/page.tsx` | All-products listing |
| `/products/[category]` | `app/products/[category]/page.tsx` | Category-filtered product listing |
| `/products/[category]/[productId]` | `app/products/[category]/[productId]/page.tsx` | **Product detail page** — client component; fetches product from Sanity by `_id`, gallery, rating stars, size/color sections, AddToCart + wishlist buttons, "You May Also Like" grid |
| `/cart` | `app/cart/page.tsx` | Cart page — quantity update, remove, discount-code Apply button (→ `/api/validate-discount`), totals (subtotal − discount + $5 delivery), **Proceed to Checkout** → Stripe hosted Checkout |
| `/checkout` | `app/checkout/page.tsx` | In-page checkout — order summary + embedded Stripe card form (via CheckOut component) |
| `/checkout/success` | `app/checkout/success/page.tsx` | Success page — clears the cart |
| `/search` | `app/search/page.tsx` | Typesense-powered search page |
| `/wishlist` | `app/wishlist/page.tsx` | Wishlist page (Zustand persisted) |
| `/category.tsx` | — | (stray file, not routed) |
| `/product.tsx` | — | (stray file, not routed) |

**Auth & account:**

| Route | File | What it does |
|---|---|---|
| `/login` | `app/login/page.tsx` | Login form (NextAuth signIn) |
| `/register` | `app/register/page.tsx` | Signup form → `/api/register` |
| `/dashboard` | `app/dashboard/page.tsx` | **Server component** — session-guarded; shows welcome, avatar upload, logout; fetches the user from Sanity by email |
| `/profile` | `app/profile/page.tsx` | Profile page |
| `/settings` | `app/settings/page.tsx` | Settings page |
| `/denied` | `app/denied/page.tsx` | "Access denied" page shown when a non-admin hits an admin route |
| `/studio` | `app/studio/[[...tool]]/page.tsx` | **Embedded Sanity Studio** (CMS UI inside the app) |

**Admin panel:**

| Route | File | What it does |
|---|---|---|
| `/adminpanel` | `app/adminpanel/page.tsx` | Admin dashboard (ECommerce stats) — gated by `requireAdmin()` |
| `/adminpanel/orders` | `app/adminpanel/orders/page.tsx` | **Orders list** — all Sanity orders, summary cards (total/paid/pending/revenue), status badges, clickable rows |
| `/adminpanel/orders/[orderId]` | `app/adminpanel/orders/[orderId]/page.tsx` | **Order detail** — customer, Stripe session/PI IDs, line items (names link to storefront + Sanity Studio edit), totals, status dropdown |
| `/adminpanel/orders/OrderRow.tsx` | — | Client row component (whole-row click → detail page) |
| `/adminpanel/orders/StatusChanger.tsx` | — | Client dropdown that PATCHes order status |
| `/adminpanel/discounts` | `app/adminpanel/discounts/page.tsx` | **Discount codes** — lists codes from Sanity |
| `/adminpanel/discounts/DiscountCodesManager.tsx` | — | Client component: create/edit form, enable/disable toggle, delete |

**API routes (`app/api/*`):**

| Route | Method | What it does |
|---|---|---|
| `/api/auth/[...nextauth]` | all | NextAuth handler (re-exports from `auth.ts`) |
| `/api/auth/logout` | POST | Sign-out |
| `/api/auth/signin`, `/api/auth/signup` | — | Legacy pages (deleted) |
| `/api/register` | POST | Create user — validates name/email/password, bcrypt-hashes, writes `user` doc (role `user`) |
| `/api/promote` | POST | Admin-only — sets a user's role to `admin` in Sanity |
| `/api/upload` | POST | Auth-required — uploads avatar image to Sanity, sets `user.avatar` reference |
| `/api/create-payment-intent` | POST | **Embedded-card payment** — server-computed total → creates pending Sanity order → Stripe PaymentIntent → returns `client_secret` |
| `/api/create-checkout-session` | POST | **Hosted Checkout** — server-computed total → pending order → Stripe Checkout Session → returns session id |
| `/api/validate-discount` | POST | Validates a discount code against Sanity (for the cart Apply button) |
| `/api/orders/[orderId]/status` | PATCH | Admin-only — updates an order's status |
| `/api/discount-codes` | GET/POST | Admin-only — list/create discount codes |
| `/api/discount-codes/[id]` | PATCH/DELETE | Admin-only — update/delete a discount code |
| `/api/webhook` | POST | **Stripe webhook** — signature-verified; on `payment_intent.succeeded` / `checkout.session.completed` fulfils the order |

### 4.3 `app/components/` — UI components

**Storefront:**

| Component | What it does |
|---|---|
| `Header/Header.tsx` | Sticky header — promo banner, logo, nav (Dashboard/Login), **ProductSearch**, cart & wishlist icons with animated badges, mobile full-screen menu |
| `Footer/Footer.tsx` | Site footer |
| `Hero/Hero.tsx` | Home hero section |
| `Sponsors/Sponsors.tsx` | Brand logos strip |
| `MensClothing/MensClothing.tsx` | "New Arrivals" product section on home |
| `Accessories/Accessories.tsx` | "Top Sale" product section on home |
| `Browse/Browse.tsx` | Browse-by-category section |
| `Testiomnials/Tetimonials.tsx` | Testimonials section (uses `Ratings/Ratings.tsx`) |
| `ProductSearch/ProductSearch.tsx` | Typesense instant-search box (search-as-you-type) |
| `ProductsGrid/ProductsGrid.tsx` | Product cards grid with 3D-flip hover, "View More" pagination, responsive breakpoints |
| `ProductDetails/ProductDetails.tsx` | Product detail blocks |
| `ProductImages/ProductGallery.tsx` | Product image gallery (main image + thumbnails) |
| `AddToCartButton/AddToCartButton.tsx` | Adds product to the Zustand cart (respects stock) |
| `CheckOut/CheckOut.tsx` | **In-page Stripe payment form** — email field, CardElement, "Pay $X" button; calls `/api/create-payment-intent` with items + discountCode; shows success/failure |
| `Payments/Payments.tsx` + `Payments/StripePayment.tsx` | **Legacy/duplicate** Stripe wrapper & PaymentForm (uses the old amount-only call — superseded by CheckOut.tsx; candidate for deletion) |
| `Slider/Slider.tsx`, `Sidesize/Sidesize.tsx`, `Size/Size.tsx`, `ColorPicker/ColorPicker.tsx` | Product size/color/UI helpers |
| `Accordion/`, `Accordion1/`, `FaqTab/Faq.tsx` | FAQ / accordion sections |
| `Breadcrumbs/Breadcrumb.tsx` | Breadcrumb nav |
| `Ratings/Ratings.tsx` | Star rating display |
| `LogoutButton/LogoutButton.tsx` | Sign-out button |
| `AvatarUpload/AvatarUpload.tsx` | Avatar file upload → `/api/upload` |

**Admin (TailAdmin theme):**

| Component | What it does |
|---|---|
| `Sidebar/index.tsx` | Admin sidebar — menu groups: Dashboard (eCommerce), **Orders**, **Discounts** (custom items added on top of the TailAdmin template) |
| `Sidebar/SidebarItem.tsx`, `SidebarDropdown.tsx` | Sidebar nav helpers |
| `Layouts/DefaultLayout.tsx` | Admin page shell (sidebar + header) |
| `Header/index.tsx` + `Header/Header.tsx`, `DropdownUser.tsx`, `DropdownMessage.tsx`, `DropdownNotification.tsx`, `DarkModeSwitcher.tsx` | Admin top bar + dropdowns + dark mode toggle |
| `Dashboard/E-commerce.tsx` | Admin dashboard — stats cards + charts |
| `CardDataStats.tsx` | Stat card |
| `Charts/ChartOne/Two/Three.tsx` | ApexCharts panels |
| `Tables/TableOne–Four.tsx` | Template tables |
| `Calender/index.tsx`, `Chat/ChatCard.tsx`, `Maps/Maps.tsx`, `Forms/*`, `Checkboxes/*`, `Switchers/*`, `SelectGroup/*`, `Dropdowns/*`, `ClickOutside.tsx`, `ColorPicker/*`, `common/Loader`, `Order/Order.tsx` | TailAdmin template components (mostly unused by the live storefront — leftovers from the starter template) |

### 4.4 `components/ui/` — shadcn-style primitives

`button, card, input, label, separator, badge, dialog, sheet, drawer, popover, tooltip, accordion, avatar, checkbox, radio, slider, textarea, field, input-group, skeleton, sidebar, provider, color-mode, close-button, color-picker` — small reusable UI primitives used across storefront + admin.

### 4.5 `lib/` — shared logic

| File | What it does |
|---|---|
| `lib/stores/cartStore.ts` | **Zustand cart** — items (with quantity + imageUrl), `discountCode`/`discountAmount`; persisted to localStorage (`sanity-cart-storage`); clearing/adding/removing invalidates the discount; stock-aware quantity clamping |
| `lib/stores/wishlistStore.ts` | **Zustand wishlist** persisted to localStorage (`wishlist-storage`) |
| `lib/sanity/product.ts` | Sanity product GROQ queries + `SanityProduct` type |
| `lib/admin.ts` | **Admin helpers** — `isAdmin(session)` (role `admin` OR owner email fallback) + `requireAdmin()` guard (redirects to `/denied`) |
| `lib/orders.ts` | **Order logic** — `createPendingOrder` (writes `order` doc with uuid `order_id` BEFORE payment), `fetchProductsByIds`, `findOrderByOrderId`, `persistCustomerEmail`, `markOrderPaid` (atomic `ifRevisionId` lock), `decrementProductStock` (single transaction, clamp ≥ 0) |
| `lib/orders-ui.ts` | Shared order formatting — status badge styles, `formatDate`, `formatTotal`, `formatOrderId` (used by orders list + detail) |
| `lib/discounts.ts` | **Server-side discount validation** — checks code exists, active, not expired, under maxUses; computes percent/fixed; caps at subtotal; rounds to cents. `incrementDiscountUsage` (atomic `.inc`) called by the webhook |
| `lib/discount-code-admin.ts` | Admin API guard (`discountCodeGuard`) + input validator for discount-code CRUD routes |
| `lib/constants.ts` | `DELIVERY_FEE = 5` (dollars) — single source of truth for the delivery fee |
| `lib/email.ts` | **Receipt email** via nodemailer — Brevo SMTP; `requireTLS` on 587; skips gracefully if `SMTP_HOST` unset |
| `lib/get-stripe.js` | `loadStripe` singleton (used by the legacy cart checkout) |
| `lib/typesense.ts` | Typesense client configs — `searchClient` (public search key) + `adminClient` (server key) |
| `lib/products.json` | Local product data sample (seed source) |
| `lib/utils.ts` | `cn()` classname helper (shadcn) |

### 4.6 `sanity/` — CMS

| File | What it does |
|---|---|
| `sanity/env.ts` | Project id, dataset, apiVersion from env |
| `sanity/lib/client.ts` | **Public read client** (`useCdn: true`, no token) — used by the browser |
| `sanity/lib/server-client.ts` | **Server write client** (`useCdn: false`, token) — used by API routes & webhook |
| `sanity/lib/image.ts` | `urlFor()` image URL builder |
| `sanity/lib/live.ts` | Sanity Live (real-time content) |
| `sanity/schemaTypes/index.ts` | Registers schemas: `product`, `user`, `order`, `discountCode` |
| `sanity/schemaTypes/product.ts` | Product schema — name, description, price, stock, category, category_slug, images, size, qcom_availability, brand, tags, ratings, created_at |
| `sanity/schemaTypes/user.ts` | User schema — role (user/admin), name, email, hidden bcrypt password, avatar image |
| `sanity/schemaTypes/order.ts` | Order schema — order_id, status (pending/paid/failed/refunded), customer_email/name, items[] (product ref + name + price + qty + size), subtotal, discount_code, discount_amount, total, currency, stripe_session_id, stripe_payment_intent_id, created_at |
| `sanity/schemaTypes/discountCode.ts` | Discount code schema — code, type (percent/fixed), value, active, maxUses, usedCount, expiresAt |
| `sanity/structure.ts` | Studio sidebar structure |
| `sanity.config.ts` | Studio config — basePath `/studio`, vision tool |
| `sanity.cli.ts` | Sanity CLI config |

### 4.7 `scripts/`

| File | What it does |
|---|---|
| `scripts/importData.mjs` | Seeds products from the old backend + demo discount codes (`WELCOME10`, `FIXED5`) into Sanity. Run: `npm run import-data` |
| `scripts/syncProducts.ts` | Syncs Sanity products → Typesense search index (needs `TYPESENSE_ADMIN_KEY`) |
| `scripts/client.ts` | Sanity client for scripts |

### 4.8 `hooks/`, `types/`, `utils/`, `css/`, `fonts/`

- `hooks/useColorMode.tsx` (dark-mode), `useLocalStorage.tsx`, `use-mobile.tsx` — admin theme helpers
- `types/` — TailAdmin template TypeScript types (brand, cards, chat, country, faq, Lead, package, product, products)
- `utils/validation.ts` — `validateEmail`, `validatePassword` (≥6), `validateName` (≥2) used by `/api/register`
- `css/satoshi.css` + `css/style.css` + `fonts/` — TailAdmin theme (Satoshi font, dashboard styles)
- `app/globals.css` — global styles

---

## 5. Authentication (NextAuth v5)

**File: `auth.ts`** — the single source of truth (the route handler `app/api/auth/[...nextauth]/route.ts` just re-exports `handlers`).

- **Provider:** Credentials (email + password)
- **authorize():** fetches the user from Sanity by email (`*[_type == "user" && email == $email][0]`), compares the **bcrypt** hash, returns `{ id, email, name, role }`
- **JWT callback:** persists `id` + `role` into the token
- **session callback:** exposes `session.user.id` + `session.user.role` (reads role from the token so it survives refreshes)
- `trustHost: true` (required behind Vercel), `pages.signIn = "/login"`, `AUTH_SECRET` from env
- **Roles:** `user` (default) vs `admin`. Admins are created by:
  1. Registering normally, then
  2. Calling `/api/promote` (admin-only) with the target email, **or**
  3. The owner fallback email (`ibaduddinsiddiqui418@gmail.com`) is treated as admin in `lib/admin.ts`

**Admin gating:** `requireAdmin()` (server pages) redirects to `/denied`; API routes use `isAdmin(session)` and return **401**.

---

## 6. Data Layer (Sanity — the real database)

The live site uses **Sanity** as its database. Sanity document types:

| Type | Purpose | Key fields |
|---|---|---|
| `product` | Catalog items | name, price, stock, category, category_slug, images[], size[], brand, tags, ratings |
| `user` | Accounts | role, name, email, password (bcrypt), avatar |
| `order` | Purchases | order_id (uuid), status, customer_email, items[] (product ref, name, price, qty, size), subtotal, discount_code, discount_amount, total, currency, stripe_session_id, stripe_payment_intent_id |
| `discountCode` | Promo codes | code, type (percent/fixed), value, active, maxUses, usedCount, expiresAt |

**Two clients:**
- `sanity/lib/client.ts` (public, CDN, no token) — storefront reads
- `sanity/lib/server-client.ts` (token, `useCdn: false`) — all writes + webhook + admin

---

## 7. User Flows (end to end)

### 7.1 Browse & search
1. Home (`/`) → sections pull products from Sanity (MensClothing/Accessories/Browse grids via `getSanityProducts`)
2. Search bar (Header) → Typesense instant search (`/search`) — must be synced via `scripts/syncProducts.ts`
3. `/products/[category]/[productId]` → product detail (gallery, ratings, stock badge, size section, Add to Cart / Wishlist)

### 7.2 Cart & wishlist
1. **Add to Cart** (AddToCartButton) → Zustand store → badge updates in header
2. `/cart` → edit quantities (clamped to stock), remove items, **apply discount code** (validated by `/api/validate-discount`)
3. **Proceed to Checkout** → hosted Stripe Checkout (session flow)

### 7.3 Payment (two flows)
**Flow A — Hosted Checkout (from the cart page):**
1. Cart → `GET /api/create-checkout-session` with items + discountCode
2. Server: fetches REAL products from Sanity → validates discount → **creates a `pending` order** → builds line items (discount folded into unit amounts because Stripe rejects negative line items) → creates Stripe Checkout Session with `metadata.order_id`
3. Browser → `stripe.redirectToCheckout(sessionId)`
4. Customer pays on Stripe's page → redirected to `/checkout/success?session_id=...` (cart cleared)

**Flow B — Embedded card form (from `/checkout`):**
1. Checkout page → `CheckOut.tsx` PaymentForm (email + CardElement)
2. `POST /api/create-payment-intent` {items, customerEmail, discountCode}
3. Server: same server-side total computation → pending order → Stripe `payment_intent.create` → returns `client_secret`
4. Client: `stripe.confirmCardPayment(clientSecret)` → success message

### 7.4 Webhook fulfillment (both flows)
1. Stripe fires `payment_intent.succeeded` / `checkout.session.completed` → **`/api/webhook`**
2. Signature verified with `STRIPE_WEBHOOK_SECRET` (else 400)
3. Order found by `metadata.order_id`
4. **Fulfill (idempotent):**
   - Persist the Stripe-collected customer email (if missing) — *note: recent bug fix for empty-string emails*
   - **Decrement product stock** (single Sanity transaction, never below 0)
   - **Email the receipt** (Brevo SMTP; failures are logged, never block the webhook)
   - **Mark order `paid`** atomically (`ifRevisionId` optimistic lock prevents double-fulfill)
   - **Increment discount usage** (atomic `.inc`)

### 7.5 Admin operations
1. Login as admin → `/adminpanel`
2. **Orders** (`/adminpanel/orders`) — table of all orders; click a row → detail (`/adminpanel/orders/[orderId]`): customer, Stripe session/PI IDs, line items (names link to the storefront product AND to Sanity Studio edit), totals, and a **status dropdown** (pending/paid/failed/refunded → PATCH `/api/orders/[orderId]/status`)
3. **Discounts** (`/adminpanel/discounts`) — create/edit/enable/disable/delete codes via `DiscountCodesManager` (POST/PATCH/DELETE `/api/discount-codes*`)

---

## 8. Code Flow — Payment Totals (the money path)

```
Client cart (Zustand)                    Server (Next.js API)                    Stripe
─────────────────────                    ────────────────────                    ──────
items[{id, qty}]      ────────────────►  fetchProductsByIds → REAL Sanity prices
discountCode="WELCOME10"                 validateDiscountCode(code, subtotal)
                                          ✓ active · not expired · under maxUses
                                          discountAmount = min(subtotal×10%, subtotal)
                                         subtotal = Σ price×qty
                                         total = subtotal − discount + DELIVERY_FEE($5)
                                         amountCents = round(total×100)   ← client can't influence this
                                          ──► createPendingOrder(status: "pending")
                                          ──► stripe.paymentIntents.create / checkout.sessions.create
                                          ◄── client_secret / session_id
Client confirms card ─────────────────►   ◄── webhook: payment_intent.succeeded
                                          ──► mark paid · decrement stock · email receipt · bump usage
```

---

## 9. Search (Typesense)

- `lib/typesense.ts` sets up the client (host/port/protocol + search key from `NEXT_PUBLIC_TYPESENSE_*`)
- `ProductSearch` + `/search` use `react-instantsearch` + `typesense-instantsearch-adapter`
- Index must be populated by `node scripts/syncProducts.ts` (uses `TYPESENSE_ADMIN_KEY`) after product changes
- If search shows nothing: the `products` collection doesn't exist yet, or the search key is wrong

---

## 10. The Legacy Backend (`hackathon_3_backend_server/`)

An **Express + MongoDB (Mongoose)** REST server — **NOT used by the live site** (the site is Sanity-backed). It exists as a leftover from the hackathon:

| File | What it does |
|---|---|
| `server.js` | Express app on port 5000, mounts `/api/products` |
| `config/db.js` | Mongoose connect via `MONGO_URI` |
| `models/product.js` | Mongoose product schema |
| `routes/productRoutes.js` | Full CRUD: GET all, GET by id, POST, PUT, DELETE |
| `seeds/products.json` + `seeds/seed.js` | Seed data |
| `readme.md`, `package.json` | Its own docs/deps (express, mongoose, dotenv, nodemailer, next-auth v4, …) |

**Status:** runs independently (`cd hackathon_3_backend_server && npm run dev`), but nothing in the Next app calls it. It was historically the data source for `scripts/importData.mjs` (products were fetched from it and pushed to Sanity). **Can be archived/deleted** — see §14.

---

## 11. What's DONE ✅

- ✅ Storefront: home, products, category, product detail (gallery/ratings/wishlist/related), cart, wishlist, search
- ✅ Auth: register (validated + bcrypt), login, session, dashboard + avatar upload, logout, admin role via promote
- ✅ Admin panel: dashboard, **orders list + detail** (with product links to storefront & Studio), **order status changer**, **discount-code manager** (create/edit/toggle/delete)
- ✅ Payments: **real totals** (no more hardcoded $10), server-computed amounts, both Stripe flows, discount codes validated **server-side** and folded into checkout line items (Stripe negative-line-item bug fixed), webhook fulfillment (paid + stock + email + usage count), pending-order-before-charge pattern
- ✅ Email receipts via Brevo SMTP (requireTLS fix), verified live
- ✅ Stripe webhook wired & verified live with a real test-card payment (order `paid`, stock 90→89, email persisted)
- ✅ Discount codes seeded: `WELCOME10` (10%), `FIXED5` ($5)
- ✅ Security: server-side pricing, `isAdmin` single source of truth, 401/307 gating, signature-verified webhook, optimistic-lock fulfillment
- ✅ tsc + eslint clean; `npm run build` verified earlier

## 12. What's MISSING / SHOULD BE DONE ⚠️

### Bugs / issues found & fixed during this work
- ✅ (fixed) Checkout-session discount broke with "Invalid non-negative integer" — negative line items are invalid in Stripe Checkout → discount now folded into unit amounts (verified: $69.99−$5=$64.99, 2×$19.99−$4=$35.98, multi-item carry-over exact)
- ✅ (fixed) `persistCustomerEmail` treated `''` as "already set" → Stripe-collected emails were never saved to orders → now `.set()` with trim-guard

### Missing / recommended work
| Item | Notes |
|---|---|
| **STRIPE_WEBHOOK_SECRET in production** | Set locally + on Vercel. Local: `stripe listen --forward-to localhost:3000/api/webhook`; Prod: Stripe Dashboard → webhook endpoint `https://<app>/api/webhook` (events `payment_intent.succeeded`, `checkout.session.completed`) |
| **Product management UI** | Products are edited only via Sanity Studio (`/studio`) — there's no admin CRUD page for products (only the old TailAdmin tables template). Consider an admin products page. |
| **Order status filter / search** | Orders list has no filter tabs or search yet |
| **Stock sync on admin edits** | Stock is decremented on payment, but nothing re-syncs if an order is refunded (a refund should restore stock) |
| **Refund flow** | `refunded` status exists in the schema + status changer, but there's no Stripe refund call or stock-restore logic behind it |
| **Deploy to Vercel** | `DEPLOYMENT.md` is complete — deploy, add env vars, CORS for Sanity, webhook endpoint, custom domain |
| **Rotate API keys** | Keys were historically committed; regenerate before launch (see DEPLOYMENT.md) |
| **Duplicate payment components** | `app/components/Payments/` (StripePayment.tsx + Payments.tsx) duplicates `app/components/CheckOut/CheckOut.tsx` and sends only `amount` (old API) — should be deleted or reworked |
| **`auth.config.ts`** | Dead config (providers: []) — can be removed since `auth.ts` is authoritative |
| **Stray files** | `app/category.tsx`, `app/product.tsx` are unused; `data.ms/` is a local datastore artifact; `chakra` + `module_name` deps look like accidental installs |
| **Legacy backend** | `hackathon_3_backend_server/` isn't used by the site — archive or remove to reduce confusion |
| **Delivery fee** | $5 hardcoded in the UI (`app/cart/page.tsx`, `app/checkout/page.tsx`) but `lib/constants.ts` is the server source — the UI should read `DELIVERY_FEE` from the constant to avoid drift; also the checkout-session flow's stored order total doesn't include delivery (payment-intent flow does) — decide one consistent policy |
| **Rate limiting / abuse** | Payment-intent has a $10k cap; consider rate limiting on register/payment endpoints |
| **Tests** | No automated tests exist — add unit tests for discount math + webhook idempotency |
| **Sanity desk customization** | `sanity/structure.ts` is minimal — could group orders/codes into admin views |
| **"QCOM availability" field** | Present in schema but unused in the UI |

---

## 13. Environment Variables (`.env.local`)

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project (`xphvex0e`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset (`production`) |
| `NEXT_PUBLIC_SANITY_TOKEN` / `SANITY_API_TOKEN` | Server write token |
| `NEXT_PUBLIC_TYPESENSE_HOST/PORT/PROTOCOL` | Typesense endpoint |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | Public search key |
| `TYPESENSE_ADMIN_KEY` | Server key (sync script) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) — from `stripe listen` or the dashboard |
| `AUTH_SECRET` | NextAuth secret |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` (or `465` for SSL) |
| `SMTP_USER` | **Brevo login shown on the SMTP tab** (e.g. `xxxx@smtp-brevo.com` — NOT the account email) |
| `SMTP_PASS` | Brevo SMTP key (`xsmtpsib-...`) |
| `EMAIL_FROM` | Sender shown on receipts |

---

## 14. Deployment Summary (short version)

Full guide in `DEPLOYMENT.md`. Quick steps:
1. `npm run build` passes → commit & push to GitHub (`IbadUddinSiddqui/hackathon-2`)
2. Import into **Vercel**, paste all env vars from §13
3. Sanity: allow the Vercel domain in CORS + public reads
4. Stripe Dashboard → Webhooks → add `https://<app>/api/webhook` with both payment events → copy signing secret to `STRIPE_WEBHOOK_SECRET`
5. Typesense: run `node scripts/syncProducts.ts` to populate the index
6. Test: register → login → browse → cart → discount code → pay with test card `4242 4242 4242 4242` → verify order is `paid`, stock decremented, receipt emailed
7. Add the client's custom domain in Vercel (A record `76.76.21.21` / CNAME `cname.vercel-dns.com`)

---

## 15. Quick Reference — Where Things Live

| "I want to..." | Go to |
|---|---|
| Change the delivery fee | `lib/constants.ts` |
| Add a discount code | `/adminpanel/discounts` or Sanity Studio |
| Change receipt email design | `lib/email.ts` |
| Change payment logic | `app/api/create-payment-intent/route.ts`, `app/api/create-checkout-session/route.ts` |
| Change webhook fulfillment | `app/api/webhook/route.ts`, `lib/orders.ts` |
| Add a product | Sanity Studio `/studio` |
| Change admin gating | `lib/admin.ts` |
| Change order admin UI | `app/adminpanel/orders/*` |
| Sync search index | `node scripts/syncProducts.ts` |
| Seed demo codes/products | `npm run import-data` |
| Deploy | `DEPLOYMENT.md` |

---

*Generated for the Bazaar Nest client project. Last updated: Aug 2026.*
