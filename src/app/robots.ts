import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/productUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/orders", "/account"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
