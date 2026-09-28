import { MetadataRoute } from "next";
import { getAirlineSlugs, getAllAirlines } from "@/lib/data";
import { FEE_CATEGORY_KEYS } from "@/content/fee-categories";
import { ACTIVE_STRATEGY_SLUGS } from "@/lib/airline-strategy";
import { COMPARE_TABLES } from "@/content/compare-tables";

function latestDateForFees(fees: Array<{ last_verified?: unknown }>): Date {
  const latest = fees
    .map((item) => item.last_verified)
    .filter((value): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()
    .at(-1) ?? "2025-01-01";
  return new Date(`${latest}T00:00:00.000Z`);
}

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
  const airlineSlugs = getAirlineSlugs().filter((slug) => slug !== "spirit");
  const airlines = getAllAirlines().filter((airline) => airline.slug !== "spirit");
  const airlineBySlug = new Map(airlines.map((airline) => [airline.slug, airline]));

  // 1. Core Marketing & Utility Pages
  const staticPages = [
    "",
    "/airlines",
    "/best-cards",
    "/fees",
    "/compare",
    "/about",
    "/methodology",
    "/contact",
    "/privacy",
    "/sizer-rules",
    "/recommended-carry-on-luggage",
    "/tools/checked-baggage-calculator",
    "/tools/excess-baggage-calculator",
    "/tools/true-trip-cost",
    "/guides/basic-economy-traps",
    "/guides/airline-credit-card-baggage-benefits",
    "/guides/carry-on-strictness-by-airline",
    "/guides/international-baggage-allowance",
    "/passenger-rights/eu261",
    "/passenger-rights/eu261-calculator",
    "/passenger-rights/us-dot-refund",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: p === "" ? 1.0 : 0.8,
  }));

  // 2. Individual Airline Pages (The programmatic bulk)
  const airlinePages = airlineSlugs.map((slug) => ({
    url: `${base}/airlines/${slug}`,
    lastModified: latestDateForFees(airlineBySlug.get(slug)?.fees ?? []),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const airlinePlaybookPages = ACTIVE_STRATEGY_SLUGS.map((slug) => ({
    url: `${base}/airlines/${slug}/how-to-beat-fees`,
    lastModified: latestDateForFees(airlineBySlug.get(slug)?.fees ?? []),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // 3. Category Pages (Baggage, Seats, etc.)
  const feePages = FEE_CATEGORY_KEYS.map((k) => ({
    url: `${base}/fees/${k}`,
    lastModified: latestDateForFees(
      airlines.flatMap((airline) => (airline.fees ?? []).filter((fee) => fee.category === k)),
    ),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const comparisonPages = COMPARE_TABLES.map((table) => ({
    url: `${base}/compare/${table.id}`,
    lastModified: latestDateForFees(
      airlines.flatMap((airline) => (airline.fees ?? []).filter((fee) => fee.category === table.category)),
    ),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...airlinePages, ...airlinePlaybookPages, ...feePages, ...comparisonPages];
}
