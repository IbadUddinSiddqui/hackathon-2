import { NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/discounts";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Validate a discount code for the given subtotal. Used by the cart page's
 * "Apply" button to preview the discount; the final discount is always
 * recomputed server-side at payment time.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { key: "validate-discount", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";
    const subtotal = Number(body?.subtotal);

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 });
    }

    const result = await validateDiscountCode(code, subtotal);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: result.code,
      discountAmount: Math.round(result.discountAmount * 100) / 100,
    });
  } catch (error: any) {
    console.error("Validate discount error:", error);
    return NextResponse.json({ error: "Failed to validate code" }, { status: 500 });
  }
}
