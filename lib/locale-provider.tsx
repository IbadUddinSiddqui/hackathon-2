"use client";

// lib/locale-provider.tsx
// P3-20 — client-side locale context. The server layout reads the cookie and
// seeds this provider; `setLocale` writes the cookie and refreshes so the
// server re-renders with the new `lang`/`dir` on <html>. No external deps.

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      // Persist for a year; refresh re-renders server components (and <html dir>).
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
