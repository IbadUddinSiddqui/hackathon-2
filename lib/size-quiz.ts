// lib/size-quiz.ts
// P4-14 — measurement-based size recommendation (pure logic, unit-tested).
// Maps body measurements (cm / kg) to the store's PK letter sizes, then snaps
// the recommendation to the closest size the product actually carries.
// No AI required; the table is the single source of truth and can be tuned.

export type BodyMeasurements = {
  heightCm?: number; // 140–220
  weightKg?: number; // 35–150
  chestCm?: number; // 70–140 (optional, most accurate signal)
  waistCm?: number; // 55–130 (optional, for bottoms)
};

export const SIZE_TABLE: { size: string; chest: [number, number]; height: [number, number] }[] = [
  { size: "XS", chest: [76, 86], height: [150, 160] },
  { size: "S", chest: [86, 96], height: [158, 168] },
  { size: "M", chest: [96, 104], height: [165, 176] },
  { size: "L", chest: [104, 114], height: [173, 184] },
  { size: "XL", chest: [114, 124], height: [181, 192] },
  { size: "XXL", chest: [124, 140], height: [189, 205] },
];

export const WAIST_TABLE: { size: string; waist: [number, number] }[] = [
  { size: "28", waist: [66, 74] },
  { size: "30", waist: [74, 82] },
  { size: "32", waist: [82, 90] },
  { size: "34", waist: [90, 98] },
  { size: "36", waist: [98, 106] },
];

const LETTER_SIZES = new Set(SIZE_TABLE.map((s) => s.size));
const NUMERIC_SIZES = new Set(WAIST_TABLE.map((s) => s.size));

/** Pick the letter size whose range contains chest (fall back to height). */
export function letterSizeFrom(m: BodyMeasurements): string {
  if (m.chestCm) {
    const hit = SIZE_TABLE.find(
      (r) => m.chestCm! >= r.chest[0] && m.chestCm! < r.chest[1]
    );
    if (hit) return hit.size;
    return m.chestCm >= SIZE_TABLE[SIZE_TABLE.length - 1].chest[1] ? "XXL" : "XS";
  }
  if (m.heightCm) {
    const hit = SIZE_TABLE.find(
      (r) => m.heightCm! >= r.height[0] && m.heightCm! < r.height[1]
    );
    if (hit) return hit.size;
    return m.heightCm >= SIZE_TABLE[SIZE_TABLE.length - 1].height[1] ? "XXL" : "XS";
  }
  return "M";
}

/** Pick the numeric (waist) size, or null when measurements don't apply. */
export function numericSizeFrom(m: BodyMeasurements): string | null {
  if (!m.waistCm) return null;
  const hit = WAIST_TABLE.find((r) => m.waistCm! >= r.waist[0] && m.waistCm! < r.waist[1]);
  if (hit) return hit.size;
  return m.waistCm >= WAIST_TABLE[WAIST_TABLE.length - 1].waist[1]
    ? WAIST_TABLE[WAIST_TABLE.length - 1].size
    : WAIST_TABLE[0].size;
}

/**
 * Recommend a size for a given product's available sizes. Tries the direct
 * measurement hit first; otherwise the nearest letter size the product stocks.
 */
export function recommendSize(
  availableSizes: string[],
  measurements: BodyMeasurements
): string | null {
  const sizes = Array.isArray(availableSizes) ? availableSizes : [];
  if (sizes.length === 0) return null;

  const hasNumeric = sizes.some((s) => NUMERIC_SIZES.has(s));
  const hasLetters = sizes.some((s) => LETTER_SIZES.has(s));

  if (hasNumeric && measurements.waistCm) {
    const rec = numericSizeFrom(measurements);
    if (rec && sizes.includes(rec)) return rec;
    // Nearest stocked numeric size.
    const recNum = Number(rec);
    const sorted = [...sizes]
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    if (sorted.length > 0) {
      const nearest = sorted.reduce((best, n) =>
        Math.abs(n - recNum) < Math.abs(best - recNum) ? n : best
      );
      return String(nearest);
    }
  }

  if (hasLetters) {
    const rec = letterSizeFrom(measurements);
    if (sizes.includes(rec)) return rec;
    // Nearest letter size the product stocks.
    const order = SIZE_TABLE.map((s) => s.size);
    const stocked = sizes
      .filter((s) => LETTER_SIZES.has(s))
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (stocked.length > 0) {
      const targetIdx = order.indexOf(rec);
      return stocked.reduce((best, s) =>
        Math.abs(order.indexOf(s) - targetIdx) < Math.abs(order.indexOf(best) - targetIdx)
          ? s
          : best
      );
    }
  }

  // Fallback: first size the product stocks.
  return sizes[0];
}

export type QuizInput = BodyMeasurements;

/** Validate the quiz inputs; returns error strings keyed by field. */
export function validateQuizInput(m: QuizInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (m.heightCm !== undefined && (m.heightCm < 120 || m.heightCm > 220))
    errors.heightCm = "Height must be between 120 and 220 cm";
  if (m.weightKg !== undefined && (m.weightKg < 30 || m.weightKg > 160))
    errors.weightKg = "Weight must be between 30 and 160 kg";
  if (m.chestCm !== undefined && (m.chestCm < 70 || m.chestCm > 140))
    errors.chestCm = "Chest must be between 70 and 140 cm";
  if (m.waistCm !== undefined && (m.waistCm < 55 || m.waistCm > 130))
    errors.waistCm = "Waist must be between 55 and 130 cm";
  return errors;
}
