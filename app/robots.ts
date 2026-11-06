// app/robots.ts

import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/data-entry"] },
    sitemap: "https://airline-fees.com/sitemap.xml",
  };
}
