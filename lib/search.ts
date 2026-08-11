// lib/search.ts
// P4-13 — client-safe search helpers. Hybrid (vector) ranking is switched on
// only when the embedder env vars are present (P4-16); otherwise the exact
// same search call runs in text mode — the existing fallback.

export const SEARCH_QUERY_FIELDS = "name,description,brand,category,tags";

/**
 * True when Typesense hybrid search is configured (embedder host + key in
 * NEXT_PUBLIC_* env). Hybrid ranking requires an embedder to be defined on
 * the collection AND the search key to carry the `hybrid` permission — when
 * either is missing we fall back to plain text search, which always works.
 */
export function hybridSearchConfigured(): boolean {
  if (typeof process === "undefined") return false;
  return Boolean(
    process.env.NEXT_PUBLIC_TYPESENSE_EMBEDDER &&
      process.env.NEXT_PUBLIC_TYPESENSE_EMBEDDING_KEY
  );
}

/** Build the search params shared by header search + any future surfaces. */
export function buildSearchParams(query: string, tenantId: string, perPage = 12) {
  return {
    q: query,
    query_by: SEARCH_QUERY_FIELDS,
    filter_by: `tenant_id:=${tenantId}`,
    sort_by: "ratings:desc,created_at:desc",
    per_page: perPage,
    ...(hybridSearchConfigured() ? { hybrid: true } : {}),
  };
}
