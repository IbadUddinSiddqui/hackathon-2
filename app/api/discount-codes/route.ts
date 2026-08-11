import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import {
  validateDiscountCodeInput,
  type DiscountCodeInput,
} from "@/lib/discount-code-admin";
import { logAdminAction } from "@/lib/audit";
import { getTenantContext, tenantFilter } from "@/lib/tenants";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await serverClient.fetch(
    `*[_type == "discountCode" && ${tenantFilter()}] | order(code asc) {
      _id,
      code,
      type,
      value,
      active,
      maxUses,
      usedCount,
      expiresAt
    }`,
    { tenantId: ctx.tenantId }
  );

  return NextResponse.json({ codes });
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { session, tenantId } = ctx;

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
    // Prevent duplicate codes (tenant-scoped).
    const existing = await serverClient.fetch(
      `*[_type == "discountCode" && code == $code && ${tenantFilter()}][0]{_id}`,
      { code: String(body.code).trim().toUpperCase(), tenantId }
    );
    if (existing) {
      return NextResponse.json(
        { error: `Code ${String(body.code).toUpperCase()} already exists` },
        { status: 400 }
      );
    }

    const doc = await serverClient.create({
      _type: "discountCode",
      tenantId,
      code: String(body.code).trim().toUpperCase(),
      type: body.type,
      value: body.value,
      active: body.active ?? true,
      maxUses: body.maxUses ?? 100,
      usedCount: 0,
      expiresAt: body.expiresAt || undefined,
    });

    logAdminAction({
      adminEmail: session?.user?.email,
      tenantId,
      action: "create",
      targetType: "discountCode",
      targetId: doc._id,
      targetLabel: String(body.code).trim().toUpperCase(),
    });

    return NextResponse.json({ code: doc }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create discount code:", err);
    return NextResponse.json({ error: "Failed to create discount code" }, { status: 500 });
  }
}
