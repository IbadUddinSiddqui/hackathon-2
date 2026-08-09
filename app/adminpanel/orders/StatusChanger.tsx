"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-green-500",
  failed: "bg-red-500",
  refunded: "bg-gray-400",
};

/**
 * Admin status changer for an order. Calls the PATCH API and refreshes the
 * page so the badge/table reflect the new status.
 */
export default function StatusChanger({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (value: string) => {
    if (value === status || saving) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update status");
      }

      setStatus(value);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <label htmlFor="order-status" className="sr-only">
        Order status
      </label>
      <div className="relative inline-flex items-center">
        <span
          className={`pointer-events-none absolute left-3 h-2 w-2 rounded-full ${
            STATUS_DOT[status] || "bg-gray-400"
          }`}
        />
        <select
          id="order-status"
          value={status}
          onChange={(e) => handleChange(e.target.value)}
          disabled={saving}
          className="cursor-pointer appearance-none rounded-full border border-stroke bg-white py-1.5 pl-8 pr-8 text-sm font-semibold capitalize text-black shadow-sm transition-colors hover:border-primary focus:border-primary focus:outline-none disabled:opacity-60 dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 h-3 w-3 text-gray-400"
          fill="none"
          viewBox="0 0 20 20"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 7l5 5 5-5"
          />
        </svg>
      </div>
      {saving && (
        <span className="text-xs text-gray-500 dark:text-bodydark2">Saving…</span>
      )}
      {error && (
        <span className="text-xs text-red-500" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
