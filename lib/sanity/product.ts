// lib/sanity/product.ts
import { client } from '@/sanity/lib/client';

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
  tags: string[];
  created_at: string;
};

export async function getSanityProducts(category?: string): Promise<SanityProduct[]> {
  return client.fetch(`
    *[_type == "product" ${category ? `&& category_slug == "${category}"` : ''}] {
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
      tags,
      created_at
    }
  `);
}