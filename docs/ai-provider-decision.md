# AI Provider Decision (P4-16)

> **Status: code-ready, decision pending.** All three AI surfaces already work
> WITHOUT any AI provider (rule-based). Adding a provider is optional and
> purely an enhancement. This doc lists exactly what's needed to switch each
> surface on.

## Current behaviour (zero-cost, works today)

| Feature | Works now via | Node |
|---|---|---|
| Recommendations | Co-purchase + category + rating rules (`lib/recommendations.ts`) | P4-11 ✅ |
| Search | Typesense text search (`lib/search.ts`) | P4-13 ✅ |
| Chat | Keyword-matched FAQ knowledge base (`lib/faq.ts`) | P4-15 ✅ |
| Size quiz | Measurement→size table (`lib/size-quiz.ts`) | P4-14 ✅ |

## What to decide (owner)

1. **Embeddings provider for search** (Typesense hybrid/vector):
   - Env vars to set: `NEXT_PUBLIC_TYPESENSE_EMBEDDER` (URL of the embedding service),
     `NEXT_PUBLIC_TYPESENSE_EMBEDDING_KEY`, `TYPESENSE_EMBED_MODEL` (default `all-MiniLM-L6-v2`).
   - A **new** Typesense collection must be created after setting these (embedder
     config is fixed at collection creation — see `ensureProductsCollection`).
   - Until then, text search is the automatic fallback.

2. **Optional LLM ranker for recommendations**:
   - Env vars: `RECO_EMBEDDING_ENDPOINT` + `RECO_EMBEDDING_KEY`.
   - Contract: `POST { productId, limit }` → `{ productIds: string[] }` (ordered).
   - Until then, the rule-based engine answers (never blocks the storefront).

3. **Budget** — confirm the monthly cost is acceptable before enabling anything.

## Cheapest on-ramp
- Use a free/local embedding service (e.g. Ollama) for search hybrid mode.
- Keep recommendations + chat rule-based (they're already good and free).
