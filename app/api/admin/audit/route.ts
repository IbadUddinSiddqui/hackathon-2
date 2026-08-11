// app/api/admin/audit/route.ts
// P3-05 — admin-only audit-log list. Optional ?action= and ?targetType= filters.
// Unauthenticated → 401.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";

const VALID_ACTIONS = ["create", "update", "delete", "status_change"];
const VALID_TARGETS = ["product", "order", "discountCode", "customer"];

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") || undefined;
  const targetType = url.searchParams.get("targetType") || undefined;

  const filters = [
    "_type == \"auditLog\"",
    "(!defined($action) || action == $action)",
    "(!defined($targetType) || targetType == $targetType)",
  ].join(" && ");

  // Optional filters must be null, never undefined (GROQ rejects "undefined").
  const params: Record<string, unknown> = {
    action: action && VALID_ACTIONS.includes(action) ? action : null,
    targetType: targetType && VALID_TARGETS.includes(targetType) ? targetType : null,
  };

  try {
    const logs = await serverClient.fetch(
      `*[${filters}] | order(createdAt desc) [0...100] {
        _id,
        adminEmail,
        action,
        targetType,
        targetId,
        targetLabel,
        details,
        createdAt
      }`,
      params
    );
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Failed to load audit log:", error);
    return NextResponse.json({ error: "Failed to load audit log" }, { status: 500 });
  }
}
