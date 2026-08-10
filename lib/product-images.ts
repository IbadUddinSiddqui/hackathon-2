// lib/product-images.ts
// Server-only helpers shared by the admin product APIs. NEVER import from a
// client component — this touches the Sanity write client.
// Extracted from the bulk-import route so create (P2-02) reuses the same logic.

import { serverClient } from "@/sanity/lib/server-client";

/** Find a product id by exact name, or null. */
export async function findProductByName(name: string): Promise<string | null> {
  const doc = await serverClient.fetch(
    `*[_type == "product" && name == $name][0]{_id}`,
    { name }
  );
  return doc?._id ?? null;
}

export type SanityImage = {
  _type: "image";
  asset: { _type: "reference"; _ref: string };
};

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
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const body = await res.arrayBuffer();
      if (body.byteLength === 0) continue;

      const asset = await serverClient.assets.upload(
        "image",
        Buffer.from(body),
        {
          contentType,
          filename: `${slugify(productName)}-${assets.length + 1}.${ext}`,
        }
      );

      assets.push({ _type: "image", asset: { _type: "reference", _ref: asset._id } });
    } catch {
      // Skip unreachable/broken image URLs silently — the product still saves.
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
