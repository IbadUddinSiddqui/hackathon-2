# TYPE SCALE — ANK'S Storefront (Redesign P03)

**Governing brief:** `BRAND_BRIEF.md` §8 (Typography Doctrine).
**Current state:** heading scale was flattened in v2 to `text-3xl/4xl font-bold tracking-tight` everywhere (30–36px), with the hero as the only exception (`text-4xl sm:text-5xl md:text-6xl`). Eyebrow pattern exists and is kept.
**This doc:** the 7-role scale. Implemented as classes in `app/globals.css` (`@layer components`) — `.text-display`, `.text-display-sm`, `.text-h1/2/3`, `.text-product-name`, `.text-price`, `.text-nav`, `.text-eyebrow`.

---

## 1. The scale

| Role | Font | Size | Weight | Tracking | Line-height | Used for |
|---|---|---|---|---|---|---|
| **Display** | Fraunces (serif) | `clamp(2.5rem, 6vw, 5.5rem)` → 40–88px | 400 | −0.02em | 1.05 | Hero headline, campaign moments ONLY |
| **Display-sm** | Fraunces | `clamp(2rem, 4.5vw, 3.5rem)` → 32–56px | 400 | −0.015em | 1.1 | Sub-campaign moments (bento featured tile) |
| **H1** | Geist | 40px | 700 | −0.02em | 1.15 | Page titles, campaign section heads |
| **H2** | Geist | 32px | 700 | −0.015em | 1.2 | Section heads (New Arrivals, Top Sale…) |
| **H3** | Geist | 24px | 600 | −0.01em | 1.25 | Sub-sections, group headers |
| **Product Name** | Geist | 28px | 600 | −0.01em | 1.2 | PDP product name (its own tier, not a generic heading) |
| **Price** | Geist | 24px | 600 | −0.01em | 1.2 | Prices — `tabular-nums`, deliberate weight |
| **Nav** | Geist | 13px | 500 | +0.12em | 1 | Nav links (uppercase, wide-tracked) |
| **Body** | Geist | 16px | 400 | 0 | 1.6 | Paragraphs, descriptions |
| **Body-sm** | Geist | 14px | 400 | 0 | 1.55 | Secondary paragraphs |
| **Metadata** | Geist | 12px | 500 | +0.06em | 1.4 | Stock status, SKU, captions |
| **Eyebrow** | Geist | 12px | 700 | +0.2em | 1 | Section labels (kept from v1 — already on-brand) |

## 2. Before / after deltas vs the flattened scale

| Role | Before (v2) | After | Delta |
|---|---|---|---|
| Hero headline | 36px → 60px (4xl→6xl, sans bold) | 40 → **88px** serif, hairline tracking | **+47% at max** — the campaign statement |
| Page/section head | 30–36px bold | H1 40px / H2 32px | H1 **+11%**, H2 ≈ same — hierarchy restored between tiers |
| PDP product name | 36px (same as section head) | **28px** own tier | deliberate *reduction* — distinct from section heads |
| Price | 36px bold (same as name) | **24px tabular** | rebalanced — price gets weight via figures, not size alone |
| Sub-heads | 30px (everything was 30/36) | H3 24px | −20% — sub-heads stop competing |
| Nav link | 15px medium, sentence case | **13px uppercase, +0.12em** | tighter, editorial |
| Metadata | 14px gray | **12px, +0.06em** | quieter captions |

## 3. Mobile steps (real reduction, not clamp-afterthought)

- **Display:** desktop up to 88px → **40px floor** on small screens (clamp does real work; never wraps mid-word awkwardly, `line-height 1.05` holds).
- **H1:** 40px → 32px under `sm`. **H2:** 32px → 28px under `sm`.
- **Rule:** display type must never push the primary CTA below the fold on a 375px viewport — P05/P10 verify this per page.

## 4. Urdu (Nastaliq) — enforced in `globals.css`

- `html[lang="ur"]` keeps `Noto Nastaliq Urdu` at `line-height: 1.9` for body/controls.
- **P03 addition:** `.text-display`, `.text-display-sm`, `.text-nav`, `.text-eyebrow` are overridden to Nastaliq in Urdu mode with `letter-spacing: 0` and `text-transform: none` — wide tracking breaks Nastaliq cursive joining, and uppercase does nothing but harm. Fraunces is **never** applied to Urdu text.
- Display-size Nastaliq needs the tall 1.9 line-height — verified at the largest Display size in P21.

## 5. Rules of use

- **Display is reserved.** Hero + campaign/editorial moments only — never buttons, nav, body, or product names. Violations of this rule are the #1 sign a page has drifted (P22 checks).
- Product Name ≠ H1; Price ≠ Product Name. Each tier is its own treatment.
- When in doubt, **Metadata-quieter, Display-rarer** — the brand speaks in contrast, not volume.
