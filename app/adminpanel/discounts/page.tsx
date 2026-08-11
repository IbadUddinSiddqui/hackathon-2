import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { requireTenantAdmin } from "@/lib/tenants";
import { serverClient } from "@/sanity/lib/server-client";
import DiscountCodesManager from "./DiscountCodesManager";

export const metadata: Metadata = {
  title: "Discount Codes | AnK's Admin",
  description: "Manage discount codes",
};

export type DiscountCode = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
};

async function getDiscountCodes(tenantId: string): Promise<DiscountCode[]> {
  return serverClient.fetch(
    `*[_type == "discountCode" && (!defined(tenantId) || tenantId == $tenantId)] | order(code asc) {
      _id,
      code,
      type,
      value,
      active,
      maxUses,
      usedCount,
      expiresAt
    }`,
    { tenantId }
  );
}

export default async function DiscountsPage() {
  const { tenantId } = await requireTenantAdmin();

  let codes: DiscountCode[] = [];
  let loadError = false;
  try {
    codes = await getDiscountCodes(tenantId);
  } catch (error) {
    console.error("Failed to load discount codes:", error);
    loadError = true;
  }

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Discount Codes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Create and manage promo codes. They are validated server-side at checkout.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-sm border border-stroke bg-white p-8 text-center text-red-500 shadow-default dark:border-strokedark dark:bg-boxdark">
            Failed to load discount codes. Please try again later.
          </div>
        ) : (
          <DiscountCodesManager initialCodes={codes} />
        )}
      </div>
    </DefaultLayout>
  );
}
