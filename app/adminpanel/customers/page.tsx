import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";
import CustomersList from "./CustomersList";

export const metadata: Metadata = {
  title: "Customers | AnK's Admin",
  description: "Manage customers — search, orders, and spending",
};

export default async function CustomersAdminPage() {
  await requireAdmin();

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Every customer who has placed an order. Click a row for their order history.
          </p>
        </div>
        <CustomersList />
      </div>
    </DefaultLayout>
  );
}
