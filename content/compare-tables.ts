// content/compare-tables.ts

import type { FeeCategoryKey } from "@/lib/types";

export type FilterValue = string | string[];

export type CompareTableDef = {
  id: string; // URL slug
  title: string; // descriptive, neutral
  category: FeeCategoryKey;

  /**
   * Rule: a row qualifies if all non-empty filters match.
   * Matching is case-insensitive substring match.
   * If a filter is an array, ANY value may match.
   */
  filters: {
    applies_to_includes?: FilterValue;
    region_or_route_includes?: FilterValue;
    timing_includes?: FilterValue;
    conditions_includes?: FilterValue;
  };
};

function bagOrdinalNeedles(n: 1 | 2): string[] {
  // Support the common ways airlines phrase this in the conditions field.
  // Keep this tight and deterministic; expand only when you see misses.
  return n === 1
    ? ["1st", "first", "Bag 1", "1st Bag", "First checked bag"]
    : ["2nd", "second", "Bag 2", "2nd Bag", "Second checked bag"];
}

export const COMPARE_TABLES: ReadonlyArray<CompareTableDef> = Object.freeze([
  // US domestic, economy (non-Basic) — bag 1 and bag 2
  {
    id: "us-domestic-economy-checked-baggage-bag1-2025",
    title: "Checked baggage fees — US domestic economy, bag 1 (2025)",
    category: "checked_baggage",
    filters: {
      applies_to_includes: ["Economy", "Main", "Standard Economy"],
      region_or_route_includes: ["US domestic", "U.S.", "United States"],
      conditions_includes: bagOrdinalNeedles(1),
    },
  },
  {
    id: "us-domestic-economy-checked-baggage-bag2-2025",
    title: "Checked baggage fees — US domestic economy, bag 2 (2025)",
    category: "checked_baggage",
    filters: {
      applies_to_includes: ["Economy", "Main", "Standard Economy"],
      region_or_route_includes: ["US domestic", "U.S.", "United States"],
      conditions_includes: bagOrdinalNeedles(2),
    },
  },

  // US domestic, Basic Economy — bag 1 (only if you have explicit Basic rows)
  {
    id: "us-domestic-basic-economy-checked-baggage-bag1-2025",
    title: "Checked baggage fees — US domestic basic economy, bag 1 (2025)",
    category: "checked_baggage",
    filters: {
      applies_to_includes: ["Basic Economy", "Basic"],
      region_or_route_includes: ["US domestic", "U.S.", "United States"],
      conditions_includes: bagOrdinalNeedles(1),
    },
  },

  // Change/cancellation — Basic Economy (where published) (no route filter; shows only rows you’ve entered)
  {
    id: "change-cancellation-basic-economy-2025",
    title: "Change / cancellation fees — basic economy (2025)",
    category: "change_cancellation",
    filters: {
      applies_to_includes: ["Basic Economy", "Basic"],
    },
  },

  // Unaccompanied minor — published fees (where present)
  {
    id: "unaccompanied-minor-fees-2025",
    title: "Unaccompanied minor fees (2025)",
    category: "unaccompanied_minor",
    filters: {},
  },
]);
