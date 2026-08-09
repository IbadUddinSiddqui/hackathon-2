# 📘 PROJECT BRIEF — "Bazaar Nest" E-Commerce Storefront

> **Purpose of this document:** Complete, end-to-end technical summary of the project
> (architecture, code, data flow, current state, and known gaps). Give this to any AI
> or developer to understand the codebase and plan changes to turn it into a client
> deliverable.

---

## 1. What this project is

A **clothing / fashion e-commerce storefront** ("Bazaar Nest") built for a hackathon,
now being prepared for a real client as a local clothing brand. Customers can browse
products, filter by brand/size/tag, search, add to cart/wishlist, and pay via Stripe.
An admin panel exists for managing the store (currently mostly a dashboard shell).

**Branding note:** The site is still named "Bazaar Nest" with Bazaar Nest logos — the
client's real branding must replace these before delivery (see Section 11).

---

## 2. Tech stack (from `package.json`)

| Layer | Technology | Version | Role |
|---|---|---|---|
| Framework | **Next.js (App Router)** | ^15.1.6 | Pages, routes, API routes, SSR |
| UI framework | **React** | ^19.0.0 | Rendering |
| Language | **TypeScript** | ^5 | Type safety |
| Styling | **Tailwind CSS** + Chakra UI v3 | ^3.4.1 / ^3.2.3 | Styling |
| CMS / database | **Sanity** | ^3.71.2 | Products + users + avatars (the real "database") |
| Search | **Typesense Cloud** | ^1.8.2 | Live search + product listing fallback |
| Payments | **Stripe** | ^17.6.0 | Checkout Sessions, Payment Intents, Webhooks |
| Auth | **NextAuth v5 (beta)** | ^5.0.0-beta.25 | Credentials login, admin roles |
| State | **Zustand** + persist | ^5.0.3 | Cart & wishlist (localStorage) |
| Animation | **Framer Motion** | ^12.4.0 | UI micro-interactions |
| Icons | react-icons, lucide-react | — | Icons |
| Charts (admin) | ApexCharts + react-apexcharts | ^4.4.0 | Admin dashboard charts |
| Other notable | next-themes, swiper, nodemailer, uuid | — | Dark mode, carousels, email, IDs |

**Key architectural decision:** There is **no traditional backend database in the main app**.
Sanity IS the data layer (products, users, avatars). A separate Express+MongoDB backend
exists as a git submodule (`hackathon_3_backend_server`) but is **legacy/parallel work —
the frontend never calls it**. It can be ignored or deleted.

---

## 3. High-level architecture & data flow

```
Browser (React client components)
   │
   ├─► Sanity (public read client, no token)  ──  products, users-on-login
   │     sanity/lib/client.ts  (CDN reads)
   │     lib/sanity/product.ts (GROQ queries)
   │
   ├─► Typesense Cloud (search-only key, public) ──  live search dropdown
   │     lib/typesense.ts, app/components/ProductSearch/ProductSearch.tsx
   │
   ├─► Next.js API routes (server-side) ── auth, Stripe, uploads
   │     app/api/* (NextAuth, register, promote, upload, checkout, webhook)
   │
   └─► Zustand stores (localStorage) ── cart + wishlist (client-only state)

Server-side (Node):
   ├─► Sanity server client (WITH write token) ──  writes (register, promote, upload)
   │     sanity/lib/server-client.ts  (NEVER imported by client components)
   ├─► Stripe API (secret key) ──  create sessions / payment intents
   └─► Sanity Studio (embedded at /studio) ──  admin CMS for products/users
```

### The two Sanity clients (important)

| File | Token? | Used for |
|---|---|---|
| `sanity/lib/client.ts` | No token | Public reads from browser: products, login lookup |
| `sanity/lib/server-client.ts` | `SANITY_API_TOKEN` | Writes: registration, promotion, avatar upload |

Rule: **`server-client.ts` must never be imported from a client component** (the token
would leak into the browser bundle).

---

## 4. Directory structure (the important parts)

