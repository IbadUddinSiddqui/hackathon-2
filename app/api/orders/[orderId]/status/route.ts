import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import { refundOrder } from "@/lib/orders";
import { logAdminAction } from "@/lib/audit";

const VALID_STATUSES = ["pending", "paid", "failed", "refunded"];

/**
 * Admin-only: update an order's status (e.g. mark as paid / refunded).
 * Validates the status value against the schema options before patching.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  let status: unknown;
  try {
    const body = await request.json();
    status = body?.status;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // Refunds are real money movements: issue the Stripe refund, restore the
    // stock that was decremented at fulfillment, then mark the order refunded.
    if (status === "refunded") {
      const result = await refundOrder(orderId);
      if (!result.refunded) {
        const notFound = (result.message || "").toLowerCase().includes("not found");
        return NextResponse.json(
          { error: result.message },
          { status: notFound ? 404 : 400 }
        );
      }
      logAdminAction({
        adminEmail: session?.user?.email,
        action: "status_change",
        targetType: "order",
        targetId: orderId,
        targetLabel: orderId.slice(0, 8).toUpperCase(),
        details: "status → refunded",
      });
      return NextResponse.json({ success: true, status: "refunded" });
    }

    const order = await serverClient.fetch(
      `*[_type == "order" && _id == $id][0]{_id}`,
      { id: orderId }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await serverClient.patch(order._id).set({ status }).commit();

    logAdminAction({
      adminEmail: session?.user?.email,
      action: "status_change",
      targetType: "order",
      targetId: orderId,
      targetLabel: orderId.slice(0, 8).toUpperCase(),
      details: `status → ${status}`,
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
