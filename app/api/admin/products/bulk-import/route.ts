// app/api/admin/products/bulk-import/route.ts
// Admin-only bulk product import from an Excel (.xlsx) or CSV file.
//   POST /api/admin/products/bulk-import  (multipart: file=...)
//   GET  /api/admin/products/bulk-import?template=1  → example .xlsx
//
// Row format matches the template: name, description, price, stock, category,
// category_slug, size, brand, tags, image_urls.
// Upsert key: product name (unique). Existing products are patched; new ones
// are created. Images are downloaded from the URLs and stored as Sanity assets.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import { parseWorkbook, validateRow, buildTemplate, type ProductPayload } from "@/lib/bulk-import";
import { findProductByName, uploadImages } from "@/lib/product-images";

type RowResult = {
  row: number;
  name: string | null;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
};

const MAX_ROWS = 2000;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("template") === "1") {
    const buf = buildTemplate();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="product-import-template.xlsx"',
      },
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  let buf: ArrayBuffer;
  try {
    buf = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  // Parse + validate before any write.
  const rows = parseWorkbook(buf);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found in the file" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (${rows.length} > ${MAX_ROWS})` }, { status: 400 });
  }

  const results: RowResult[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const validation = validateRow(row);
    if (!validation.ok) {
      skipped += 1;
      results.push({
        row: row.rowNumber,
        name: row.name ? String(row.name) : null,
        status: "skipped",
        message: validation.errors.join("; "),
      });
      continue;
    }

    const product = validation.product;
    try {
      const existingId = await findProductByName(product.name);
      const images = await uploadImages(product.imageUrls, product.name);

      if (existingId) {
        await serverClient
          .patch(existingId)
          .set({
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            category: product.category,
            category_slug: product.category_slug,
            size: product.size,
            brand: product.brand || "",
            tags: product.tags,
            images,
          })
          .commit();
        updated += 1;
        results.push({ row: row.rowNumber, name: product.name, status: "updated", message: `Updated (${images.length} image${images.length === 1 ? "" : "s"})` });
      } else {
        await serverClient.create({
          _type: "product",
          name: product.name,
          description: product.description || "",
          price: product.price,
          stock: product.stock,
          category: product.category,
          category_slug: product.category_slug,
          size: product.size,
          brand: product.brand || "",
          tags: product.tags,
          images,
        });
        created += 1;
        results.push({ row: row.rowNumber, name: product.name, status: "created", message: `Created (${images.length} image${images.length === 1 ? "" : "s"})` });
      }
    } catch (error: any) {
      skipped += 1;
      results.push({
        row: row.rowNumber,
        name: product.name,
        status: "error",
        message: error?.message || "Unexpected failure",
      });
    }
  }

  return NextResponse.json({
    summary: { created, updated, skipped, total: results.length },
    results,
  });
}

// findProductByName + uploadImages now live in lib/product-images.ts (shared
// with the create/update/delete admin APIs).