```
app/
├─ page.tsx                     → Home: Hero, Sponsors, NewArrivals, TopSale, Browse, Testimonials
├─ layout.tsx                   → Root layout (fonts, Chakra Provider, SessionProvider)
├─ products/
│  ├─ page.tsx                  → All-products listing (Sanity+Typesense merge, filters, pagination)
│  └─ [category]/
│     ├─ page.tsx               → Category listing (same pattern, filtered by category_slug)
│     └─ [productId]/page.tsx   → Product detail page
├─ cart/page.tsx                → Cart (Zustand), Stripe Checkout redirect
├─ checkout/page.tsx            → Checkout w/ Stripe CardElement (PaymentIntent flow)
├─ checkout/success/page.tsx    → Post-payment success (clears cart)
├─ wishlist/page.tsx            → Wishlist
├─ search/page.tsx              → Search results page
├─ login/page.tsx               → Login (NextAuth credentials)
├─ register/page.tsx            → Register
├─ dashboard/page.tsx           → User dashboard (profile + avatar upload)
├─ adminpanel/page.tsx          → Admin panel (role-gated)
├─ denied/page.tsx              → Access denied
├─ calendar/page.tsx, category.tsx, product.tsx, profile, settings  → misc pages
├─ studio/[[...tool]]/page.tsx  → Embedded Sanity Studio
└─ api/
   ├─ auth/[...nextauth]/route.ts  → NextAuth handler (re-exports from auth.ts)
   ├─ auth/logout/route.ts         → Stub logout route
   ├─ register/route.ts            → Create user (bcrypt hash → Sanity)
   ├─ promote/route.ts             → Promote user to admin (admin-only)
   ├─ upload/route.ts              → Avatar upload to Sanity (auth required)
   ├─ create-checkout-session/route.ts → Stripe Checkout Session
   ├─ create-payment-intent/route.ts   → Stripe PaymentIntent (hardcoded $10!)
   └─ webhook/route.ts             → Stripe webhook (signature verified)
app/components/   → Header, Footer, Hero, ProductsGrid, ProductDetails, ProductSearch,
                    AddToCartButton, CheckOut, Sidebar (admin), etc.
auth.ts           → ★ Single NextAuth config (source of truth)
lib/
├─ sanity/product.ts   → SanityProduct type + GROQ queries
├─ stores/cartStore.ts → Zustand cart (persisted to localStorage)
├─ stores/wishlistStore.ts → Zustand wishlist
├─ typesense.ts        → Typesense search + admin clients (env-config'd)
└─ get-stripe.js       → Stripe.js singleton loader
sanity/
├─ schemaTypes/        → Sanity schemas: product, user, index
├─ lib/client.ts       → public client
├─ lib/server-client.ts→ token client (writes)
├─ lib/image.ts        → urlFor() image builder
└─ config.ts / env.ts  → Sanity project config
scripts/            → importData.mjs, syncProducts.ts (Typesense indexing)
DEPLOYMENT.md       → Vercel deploy guide + env checklist
PROJECT_BRIEF.md    → this file
```

---

## 5. Data model (Sanity schemas)

### `product` document (`sanity/schemaTypes/product.ts`)

| Field | Type | Notes |
|---|---|---|
| `name` | string | required |
| `description` | text | |
| `price` | number | required |
| `stock` | number | required |
| `category` | string | required |
| `category_slug` | string | required — used in URLs: `/products/{category_slug}/{slug}` |
| `images` | array of image | required, min 1 |
| `size` | array of string | required, min 1 |
| `qcom_availability` | boolean | default false |
| `brand` | string | used for filter |
| `tags` | array of string | used for filter |
| `ratings` | number | default 0 |
| `created_at` | datetime | auto default now |

### `user` document (`sanity/schemaTypes/user.ts`)

| Field | Type | Notes |
|---|---|---|
| `role` | string | 'user' \| 'admin' (radio), default 'user' |
| `name` | string | required |
| `email` | string | required, unique-ish (checked in code) |
| `password` | string | bcrypt hash, hidden field |
| `avatar` | image | optional, hotspot |

---

## 6. Core flows — code-level walkthrough

