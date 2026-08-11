"use client";

// app/adminpanel/tenants/TenantsManager.tsx
// P4-08 — platform console UI: list tenants, create new ones, and update
// plan / billing status / domains / feature flags via /api/admin/tenants.

import { useState } from "react";
import type { TenantDoc } from "@/lib/tenants";

export type TenantRow = TenantDoc;

const PLANS = ["free", "trial", "pro"];
const BILLING_STATUSES = ["active", "trialing", "past_due", "paused"];

export default function TenantsManager({ initialTenants }: { initialTenants: TenantRow[] }) {
  const [tenants, setTenants] = useState<TenantRow[]>(initialTenants);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", slug: "", domains: "", plan: "free" });

  const patch = async (id: string, body: Record<string, unknown>) => {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setTenants((prev) =>
        prev.map((t) => (t._id === id ? { ...t, ...body } : t))
      );
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setSaving(null);
    }
  };

  const create = async () => {
    setError(null);
    if (!newTenant.name.trim() || !newTenant.slug.trim()) {
      setError("Name and slug are required");
      return;
    }
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTenant.name.trim(),
          slug: newTenant.slug.trim(),
          domains: newTenant.domains
            .split(",")
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean),
          plan: newTenant.plan,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setShowCreate(false);
      setNewTenant({ name: "", slug: "", domains: "", plan: "free" });
      // Refresh from the server so slugs/ids are real.
      const list = await fetch("/api/admin/tenants");
      const listData = await list.json();
      setTenants(listData.tenants || []);
    } catch (err: any) {
      setError(err.message || "Create failed");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 dark:bg-white dark:text-gray-900"
          >
            + New tenant
          </button>
        ) : (
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-3 font-semibold text-black dark:text-white">Create tenant</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input
                placeholder="Store name (e.g. XYZ Clothing)"
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                className="rounded border border-stroke px-3 py-2 text-sm dark:border-strokedark dark:bg-gray-700 dark:text-gray-100"
              />
              <input
                placeholder="slug (e.g. xyz)"
                value={newTenant.slug}
                onChange={(e) =>
                  setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                }
                className="rounded border border-stroke px-3 py-2 text-sm dark:border-strokedark dark:bg-gray-700 dark:text-gray-100"
              />
              <input
                placeholder="Domains (comma-separated)"
                value={newTenant.domains}
                onChange={(e) => setNewTenant({ ...newTenant, domains: e.target.value })}
                className="rounded border border-stroke px-3 py-2 text-sm dark:border-strokedark dark:bg-gray-700 dark:text-gray-100"
              />
              <select
                value={newTenant.plan}
                onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                className="rounded border border-stroke px-3 py-2 text-sm dark:border-strokedark dark:bg-gray-700 dark:text-gray-100"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={create}
                className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-stroke px-4 py-2 text-sm text-gray-600 dark:border-strokedark dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <table className="w-full table-auto text-left text-sm">
          <thead>
            <tr className="border-b border-stroke bg-gray-50 text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2">
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Domains</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Usage (this month)</th>
              <th className="px-4 py-3 font-medium">Features</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 dark:text-bodydark2">
                  No tenants yet. Create the default tenant or your first client.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t._id} className="border-b border-stroke last:border-0 dark:border-strokedark">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-black dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-400">
                      {typeof t.slug === "string" ? t.slug : t.slug?.current}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.domains?.length ? (
                      <div className="space-y-0.5">
                        {t.domains.map((d) => (
                          <div key={d} className="text-xs text-gray-500 dark:text-bodydark2">{d}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.plan || "free"}
                      disabled={saving === t._id}
                      onChange={(e) => patch(t._id, { plan: e.target.value })}
                      className="rounded border border-stroke px-2 py-1 text-xs dark:border-strokedark dark:bg-gray-700 dark:text-gray-100"
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.billingStatus || "active"}
                      disabled={saving === t._id}
                      onChange={(e) => patch(t._id, { billingStatus: e.target.value })}
                      className={`rounded border px-2 py-1 text-xs dark:border-strokedark dark:bg-gray-700 ${
                        t.billingStatus === "paused"
                          ? "border-red-300 text-red-600 dark:text-red-400"
                          : "border-stroke dark:text-gray-100"
                      }`}
                    >
                      {BILLING_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {t.billingStatus === "paused" && (
                      <div className="mt-1 text-xs text-red-500">Storefront paused</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-bodydark2">
                    {t.usage?.month ? (
                      <>
                        {t.usage.month}: {t.usage.orders || 0} orders ·{" "}
                        {t.usage.products || 0} products
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(["flashSales", "reviews", "giftCards", "loyalty", "bundles", "credit"] as const).map(
                        (flag) => (
                          <button
                            key={flag}
                            disabled={saving === t._id}
                            onClick={() =>
                              patch(t._id, {
                                features: { ...(t.features || {}), [flag]: !t.features?.[flag] },
                              })
                            }
                            title={`Toggle ${flag}`}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              t.features?.[flag] === false
                                ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            }`}
                          >
                            {flag}
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
