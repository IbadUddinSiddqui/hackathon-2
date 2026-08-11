// lib/product-images.ts
// Server-only helpers shared by the admin product APIs. NEVER import from a
// client component — this touches the Sanity write client.
// Extracted from the bulk-import route so create (P2-02) reuses the same logic.

import { serverClient } from "@/sanity/lib/server-client";

/** Find a product id by exact name, or null. P4-03 — scoped to a tenant. */
export async function findProductByName(
  name: string,
  tenantId: string = "tenant-anks"
): Promise<string | null> {
  const doc = await serverClient.fetch(
    `*[_type == "product" && name == $name && (!defined(tenantId) || tenantId == $tenantId)][0]{_id}`,
    { name, tenantId }
  );
  return doc?._id ?? null;
}

export type SanityImage = {
  _type: "image";
  asset: { _type: "reference"; _ref: string };
};

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function extFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("avif")) return "avif";
  return "jpg";
}

/** Upload a single raw image buffer as a Sanity image asset. */
async function uploadBuffer(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ _id: string }> {
  return serverClient.assets.upload("image", buffer, { contentType, filename });
}

function toAsset(asset: { _id: string }): SanityImage {
  return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
}

/** Download each image URL and store it as a Sanity image asset. */
export async function uploadImages(
  urls: string[],
  productName: string
): Promise<SanityImage[]> {
  const assets: SanityImage[] = [];

  for (const url of urls.slice(0, 8)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "image/jpeg";
      const body = await res.arrayBuffer();
      if (body.byteLength === 0) continue;

      const asset = await uploadBuffer(
        Buffer.from(body),
        contentType,
        `${slugify(productName)}-${assets.length + 1}.${extFromContentType(contentType)}`
      );
      assets.push(toAsset(asset));
    } catch {
      // Skip unreachable/broken image URLs silently — the product still saves.
    }
  }

  return assets;
}

/**
 * Upload locally-provided image buffers (e.g. files extracted from the ZIP the
 * admin uploads alongside the bulk-import Excel) as Sanity image assets.
 * The extension on `name` decides the content type.
 */
export async function uploadImageBuffers(
  files: { name: string; data: Buffer }[],
  productName: string
): Promise<SanityImage[]> {
  const assets: SanityImage[] = [];

  for (const file of files.slice(0, 8)) {
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const contentType = CONTENT_TYPES[ext] ?? "image/jpeg";
      const safeExt = ext === "jpeg" ? "jpg" : ext;

      const asset = await uploadBuffer(
        file.data,
        contentType,
        `${slugify(productName)}-${assets.length + 1}.${safeExt}`
      );
      assets.push(toAsset(asset));
    } catch {
      // Skip corrupt/oversized files silently — the product still saves.
    }
  }

  return assets;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
