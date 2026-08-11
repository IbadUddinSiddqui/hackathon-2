"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText } from "lucide-react";

type AuditEntry = {
  _id: string;
  adminEmail?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  details?: string;
  createdAt?: string;
};

const ACTION_STYLES: Record<string, string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  status_change: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

const TARGET_OPTIONS = [
  { value: "", label: "All types" },
  { value: "product", label: "Products" },
  { value: "order", label: "Orders" },
  { value: "discountCode", label: "Discounts" },
  { value: "customer", label: "Customers" },
];

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogList() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [targetType, setTargetType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (target: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (target) params.set("targetType", target);
        const res = await fetch(`/api/admin/audit?${params.toString()}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error(`Failed to load audit log (HTTP ${res.status})`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e: any) {
        setError(e.message || "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    load(targetType);
  }, [targetType, load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {TARGET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTargetType(opt.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              targetType === opt.value
                ? "border-primary bg-primary text-white"
                : "border-stroke text-gray-600 hover:border-primary hover:text-primary dark:border-strokedark dark:text-bodydark2"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center gap-3 px-4 py-16 text-gray-400 dark:text-bodydark2">
            <span className="block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
            Loading audit log…
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-400 dark:text-bodydark2">
            <ScrollText className="mx-auto mb-2 h-10 w-10 opacity-50" />
            No audit entries yet.
          </div>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-strokedark">
            {logs.map((entry) => (
              <li key={entry._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    ACTION_STYLES[entry.action || ""] ||
                    "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300"
                  }`}
                >
                  {entry.action || "?"}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-bodydark2">
                  {entry.targetType || "?"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-black dark:text-white">
                  {entry.targetLabel || entry.targetId || "—"}
                  {entry.details ? (
                    <span className="ml-2 text-xs text-gray-400 dark:text-bodydark2">
                      {entry.details}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-gray-400 dark:text-bodydark2">{fmtDate(entry.createdAt)}</span>
                <span className="w-40 truncate text-right text-xs text-gray-400 dark:text-bodydark2">
                  {entry.adminEmail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
