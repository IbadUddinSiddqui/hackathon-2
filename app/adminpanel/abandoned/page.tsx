import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";
import AbandonedList from "./AbandonedList";

export const metadata: Metadata = {
  title: "Abandoned Carts | AnK's Admin",
  description: "Recover carts left at checkout",
};

export default async function AbandonedAdminPage() {
  await requireAdmin();

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Abandoned Carts</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Shoppers who entered an email at checkout but didn't finish. Send a
            reminder email to bring them back.
          </p>
        </div>
        <AbandonedList />
      </div>
    </DefaultLayout>
  );
}
