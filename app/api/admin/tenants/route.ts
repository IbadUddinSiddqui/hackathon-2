// app/api/admin/tenants/route.ts
// P4-08 — platform console: manage SaaS tenants (create, list, update plan /
// billing status / domains / features). Platform-admin only (the owner email);
// tenant admins manage their own store data via the other admin APIs.
//   GET   /api/admin/tenants                       → { tenants }
//   POST  /api/admin/tenants { name, slug, domains, plan, billingStatus }
//   PATCH /api/admin/tenants { id, ...updatable fields }

import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { getTenantContext, isPlatformAdmin } from "@/lib/tenants";
import { logAdminAction } from "@/lib/audit";

const PLANS = ["free", "trial", "pro"];
const BILLING_STATUSES = ["active", "trialing", "past_due", "paused"];

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx || !isPlatformAdmin(ctx.session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenants = await serverClient.fetch(
      `*[_type == "tenant"] | order(createdAt asc) {
        _id,
        name,
        slug,
        domains,
        plan,
        billingStatus,
        branding,
        features,
        payments,
        usage,
        createdAt
      }`
    );
    return NextResponse.json({ tenants });
  } catch (error: any) {
    console.error("Failed to list tenants:", error);
    return NextResponse.json({ error: "Failed to list tenants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx || !isPlatformAdmin(ctx.session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const slugRaw = String(body?.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slugRaw) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }
  const plan = PLANS.includes(body?.plan) ? body.plan : "free";
  const billingStatus = BILLING_STATUSES.includes(body?.billingStatus)
    ? body.billingStatus
    : "active";
  const domains = Array.isArray(body?.domains)
    ? body.domains.map((d: unknown) => String(d).trim().toLowerCase()).filter(Boolean)
    : [];

  try {
    const existing = await serverClient.fetch(
      `*[_type == "tenant" && slug.current == $slug][0]{_id}`,
      { slug: slugRaw }
    );
    if (existing) {
      return NextResponse.json(
        { error: `A tenant with slug "${slugRaw}" already exists` },
        { status: 409 }
      );
    }

    const doc = await serverClient.create({
      _type: "tenant",
      name,
      slug: { _type: "slug", current: slugRaw },
      domains,
      plan,
      billingStatus,
      branding: {},
      features: {
        flashSales: true,
        reviews: true,
        giftCards: true,
        loyalty: true,
        bundles: true,
        credit: true,
      },
      usage: {},
      createdAt: new Date().toISOString(),
    });

    logAdminAction({
      adminEmail: ctx.session?.user?.email,
      action: "create",
      targetType: "customer",
      targetId: doc._id,
      targetLabel: name,
      details: `created tenant (plan ${plan})`,
    });

    return NextResponse.json({ tenant: { _id: doc._id, name, slug: slugRaw } }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create tenant:", error);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx || !isPlatformAdmin(ctx.session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const id = String(body?.id || "");
  if (!id) {
    return NextResponse.json({ error: "Missing tenant id" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    patch.name = name;
  }
  if (body.domains !== undefined) {
    patch.domains = Array.isArray(body.domains)
      ? body.domains.map((d: unknown) => String(d).trim().toLowerCase()).filter(Boolean)
      : [];
  }
  if (body.plan !== undefined) {
    if (!PLANS.includes(body.plan)) {
      return NextResponse.json({ error: `plan must be one of: ${PLANS.join(", ")}` }, { status: 400 });
    }
    patch.plan = body.plan;
  }
  if (body.billingStatus !== undefined) {
    if (!BILLING_STATUSES.includes(body.billingStatus)) {
      return NextResponse.json(
        { error: `billingStatus must be one of: ${BILLING_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    patch.billingStatus = body.billingStatus;
  }
  if (body.features !== undefined && typeof body.features === "object") {
    patch.features = body.features;
  }
  if (body.branding !== undefined && typeof body.branding === "object") {
    patch.branding = body.branding;
  }
  if (body.payments !== undefined && typeof body.payments === "object") {
    patch.payments = body.payments;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  try {
    const existing = await serverClient.fetch(
      `*[_type == "tenant" && _id == $id][0]{_id, name}`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    await serverClient.patch(id).set(patch).commit();

    logAdminAction({
      adminEmail: ctx.session?.user?.email,
      action: "update",
      targetType: "customer",
      targetId: id,
      targetLabel: String(existing.name || id),
      details: `updated tenant: ${Object.keys(patch).join(", ")}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update tenant:", error);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}
