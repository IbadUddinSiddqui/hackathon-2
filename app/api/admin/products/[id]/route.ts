// app/api/admin/products/[id]/route.ts
// Admin-only product management API — single-product operations.
//   PATCH /api/admin/products/[id]  partial update (P2-03)
//   DELETE /api/admin/products/[id] delete (P2-04 — added later)
// 401 unauthenticated · 400 invalid body/validation · 404 unknown id · 409 dup name.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import {
  normalizeUpdateInput,
  validateUpdateInput,
  buildUpdatePatch,
  toProductSummary,
} from "@/lib/admin-products";
import { findProductByName } from "@/lib/product-images";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const input = normalizeUpdateInput((raw ?? {}) as Record<string, unknown>);
  const patch = buildUpdatePatch(input);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  const error = validateUpdateInput(input);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    // 404 before touching anything.
    const existing = await serverClient.fetch(
      `*[_type == "product" && _id == $id][0]{_id}`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Renaming must not collide with another product (name is the upsert key).
    if (input.name !== undefined) {
      const otherId = await findProductByName(input.name);
      if (otherId && otherId !== id) {
        return NextResponse.json(
          { error: `A product named "${input.name}" already exists` },
          { status: 409 }
        );
      }
    }

    await serverClient.patch(id).set(patch).commit();

    // Return the full updated summary (same projection as the list API).
    const full = await serverClient.fetch(
      `*[_id == $id][0]{
        _id,
        name,
        description,
        price,
        stock,
        category,
        category_slug,
        brand,
        size,
        tags,
        created_at,
        "images": images[]{asset->{url}}
      }`,
      { id }
    );
    if (!full) {
      // Doc vanished between the existence check and this fetch — report 404,
      // not a 500 from toProductSummary(null).
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: toProductSummary(full as Parameters<typeof toProductSummary>[0]),
    });
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
