// lib/product-colors.ts
// Pure, testable helpers for the product-page color picker. The model is one
// color per listing ("Classic Cotton Tee - Blue"), so the picker links between
// sibling listings. A sibling is any product whose base name (name minus its
// own trailing " - <color>" suffix) matches the current product's base name.

/** Escape regex special characters so user-provided color names can be used safely. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strip a trailing " - <color>" (also " — ", " – ", ":") suffix from a product
 * name. When no color is provided (or it doesn't appear as a suffix), the name
 * is returned trimmed and unchanged.
 */
export function stripColorSuffix(name: string, color?: string): string {
  if (!color) return name.trim();
  const escaped = escapeRegExp(color.trim());
  return name
    .trim()
    .replace(new RegExp(`\\s*[-–—:]\\s*${escaped}\\s*$`, "i"), "")
    .trim();
}

export type ColorSibling = {
  _id: string;
  name: string;
  color: string;
  category_slug: string;
};

/**
 * From candidate products (fetched by base-name prefix), pick the true color
 * siblings: every candidate whose own base name equals the current product's
 * base name and which has a color. The current product itself is excluded.
 * Results are sorted alphabetically by color for a stable swatch order.
 */
export function selectColorSiblings(
  current: { _id: string; name: string; color?: string },
  candidates: { _id: string; name: string; color?: string; category_slug?: string }[]
): ColorSibling[] {
  if (!current.color) return [];
  const base = stripColorSuffix(current.name, current.color);
  if (!base) return [];

  return candidates
    .filter((c) => c._id !== current._id && !!c.color)
    .filter((c) => stripColorSuffix(c.name, c.color).toLowerCase() === base.toLowerCase())
    .map((c) => ({
      _id: c._id,
      name: c.name,
      color: c.color!,
      category_slug: c.category_slug || "all",
    }))
    .sort((a, b) => a.color.localeCompare(b.color));
}
