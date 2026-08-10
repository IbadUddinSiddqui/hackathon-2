import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import ProductDetailClient, { type ProductDetail } from "./ProductDetailClient";
import { SITE_NAME } from "@/lib/site";

const PRODUCT_QUERY = `*[_type == "product" && (_id == $id || slug.current == $id)][0]{
  _id,
  name,
  ratings,
  description,
  price,
  stock,
  images,
  category_slug,
  size,
  qcom_availability,
  brand,
  tags,
  created_at
}`;

async function getProduct(id: string): Promise<ProductDetail | null> {
  const raw = await client.fetch(PRODUCT_QUERY, { id });
  if (!raw) return null;

  return {
    ...raw,
    images: (raw.images || []).map((img: { asset?: { _ref?: string } }) =>
      urlFor(img).url()
    ),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = `${product.name} | ${SITE_NAME}`;
  const description =
    product.description?.slice(0, 160) || `Shop ${product.name} at ${SITE_NAME}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images: product.images.length ? [product.images[0]] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  // Product structured data for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
