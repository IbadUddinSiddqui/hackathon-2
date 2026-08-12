import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import ProductDetailClient, { type ProductDetail } from "./ProductDetailClient";
import { SITE_NAME } from "@/lib/site";
import { getActiveFlashSales, isSaleActive } from "@/lib/flash-sales";
import { getActiveTenantId } from "@/lib/tenants";
import { stripColorSuffix, selectColorSiblings, type ColorSibling } from "@/lib/product-colors";

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
  created_at,
  on_sale,
  sale_price
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

/**
 * Fetch the other color listings of the same product family, so the product
 * page can render a color picker. Family = products whose base name (name
 * minus its own trailing " - <color>" suffix) matches. Best-effort: any error
 * just yields no siblings (the page still renders the single color chip).
 */
async function getColorSiblings(
  product: ProductDetail,
  tenantId: string
): Promise<ColorSibling[]> {
  if (!product.color) return [];
  const base = stripColorSuffix(product.name, product.color);
  if (!base) return [];

  try {
    const candidates = await client.fetch<
      { _id: string; name: string; color?: string; category_slug?: string }[]
    >(
      `*[_type == "product" && name match $prefix && defined(color) && color != "" && (!defined(tenantId) || tenantId == $tenantId)] { _id, name, color, category_slug }`,
      { prefix: `${base}*`, tenantId }
    );
    return selectColorSiblings(product, candidates).slice(0, 6);
  } catch {
    return [];
  }
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

  // P3-14 — product-level sale (on_sale flag + lower sale_price): show the
  // sale price + badge like the storefront cards do. No countdown (it has no
  // end time) — endsAt stays empty so the client skips the timer.
  if (!flashSale && product.on_sale && typeof product.sale_price === "number" && product.sale_price < product.price) {
    flashSale = { salePrice: product.sale_price, endsAt: "" };
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

  const colorSiblings = await getColorSiblings(product, tenantId);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient
        product={product}
        flashSale={flashSale}
        colorSiblings={colorSiblings}
      />
    </>
  );
}
