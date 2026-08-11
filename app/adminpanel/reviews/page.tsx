import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";
import ReviewsManager from "./ReviewsManager";

export const metadata: Metadata = {
  title: "Reviews | AnK's Admin",
  description: "Moderate customer product reviews",
};

export default async function ReviewsAdminPage() {
  await requireAdmin();

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Approve or reject customer reviews. Only approved reviews appear on
            the product pages.
          </p>
        </div>
        <ReviewsManager />
      </div>
    </DefaultLayout>
  );
}
