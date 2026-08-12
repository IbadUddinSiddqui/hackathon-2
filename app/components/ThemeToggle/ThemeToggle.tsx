"use client";

// app/components/ThemeToggle/ThemeToggle.tsx
// Storefront dark/light toggle. Uses next-themes, which is already mounted
// app-wide (components/ui/provider.tsx → ThemeProvider attribute="class"), so
// this button toggles the `dark` class on <html> and persists the choice under
// next-themes' `theme` localStorage key with no FOUC. The icon swap uses a
// quick fade/rotate so it matches the site's interaction register (badge pops,
// drawer springs) instead of snapping; MotionConfig reducedMotion="user" in
// the layout disables it for users who opt out of motion.

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";

interface ThemeToggleProps {
  /** Extra classes for the button (e.g. the header's `actionBtn` treatment). */
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration mismatch: resolvedTheme is undefined before mount, so we
  // render nothing until the client knows the real theme.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={t(locale, "header.theme")}
        className={`rounded-full p-2 ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = t(locale, "header.theme");

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={`rounded-full p-2 transition-colors ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ opacity: 0, scale: 0.5, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 25 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="block"
        >
          {isDark ? (
            <IoMoonOutline size={21} />
          ) : (
            <IoSunnyOutline size={21} />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
