"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  PackageOpen,
} from "lucide-react";

export type ProductSummary = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  category_slug: string;
  brand?: string;
  color?: string;
  size: string[];
  tags: string[];
  mainImage?: string;
  created_at?: string;
};

type ListResponse = {
  items: ProductSummary[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

const PAGE_SIZE = 20;

export default function ProductListManager() {
  const router = useRouter();
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, s: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
        if (s) params.set("search", s);
        const res = await fetch(`/api/admin/products?${params.toString()}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error(`Failed to load products (HTTP ${res.status})`);
        const data: ListResponse = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setPage(data.page);
        setPages(data.pages);
      } catch (e: any) {
        setError(e.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Debounced search — reset to page 1 on query change.
  useEffect(() => {
    const t = setTimeout(() => load(1, search.trim()), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleDelete = async (product: ProductSummary) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product._id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Delete failed");
      }
      // If this was the last row on a page, step back one page.
      if (items.length === 1 && page > 1) load(page - 1, search.trim());
      else load(page, search.trim());
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const stockBadge = (stock: number) => {
    if (stock <= 0)
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
    if (stock <= 5)
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
    return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-stroke bg-white py-2 pl-9 pr-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
          />
        </div>
        <Link
          href="/adminpanel/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-50 text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    <p className="mt-3 text-gray-400 dark:text-bodydark2">Loading products…</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-400 dark:text-bodydark2">
                    <PackageOpen className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    {search.trim()
                      ? `No products match "${search.trim()}".`
                      : "No products yet — create one or use the Bulk Import tab."}
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-stroke transition-colors last:border-0 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.mainImage}
                            alt={p.name}
                            className="h-11 w-11 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 dark:bg-meta-4">
                            <ImageOff className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/adminpanel/products/${p._id}/edit`}
                            className="block truncate font-semibold text-black hover:text-primary dark:text-white"
                          >
                            {p.name}
                          </Link>
                          <p className="truncate text-xs text-gray-400 dark:text-bodydark2">
                            {p.brand ? `${p.brand} · ` : ""}
                            {p.color ? `${p.color} · ` : ""}
                            {p.size.join(", ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-black dark:text-white">
                      Rs {p.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${stockBadge(p.stock)}`}>
                        {p.stock <= 0 ? "Out of stock" : `${p.stock} in stock`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-bodydark2">{p.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/adminpanel/products/${p._id}/edit`}
                          className="inline-flex items-center gap-1 rounded border border-stroke px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary dark:border-strokedark dark:text-bodydark2"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p._id}
                          className="inline-flex items-center gap-1 rounded border border-stroke px-2.5 py-1 text-xs font-medium text-red-500 hover:border-red-500 disabled:opacity-50 dark:border-strokedark"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke px-4 py-3 dark:border-strokedark">
          <p className="text-xs text-gray-500 dark:text-bodydark2">
            Showing <span className="font-semibold text-black dark:text-white">{from}–{to}</span> of{" "}
            <span className="font-semibold text-black dark:text-white">{total}</span> products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(page - 1, search.trim())}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded border border-stroke px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark dark:text-bodydark2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="px-1 text-xs text-gray-500 dark:text-bodydark2">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => load(page + 1, search.trim())}
              disabled={page >= pages || loading}
              className="inline-flex items-center gap-1 rounded border border-stroke px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark dark:text-bodydark2"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
