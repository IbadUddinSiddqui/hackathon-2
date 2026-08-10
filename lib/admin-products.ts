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

/** Normalized create/update payload — same fields as the import template. */
export type ProductInput = {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  size: string[];
  brand?: string;
  tags: string[];
  imageUrls: string[];
};

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = String(v ?? "").trim();
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
}

function toOptionalString(v: unknown): string | undefined {
  const s = String(v ?? "").trim();
  return s ? s : undefined;
}

function toOptionalNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Defensively coerce a raw JSON body into a ProductInput-shaped object
 * (string arrays accept both arrays and comma-separated strings, prices/stock
 * accept numbers or numeric strings, non-http URLs are dropped).
 */
export function normalizeCreateInput(raw: Record<string, unknown>): Partial<ProductInput> {
  return {
    name: toOptionalString(raw.name),
    description: toOptionalString(raw.description),
    price: toOptionalNumber(raw.price),
    stock: toOptionalNumber(raw.stock),
    category: toOptionalString(raw.category),
    category_slug: toOptionalString(raw.category_slug),
    size: toStringArray(raw.size),
    brand: toOptionalString(raw.brand),
    tags: toStringArray(raw.tags),
    imageUrls: toStringArray(raw.imageUrls).filter((u) => /^https?:\/\//i.test(u)),
  };
}

/**
 * Shared validation for create/update payloads (P2-02/P2-03 reuse this).
 * `requireImages` is true for create (the Sanity schema mandates min 1 image
 * and the storefront renders images[0]) but false for partial updates.
 */
export function validateProductInput(
  input: Partial<ProductInput>,
  options: { requireImages?: boolean } = {}
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

  if (options.requireImages) {
    if (!Array.isArray(input.imageUrls) || input.imageUrls.length === 0)
      return err("imageUrls is required (at least one http(s) URL)");
    if (input.imageUrls.some((u) => !/^https?:\/\//i.test(String(u))))
      return err("imageUrls entries must be http(s) URLs");
  }

  return null;
}
