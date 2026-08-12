// lib/sanity/product.ts
import { client } from '@/sanity/lib/client';
import { clientTenantId } from '@/lib/tenant-client';
import { newArrivalsSince } from '@/lib/product-sale';

export type SanityProduct = {
  _id: string;
  name: string;
  ratings: number;
  description: string;
  price: number;
  stock: number;
  images: any[];
  category_slug: string;
  slug?: { current: string };
  size: string[];
  qcom_availability: boolean;
  brand: string;
  color?: string;
  tags: string[];
  created_at: string;
  // Sale flags — drive the "On Sale" homepage section + sale pricing.
  on_sale?: boolean;
  sale_price?: number | null;
};

// Shared projection so every storefront fetch carries the same fields.
const PRODUCT_FIELDS = `
  _id,
  name,
  ratings,
  description,
  price,
  stock,
  images,
  category_slug,
  slug,
  size,
  qcom_availability,
  brand,
  color,
  tags,
  created_at,
  on_sale,
  sale_price
`;

const TENANT_SCOPE = '(!defined(tenantId) || tenantId == $tenantId)';

export async function getSanityProducts(category?: string): Promise<SanityProduct[]> {
  const tenantId = clientTenantId();
  return client.fetch(
    `*[_type == "product" && ${TENANT_SCOPE} ${category ? `&& category_slug == "${category}"` : ''}] {
      ${PRODUCT_FIELDS}
    }`,
    { tenantId }
  );
}

/**
 * "New Arrivals" — products created within the recent window (default 30
 * days), newest first. If the catalog predates the window (old seed data),
 * falls back to the newest products overall so the section never renders
 * empty. Tenant-scoped.
 */
export async function getNewArrivals(limit = 12): Promise<SanityProduct[]> {
  const tenantId = clientTenantId();
  const since = newArrivalsSince();

  const windowed = await client.fetch<SanityProduct[]>(
    `*[_type == "product" && ${TENANT_SCOPE} && created_at >= $since] | order(created_at desc) [0...$limit] {
      ${PRODUCT_FIELDS}
    }`,
    { tenantId, since, limit }
  );

  if (windowed.length > 0) return windowed;

  return client.fetch<SanityProduct[]>(
    `*[_type == "product" && ${TENANT_SCOPE}] | order(created_at desc) [0...$limit] {
      ${PRODUCT_FIELDS}
    }`,
    { tenantId, limit }
  );
}

/**
 * "On Sale" — products with a genuine sale: on_sale flag set AND a sale price
 * lower than the list price. Tenant-scoped.
 */
export async function getOnSaleProducts(limit = 12): Promise<SanityProduct[]> {
  const tenantId = clientTenantId();
  return client.fetch<SanityProduct[]>(
    `*[_type == "product" && ${TENANT_SCOPE} && on_sale == true && defined(sale_price) && sale_price < price] | order(ratings desc) [0...$limit] {
      ${PRODUCT_FIELDS}
    }`,
    { tenantId, limit }
  );
}
