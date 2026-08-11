// app/api/admin/reviews/[id]/route.ts
// P3-16 — approve/reject a review. Also logs to the audit trail.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import { logAdminAction } from "@/lib/audit";

const VALID_STATUSES = ["approved", "rejected"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const status = typeof body?.status === "string" ? body.status : "";
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const existing = await serverClient.fetch(
      `*[_id == $id][0]{_id, customerName, customerEmail}`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await serverClient.patch(id).set({ status }).commit();

    logAdminAction({
      adminEmail: session?.user?.email,
      action: "update",
      targetType: "product",
      targetId: id,
      targetLabel: existing.customerName || existing.customerEmail || "review",
      details: `review ${status}`,
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Failed to moderate review:", error);
    return NextResponse.json({ error: "Failed to moderate review" }, { status: 500 });
  }
}
