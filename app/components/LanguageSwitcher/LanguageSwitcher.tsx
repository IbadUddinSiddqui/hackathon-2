"use client";

// app/components/LanguageSwitcher/LanguageSwitcher.tsx
// P3-20 — EN / اردو toggle. Reads the locale from context, writes the cookie
// via setLocale (which refreshes the server render for dir/lang).

import { LOCALES } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-provider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex items-center overflow-hidden rounded-full border border-gray-200 text-xs font-semibold shadow-sm dark:border-gray-700"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          aria-pressed={locale === l.code}
          className={`px-2.5 py-1 transition-colors ${
            locale === l.code
              ? "bg-black text-white dark:bg-white dark:text-gray-900"
              : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
