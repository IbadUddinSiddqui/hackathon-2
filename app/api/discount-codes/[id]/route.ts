import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { serverClient } from "@/sanity/lib/server-client";
import {
  discountCodeGuard,
  validateDiscountCodeInput,
} from "@/lib/discount-code-admin";
import { logAdminAction } from "@/lib/audit";

/**
 * Admin-only: update a discount code (e.g. edit value, toggle active,
 * change max uses).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await discountCodeGuard();
  if (unauthorized) return unauthorized;
  const session = await auth();

  const { id } = await params;

  let body: any;
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
    const existing = await serverClient.fetch(
      `*[_id == $id][0]{_id, code}`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    // If changing the code itself, avoid colliding with another code.
    const newCode = String(body.code).trim().toUpperCase();
    if (newCode !== existing.code) {
      const collision = await serverClient.fetch(
        `*[_type == "discountCode" && code == $code && _id != $id][0]{_id}`,
        { code: newCode, id }
      );
      if (collision) {
        return NextResponse.json(
          { error: `Code ${newCode} already exists` },
          { status: 400 }
        );
      }
    }

    const updated = await serverClient
      .patch(id)
      .set({
        code: newCode,
        type: body.type,
        value: body.value,
        active: body.active ?? true,
        maxUses: body.maxUses ?? 100,
        expiresAt: body.expiresAt || undefined,
      })
      .commit();

    logAdminAction({
      adminEmail: session?.user?.email,
      action: "update",
      targetType: "discountCode",
      targetId: id,
      targetLabel: newCode,
    });

    return NextResponse.json({ code: updated });
  } catch (err: any) {
    console.error("Failed to update discount code:", err);
    return NextResponse.json({ error: "Failed to update discount code" }, { status: 500 });
  }
}

/**
 * Admin-only: delete a discount code.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await discountCodeGuard();
  if (unauthorized) return unauthorized;
  const session = await auth();

  const { id } = await params;

  try {
    const existing = await serverClient.fetch(
      `*[_id == $id][0]{_id, code}`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    await serverClient.delete(id);

    logAdminAction({
      adminEmail: session?.user?.email,
      action: "delete",
      targetType: "discountCode",
      targetId: id,
      targetLabel: existing.code || id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete discount code:", err);
    return NextResponse.json({ error: "Failed to delete discount code" }, { status: 500 });
  }
}
