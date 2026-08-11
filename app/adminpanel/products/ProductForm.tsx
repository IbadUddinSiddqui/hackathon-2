"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, ArrowLeft } from "lucide-react";
import type { ProductSummary } from "./ProductListManager";

const inputClass =
  "w-full rounded border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white";

export default function ProductForm({ product }: { product?: ProductSummary | null }) {
  const editing = Boolean(product);
  const router = useRouter();

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "",
    category: product?.category ?? "",
    category_slug: product?.category_slug ?? "",
    size: (product?.size ?? []).join(", "),
    brand: product?.brand ?? "",
    color: product?.color ?? "",
    tags: (product?.tags ?? []).join(", "),
    imageUrls: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const splitList = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category.trim(),
      category_slug: form.category_slug.trim(),
      size: splitList(form.size),
      brand: form.brand.trim(),
      color: form.color.trim(),
      tags: splitList(form.tags),
    };
    if (!editing) payload.imageUrls = splitList(form.imageUrls);

    try {
      const res = await fetch(
        editing ? `/api/admin/products/${product!._id}` : "/api/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save product");

      router.push("/adminpanel/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Delete failed");
      }
      router.push("/adminpanel/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
    >
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        <div>
          <label htmlFor="pf-name" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Name *
          </label>
          <input
            id="pf-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Classic Cotton Tee"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-brand" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Brand
          </label>
          <input
            id="pf-brand"
            type="text"
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            placeholder="AnK's"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-price" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Price (PKR) *
          </label>
          <input
            id="pf-price"
            type="number"
            required
            min="0"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            placeholder="1499"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-stock" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Stock *
          </label>
          <input
            id="pf-stock"
            type="number"
            required
            min="0"
            value={form.stock}
            onChange={(e) => update("stock", e.target.value)}
            placeholder="50"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-category" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Category *
          </label>
          <input
            id="pf-category"
            type="text"
            required
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="T-Shirts"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-slug" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Category slug *
          </label>
          <input
            id="pf-slug"
            type="text"
            required
            value={form.category_slug}
            onChange={(e) => update("category_slug", e.target.value)}
            placeholder="t-shirts"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-size" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Sizes * (comma-separated)
          </label>
          <input
            id="pf-size"
            type="text"
            required
            value={form.size}
            onChange={(e) => update("size", e.target.value)}
            placeholder="S, M, L, XL"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pf-color" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Color <span className="font-normal text-gray-400">(e.g. Blue or #3498db)</span>
          </label>
          <input
            id="pf-color"
            type="text"
            value={form.color}
            onChange={(e) => update("color", e.target.value)}
            placeholder="Blue"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-bodydark2">
            Shown on the product page and recorded on every order so the right color is delivered.
          </p>
        </div>

        <div>
          <label htmlFor="pf-tags" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Tags (comma-separated)
          </label>
          <input
            id="pf-tags"
            type="text"
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="new, summer"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="pf-desc" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
            Description
          </label>
          <textarea
            id="pf-desc"
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Soft 100% cotton, regular fit…"
            className={inputClass}
          />
        </div>

        {!editing && (
          <div className="md:col-span-2">
            <label htmlFor="pf-images" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
              Image URLs * (one per line or comma-separated, http(s))
            </label>
            <textarea
              id="pf-images"
              rows={3}
              required
              value={form.imageUrls}
              onChange={(e) => update("imageUrls", e.target.value)}
              placeholder={"https://example.com/tee-front.jpg\nhttps://example.com/tee-back.jpg"}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-bodydark2">
              Images are downloaded and stored as Sanity assets (max 8). Editing images on existing
              products isn&apos;t supported yet — delete and recreate, or use Studio.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 md:col-span-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Product"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded border border-stroke px-5 py-2 text-sm font-medium text-red-500 hover:border-red-500 disabled:opacity-60 dark:border-strokedark"
            >
              <Trash2 className="h-4 w-4" />
              Delete product
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/adminpanel/products")}
            className="inline-flex items-center gap-2 rounded border border-stroke px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-bodydark2 dark:hover:bg-meta-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
