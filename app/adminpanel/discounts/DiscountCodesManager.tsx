"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DiscountCode } from "./page";

type FormState = {
  code: string;
  type: "percent" | "fixed";
  value: string;
  active: boolean;
  maxUses: string;
  expiresAt: string;
};

const EMPTY_FORM: FormState = {
  code: "",
  type: "percent",
  value: "",
  active: true,
  maxUses: "100",
  expiresAt: "",
};

function toForm(code: DiscountCode): FormState {
  return {
    code: code.code,
    type: code.type,
    value: String(code.value),
    active: code.active,
    maxUses: String(code.maxUses ?? 100),
    expiresAt: code.expiresAt ? code.expiresAt.slice(0, 16) : "",
  };
}

export default function DiscountCodesManager({
  initialCodes,
}: {
  initialCodes: DiscountCode[];
}) {
  const router = useRouter();
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setMessage(null);
  };

  const startEdit = (code: DiscountCode) => {
    setEditingId(code._id);
    setForm(toForm(code));
    setError(null);
    setMessage(null);
  };

  const updateField = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      active: form.active,
      maxUses: Number(form.maxUses) || 0,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/discount-codes/${editingId}` : "/api/discount-codes",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save discount code");
      }

      const saved: DiscountCode | undefined = data?.code;
      if (saved) {
        setCodes((prev) =>
          editingId
            ? prev.map((c) => (c._id === saved._id ? { ...c, ...saved } : c))
            : [saved, ...prev]
        );
      }

      setMessage(editingId ? "Discount code updated." : "Discount code created.");
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save discount code");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (code: DiscountCode) => {
    setSaving(true);
    setError(null);
    try {
      // Send the same ISO-expiry payload the edit form uses (toForm returns
      // datetime-local format, which Sanity datetime fields would reject).
      const f = toForm(code);
      const response = await fetch(`/api/discount-codes/${code._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: f.code,
          type: f.type,
          value: Number(f.value),
          active: !code.active,
          maxUses: Number(f.maxUses) || 0,
          expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update code");
      }
      // Reflect the toggle immediately, then sync with the server.
      setCodes((prev) => prev.map((c) => (c._id === code._id ? { ...c, active: !code.active } : c)));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update code");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: DiscountCode) => {
    if (!window.confirm(`Delete discount code ${code.code}? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/discount-codes/${code._id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete code");
      }
      setCodes((prev) => prev.filter((c) => c._id !== code._id));
      setMessage(`Discount code ${code.code} deleted.`);
      if (editingId === code._id) resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete code");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded border border-stroke bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white";

  return (
    <div className="flex flex-col gap-6">
      {/* Create / Edit form */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
          <h2 className="font-semibold text-black dark:text-white">
            {editingId ? `Edit Code: ${form.code}` : "Create New Code"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <div>
            <label htmlFor="dc-code" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
              Code
            </label>
            <input
              id="dc-code"
              type="text"
              required
              value={form.code}
              onChange={(e) => updateField("code", e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="dc-type" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
              Type
            </label>
            <select
              id="dc-type"
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className={inputClass}
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (Rs)</option>
            </select>
          </div>

          <div>
            <label htmlFor="dc-value" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
              Value
            </label>
            <input
              id="dc-value"
              type="number"
              required
              min="0"
              step="0.01"
              value={form.value}
              onChange={(e) => updateField("value", e.target.value)}
              placeholder={form.type === "percent" ? "10" : "5"}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="dc-max" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
              Max Uses (0 = unlimited)
            </label>
            <input
              id="dc-max"
              type="number"
              min="0"
              value={form.maxUses}
              onChange={(e) => updateField("maxUses", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="dc-expires" className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-bodydark2">
              Expires At (optional)
            </label>
            <input
              id="dc-expires"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => updateField("expiresAt", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-bodydark2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField("active", e.target.checked)}
                className="h-4 w-4 rounded border-stroke"
              />
              Active
            </label>
          </div>

          <div className="flex items-end gap-2 md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Code"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-stroke px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-bodydark2 dark:hover:bg-meta-4"
              >
                Cancel
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-500 md:col-span-3" role="alert">{error}</p>}
          {message && <p className="text-sm text-green-600 md:col-span-3">{message}</p>}
        </form>
      </div>

      {/* Code list */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
          <h2 className="font-semibold text-black dark:text-white">Existing Codes ({codes.length})</h2>
        </div>

        {codes.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 dark:text-bodydark2">
            No discount codes yet. Create one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-50 text-gray-500 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2">
                  <th className="px-6 py-3 font-medium">Code</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Value</th>
                  <th className="px-6 py-3 font-medium">Uses</th>
                  <th className="px-6 py-3 font-medium">Expires</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr
                    key={code._id}
                    className="border-b border-stroke last:border-0 dark:border-strokedark"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-black dark:text-white">
                      {code.code}
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600 dark:text-bodydark2">
                      {code.type}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                      {code.type === "percent" ? `${code.value}%` : `Rs ${code.value.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                      {code.usedCount ?? 0} / {code.maxUses ?? 0}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-bodydark2">
                      {code.expiresAt
                        ? new Date(code.expiresAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          code.active
                            ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300"
                            : "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300"
                        }`}
                      >
                        {code.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(code)}
                          className="rounded border border-stroke px-3 py-1 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary dark:border-strokedark dark:text-bodydark2 dark:hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(code)}
                          disabled={saving}
                          className="rounded border border-stroke px-3 py-1 text-xs font-medium text-gray-600 hover:border-yellow-500 hover:text-yellow-600 dark:border-strokedark dark:text-bodydark2"
                        >
                          {code.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDelete(code)}
                          disabled={saving}
                          className="rounded border border-stroke px-3 py-1 text-xs font-medium text-red-500 hover:border-red-500 dark:border-strokedark"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
