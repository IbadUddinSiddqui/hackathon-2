import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import ProductForm from "../../ProductForm";
import type { ProductSummary } from "../../ProductListManager";

export const metadata: Metadata = {
  title: "Edit Product | AnK's Admin",
  description: "Edit a product",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let product: ProductSummary | null = null;
  try {
    product = await serverClient.fetch(
      `*[_id == $id][0]{
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
      { id }
    );
  } catch (error) {
    console.error("Failed to load product:", error);
  }

  if (!product) {
    notFound();
  }

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Edit Product</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Update {product.name} — changes save immediately via the admin API.
          </p>
        </div>

        <ProductForm product={product} />
      </div>
    </DefaultLayout>
  );
}
