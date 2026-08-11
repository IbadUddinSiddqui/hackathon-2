// app/api/admin/products/bulk-import/route.ts
// Admin-only bulk product import from an Excel (.xlsx) or CSV file, with an
// optional ZIP of product images (no URLs required).
//   POST /api/admin/products/bulk-import  (multipart: file=..., images=?.zip)
//   GET  /api/admin/products/bulk-import?template=1  → example .xlsx (with dropdowns)
//
// Row format matches the template: name, description, price, stock, category,
// category_slug, size, brand, tags, image_urls, image_files.
// Upsert key: product name (unique). Existing products are patched; new ones
// are created.
// Images resolution (per row, in order):
//   1. image_files column → filenames matched inside the uploaded ZIP
//   2. if no image_files matched → a ZIP folder named exactly like the product
//   3. image_urls column → downloaded from the web
// All resolved images are stored as Sanity assets.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { serverClient } from "@/sanity/lib/server-client";
import {
  parseWorkbook,
  validateRow,
  buildTemplate,
  type TemplateOptions,
} from "@/lib/bulk-import";
import {
  findProductByName,
  uploadImages,
  uploadImageBuffers,
  type SanityImage,
} from "@/lib/product-images";
import AdmZip from "adm-zip";

type RowResult = {
  row: number;
  name: string | null;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
};

const MAX_ROWS = 2000;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES = 8;
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

function isImageName(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase();
  return !!ext && IMAGE_EXT.has(ext);
}

/** Load the store's live categories + brands for the template dropdowns. */
async function fetchTemplateOptions(): Promise<TemplateOptions | undefined> {
  try {
    const [catRows, brandRows] = await Promise.all([
      serverClient.fetch<{ category: string; category_slug: string }[]>(
        `*[_type == "product" && defined(category) && defined(category_slug) && (!defined(tenantId) || tenantId == $tenantId)] | order(category asc) { category, category_slug }`,
        { tenantId: "tenant-anks" }
      ),
      serverClient.fetch<{ brand: string }[]>(
        `*[_type == "product" && defined(brand) && brand != "" && (!defined(tenantId) || tenantId == $tenantId)] | order(brand asc) { brand }`,
        { tenantId: "tenant-anks" }
      ),
    ]);

    const seen = new Set<string>();
    const categories = catRows.filter((r) => {
      if (!r.category || !r.category_slug || seen.has(r.category_slug)) return false;
      seen.add(r.category_slug);
      return true;
    });
    const brandSeen = new Set<string>();
    const brands = brandRows.map((r) => r.brand).filter((b) => {
      if (!b || brandSeen.has(b)) return false;
      brandSeen.add(b);
      return true;
    });

    if (categories.length === 0 && brands.length === 0) return undefined;
    return { categories, brands };
  } catch {
    return undefined;
  }
}

/** Extract image files from an uploaded ZIP: basename map + folder map. */
function parseImageZip(buf: Buffer): {
  byName: Map<string, Buffer>;
  byFolder: Map<string, Buffer[]>;
} {
  const byName = new Map<string, Buffer>();
  const byFolder = new Map<string, Buffer[]>();

  try {
    const zip = new AdmZip(buf);
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;
      const path = entry.entryName.replace(/\\/g, "/").split("/").filter(Boolean);
      const base = path[path.length - 1];
      if (!isImageName(base)) continue;

      const data = entry.getData();
      if (data.byteLength > 20 * 1024 * 1024) continue; // per-entry cap (zip-bomb guard)
      byName.set(base.toLowerCase(), data);

      if (path.length > 1) {
        const folder = path[0].toLowerCase();
        const list = byFolder.get(folder) ?? [];
        list.push(data);
        byFolder.set(folder, list);
      }
    }
  } catch {
    // Unreadable ZIP → ignore; URL-based imports still work.
  }

  return { byName, byFolder };
}

/**
 * Resolve a row's images: ZIP files first (image_files column, then
 * folder-named-after-product fallback), then downloaded URLs. Max 8.
 */
async function resolveImages(
  product: { imageFiles: string[]; imageUrls: string[]; name: string },
  zip: { byName: Map<string, Buffer>; byFolder: Map<string, Buffer[]> }
): Promise<SanityImage[]> {
  const images: SanityImage[] = [];

  const localFiles: { name: string; data: Buffer }[] = [];
  for (const f of product.imageFiles) {
    // Tolerate pasted paths ("assets/a.jpg" or "C:\\photos\\a.jpg"): match on basename.
    const base = f.trim().split(/[\\/]/).pop() ?? "";
    if (!base) continue;
    const hit = zip.byName.get(base.toLowerCase());
    if (hit) localFiles.push({ name: base, data: hit });
  }
  // Fallback: a ZIP folder named exactly like the product ("Classic Cotton
  // Tee") or its slugified form ("classic-cotton-tee").
  if (localFiles.length === 0) {
    const exact = product.name.trim().toLowerCase();
    const folderFiles =
      zip.byFolder.get(exact) ??
      zip.byFolder.get(
        exact
          .replace(/'/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    if (folderFiles) {
      folderFiles
        .slice(0, MAX_IMAGES)
        .forEach((data, i) => localFiles.push({ name: `${product.name}-${i + 1}`, data }));
    }
  }
  if (localFiles.length > 0) {
    images.push(...(await uploadImageBuffers(localFiles, product.name)));
  }

  if (product.imageUrls.length > 0) {
    images.push(...(await uploadImages(product.imageUrls, product.name)));
  }

  return images.slice(0, MAX_IMAGES);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("template") === "1") {
    const buf = buildTemplate(await fetchTemplateOptions());
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

  // Optional ZIP of images.
  const zipField = formData.get("images");
  let zip = { byName: new Map<string, Buffer>(), byFolder: new Map<string, Buffer[]>() };
  if (zipField instanceof File && zipField.size > 0) {
    if (zipField.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Images ZIP too large (max 10 MB)" }, { status: 400 });
    }
    zip = parseImageZip(Buffer.from(await zipField.arrayBuffer()));
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
      const images = await resolveImages(product, zip);

      if (images.length === 0) {
        skipped += 1;
        results.push({
          row: row.rowNumber,
          name: product.name,
          status: "skipped",
          message:
            "no images could be loaded — check the image_files names / ZIP contents / image_urls",
        });
        continue;
      }

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
