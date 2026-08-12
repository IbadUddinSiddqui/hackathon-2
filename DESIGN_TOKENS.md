# DESIGN TOKENS — ANK'S Storefront (Redesign P02)

**Governing brief:** `BRAND_BRIEF.md` §7 (Color & Accent Doctrine).
**Scope:** customer-facing storefront. The TailAdmin token set (`primary #3C50E0`, `secondary #80CAEE`, `meta` 1–10, `body #64748B`, `stroke`, `success/danger/warning`) is now **admin-only** and untouched so the admin panel keeps working.

---

## 1. Foundation tokens

Defined as CSS custom properties in `app/globals.css` (`:root` + `.dark`), surfaced as Tailwind colors in `tailwind.config.ts` (`brand-*`).

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--brand-ink` / `bg-brand-ink` | `#0B0B0C` | `#EDEAE3` | Primary text + primary buttons on light; becomes light text/buttons in dark |
| `--brand-ink-soft` | `#141416` | `#C9C4BB` | Secondary dark surface (footer), secondary text in dark |
| `--brand-ink-inverse` | `#F5F3EF` | `#0B0B0C` | Text on ink surfaces (buttons, banner) |
| `--brand-surface` | `#FAF9F6` | `#0B0B0C` | Page surface (warm off-white / near-black) |
| `--brand-surface-alt` | `#F5F3EF` | `#141416` | Elevated/differentiated surface (drawer, cards, hovers) |
| `--brand-charcoal` | `#2A2A2C` | `#2A2A2C` | Desaturated midtone; banner gradient; hover fills in dark |
| `--brand-line` | `#E8E4DC` | `#232327` | Hairline borders/dividers |
| `--brand-line-strong` | `#CFCAC0` | `#34343A` | Stronger borders, outline buttons |
| `--brand-muted` | `#6E6A63` | `#97928A` | Secondary text, captions, disabled |

## 2. Functional tokens (the ONLY non-neutral colors — fixed semantics)

| Token | Light | Dark | Semantic |
|---|---|---|---|
| `--brand-ok` / `-soft` | `#2F7D4F` / `#E7F2EB` | `#4CAF6E` / 12% | In stock, success, discount-applied |
| `--brand-bad` / `-soft` | `#B3392E` / `#F9EAE8` | `#E2685F` / 12% | Errors, out of stock, remove actions |
| `--brand-sale` / `-soft` | `#C2410C` / `#FBEEE2` | `#E0763A` / 12% | Sale / flash discount badges |
| `--brand-warn` / `-soft` | `#8A5A00` / `#FBF0DB` | `#D9A441` / 12% | Validation warnings, low stock |
| `--brand-heart` | `#E0483E` | `#E0554D` | Wishlist heart (decorative, fixed across tenants) |

All functional pairs hit WCAG AA on both surfaces. **Never use a functional color decoratively** (e.g., don't color a button `brand-ok` because green "looks nice").

## 3. Radius & elevation

| Token | Value | Role |
|---|---|---|
| `--brand-radius-sm` | 2px | chips, checkmarks |
| `--brand-radius` | 4px | inputs, buttons, small cards |
| `--brand-radius-lg` | 8px | dropdowns, drawers (max radius on storefront) |
| `--brand-shadow-1` | hairline | resting cards |
| `--brand-shadow-2` | soft, low | header on scroll, floating pills |
| `--brand-shadow-3` | deep, tight | overlays/dropdowns only |

Depth comes from surface tone and photography — **never** soft-glow SaaS shadows.

## 4. Tenant-accent mechanism (verified, preserved)

The tenant accent is **not** a CSS variable. It flows from Sanity → `lib/tenants.ts` → `TenantProvider` (React context) → consumed as inline `style={{ backgroundColor: accent }}` in: **Header cart badge, Hero headline span, CategoryShowcase hover wash, AddToCartButton, login/register pages.** This mechanism is load-bearing (multi-tenant SaaS) and **unchanged** by P02.

**Role narrowing (per Brand Brief §7):** accent is used for *price emphasis, active states, and the odd editorial underline* — never as a dominant CTA hue. CTAs use `brand-ink`/`brand-surface` contrast instead. The inline-style consumers stay until their owning prompt (P05 hero, P08 card, P10 PDP) re-skills them.

## 5. Deprecated tokens (admin-only from here)

`primary #3C50E0` · `secondary #80CAEE` · `body #64748B` · `meta 1–10` · `stroke` / `strokedark` · `graydark` · `boxdark` · `whiten/whiter` · `success/danger/warning` (old values) — all still defined for the admin panel; **do not use them in new storefront code.**

## 6. 1:1 mapping of every current customer-facing color consumer

| Where (file) | Current class | New token | Notes |
|---|---|---|---|
| ProductCard sale badge | `bg-red-500` | `bg-brand-sale` | P08 |
| ProductCard out-of-stock | `text-red-500` | `text-brand-bad` | P08 |
| PDP flash-sale badge | `bg-red-100 text-red-700` | `bg-brand-sale-soft text-brand-sale` | P10 |
| PDP stock badge | `bg-green-100 text-green-800` | `bg-brand-ok-soft text-brand-ok` | P10 (needs dark variant — currently light-only) |
| PDP rating stars | `text-yellow-400` | **gold kept** (decision deferred to P15) | explicit exception, documented |
| Wishlist heart (header, PDP) | `text-red-400` / `bg-red-400` | `text-brand-heart` / `bg-brand-heart` | P04 header already done |
| AddToCart in-cart ping | `bg-green-500` | `bg-brand-ok` | P10 re-skin of colors only |
| AddToCart low-stock note | `text-amber-600` | `text-brand-warn` | P10 |
| Cart success message | `text-green-600 dark:text-green-400` | `text-brand-ok` | P12 |
| Cart error / remove | `text-red-500` / `bg-red-500` | `text-brand-bad` / `bg-brand-bad` | P12 |
| Checkout error alert | `bg-red-100 text-red-700` | `bg-brand-bad-soft text-brand-bad` | P13 |
| Checkout total emphasis | `text-red-500` | **flag → P13**: total shouldn't be red; use `text-brand-ink` w/ Price type | design call |
| Login/Register error | `bg-red-50 text-red-600` | `bg-brand-bad-soft text-brand-bad` | P17 |
| Footer newsletter error | `text-red-400` | `text-brand-bad` | P16 |
| Search QCOM chip | `bg-green-100 text-green-800` | `bg-brand-ok-soft text-brand-ok` | P11 |
| Filter FAB | green fill | → ink/neutral (`bg-brand-ink`) | P09 (utility affordance, not status) |

## 7. Dark-mode parity

Every foundation + functional token is defined in **both** `:root` and `.dark` — dark is the primary mode (per Brand Brief), light the well-supported secondary. No storefront component may use a light-only literal (`#212020`, `bg-white`…) when a token exists; stragglers are normalized in their owning prompt's pass.
