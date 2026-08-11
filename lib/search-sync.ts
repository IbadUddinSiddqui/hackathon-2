// lib/search-sync.ts
// Server-only Typesense sync logic (P2-EPIC-06). Powers the Sanity webhook
// (app/api/webhooks/sanity/route.ts) and the manual full reindex that used to
// live in scripts/syncProducts.ts (which hardcoded the Sanity project id —
// here we reuse sanity/lib/server-client.ts instead). NEVER import from a
// client component.
//
// P4-03 — multi-tenant: every indexed doc carries `tenant_id` and every sync
// is scoped to one tenant, so a tenant's storefront search never sees another
// tenant's products.

import { serverClient } from "@/sanity/lib/server-client";
import { adminClient } from "@/lib/typesense";
import { HTTPError } from "typesense/lib/Typesense/Errors";
import { tenantFilter, DEFAULT_TENANT_ID } from "@/lib/tenants";

export type SanityProductDoc = {
  _id: string;
  tenantId?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  images: Array<{ asset?: { url?: string } }>;
  size: string[];
  qcom_availability: boolean;
  brand?: string;
  tags?: string[];
  ratings?: number;
  created_at: string;
};

export type TypesenseProduct = {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  images: string[];
  size: string[];
  qcom_availability: boolean;
  brand: string;
  tags: string[];
  ratings: number;
  created_at: number;
};

const PRODUCT_PROJECTION = (tenantId: string) =>
  `*[_type == "product" && ${tenantFilter()}]{
  _id,
  tenantId,
  name,
  description,
  price,
  stock,
  category,
  category_slug,
  images[]{asset->{url}},
  size,
  qcom_availability,
  brand,
  tags,
  ratings,
  created_at
}`;

/** Map a Sanity doc to the Typesense document; null when it has no images. */
export function toTypesenseDocument(
  product: SanityProductDoc
): TypesenseProduct | null {
  if (!product.images || product.images.length === 0) {
    console.warn(`Product ${product._id} has no images, skipping index`);
    return null;
  }

  return {
    id: product._id,
    tenant_id: product.tenantId || DEFAULT_TENANT_ID,
    name: product.name,
    description: product.description || "",
    price: product.price,
    stock: product.stock,
    category: product.category,
    category_slug: product.category_slug,
    images: product.images
      .map((img) => img?.asset?.url)
      .filter((url): url is string => !!url),
    size: product.size,
    qcom_availability: product.qcom_availability,
    brand: product.brand || "",
    tags: product.tags || [],
    ratings: product.ratings || 0,
    created_at: Math.floor(new Date(product.created_at).getTime() / 1000),
  };
}

/** Create the Typesense collection on first use if it doesn't exist yet. */
export async function ensureProductsCollection(): Promise<void> {
  let exists = true;
  try {
    await adminClient.collections("products").retrieve();
  } catch (error) {
    if ((error as HTTPError).httpStatus === 404) exists = false;
    else throw error;
  }
  if (exists) return;

  await adminClient.collections().create({
    name: "products",
    fields: [
      { name: "id", type: "string" },
      { name: "tenant_id", type: "string", facet: true },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "price", type: "float" },
      { name: "stock", type: "int32" },
      { name: "category", type: "string" },
      { name: "category_slug", type: "string" },
      { name: "images", type: "string[]" },
      { name: "size", type: "string[]" },
      { name: "qcom_availability", type: "bool" },
      { name: "brand", type: "string" },
      { name: "tags", type: "string[]" },
      { name: "ratings", type: "float" },
      { name: "created_at", type: "int64" },
    ],
    default_sorting_field: "created_at",
  });
}

/** Upsert a single product (by Sanity _id) into the search index. */
export async function syncProductToSearch(productId: string): Promise<boolean> {
  const product = await serverClient.fetch<SanityProductDoc | null>(
    `*[_type == "product" && _id == $id][0]{
      _id,
      tenantId,
      name,
      description,
      price,
      stock,
      category,
      category_slug,
      images[]{asset->{url}},
      size,
      qcom_availability,
      brand,
      tags,
      ratings,
      created_at
    }`,
    { id: productId }
  );

  if (!product) return false; // already gone
  const doc = toTypesenseDocument(product);
  if (!doc) return false; // no images — not indexed

  await ensureProductsCollection();
  await adminClient.collections("products").documents().upsert(doc);
  return true;
}

/** Delete a product from the search index (404 is a no-op). */
export async function removeProductFromSearch(productId: string): Promise<void> {
  await ensureProductsCollection();
  try {
    await adminClient.collections("products").documents(productId).delete();
  } catch (error: any) {
    if (error?.httpStatus === 404) return;
    throw error;
  }
}

/**
 * Full reindex for ONE tenant — used by the manual sync script and on-demand.
 * P4-03: scoped by tenant so the shared index never mixes stores.
 */
export async function syncAllProducts(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<{ synced: number; skipped: number }> {
  await ensureProductsCollection();
  const products = await serverClient.fetch<SanityProductDoc[]>(
    PRODUCT_PROJECTION(tenantId),
    { tenantId }
  );

  const documents: TypesenseProduct[] = [];
  let skipped = 0;
  for (const product of products) {
    const doc = toTypesenseDocument(product);
    if (doc) documents.push(doc);
    else skipped += 1;
  }

  if (documents.length > 0) {
    await adminClient.collections("products").documents().import(documents, {
      action: "upsert",
    });
  }

  return { synced: documents.length, skipped };
}
