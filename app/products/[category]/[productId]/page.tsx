import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import ProductDetailClient, { type ProductDetail } from "./ProductDetailClient";
import { SITE_NAME } from "@/lib/site";
import { getActiveFlashSales, isSaleActive } from "@/lib/flash-sales";
import { getActiveTenantId } from "@/lib/tenants";

const PRODUCT_QUERY = `*[_type == "product" && (_id == $id || slug.current == $id) && (!defined(tenantId) || tenantId == $tenantId)][0]{
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
  color,
  tags,
  created_at
}`;

async function getProduct(id: string, tenantId: string): Promise<ProductDetail | null> {
  const raw = await client.fetch(PRODUCT_QUERY, { id, tenantId });
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
  const product = await getProduct(productId, await getActiveTenantId());

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
  const tenantId = await getActiveTenantId();
  const product = await getProduct(productId, tenantId);

  if (!product) {
    notFound();
  }

  // P3-13 — find an active flash sale covering this product (server-truth).
  let flashSale: { salePrice: number; endsAt: string } | undefined;
  try {
    const sales = await getActiveFlashSales(tenantId);
    for (const sale of sales) {
      const inSale = (sale.products || []).some(
        (ref: any) => (ref?._ref || ref?._id) === product._id
      );
      if (inSale && isSaleActive(sale)) {
        flashSale = { salePrice: sale.salePrice, endsAt: sale.endsAt };
        break;
      }
    }
  } catch {
    // flash-sale lookup is best-effort — never break the product page
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
      price: flashSale ? flashSale.salePrice : product.price,
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
      <ProductDetailClient product={product} flashSale={flashSale} />
    </>
  );
}
