import type { Metadata } from "next";
import DefaultLayout from "@/app/components/Layouts/DefaultLayout";
import { serverClient } from "@/sanity/lib/server-client";
import { requireTenantAdmin, isPlatformAdmin } from "@/lib/tenants";
import { redirect } from "next/navigation";
import TenantsManager, { type TenantRow } from "./TenantsManager";

export const metadata: Metadata = {
  title: "Tenants | Platform Console",
  description: "Manage SaaS tenants, plans and billing",
};

async function getTenants(): Promise<TenantRow[]> {
  return serverClient.fetch(
    `*[_type == "tenant"] | order(createdAt asc) {
      _id,
      name,
      slug,
      domains,
      plan,
      billingStatus,
      branding,
      features,
      payments,
      usage,
      createdAt
    }`
  );
}

export default async function TenantsPage() {
  const { session } = await requireTenantAdmin();
  // Platform console is owner-only (P4-08).
  if (!isPlatformAdmin(session)) {
    redirect("/denied");
  }

  let tenants: TenantRow[] = [];
  let loadError = false;
  try {
    tenants = await getTenants();
  } catch (error) {
    console.error("Failed to load tenants:", error);
    loadError = true;
  }

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Tenants</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-bodydark2">
            Your SaaS platform: one row per client store. Set plans, pause
            tenants, and manage feature flags. Onboarding + DNS handoff is P4-10.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-sm border border-stroke bg-white p-8 text-center text-red-500 shadow-default dark:border-strokedark dark:bg-boxdark">
            Failed to load tenants. Please try again later.
          </div>
        ) : (
          <TenantsManager initialTenants={tenants} />
        )}
      </div>
    </DefaultLayout>
  );
}
