"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type RowResult = {
  row: number;
  name: string | null;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
};

type ImportResponse = {
  summary: { created: number; updated: number; skipped: number; total: number };
  results: RowResult[];
};

const STATUS_STYLES: Record<RowResult["status"], string> = {
  created: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  updated: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  skipped: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function BulkImportManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = useCallback((file: File | null | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    const ok = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!ok) {
      setError("Please choose an .xlsx, .xls or .csv file.");
      setFileName(null);
      return;
    }
    setFileName(file.name);
  }, []);

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/products/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Import failed (HTTP ${res.status})`);
        return;
      }

      setResult(data);
    } catch {
      setError("Network error while uploading. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-stroke bg-white hover:border-primary/60 dark:border-strokedark dark:bg-boxdark"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div className="flex flex-col items-center gap-3">
          {fileName ? (
            <>
              <FileSpreadsheet className="h-12 w-12 text-green-600" />
              <p className="text-base font-semibold text-black dark:text-white">{fileName}</p>
              <p className="text-sm text-gray-500">Click to choose a different file</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-12 w-12 text-gray-400" />
              <p className="text-base font-semibold text-black dark:text-white">
                Drag & drop your Excel file here
              </p>
              <p className="text-sm text-gray-500">or click to browse (.xlsx, .xls, .csv — max 10 MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleUpload}
          disabled={!fileName || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Importing…
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              Import products
            </>
          )}
        </button>
        <a
          href="/api/admin/products/bulk-import?template=1"
          className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-boxdark/80"
        >
          <Download className="h-4 w-4" />
          Download template
        </a>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <XCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="mb-4 text-lg font-bold text-black dark:text-white">Import results</h2>

          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Created"
              value={result.summary.created}
              className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
            />
            <StatCard
              label="Updated"
              value={result.summary.updated}
              className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
            />
            <StatCard
              label="Skipped"
              value={result.summary.skipped}
              className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400"
            />
            <StatCard
              label="Total rows"
              value={result.summary.total}
              className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800/20 dark:text-gray-300"
            />
          </div>

          {result.results.length > 0 && (
            <div className="max-h-96 overflow-auto rounded-lg border border-stroke dark:border-strokedark">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-boxdark dark:text-bodydark2">
                  <tr>
                    <th className="px-4 py-2.5">Row</th>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr key={r.row} className="border-t border-stroke dark:border-strokedark">
                      <td className="px-4 py-2 text-gray-500">{r.row}</td>
                      <td className="px-4 py-2 font-medium text-black dark:text-white">
                        {r.name ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                          {r.status === "error" || r.status === "skipped" ? (
                            r.status === "error" ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-bodydark2">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-lg border p-4 text-center ${className}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}
