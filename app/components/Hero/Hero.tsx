"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { useTenant } from "@/lib/tenant-provider";

const SALE_MS = 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000;

function useCountdown(): {
  days: number;
  hours: number;
  minutes: number;
  ready: boolean;
} {
  // `ready` gates the rendered numbers until mount: seeding useState with
  // Date.now() during SSR would mismatch the client-hydrated HTML, so the
  // server always renders the stable "--" placeholder instead.
  const [end] = useState(() => Date.now() + SALE_MS);
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(0, end - now);
  const totalMinutes = Math.floor(remaining / 60_000);
  return {
    days: Math.floor(totalMinutes / (24 * 60)),
    hours: Math.floor((totalMinutes % (24 * 60)) / 60),
    minutes: totalMinutes % 60,
    ready,
  };
}

// P05 — Cinematic entrance register (per Brand Brief §Motion): slow, quiet,
// precise reveals for the hero; snappy springs stay reserved for
// interactions. The headline lifts through a clip-path mask (not a plain
// y-slide) and the body copy fades in on a long, gentle curve.
const maskReveal = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 + i * 0.12 },
  }),
};

export default function FashionHero() {
  const { locale } = useLocale();
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const { days, hours, minutes, ready } = useCountdown();

  // P05 decision (documented): the multi-category collage STAYS — it mirrors
  // the real catalog and the category bento below already owns editorial
  // category storytelling. The menswear-forward voice is carried by copy,
  // type and treatment: dark campaign backdrop, Fraunces display headline,
  // editorial season metadata. The 8s wobble and floating thread are CUT
  // (decorative loops with no orientation purpose — Brand Brief §Motion).
  const collage = [
    { href: "/products/mens-clothing", src: "/mens-clothing.webp", label: t(locale, "hero.mens") },
    { href: "/products/womens-clothing", src: "/womens-clothing.jpg", label: t(locale, "hero.womens") },
    { href: "/products/wearables", src: "/wearables.jpg", label: t(locale, "hero.wearables") },
    { href: "/products/children", src: "/children.jpg", label: t(locale, "hero.children") },
  ];

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-brand-ink text-brand-ink-inverse dark:bg-brand-ink-inverse dark:text-brand-ink">
      {/* Campaign photograph — full-bleed hero bg (bg.png), shown at full
          strength. It is a dark low-key menswear shot, so the text column
          relies on the legibility gradient below (dark left → clear right).
          Parallax scale kept as a restrained depth cue. */}
      <motion.div style={{ scale }} className="absolute inset-0 z-0">
        <Image
          src="/bg.png"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Legibility gradient — ink on the text column, fading right. */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-gradient-to-r from-brand-ink via-brand-ink/85 to-brand-ink/30 dark:from-brand-ink-inverse dark:via-brand-ink-inverse/85 dark:to-brand-ink-inverse/30"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          {/* Text column — asymmetric 7/5 split, editorial column measure */}
          <div className="lg:col-span-7">
            <div className="max-w-2xl space-y-9">
              {/* Editorial metadata: season eyebrow in accent, then a hairline */}
              <motion.div
                custom={0}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4"
              >
                <span
                  className="text-eyebrow"
                  style={{ color: accent === "#000000" ? "#ffffff" : accent }}
                >
                  {t(locale, "hero.eyebrow")}
                </span>
                <span aria-hidden className="h-px w-12 bg-brand-ink-inverse/25 dark:bg-brand-ink/25" />
              </motion.div>

              {/* Display headline — Fraunces, mask-wipe reveal */}
              <div className="overflow-hidden">
                <motion.h1
                  variants={maskReveal}
                  initial="hidden"
                  animate="visible"
                  className="text-display text-brand-ink-inverse dark:text-brand-ink"
                >
                  {t(locale, "hero.title1")}
                  <br />
                  <em
                    className="not-italic"
                    style={{ color: accent === "#000000" ? "#ffffff" : accent }}
                  >
                    {t(locale, "hero.title2")}
                  </em>
                </motion.h1>
              </div>

              <motion.p
                custom={1}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="max-w-xl text-lg leading-relaxed text-brand-ink-inverse/70 dark:text-brand-ink/70"
              >
                {t(locale, "hero.subtitle")}
              </motion.p>

              {/* Flash-sale countdown — editorial bar, not a pill: thin rules,
                  tabular numerals, live 30s tick with SSR-safe placeholder. */}
              <motion.div
                custom={2}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-brand-ink-inverse/15 dark:border-brand-ink/15 py-4"
              >
                <span className="text-eyebrow" style={{ color: accent === "#000000" ? "#ffffff" : accent }}>
                  {t(locale, "hero.sale")}
                </span>
                <span className="text-price tabular-nums text-brand-ink-inverse dark:text-brand-ink">
                  {ready ? `${days}d` : "--d"}
                  <span className="mx-1.5 text-brand-ink-inverse/40 dark:text-brand-ink/40">:</span>
                  {ready ? `${hours}h` : "--h"}
                  <span className="mx-1.5 text-brand-ink-inverse/40 dark:text-brand-ink/40">:</span>
                  {ready ? `${minutes}m` : "--m"}
                </span>
              </motion.div>

              {/* CTAs — primary: high-contrast solid (accent never dominates a
                  CTA again); secondary: quiet underline link. */}
              <motion.div
                custom={3}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap items-center gap-x-8 gap-y-4"
              >
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-3 rounded-none bg-brand-ink-inverse px-9 py-4 text-sm font-semibold tracking-wide text-brand-ink transition-all duration-300 hover:bg-white dark:bg-brand-ink dark:text-brand-ink-inverse dark:hover:bg-brand-charcoal"
                >
                  {t(locale, "hero.shopNew")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/products/mens-clothing"
                  className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide text-brand-ink-inverse/85 dark:text-brand-ink/85 transition-colors hover:text-brand-ink-inverse dark:hover:text-brand-ink"
                >
                  {t(locale, "hero.explore")}
                  <span
                    aria-hidden
                    className="h-px w-8 bg-brand-ink-inverse/40 dark:bg-brand-ink/40 transition-all duration-300 group-hover:w-12 group-hover:bg-brand-ink-inverse dark:group-hover:bg-brand-ink"
                  />
                </Link>
              </motion.div>

              {/* Trust metadata — restrained row with hairline dividers,
                  replacing the generic badge grid. */}
              <motion.div
                custom={4}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-xs text-brand-ink-inverse/60 dark:text-brand-ink/60"
              >
                {[
                  t(locale, "hero.freeReturns"),
                  t(locale, "hero.eco"),
                  t(locale, "hero.quality"),
                  t(locale, "hero.support"),
                ].map((text, i) => (
                  <span key={text} className="flex items-center gap-3">
                    {i > 0 && <span aria-hidden className="h-3 w-px bg-brand-ink-inverse/20 dark:bg-brand-ink/20" />}
                    {text}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Editorial collage — tight 2×2, sharp corners, quiet hover zoom.
              No infinite wobble (cut). */}
          <motion.div
            className="relative hidden lg:col-span-5 lg:block"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
          >
            <div className="grid h-[560px] grid-cols-2 gap-3">
              {collage.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative block overflow-hidden bg-brand-ink-soft dark:bg-brand-surface-alt ${
                    i === 0 ? "row-span-2" : ""
                  }`}
                >
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    sizes="(max-width: 1024px) 0vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 dark:from-brand-ink-inverse/80 via-transparent to-transparent" />
                  <span className="absolute bottom-4 left-4 text-xs font-medium uppercase tracking-[0.15em] text-brand-ink-inverse/90 dark:text-brand-ink/90">
                    {item.label}
                  </span>
                  {/* Hairline reveal on hover */}
                  <span
                    aria-hidden
                    className="absolute inset-x-4 bottom-0 h-px origin-left scale-x-0 bg-brand-ink-inverse/60 dark:bg-brand-ink/60 transition-transform duration-500 group-hover:scale-x-100"
                  />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M5 12H19M19 12L13 6M19 12L13 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
