// lib/audit.ts
// P3-04 — shared audit-log writer. Every admin mutation endpoint calls
// logAdminAction() (fire-and-forget so a logging failure never breaks the
// mutation itself). The session's admin email comes from auth().

import { serverClient } from "@/sanity/lib/server-client";

export type AuditAction = "create" | "update" | "delete" | "status_change";
export type AuditTarget =
  | "product"
  | "order"
  | "discountCode"
  | "customer";

export function logAdminAction(input: {
  adminEmail?: string | null;
  tenantId?: string | null;
  action: AuditAction;
  targetType: AuditTarget;
  targetId?: string;
  targetLabel?: string;
  details?: string;
}): void {
  const email = (input.adminEmail || "").trim();
  if (!email) {
    // No identifiable admin session — skip the log rather than record junk.
    return;
  }

  serverClient
    .create({
      _type: "auditLog",
      tenantId: input.tenantId || "tenant-anks",
      adminEmail: email,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || "",
      targetLabel: input.targetLabel || "",
      details: input.details || "",
      createdAt: new Date().toISOString(),
    })
    .catch((err: any) => {
      // Never let audit logging break the mutation it records.
      console.error("Audit log write failed:", err?.message || err);
    });
}
