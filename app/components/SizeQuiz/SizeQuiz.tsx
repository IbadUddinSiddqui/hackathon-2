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
    "w-full border border-brand-line bg-transparent px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-ink focus:outline-none dark:border-brand-line  ";

  return (
    <div className="mt-4 border border-dashed border-brand-line-strong p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-semibold text-brand-ink underline underline-offset-4 transition-opacity hover:opacity-70 "
      >
        {open ? "Hide" : "📏"} {t(locale, "product.findMySize")}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-4">
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
                <label className="mb-1 block text-xs font-medium text-brand-muted">
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
                  <p className="mt-1 text-xs text-brand-bad">{errors[key]}</p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-ink py-2.5 text-sm font-semibold text-brand-ink-inverse transition-opacity hover:opacity-90 dark:bg-brand-ink-inverse dark:text-brand-ink"
          >
            {t(locale, "product.recommendSize")}
          </button>

          {result && (
            <p className="text-center text-sm font-semibold text-brand-ok">
              {t(locale, "product.weRecommend")}{" "}
              <span className="text-lg">{result}</span>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
