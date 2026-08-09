import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import {
  discountCodeGuard,
  validateDiscountCodeInput,
  type DiscountCodeInput,
} from "@/lib/discount-code-admin";

export async function GET() {
  const unauthorized = await discountCodeGuard();
  if (unauthorized) return unauthorized;

  const codes = await serverClient.fetch(
    `*[_type == "discountCode"] | order(code asc) {
      _id,
      code,
      type,
      value,
      active,
      maxUses,
      usedCount,
      expiresAt
    }`
  );

  return NextResponse.json({ codes });
}

export async function POST(request: Request) {
  const unauthorized = await discountCodeGuard();
  if (unauthorized) return unauthorized;

  let body: DiscountCodeInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const error = validateDiscountCodeInput(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    // Prevent duplicate codes.
    const existing = await serverClient.fetch(
      `*[_type == "discountCode" && code == $code][0]{_id}`,
      { code: String(body.code).trim().toUpperCase() }
    );
    if (existing) {
      return NextResponse.json(
        { error: `Code ${String(body.code).toUpperCase()} already exists` },
        { status: 400 }
      );
    }

    const doc = await serverClient.create({
      _type: "discountCode",
      code: String(body.code).trim().toUpperCase(),
      type: body.type,
      value: body.value,
      active: body.active ?? true,
      maxUses: body.maxUses ?? 100,
      usedCount: 0,
      expiresAt: body.expiresAt || undefined,
    });

    return NextResponse.json({ code: doc }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create discount code:", err);
    return NextResponse.json({ error: "Failed to create discount code" }, { status: 500 });
  }
}
