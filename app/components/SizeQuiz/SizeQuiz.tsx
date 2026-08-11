"use client";

// app/components/SizeQuiz/SizeQuiz.tsx
// P4-14 — "Find my size" quiz. Collects height/weight/chest/waist (cm) and
// recommends a size from the product's own size chart via lib/size-quiz.

import React, { useState } from "react";
import { recommendSize, validateQuizInput, type BodyMeasurements } from "@/lib/size-quiz";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

export default function SizeQuiz({ availableSizes }: { availableSizes: string[] }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BodyMeasurements>({});
  const [result, setResult] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof BodyMeasurements) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v === "" ? undefined : Number(v) }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateQuizInput(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setResult(null);
      return;
    }
    setResult(recommendSize(availableSizes, form));
  };

  const inputCls =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";

  return (
    <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
      >
        {open ? "Hide" : "📏"} {t(locale, "product.findMySize")}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["heightCm", t(locale, "product.heightCm")],
                ["weightKg", t(locale, "product.weightKg")],
                ["chestCm", t(locale, "product.chestCm")],
                ["waistCm", t(locale, "product.waistCm")],
              ] as [keyof BodyMeasurements, string][]
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">
                  {label}
                </label>
                <input
                  type="number"
                  value={form[key] ?? ""}
                  onChange={set(key)}
                  placeholder={key === "heightCm" ? "175" : key === "weightKg" ? "70" : ""}
                  className={inputCls}
                />
                {errors[key] && (
                  <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {t(locale, "product.recommendSize")}
          </button>

          {result && (
            <p className="text-center text-sm font-semibold text-green-700 dark:text-green-400">
              {t(locale, "product.weRecommend")}{" "}
              <span className="text-lg">{result}</span>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
