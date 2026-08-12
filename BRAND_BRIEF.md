# ANK'S — Brand Brief & Design Constitution

**Version:** 1.0 · **Status:** Ratified (Redesign Prompt 01 deliverable)
**Governing document for:** Redesign Prompts 02–22
**Scope:** Customer-facing storefront only. Admin panel, Sanity Studio, and API routes are intentionally out of scope (an admin pass would dilute the brand work and was never requested).

> **Authority rule:** Where any later prompt disagrees with this brief, this brief wins. Where a later prompt is silent, this brief's rules apply. Ambiguity in a design system becomes inconsistency in a product — this document is deliberately opinionated, and every later prompt cites it by name (e.g., *"per the Brand Brief, the accent is restrained to X uses"*).

---

## 1. Brand personality statement

> AnK's is a men's fashion label built on the tension between the tailored and the worn-in: garments cut with quiet discipline and lived in without apology. The brand speaks in low, precise voices — monochrome surfaces, sharp typography, and photography that treats a garment like an object of study rather than a billboard. AnK's doesn't chase seasons; it dresses men who would rather be noticed for how they move than what they're wearing. Every screen, from a product thumbnail to a checkout confirmation, should feel set by a designer who treats commerce as craft — never as a checkout funnel with a logo attached.

---

## 2. Three words

| This **is** | This is **not** |
|---|---|
| **Disciplined** — restraint is the aesthetic; every element must justify its existence or die | **Decorated** — no gratuitous effects, gradients, or chrome-as-personality |
| **Textured** — material honesty (fabric, grain, real photography) over flat digital decoration | **Corporate** — no template SaaS feel, no admin-panel vibe leaking into the storefront |
| **Precise** — typography does the talking; alignment, scale, and spacing are exact, never approximate | **Loud** — no shouting color, oversized-everything, or competing focal points |

---

## 3. Reference territory (verbal moodboards — deliberately no images, only territory)

1. **Aesop × Our Legacy — the calm.** Warm-neutral grounds, product photographed as an object on a quiet surface, generous whitespace, restrained serif/grotesk pairing, dense-but-quiet editorial detail. This is the *settled* register of the system: surfaces that never shout.
2. **SSENSE editorial × 032c — the drama.** Near-black canvases, oversized condensed display type, asymmetric type-over-image composition, campaign photography treated as magazine spreads rather than catalog shots. This is the *campaign* register: hero, bento, and any editorial moment.
3. **A Kind of Guise × Lemaire — the materiality.** Ink-and-muted-earth palette, slow pacing, tactile materials, small confident details — hairline rules, metadata captions, numbered editions, an underline where another brand would put a badge. This is the *detail* register: where the brand's care is proven.

Where the three meet: **dark-first, type-driven, photography-dominant, decoration-averse.** Any element that belongs to none of the three registers is not AnK's.

---

## 4. What we keep vs. what we replace

### 4.1 Keep — structural, non-negotiable
All routes, data-fetching patterns (Sanity / Typesense / Zustand), tenant scoping **and the tenant-accent mechanism** (the property that one token drives Add to Cart, badges, hero span, category wash is core to the SaaS model — preserved structurally), i18n EN/UR including Noto Nastaliq Urdu loading and 1.9 line-height, the Safepay/COD checkout flow, discount logic, size quiz, reviews, admin panel structure, and tenant-scoped SEO metadata generation.

### 4.2 Keep — motion physics, re-skin only
The interaction register is already right and stays: springs `260/24` and `280/24`, mobile-drawer `320/32`, the stroke-draw checkbox (`pathLength` 0→1, 0.22s easeOut, overshoot pop, press-squash), badge pops (`AnimatePresence scale 0→1`), the direction-aware `AnimatePresence` swap shared by checkout and the testimonials pager (64px slide, spring 260/24 enter, 0.18s exit), the marquee CSS scroll (20s linear, seamless duplication), skeleton pulses, the parallax mechanism (retained, kept subtle), nav-underline grow, and the qty-bubble pop + ping ring + stock-bar fill (these are **functional-signal animations and are protected even though playful**).

### 4.3 Replace — customer-facing visual language
- **Palette:** the TailAdmin-derived set (`primary #3C50E0`, `secondary #80CAEE`, `meta` status colors, `body #64748B`) as the storefront's identity → new ink / warm-off-white / charcoal foundation. Blue/purple/amber-as-decoration is gone from customer-facing pages; color is either neutral, the tenant accent (sparingly), or a fixed functional meaning (stock, sale, validation).
- **Radius:** `--radius: 0.5rem` rounded-everywhere → sharper, architectural radii (smaller or none); radius becomes a deliberate choice per surface, not a default.
- **Elevation:** soft-glow SaaS shadows (`0 8px 24px -12px` family) → flat, restrained elevation; depth comes from surface tone and photography, not shadow.
- **Chrome:** pill buttons and bordered-card-as-default → photography-dominant, type-forward surfaces. Typography carries the "premium," not gradients or shadows.
- **Type:** the flattened single heading scale (`text-3xl/4xl font-bold tracking-tight` everywhere) → a 7-role scale (§8). Reversed selectively, never wholesale.

