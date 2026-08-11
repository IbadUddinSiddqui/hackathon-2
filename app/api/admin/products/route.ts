// app/api/admin/products/route.ts
// Admin-only product management API.
//   GET  /api/admin/products?page=1&limit=20&search=tee&category=t-shirts  (P2-01)
//   POST /api/admin/products  { name, description, price, stock, category,
//                               category_slug, size, brand, tags, imageUrls }  (P2-02)
// Unauthenticated → 401; invalid body → 400; duplicate name → 409.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
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

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = parseListQuery(new URL(request.url));
  const { groq, countGroq, params } = buildProductListGroq(query);

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
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    // Prevent accidental overwrite of an existing product (import upserts by
    // name; the single-create endpoint must not silently clobber).
    const existingId = await findProductByName(name);
    if (existingId) {
      return NextResponse.json(
        { error: `A product named "${name}" already exists` },
        { status: 409 }
      );
    }

    const images = await uploadImages(input.imageUrls ?? [], name);

    const doc = await serverClient.create({
      _type: "product",
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

    logAdminAction({
      adminEmail: session?.user?.email,
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
