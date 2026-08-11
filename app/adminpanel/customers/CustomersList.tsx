"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";

type CustomerSummary = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  creditBalance: number;
  points: number;
  createdAt?: string;
};

type ListResponse = {
  items: CustomerSummary[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

const PAGE_SIZE = 20;

export default function CustomersList() {
  const router = useRouter();
  const [items, setItems] = useState<CustomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, s: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
        if (s) params.set("search", s);
        const res = await fetch(`/api/admin/customers?${params.toString()}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error(`Failed to load customers (HTTP ${res.status})`);
        const data: ListResponse = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setPage(data.page);
        setPages(data.pages);
      } catch (e: any) {
        setError(e.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const t = setTimeout(() => load(1, search.trim()), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name…"
          className="w-full rounded-lg border border-stroke bg-white py-2 pl-9 pr-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
        />
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
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Total Spent</th>
                <th className="px-4 py-3 font-medium">Credit</th>
                <th className="px-4 py-3 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    <p className="mt-3 text-gray-400 dark:text-bodydark2">Loading customers…</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-400 dark:text-bodydark2">
                    <Users className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    {search.trim()
                      ? `No customers match "${search.trim()}".`
                      : "No customers yet — they appear after the first order."}
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => router.push(`/adminpanel/customers/${c._id}`)}
                    className="cursor-pointer border-b border-stroke transition-colors last:border-0 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-black dark:text-white">
                        {c.name || "Guest"}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-bodydark2">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-bodydark2">{c.orderCount}</td>
                    <td className="px-4 py-3 font-medium text-black dark:text-white">
                      Rs {c.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-bodydark2">
                      {c.creditBalance > 0 ? `Rs ${c.creditBalance.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-bodydark2">{c.points}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke px-4 py-3 dark:border-strokedark">
          <p className="text-xs text-gray-500 dark:text-bodydark2">
            Showing <span className="font-semibold text-black dark:text-white">{from}–{to}</span> of{" "}
            <span className="font-semibold text-black dark:text-white">{total}</span> customers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(page - 1, search.trim())}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded border border-stroke px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark dark:text-bodydark2"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="px-1 text-xs text-gray-500 dark:text-bodydark2">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => load(page + 1, search.trim())}
              disabled={page >= pages || loading}
              className="inline-flex items-center gap-1 rounded border border-stroke px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark dark:text-bodydark2"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
