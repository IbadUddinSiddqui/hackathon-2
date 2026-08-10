import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { searchClient } from "@/lib/typesense";
import CategoryClient from "./CategoryClient";
import type { Product } from "@/types/products";

// Same data source the old client page used (Sanity + Typesense merged and
// de-duplicated), now fetched server-side so the page is indexable.
async function fetchCategoryProducts(category: string): Promise<Product[]> {
  const sanityQuery = `*[_type == "product" && category_slug == $categorySlug]{
    _id,
    name,
    ratings,
    price,
    images,
    category_slug,
    slug,
    brand,
    size,
    tags
  }`;

  const sanityProducts: Product[] = await client.fetch(sanityQuery, {
    categorySlug: category,
  });

  let typesenseProducts: Product[] = [];
  try {
    const typesenseResponse = await searchClient
      .collections("products")
      .documents()
      .search({
        q: "*",
        query_by: "name,brand,tags",
        filter_by: `category_slug:${category}`,
        per_page: 100,
      });

    typesenseProducts =
      typesenseResponse.hits?.map((hit: any) => ({
        ...hit.document,
        _id: hit.document.id,
      })) || [];
  } catch (typesenseError) {
    console.warn("Typesense search failed, using Sanity data only", typesenseError);
  }

  const byId = new Map<string, Product>();
  for (const p of [...sanityProducts, ...typesenseProducts]) {
    if (!byId.has(p._id)) byId.set(p._id, p);
  }
  return [...byId.values()];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const name = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${name} — Shop Online`,
    description: `Shop ${name} at AnK's — premium Pakistani fashion and clothing with nationwide delivery.`,
    openGraph: {
      title: `${name} | AnK's`,
      description: `Shop ${name} at AnK's — premium Pakistani fashion and clothing with nationwide delivery.`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const products = await fetchCategoryProducts(category);

  return <CategoryClient category={category} initialProducts={products} />;
}
