// lib/admin-products.ts
// Pure, testable logic for the admin product-management API. Keeps the route
// handlers thin: everything here is deterministic and unit-testable without a
// Sanity connection. Node P2-01 (list), P2-02/03/04 reuse this module.

export type ProductListQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
};

export type ProductSummary = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  brand?: string;
  size: string[];
  tags: string[];
  mainImage?: string;
  created_at?: string;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

/** Parse + sanitize the query params of the list endpoint. */
export function parseListQuery(url: URL): ProductListQuery {
  const rawPage = url.searchParams.get("page");
  const rawLimit = url.searchParams.get("limit");

  // NOTE: .get() returns null when the param is absent, and Number(null) is 0
  // (an integer!) — so we must test against null before coercing, or a missing
  // ?limit= would clamp to 1 instead of falling back to the default.
  const page =
    rawPage !== null && Number.isInteger(Number(rawPage)) && Number(rawPage) > 0
      ? Number(rawPage)
      : 1;
  const limit =
    rawLimit !== null && Number.isInteger(Number(rawLimit))
      ? Math.min(Math.max(Number(rawLimit), MIN_LIMIT), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const search = url.searchParams.get("search")?.trim() || undefined;
  const category = url.searchParams.get("category")?.trim() || undefined;

  return { page, limit, search, category };
}

/**
 * Build the GROQ list + count queries and their params.
 * `search` is matched as a prefix (`tee*`) against `name`.
 */
export function buildProductListGroq(query: ProductListQuery): {
  groq: string;
  countGroq: string;
  params: Record<string, unknown>;
} {
  const filters = [
    "_type == \"product\"",
    "(!defined($category) || category == $category)",
    "(!defined($search) || name match $search)",
  ].join(" && ");

  const offset = (query.page - 1) * query.limit;
  const params: Record<string, unknown> = {
    category: query.category,
    search: query.search ? `${query.search}*` : undefined,
    offset,
    limit: query.limit,
  };

  return {
    groq: `*[${filters}] | order(created_at desc) [$offset...$limit] {
      _id,
      name,
      description,
      price,
      stock,
      category,
      category_slug,
      brand,
      size,
      tags,
      created_at,
      "images": images[]{asset->{url}}
    }`,
    countGroq: `count(*[${filters}])`,
    params,
  };
}

type RawProductDoc = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  brand?: string;
  size?: string[];
  tags?: string[];
  created_at?: string;
  images?: { asset?: { url?: string } }[];
};

/** Map a raw GROQ product doc to the admin-list summary shape. */
export function toProductSummary(doc: RawProductDoc): ProductSummary {
  return {
    _id: doc._id,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    stock: doc.stock,
    category: doc.category,
    category_slug: doc.category_slug,
    brand: doc.brand,
    size: doc.size ?? [],
    tags: doc.tags ?? [],
    mainImage: doc.images?.[0]?.asset?.url,
    created_at: doc.created_at,
  };
}

/** Shared validation for create/update payloads (P2-02/P2-03 reuse this). */
export function validateProductInput(
  input: Partial<{
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    category_slug: string;
    size: string[];
    brand: string;
    tags: string[];
  }>
): string | null {
  const err = (msg: string) => msg;

  if (!input.name || !String(input.name).trim()) return err("name is required");
  if (input.price === undefined || !Number.isFinite(input.price) || input.price < 0)
    return err("price must be a non-negative number");
  if (input.stock === undefined || !Number.isFinite(input.stock) || input.stock < 0)
    return err("stock must be a non-negative number");
  if (!input.category || !String(input.category).trim()) return err("category is required");
  if (!input.category_slug || !String(input.category_slug).trim())
    return err("category_slug is required");
  if (!Array.isArray(input.size) || input.size.length === 0)
    return err("size must be a non-empty array");
  if (input.size.some((s) => !String(s).trim())) return err("size entries cannot be empty");

  return null;
}
