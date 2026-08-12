"use client";

import { motion } from "framer-motion";
import { useTenant } from "@/lib/tenant-provider";

/**
 * P07 — shared editorial section head that gives the homepage one consistent
 * rhythm: eyebrow (accent) → hairline → heading. Every section uses the same
 * structure and the same quiet cinematic reveal, so the page reads as one
 * continuous editorial experience instead of stacked widgets.
 *
 * `align` defaults to center (NewArrivals/TopSale/Recs); the Category bento
 * keeps its own left-aligned variant (it predates this component).
 */
export default function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";

  const alignCls =
    align === "left"
      ? "text-left"
      : "flex flex-col items-center text-center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-12 ${alignCls}`}
    >
      {eyebrow && (
        <div className="mb-3 flex items-center gap-4">
          {align === "left" && <span aria-hidden className="h-px w-8 bg-brand-line-strong" />}
          <span
            className="text-eyebrow"
            style={{ color: accent === "#000000" ? undefined : accent }}
          >
            {eyebrow}
          </span>
          {align === "center" && <span aria-hidden className="h-px w-8 bg-brand-line-strong" />}
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-inverse sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-xl text-sm text-brand-muted">{subtitle}</p>
      )}
    </motion.div>
  );
}
