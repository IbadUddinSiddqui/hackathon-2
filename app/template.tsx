"use client";

import { motion } from "framer-motion";

/**
 * Page-level route transition. Next.js re-mounts `template.tsx` on every
 * navigation, so this entrance plays on each route change — no instant cut.
 *
 * Motion values are lifted straight from the existing conventions:
 *   - entrance shape: fade + slight rise (Hero content, CategoryShowcase tiles)
 *   - spring: `stiffness: 260, damping: 24` (ProductCard / CategoryShowcase)
 * The storefront already staggers inner content on top of this, so the page
 * itself stays subtle — one restrained rise, no competing bounces.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}
