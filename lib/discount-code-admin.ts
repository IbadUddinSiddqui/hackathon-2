import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

const VALID_TYPES = ["percent", "fixed"];

export type DiscountCodeInput = {
  code?: unknown;
  type?: unknown;
  value?: unknown;
  active?: unknown;
  maxUses?: unknown;
  expiresAt?: unknown;
};

/** Validate the shared discount-code fields; returns an error string or null. */
export function validateDiscountCodeInput(body: DiscountCodeInput): string | null {
  if (typeof body.code !== "string" || !body.code.trim()) {
    return "Code is required";
  }
  if (typeof body.type !== "string" || !VALID_TYPES.includes(body.type)) {
    return `Type must be one of: ${VALID_TYPES.join(", ")}`;
  }
  if (typeof body.value !== "number" || !Number.isFinite(body.value) || body.value < 0) {
    return "Value must be a non-negative number";
  }
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return "Active must be a boolean";
  }
  if (body.maxUses !== undefined && (typeof body.maxUses !== "number" || body.maxUses < 0)) {
    return "Max uses must be a non-negative number";
  }
  if (
    body.expiresAt !== undefined &&
    body.expiresAt !== null &&
    typeof body.expiresAt !== "string"
  ) {
    return "Expires at must be a date string";
  }
  return null;
}

/** Shared guard for discount-code API routes. Returns null when allowed. */
export async function discountCodeGuard() {
  const session = await auth();
  return isAdmin(session) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