### 6.1 Product listing (`app/products/page.tsx`) — "the merge pattern"

Client component. On mount it fetches from **two sources and merges**:

```ts
// 1) Sanity (public client)
const sanityProducts = await client.fetch(`*[_type == "product"]{ _id, name, ratings, price, images, slug, brand, size, tags, category_slug }`);

// 2) Typesense (search API, q:'*' returns everything)
const typesenseResponse = await searchClient.collections('products').documents()
  .search({ q: '*', query_by: 'name,brand,tags', per_page: 100 });
const typesenseProducts = typesenseResponse.hits?.map(h => ({ ...h.document, _id: h.document.id })) || [];

// 3) Merge + dedupe by _id
const combined = [...sanityProducts, ...typesenseProducts]
  .filter((p, i, self) => self.findIndex(x => x._id === p._id) === i);
```

- Filters are client-side: `selectedBrands` / `selectedSizes` / `selectedTags` arrays
  combined with `.filter()`. Sidebar = `app/components/Sidebar/AppSidebar.tsx`.
- Pagination: 9 per page, slice-based.
- Cards link to `/products/${category_slug}/${slug || _id}`.

### 6.2 Category page (`app/products/[category]/page.tsx`)

Same pattern but GROQ filters `&& category_slug == $categorySlug` and Typesense uses
`filter_by: 'category_slug:...'`. Uses `use(params)` (Next 15 async params).

### 6.3 Product detail (`app/products/[category]/[productId]/page.tsx`)

- Reads product by id from Sanity, shows gallery (ProductGallery), ratings, size
  picker, stock badges, AddToCartButton, wishlist toggle, and a "You May Also Like"
  grid (ProductsGrid with 3D flip cards, framer-motion).
- `AddToCartButton.tsx` → `useCartStore.addItem(product)`.

### 6.4 Cart (`lib/stores/cartStore.ts`) — Zustand + localStorage

```ts
export const useCartStore = create<CartState>()(
  persist((set) => ({
    items: [],
    addItem: (product) => set((state) => { /* stock-clamped add */ }),
    removeItem: (productId) => /* filter out */,
    updateQuantity: (productId, quantity) => /* clamp 1..stock */,
    clearCart: () => set({ items: [] }),
  }), {
    name: 'sanity-cart-storage',
    storage: createJSONStorage(() => localStorage),
  })
);
```

Key behaviors:
- Stock-aware: refuses to add when `stock <= 0`, clamps quantity to `stock`.
- On add, builds `imageUrl` via `urlFor(product.images[0]).url()`.
- Persisted to localStorage key `sanity-cart-storage`.
- Note: the file imports React hooks (`useState`/`useEffect`) for a hydration helper —
  unconventional inside a store file, but works.

### 6.5 Wishlist (`lib/stores/wishlistStore.ts`)

Same pattern, persisted to `wishlist-storage`. Toggle add/remove, dedupe by `_id`.

### 6.6 Authentication — the consolidated setup

**Single source of truth:** `auth.ts` (root). The route handler re-exports it:

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

`auth.ts` uses a **credentials provider** backed by Sanity:

