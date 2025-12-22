// app/sitemap.ts

import { MetadataRoute } from "next";
import { getAirlineSlugs, getAllAirlines } from "@/lib/data";
import { FEE_CATEGORY_KEYS } from "@/content/fee-categories";

function computeStableLastModified(): Date {
  // Deterministic: derived from data (max last_verified across all fee items).
  const airlines = getAllAirlines();

  let max = "0000-00-00";

  for (const a of airlines) {
    for (const item of a.fees ?? []) {
      const v = (item as any).last_verified;
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        if (v > max) max = v;
      }
    }
  }

  // Fallback only if dataset has no valid dates (should be rare).
  if (max === "0000-00-00") return new Date("2025-01-01T00:00:00.000Z");

  return new Date(`${max}T00:00:00.000Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://airline-fees.com";
  const lastModified = computeStableLastModified();

  const staticPages = ["", "/airlines", "/fees", "/compare", "/updates"].map((p) => ({
    url: `${base}${p}`,
    lastModified,
  }));

  const airlinePages = getAirlineSlugs().map((slug) => ({
    url: `${base}/airlines/${slug}`,
    lastModified,
  }));

  const feePages = FEE_CATEGORY_KEYS.map((k) => ({
    url: `${base}/fees/${k}`,
    lastModified,
  }));

  return [...staticPages, ...airlinePages, ...feePages];
}
