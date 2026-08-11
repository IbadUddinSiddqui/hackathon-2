"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Mail, RefreshCw } from "lucide-react";

type AbandonedCart = {
  _id: string;
  email: string;
  items?: { name?: string; quantity?: number; price?: number }[];
  subtotal?: number;
  status?: string;
  remindedAt?: string;
  createdAt?: string;
};

const STATUS_STYLES: Record<string, string> = {
  abandoned: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  reminded: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  recovered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AbandonedList() {
  const router = useRouter();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/abandoned");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(`Failed to load carts (HTTP ${res.status})`);
      const data = await res.json();
      setCarts(data.carts || []);
    } catch (e: any) {
      setError(e.message || "Failed to load carts");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const sendReminder = async (cart: AbandonedCart) => {
    setSendingId(cart._id);
    setError(null);
    try {
      const res = await fetch("/api/admin/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cart._id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to send reminder");
      }
      load();
    } catch (e: any) {
      setError(e.message || "Failed to send reminder");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-bodydark2">
          {carts.length} saved cart{carts.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded border border-stroke px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary dark:border-strokedark dark:text-bodydark2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-50 text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Since</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && carts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    <p className="mt-3 text-gray-400 dark:text-bodydark2">Loading carts…</p>
                  </td>
                </tr>
              ) : carts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-400 dark:text-bodydark2">
                    <ShoppingCart className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    No abandoned carts yet.
                  </td>
                </tr>
              ) : (
                carts.map((cart) => {
                  const itemCount = (cart.items || []).reduce(
                    (sum, i) => sum + (i.quantity || 0),
                    0
                  );
                  return (
                    <tr
                      key={cart._id}
                      className="border-b border-stroke last:border-0 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-black dark:text-white">{cart.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-bodydark2">
                        {itemCount > 0
                          ? `${itemCount} item${itemCount > 1 ? "s" : ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-black dark:text-white">
                        Rs {(cart.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            STATUS_STYLES[cart.status || ""] ||
                            "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300"
                          }`}
                        >
                          {cart.status || "?"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-bodydark2">
                        {fmtDate(cart.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          {cart.status === "abandoned" ? (
                            <button
                              onClick={() => sendReminder(cart)}
                              disabled={sendingId === cart._id}
                              className="inline-flex items-center gap-1 rounded border border-stroke px-2.5 py-1 text-xs font-medium text-primary hover:border-primary disabled:opacity-50 dark:border-strokedark"
                            >
                              <Mail className="h-3 w-3" />
                              {sendingId === cart._id ? "Sending…" : "Remind"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-bodydark2">
                              {cart.status === "reminded" ? `Emailed ${fmtDate(cart.remindedAt)}` : ""}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
