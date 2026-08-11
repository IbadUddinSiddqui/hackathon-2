// app/api/admin/customers/[id]/route.ts
// P3-14 — admin-only customer adjustments: grant/revoke store credit and
// loyalty points. Reuses the customer doc. 401 unauthenticated, 404 unknown.
//   PATCH { creditDelta?: number, pointsDelta?: number }

import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { logAdminAction } from "@/lib/audit";
import { getTenantContext, tenantFilter } from "@/lib/tenants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { session, tenantId } = ctx;

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const creditDelta =
    typeof body?.creditDelta === "number" && Number.isFinite(body.creditDelta)
      ? Math.round(body.creditDelta)
      : 0;
  const pointsDelta =
    typeof body?.pointsDelta === "number" && Number.isFinite(body.pointsDelta)
      ? Math.round(body.pointsDelta)
      : 0;

  if (creditDelta === 0 && pointsDelta === 0) {
    return NextResponse.json(
      { error: "Provide creditDelta and/or pointsDelta" },
      { status: 400 }
    );
  }

  try {
    const existing = await serverClient.fetch(
      `*[_type == "customer" && _id == $id && ${tenantFilter()}][0]{_id, email}`,
      { id, tenantId }
    );
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const patch = serverClient.patch(id);
    if (creditDelta !== 0) patch.inc({ creditBalance: creditDelta });
    if (pointsDelta !== 0) patch.inc({ points: pointsDelta });
    await patch.commit();

    logAdminAction({
      adminEmail: session?.user?.email,
      tenantId,
      action: "update",
      targetType: "customer",
      targetId: id,
      targetLabel: existing.email,
      details: `credit ${creditDelta > 0 ? "+" : ""}${creditDelta}, points ${pointsDelta > 0 ? "+" : ""}${pointsDelta}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to adjust customer:", error);
    return NextResponse.json({ error: "Failed to adjust customer" }, { status: 500 });
  }
}
