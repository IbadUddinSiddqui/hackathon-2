"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Plus } from "lucide-react";

export default function AdjustCustomer({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [credit, setCredit] = useState("");
  const [points, setPoints] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const creditDelta = credit ? Number(credit) : 0;
      const pointsDelta = points ? Number(points) : 0;
      if (!creditDelta && !pointsDelta) {
        setError("Enter a credit and/or points change.");
        return;
      }
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditDelta, pointsDelta }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to update");
      setMessage("Saved ✓");
      setCredit("");
      setPoints("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="flex items-center gap-2 font-semibold text-black dark:text-white">
        <Coins className="h-4 w-4" /> Adjust balances
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-bodydark2">
        Positive adds, negative removes (e.g. credit −200 revokes Rs 200).
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-bodydark2">
            Store credit Δ (Rs)
          </label>
          <input
            type="number"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            placeholder="+500"
            className="w-32 rounded border border-stroke bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-bodydark2">
            Points Δ
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="+100"
            className="w-32 rounded border border-stroke bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Apply"}
        </button>
        {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </form>
    </div>
  );
}