### 4.4 Provisional cuts — final call in Prompt 19
- Hero collage 8s wobble (decorative, no narrative purpose)
- Floating dashed "thread" SVG (decorative, no narrative purpose)
- TailAdmin dead keyframes (`linspin`, `easespin`, `left-spin`, `right-spin`, `rotating`, `topbottom`, `bottomtop`, `line`, `line-revert` — confirmed present in `tailwind.config.ts`, used by no customer-facing component)

---

## 5. Design direction mix

- **~70% Dark editorial menswear** — the dominant note: near-black surfaces, editorial photography, type-driven composition
- **~15% Contemporary streetwear** — secondary texture: controlled edge, relaxed typography moments, campaign energy
- **~10% Tactile / experimental digital** — small doses: grain, material honesty, unexpected-but-quiet details
- **~5% Advanced 3D / interaction** — rare accents only, and only where assets exist to support them (see Prompt 20's "why here, not elsewhere" test)

**Explicitly rejected:** black+gold luxury cliché · generic serif-luxury · purple AI gradients · glassmorphism-as-default · neon · pill-button-everywhere.

---

## 6. The non-negotiable UX doctrine (quotable)

> **"Shoppability is never subordinate to art direction. Discovery, filtering, cart, checkout, and sizing confidence are product requirements that outrank any visual choice: no redesign decision may slow, hide, obscure, or complicate any of them — and any prompt that does is in violation of this brief, not making a 'trade-off.'"**

Operationally, every prompt's "what must not be changed" section derives from this sentence. Anything that looks premium but costs a conversion step is rejected on sight.

---

## 7. Color & accent doctrine → Prompt 02

- **Foundation:** near-black ink (`#0B0B0C`–`#141416` range), warm off-white (`#F5F3EF`–`#FAF9F6` range), a desaturated charcoal midtone for secondary surfaces, and a refined neutral-gray scale for borders/dividers.
- **One accent.** The tenant accent token stays exactly where it is structurally — but its **role** narrows to: price emphasis, active states, and the odd editorial underline. It is **never** the dominant hue of a CTA again.
- **Functional colors only** for non-neutrals: success/in-stock, error/out-of-stock, sale, and form validation — fixed semantic meaning, mutually distinguishable, WCAG AA in both modes.
- **Dark mode is the primary mode** (dark-first design, not a bolt-on); light mode is the well-supported secondary. Token parity from definition forward — never design light-first and backfill dark.
- The mechanism by which tenant branding overrides the accent is load-bearing and must survive every token change untouched.

## 8. Typography doctrine → Prompt 03

- **Workhorse:** Geist Sans stays for UI/body/nav. Geist Mono stays for code/monospace contexts (SKUs, order numbers). Satoshi remains admin-scope.
- **One display face** (condensed neo-grotesk or editorial serif) reserved **exclusively** for hero headline + campaign/editorial moments — never buttons, nav, or body copy.
- **Seven roles:** Display (hero/campaign — largest, dramatic) · Heading H1–H3 (section heads, category names) · Product Name (PDP — its own treatment) · Price (tabular figures, deliberate visual weight — a compositional element, not a number) · Nav (small, wide-tracked, uppercase-leaning) · Body (readable, restrained) · Metadata (smallest — stock, SKU, editorial captions).
- **Eyebrow pattern kept as-is:** `text-xs font-bold uppercase tracking-[0.2em]`, tenant accent — it already fits and needs no reinvention.
- **Urdu is sacred:** Noto Nastaliq Urdu auto-load for `lang="ur"` and 1.9 line-height preserved; Display/Heading tiers must be verified at the largest size for Nastaliq vertical rhythm and line-wrapping.
- **Mobile-scale steps for Display and Heading** are a real design deliverable, not a `clamp()` afterthought.

## 9. Motion personality → Prompt 19

**Words:** cinematic · smooth · physical · slow · precise · confident.

Two intentional speeds — this is the whole system:
- **Entrance register (slow/quiet):** hero, PDP, section reveals. Longer fades, quieter rises, unified reveals (mask/wipe candidates). *Cinematic, not bouncy.*
- **Interaction register (snappy/physical):** the existing springs (§4.2) — buttons, badges, checkboxes, pops, drawers. *Precise, not jittery.*

**Cutting rule:** if an effect exists only because it looks technically impressive, remove it. **Protection rule:** any animation that is the sole indicator of a state change (stock, badge counts, qty-bubble ping) survives even if playful. `prefers-reduced-motion` is respected everywhere.

**Provisional decisions** (final calls in Prompt 19 — nothing in §4.4 is cut until then):

| Animation | Provisional decision |
|---|---|
| Parallax hero (scale 1→1.2) | Keep, subtle |
| Spring badges / stroke-draw checkbox / drawer springs | Keep as-is |
| Direction-aware checkout + testimonials swap | Keep as-is |
| Marquee CSS scroll | Keep as-is |
| Hero collage wobble + floating thread | Cut (decorative) |
| Entrance staggers (hero, PDP, sections) | Re-time toward cinematic register |
| Product-grid entrance (0.07s container / 280-24) | May stay snappier — it's a repeated scannable pattern, stated explicitly, not hero pacing applied blindly |

## 10. Mobile philosophy → Prompt 18

**"Recomposed, not shrunk."** Every layout gets rebuilt for the narrow canvas, never mechanically scaled: the asymmetric hero becomes a full-bleed image with type composed over it rather than a squashed two-column; the bento keeps featured-tile priority by stacking the featured tile first at full width; the PDP keeps gallery dominance with a persistent Add to Cart; Display and Heading get their real mobile-scale steps. Every primary action (shop, add to cart, checkout, search, filter) is thumb-reachable and never hover-dependent. The highest-risk combination — **RTL + narrow width + asymmetric editorial grids** — is verified explicitly at mobile widths, because Nastaliq and editorial asymmetry actively pull against each other.

---

## 11. Quality bar & the final test

- Would a creative director at a real menswear label sign this brief before a single screen gets designed?
- The brief's own test, applied literally at the end of Prompt 22:

> **"When someone opens this website, their first reaction should NOT be 'Nice ecommerce website.' It should be 'That looks like a real fashion brand.'"**

- And the honesty check for every experimental layer (Prompt 20): *would removing this make the site noticeably worse — or would no one notice it's gone?* If the latter, cut it.

---

## 12. Appendix — verified current-state facts (checked against the codebase, 2026-08-12)

These are the exact anchors later prompts build on. Where this appendix differs from the strategy document, **the appendix is right.**

### 12.1 Tokens (corrections to the strategy doc)
- The leaking "accent" is **TailAdmin's `primary: #3C50E0`** plus the `secondary: #80CAEE`, `body: #64748B`, and `meta` 1–10 status set in `tailwind.config.ts` — *not* a literal `--accent` CSS var (the shadcn `--accent` is neutral, `0 0% 96.1%`).
- `--radius` is **`0.5rem` (8px)** in `globals.css`, not 14px. `rounded-2xl` (16px) is used liberally as *component* styling, which is where the "rounded-everywhere" feel comes from.
- Status colors: `success #219653`, `danger #D34053`, `warning #FFA70B`, `meta` set incl. `#DC3545`, `#10B981`, `#259AE6`, `#FFBA00`. Black DEFAULT `#1C2434`, `black-2 #010101`.
- Dark mode: shadcn vars flip to near-black (`--background: 0 0% 3.9%`); several storefront pages additionally use a direct `#212020` — Prompt 02 should normalize these onto tokens.
- Tenant accent is a separate live mechanism (`tenant.branding.accentColor` → drives Add to Cart, badges, hero span, category wash).

### 12.2 Fonts
- Geist Sans + Geist Mono (local variable fonts, `--font-geist-sans` / `--font-geist-mono`) for the storefront.
- Satoshi registered as `fontFamily.satoshi` — admin/theme context.
- Noto Nastaliq Urdu loaded **only when `lang="ur"`** via Google Fonts, with `line-height: 1.9` on `html[lang="ur"]` — both preserved, untouchable.

### 12.3 Homepage section order (9 sections, verified)
`Header` → `Hero` → `SponsorSection` (marquee) → `CategoryShowcase` (bento) → `NewArrivals` (MensClothing) → `TopSale` (Accessories) → `HomeRecommendations` → `TestimonialCard` → `Footer`.

### 12.4 PDP gallery (anchor for Prompt 10)
The gallery is a white-boxed card: `.swiper-container-vertical` (white bg, `border-radius: 10px`, shadow), `.mainSwiper` fixed at **400×400**, `.thumbsSwiper` 100×400 vertical thumbnails. The "400×400 thumbnail-scale" critique and the white-card chrome are both accurate and confirmed.

### 12.5 Dead motion inventory (anchor for Prompt 19)
`tailwind.config.ts` carries unused TailAdmin keyframes: `linspin`, `easespin`, `left-spin`, `right-spin`, `rotating`, `topbottom`, `bottomtop`, `line`, `line-revert` (plus `spin-1.5/2/3`, `ping-once` animation aliases) — confirmed unused by customer-facing components.

### 12.6 Known functional gaps (tracked, NOT redesign fodder)
- Safepay redirect-back isn't wired to `/checkout/success` — webhook fulfills; backend/logic issue, **out of scope** for the redesign (explicit per strategy doc).
- `/dashboard`, `/about`, `/contact` light-only cards — `/dashboard` dark-mode gap is closed in Prompt 17; `/about`/`/contact` are covered by the same pass if they share components.
- `/search` missing header/footer — closed in Prompt 11 as an explicitly-flagged structural change.

---

*End of Brand Brief v1.0. Ratified. Prompts 02–22 are bound by this document.*
