import { MetadataRoute } from "next";
import { getAirlineSlugs, getAllAirlines } from "@/lib/data";
import { FEE_CATEGORY_KEYS } from "@/content/fee-categories";

function computeStableLastModified(): Date {
  // Deterministic: derived from data (max last_verified across all fee items).
  const airlines = getAllAirlines();
  let max = "2025-01-01"; // Default starting point

  for (const a of airlines) {
    for (const item of a.fees ?? []) {
      const v = (item as { last_verified?: unknown }).last_verified;
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        if (v > max) max = v;
      }
    }
  }

  return new Date(`${max}T00:00:00.000Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://airline-fees.com";
  const lastModified = computeStableLastModified();
  const airlineSlugs = getAirlineSlugs();

  // 1. Core Marketing & Utility Pages
  const staticPages = [
    "",
    "/airlines",
    "/best-cards",
    "/fees",
    "/compare",
    "/updates",
    "/about",
    "/methodology",
    "/contact",
    "/privacy",
    "/sizer-rules",
    "/tools/checked-baggage-calculator",
    "/tools/excess-baggage-calculator",
    "/guides/basic-economy-traps",
    "/guides/airline-credit-card-baggage-benefits",
    "/guides/carry-on-strictness-by-airline",
    "/guides/travel-esims",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: p === "" ? 1.0 : 0.8,
  }));

  // 2. Individual Airline Pages (The programmatic bulk)
  const airlinePages = airlineSlugs.map((slug) => ({
    url: `${base}/airlines/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const airlinePlaybookPages = airlineSlugs.map((slug) => ({
    url: `${base}/airlines/${slug}/how-to-beat-fees`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // 3. Category Pages (Baggage, Seats, etc.)
  const feePages = FEE_CATEGORY_KEYS.map((k) => ({
    url: `${base}/fees/${k}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...airlinePages, ...airlinePlaybookPages, ...feePages];
}
