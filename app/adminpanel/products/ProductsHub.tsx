"use client";

import { useState } from "react";
import { Package, FileSpreadsheet } from "lucide-react";
import ProductListManager from "./ProductListManager";
import BulkImportManager from "./BulkImportManager";

const TABS = [
  { id: "list", label: "All Products", icon: Package },
  { id: "import", label: "Bulk Import", icon: FileSpreadsheet },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProductsHub() {
  const [tab, setTab] = useState<TabId>("list");

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-lg border border-stroke bg-white p-1 dark:border-strokedark dark:bg-boxdark">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 dark:text-bodydark2 dark:hover:bg-meta-4"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "list" ? <ProductListManager /> : <BulkImportManager />}
    </div>
  );
}
