"use client";

import { motion } from "framer-motion";

/**
 * Page-level route transition. Next.js re-mounts `template.tsx` on every
 * navigation, so this entrance plays on each route change — no instant cut.
 *
 * P19 — the two-register rule (Brand Brief §Motion): entrances are SLOW and
 * QUIET (cinematic), interactions stay SNAPPY. This is an entrance, so it
 * uses the same long gentle ease as the Hero mask-reveal and SectionHead —
 * not the interaction springs (which stay in buttons/badges/checkboxes).
 * The storefront staggers inner content on top of this, so the page itself
 * stays subtle: one restrained rise, ~0.6s.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
