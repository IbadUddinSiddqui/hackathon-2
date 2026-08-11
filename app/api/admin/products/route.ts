// app/api/admin/products/route.ts
// Admin-only product management API (P2-01/P2-02). P4-03 — every query is
// scoped to the admin's SaaS tenant; P4-07 — product creation enforces the
// tenant's plan product limit and meters usage.
//   GET  /api/admin/products?page=1&limit=20&search=tee&category=t-shirts
//   POST /api/admin/products  { name, description, price, stock, category,
//                               category_slug, size, brand, tags, imageUrls }
// Unauthenticated → 401; invalid body → 400; duplicate name → 409.

import { NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import {
  parseListQuery,
  buildProductListGroq,
  toProductSummary,
  normalizeCreateInput,
  validateProductInput,
  type ProductSummary,
} from "@/lib/admin-products";
import { findProductByName, uploadImages } from "@/lib/product-images";
import { logAdminAction } from "@/lib/audit";
import { getTenantContext, getTenantById, DEFAULT_TENANT_ID } from "@/lib/tenants";
import { checkPlanLimit, recordUsage } from "@/lib/billing";

export async function GET(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = ctx;

  const query = parseListQuery(new URL(request.url));
  const { groq, countGroq, params } = buildProductListGroq(query, tenantId);

  try {
    const [docs, total] = await Promise.all([
      serverClient.fetch<unknown[]>(groq, params),
      serverClient.fetch<number>(countGroq, params),
    ]);

    const items: ProductSummary[] = docs.map((doc) =>
      toProductSummary(doc as Parameters<typeof toProductSummary>[0])
    );
    const pages = Math.max(1, Math.ceil(total / query.limit));

    return NextResponse.json({
      items,
      total,
      page: query.page,
      pages,
      limit: query.limit,
    });
  } catch (error: any) {
    console.error("Failed to list products:", error);
    return NextResponse.json({ error: "Failed to list products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { session, tenantId } = ctx;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const input = normalizeCreateInput(
    (raw ?? {}) as Record<string, unknown>
  );
  const error = validateProductInput(input, { requireImages: true });
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const name = input.name!;
  try {
    // P4-07 — enforce the tenant's plan product limit before creating. The
    // platform owner (default tenant) is never limited.
    if (tenantId !== DEFAULT_TENANT_ID) {
      const tenant = await getTenantById(tenantId);
      const productCount = await serverClient.fetch<number>(
        `count(*[_type == "product" && (!defined(tenantId) || tenantId == $tenantId)])`,
        { tenantId }
      );
      const planCheck = checkPlanLimit(tenant?.plan || "free", "products", productCount);
      if (!planCheck.ok) {
        return NextResponse.json(
          { error: `Plan limit reached: ${planCheck.current}/${planCheck.limit} products. Upgrade the tenant plan.` },
          { status: 402 }
        );
      }
    }

    // Prevent accidental overwrite of an existing product (import upserts by
    // name; the single-create endpoint must not silently clobber).
    const existingId = await findProductByName(name, tenantId);
    if (existingId) {
      return NextResponse.json(
        { error: `A product named "${name}" already exists` },
        { status: 409 }
      );
    }

    const images = await uploadImages(input.imageUrls ?? [], name);

    const doc = await serverClient.create({
      _type: "product",
      tenantId,
      name,
      description: input.description || "",
      price: input.price,
      stock: input.stock,
      category: input.category,
      category_slug: input.category_slug,
      size: input.size,
      brand: input.brand || "",
      tags: input.tags,
      images,
    });

    await recordUsage(tenantId, "products", 1);

    logAdminAction({
      adminEmail: session?.user?.email,
      tenantId,
      action: "create",
      targetType: "product",
      targetId: doc._id,
      targetLabel: name,
    });

    return NextResponse.json({ product: { _id: doc._id, name } }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