```ts
providers: [{
  id: "credentials", name: "Credentials", type: "credentials",
  async authorize(credentials) {
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]`, { email: credentials.email });
    if (!user) return null;
    const isValid = await bcrypt.compare(credentials.password, user.password);
    return isValid ? { id: user._id, email: user.email, name: user.name, role: user.role } : null;
  },
}],
callbacks: {
  async jwt({ token, user }) { if (user) { token.id = user.id; token.role = user.role || "user"; } return token; },
  async session({ session, token }) { session.user.id = token.sub; session.user.role = token.role || "user"; return session; },
},
```

Why callbacks matter: the `jwt` callback copies `role` into the token so it **survives
page refreshes** (the previous bug: role was read from the `user` object which is
undefined on later requests). Also `trustHost: true` (needed on Vercel) and
`pages.signIn = "/login"`.

**Registration** (`app/api/register/route.ts`): validates name/email/password, checks
duplicate email in Sanity, `bcrypt.hash(password, 10)`, creates `{ _type:"user", role:"user" }`
via `serverClient`.

**Promotion** (`app/api/promote/route.ts`): checks `session.user.role === 'admin'`,
then patches the target user's role to 'admin' in Sanity.

**Avatar upload** (`app/api/upload/route.ts`): requires auth, finds user by email,
uploads file with `serverClient.assets.upload('image', ...)`, patches user document
with an image reference.

**Admin gating:** `app/adminpanel/page.tsx` allows access when
`role === 'admin'` OR hardcoded fallback email.

### 6.7 Payments — Stripe

**Path A: Checkout Session (used by the cart page):**
`app/cart/page.tsx` → `handleCheckout()` POSTs items to `/api/create-checkout-session`
→ the route builds `line_items` (name, image, `unit_amount = price * 100` cents) →
returns `{ id }` → cart page calls `stripe.redirectToCheckout({ sessionId })`.
Success URL: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}` (was fixed
from a broken `?session_id?=` typo).

**Path B: Payment Intent (used by the checkout page):**
`app/checkout/page.tsx` shows an order summary + `<StripePayment amount={...} />` from
`app/components/CheckOut/CheckOut.tsx`. That component creates a PaymentMethod from
`CardElement`, POSTs to `/api/create-payment-intent`, then `confirmCardPayment(clientSecret)`.
⚠️ **Bug:** the API route hardcodes `amount: 1000` ($10) and ignores the body — the
checkout page computes the real total but it's never used. (See Section 11.)

**Webhook:** `app/api/webhook/route.ts` verifies the Stripe signature with
`STRIPE_WEBHOOK_SECRET` and logs `payment_intent.succeeded`. No DB write yet.

### 6.8 Search (`app/components/ProductSearch/ProductSearch.tsx`)

Live dropdown search against Typesense: `q`, `query_by: 'name,brand,tags'`, 12 results.
Uses `NEXT_PUBLIC_TYPESENSE_*` env vars (search key is public by design). Has its own
debounced input + results dropdown with loading/error states.

### 6.9 Home page (`app/page.tsx`)

Server component composing sections: Hero, Sponsors, NewArrivals (MensClothing),
TopSale (Accessories), Browse, Testimonials, wrapped in storefront Header/Footer.

### 6.10 Admin shell (`app/dashboard`, `app/adminpanel`, `app/components/Sidebar/*`)

A TailAdmin-style dashboard template (Sidebar + Header + charts + tables). Product
management UI is largely **shell/placeholder** — real CRUD against Sanity is not wired
into the admin panel. `app/components/ProductDetails/ProductDetails.tsx` is literally
lorem-ipsum placeholder form.

---

