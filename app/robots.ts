import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/adminpanel/",
        "/dashboard",
        "/login",
        "/register",
        "/cart",
        "/checkout",
        "/wishlist",
        "/denied",
        "/studio",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
