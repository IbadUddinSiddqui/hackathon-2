import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";
import BulkImportManager from "./BulkImportManager";

export const metadata: Metadata = {
  title: "Products | AnK's Admin",
  description: "Bulk-import products from an Excel file",
};

export default async function ProductsAdminPage() {
  await requireAdmin();

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Bulk Product Import
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Upload an Excel (.xlsx) or CSV file to create or update products in bulk.
            Download the template to see the exact column format.
          </p>
        </div>

        <BulkImportManager />
      </div>
    </DefaultLayout>
  );
}