## 7. Environment variables (`.env.local` → must also exist on Vercel)

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | public | Sanity project id (`xphvex0e`) |
| `NEXT_PUBLIC_SANITY_DATASET` | public | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | public | `2025-01-27` (default) |
| `SANITY_API_TOKEN` | server | write token for register/promote/upload |
| `NEXT_PUBLIC_SANITY_TOKEN` | public fallback | used by server-client if `SANITY_API_TOKEN` unset |
| `NEXT_PUBLIC_TYPESENSE_HOST` | public | Typesense cluster host |
| `NEXT_PUBLIC_TYPESENSE_PORT` | public | `443` |
| `NEXT_PUBLIC_TYPESENSE_PROTOCOL` | public | `https` |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | public | search-only key |
| `TYPESENSE_ADMIN_KEY` | server | admin key (scripts only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | Stripe pk_ key |
| `STRIPE_SECRET_KEY` | server | Stripe sk_ key |
| `STRIPE_WEBHOOK_SECRET` | server | webhook signing secret |
| `AUTH_SECRET` (or `NEXTAUTH_SECRET`) | server | NextAuth session secret |

> ⚠️ **Security:** The old Sanity/Typesense keys were once committed to git history.
> **Rotate all keys** before client launch. They now live only in `.env.local` (gitignored).

---

## 8. Scripts (in `package.json`)

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbopack` | Local dev |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `eslint .` | Lint (fixed from deprecated `next lint`) |
| `import-data` | `node --env-file=.env.local scripts/importData.mjs` | Seed Sanity from `lib/products.json` |
| `sync-meilisearch` | `node scripts/syncToMeilisearch.js` | Legacy Meilisearch sync (unused) |

`scripts/syncProducts.ts` pushes products to the Typesense collection (needs
`TYPESENSE_ADMIN_KEY`).

---

## 9. Current verification status

- ✅ **TypeScript clean** (`tsc --noEmit` zero errors)
- ✅ **ESLint clean** (`eslint .` zero errors)
- ✅ **Production build passes** (verified; `next build` on this Windows machine
  intermittently throws a Windows-only `kill EPERM` filesystem flake — **does not occur
  on Vercel/Linux**)
- ✅ Local dev server runs on `localhost:3000`
- ✅ Deploy guide written: `DEPLOYMENT.md` (Vercel import, env vars, CORS, webhook, testing)

---

## 10. Known gaps / rough edges (in priority order)

1. **Hardcoded payment amount** — `create-payment-intent` ignores the cart and charges
   $10; `CheckOut.tsx` logs `amount` but doesn't send it.
2. **Discount code is fake** — cart/checkout show `discount = 10` and a discount input
   that does nothing.
3. **Delivery fee is fake** — hardcoded `deliveryFee = 5`, no shipping config.
4. **No order records** — successful payments are only logged in the webhook; no order
   is saved to Sanity/DB, no stock decrement, no email receipt (nodemailer installed
   but unused).
5. **Admin panel is a shell** — no product create/edit/delete UI wired to Sanity;
   `ProductDetails.tsx` is lorem-ipsum; sidebar has dead sections.
6. **Placeholder content** — Home sections, descriptions, testimonials are demo data.
7. **Typesense duplication** — products are fetched from both Sanity AND Typesense and
   merged client-side; Typesense data can drift from Sanity. Consider one source of truth.
8. **Auth logout route** — `app/api/auth/logout/route.ts` is a stub that doesn't
   actually end the session (the `LogoutButton` uses `signOut()` from next-auth/react
   which works).
9. **Legacy files** — unused `auth.config.ts`, `app/api/auth/signin`+`signup` were
   removed; Express submodule (`hackathon_3_backend_server`) is unused; Meilisearch
   script/deps unused; `@types/next-auth` v3 mismatched with next-auth v5.
10. **`create-payment-intent` returns no amount validation** and checkout page's
    `Proceed to Payment` button doesn't submit the form.

---

## 11. What it takes to be a client deliverable (suggested work)

**Branding & content**
- Replace "Bazaar Nest" name/logos/branding everywhere (Header, Footer, metadata,
  favicon, Home copy).
- Replace placeholder product descriptions, hero images, testimonials, and add the
  client's real product catalog (via Sanity Studio).

**Commerce hardening (must-do before real money)**
- Make `create-payment-intent` charge the **real cart total** from the request body.
- Wire the discount code to real coupon/promo logic (or remove the input).
- Persist **orders** (webhook → create Sanity `order` document), decrement stock,
  optionally email receipts (nodemailer is already a dependency).
- Set a real delivery/shipping fee model (or flat rate).

**Admin panel**
- Build product CRUD (create/edit/delete products in Sanity from the admin UI),
  order management, user management. Replace placeholder charts with real stats.

**Cleanup**
- Remove the Express submodule and unused scripts/deps if not needed.
- Rotate all API keys, ensure Sanity dataset access + CORS for the Vercel domain,
  configure the Stripe webhook endpoint on the live domain.
- Fix minor UX gaps (checkout button submitting, hydration of Zustand stores).

**Launch**
- Follow `DEPLOYMENT.md`: push, import to Vercel, set env vars, add domain,
  run post-deploy checklist (Sanity CORS, Stripe webhook, test payment with
  `4242 4242 4242 4242`).

---

*Generated from the live codebase. Pair with `DEPLOYMENT.md` for launch steps.*
