import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";
import ProductForm from "../ProductForm";

export const metadata: Metadata = {
  title: "New Product | AnK's Admin",
  description: "Create a new product",
};

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">New Product</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Create a product. Images are pulled from https URLs and stored as Sanity assets.
          </p>
        </div>

        <ProductForm />
      </div>
    </DefaultLayout>
  );
}
