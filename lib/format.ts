// lib/format.ts

import type { FeeItem } from "@/lib/types";

/**
 * Display amount without implying judgments.
 * - If number: show as currency + number (no "from", no "as low as").
 * - If string: return as-is (but data-entry should keep it short).
 */
export function formatAmount(item: FeeItem): string {
  if (typeof item.amount === "number") {
    // Avoid locale formatting that could change decimals unexpectedly.
    // Keep it plain and consistent.
    const n = Number.isInteger(item.amount) ? item.amount.toString() : item.amount.toFixed(2);
    return `${n} ${item.currency}`;
  }
  // Example string allowed: "Varies", "0–35" (but prefer explicit rows instead of ranges)
  return `${item.amount} ${item.currency}`;
}

/**
 * Keep label-like fields consistent. Never add prose here.
 */
export function dashIfEmpty(v?: string): string {
  return v && v.trim().length > 0 ? v : "—";
}
