// lib/compare.ts

import type { FeeRow } from "@/lib/types";
import { getFeeRowsByCategory } from "@/lib/data";
import type { CompareTableDef, FilterValue } from "@/content/compare-tables";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function includesCI(haystack: string | undefined, needle: string): boolean {
  if (!haystack) return false;
  return normalize(haystack).includes(normalize(needle));
}

function matchesFilter(haystack: string | undefined, filter: FilterValue | undefined): boolean {
  if (!filter) return true;
  if (Array.isArray(filter)) {
    return filter.some((n) => includesCI(haystack, n));
  }
  return includesCI(haystack, filter);
}

export function buildComparisonRows(def: CompareTableDef): FeeRow[] {
  const rows = getFeeRowsByCategory(def.category);

  const f = def.filters;

  const filtered = rows.filter((r) => {
    // “Verified” rule: must have a source URL + last_verified.
    // (You already enforce this conceptually; we make it explicit here.)
    if (!r.item.source_url || !r.item.last_verified) return false;

    return (
      matchesFilter(r.item.applies_to, f.applies_to_includes) &&
      matchesFilter(r.item.region_or_route, f.region_or_route_includes) &&
      matchesFilter(r.item.timing, f.timing_includes) &&
      matchesFilter(r.item.conditions, f.conditions_includes)
    );
  });

  // Neutral: alphabetic by airline name (explicit).
  filtered.sort((a, b) => a.airline_name.localeCompare(b.airline_name));

  return filtered;
}
