// lib/recommendations.ts
// P4-11 — server-side recommendations engine.
//
// Ranking strategy (no external services required):
//   1. CO-PURCHASE — products bought together in the same order score highest
//      (pair co-occurrence counted across recent paid/delivered orders).
//   2. CATEGORY AFFINITY — other products in the same category (the old
//      fallback) break ties.
//   3. RATING — top-rated products fill any remaining slots.
//
// An LLM/embedding path (P4-16) can be switched on behind the SAME interface:
// set RECO_EMBEDDING_ENDPOINT + RECO_EMBEDDING_KEY and the engine calls the
// remote ranker instead of the rule-based scorer. Until then, `getRankedRecs`
// always returns rule-based results so the storefront never depends on keys.

import { serverClient } from "@/sanity/lib/server-client";
import { tenantFilter, DEFAULT_TENANT_ID } from "@/lib/tenants";

export type Recommendation = {
  productId: string;
  score: number;
  source: "co-purchase" | "category" | "rating";
};

export type RecommendationInput = {
  tenantId?: string;
  productId: string;
  limit?: number;
};

export type RecommendationResult = {
  productId: string;
  recommendations: Recommendation[];
  used: "rules" | "embedding";
};

const ORDER_STATUSES = ["paid", "delivered", "completed"];

// --- rule-based scoring ---------------------------------------------------

/** Count co-purchase co-occurrences from recent orders (tenant-scoped). */
export async function buildCoPurchaseScores(
  tenantId: string
): Promise<Map<string, Map<string, number>>> {
  // <productId, Map<coBoughtId, count>>
  const pairs = new Map<string, Map<string, number>>();

  const orders: { items?: { product?: { _id?: string } }[] }[] =
    await serverClient.fetch(
      // NOTE: `product->{_id}` dereferences the reference, so the field is
      // `product._id` in the result — never `product._ref`.
      `*[_type == "order" && status in $statuses && ${tenantFilter()}] | order(_createdAt desc) [0...200] {
        items[]{product->{_id}}
      }`,
      { statuses: ORDER_STATUSES, tenantId }
    );

  for (const order of orders) {
    const ids = (order.items || [])
      .map((i) => i.product?._id)
      .filter((id): id is string => Boolean(id));
    const unique = [...new Set(ids)];
    for (let i = 0; i < unique.length; i++) {
      for (let j = 0; j < unique.length; j++) {
        if (i === j) continue;
        const a = unique[i];
        const b = unique[j];
        if (!pairs.has(a)) pairs.set(a, new Map());
        pairs.get(a)!.set(b, (pairs.get(a)!.get(b) || 0) + 1);
      }
    }
  }

  return pairs;
}

/** Pure pair-scorer used by tests (no Sanity). Never returns the input id. */
export function scoreCoPurchase(
  pairs: Map<string, Map<string, number>>,
  productId: string,
  limit = 6
): Recommendation[] {
  const co = pairs.get(productId);
  if (!co) return [];
  return [...co.entries()]
    .filter(([id]) => id !== productId)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({
      productId: id,
      score: count,
      source: "co-purchase" as const,
    }));
}

/** Fetch other products in the same category (tenant-scoped), best-rated first. */
export async function categoryFallback(
  productId: string,
  categorySlug: string,
  tenantId: string,
  limit = 6
): Promise<Recommendation[]> {
  const docs: { _id: string; ratings?: number }[] = await serverClient.fetch(
    `*[_type == "product" && category_slug == $categorySlug && _id != $id && ${tenantFilter()}]{_id, ratings} | order(ratings desc) [0...$limit]`,
    { categorySlug, id: productId, tenantId, limit }
  );
  return docs.map((d) => ({
    productId: d._id,
    score: d.ratings || 0,
    source: "category" as const,
  }));
}

/** Top-rated products from the same tenant, minus the input product. */
export async function ratingFallback(
  productId: string,
  tenantId: string,
  limit = 6
): Promise<Recommendation[]> {
  const docs: { _id: string; ratings?: number }[] = await serverClient.fetch(
    `*[_type == "product" && _id != $id && ${tenantFilter()}]{_id, ratings} | order(ratings desc) [0...$limit]`,
    { id: productId, tenantId, limit }
  );
  return docs.map((d) => ({
    productId: d._id,
    score: d.ratings || 0,
    source: "rating" as const,
  }));
}

/**
 * Embedding path (P4-16 hook) — called only when RECO_EMBEDDING_ENDPOINT and
 * RECO_EMBEDDING_KEY are set. POSTs the product context to a remote ranker and
 * maps the response's `productIds` (ordered) into Recommendations. Any failure
 * falls back to the rule-based path — never throw to the storefront.
 */
export async function embeddingRank(
  input: RecommendationInput
): Promise<Recommendation[]> {
  const endpoint = process.env.RECO_EMBEDDING_ENDPOINT;
  const key = process.env.RECO_EMBEDDING_KEY;
  if (!endpoint || !key) return [];

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ productId: input.productId, limit: input.limit || 6 }),
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { productIds?: string[] };
    if (!Array.isArray(data.productIds)) return [];
    return data.productIds
      .filter((id): id is string => Boolean(id))
      .map((productId, idx) => ({
        productId,
        score: data.productIds!.length - idx,
        source: "co-purchase" as const,
      }));
  } catch {
    return []; // embedding failure → rules fallback
  }
}

/**
 * Main entry point. Returns ranked recommendations (productIds, deduped,
 * input product excluded). `used` tells callers which path produced the list.
 */
export async function getRecommendations(
  input: RecommendationInput
): Promise<RecommendationResult> {
  const tenantId = input.tenantId || DEFAULT_TENANT_ID;
  const limit = Math.min(Math.max(input.limit || 6, 1), 12);

  const embeddingRecs = await embeddingRank(input);
  if (embeddingRecs.length > 0) {
    // Never recommend the product itself, even from the embedding path.
    const seen = new Set<string>([input.productId]);
    const filtered = embeddingRecs.filter((r) => {
      if (seen.has(r.productId)) return false;
      seen.add(r.productId);
      return true;
    });
    return { productId: input.productId, recommendations: filtered.slice(0, limit), used: "embedding" };
  }

  // Rules path — co-purchase first, then category, then rating.
  const pairs = await buildCoPurchaseScores(tenantId);
  const co = scoreCoPurchase(pairs, input.productId, limit);

  const product = await serverClient.fetch<{ category_slug?: string } | null>(
    `*[_id == $id && ${tenantFilter()}][0]{category_slug}`,
    { id: input.productId, tenantId }
  );

  const byCategory = product?.category_slug
    ? await categoryFallback(input.productId, product.category_slug, tenantId, limit)
    : [];
  const byRating = await ratingFallback(input.productId, tenantId, limit);

  // Merge: co-purchase first (keeps its order), then fill with category, then rating.
  const seen = new Set<string>([input.productId]);
  const merged: Recommendation[] = [];
  for (const rec of [...co, ...byCategory, ...byRating]) {
    if (seen.has(rec.productId)) continue;
    seen.add(rec.productId);
    merged.push(rec);
    if (merged.length >= limit) break;
  }

  return { productId: input.productId, recommendations: merged.slice(0, limit), used: "rules" };
}
