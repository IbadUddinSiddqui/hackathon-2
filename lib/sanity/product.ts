// lib/sanity/product.ts
import { client } from '@/sanity/lib/client';
import { clientTenantId } from '@/lib/tenant-client';

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
};

export async function getSanityProducts(category?: string): Promise<SanityProduct[]> {
  const tenantId = clientTenantId();
  return client.fetch(
    `*[_type == "product" && (!defined(tenantId) || tenantId == $tenantId) ${category ? `&& category_slug == "${category}"` : ''}] {
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
      created_at
    }`,
    { tenantId }
  );
}