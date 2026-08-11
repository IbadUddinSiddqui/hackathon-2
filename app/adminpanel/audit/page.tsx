import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireAdmin } from "@/lib/admin";
import AuditLogList from "./AuditLogList";

export const metadata: Metadata = {
  title: "Audit Log | AnK's Admin",
  description: "Admin activity history",
};

export default async function AuditAdminPage() {
  await requireAdmin();

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Every admin action — product, discount, and order changes.
          </p>
        </div>
        <AuditLogList />
      </div>
    </DefaultLayout>
  );
}
