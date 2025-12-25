// lib/normalize.ts

import type { FeeItem } from "@/lib/types";
import { FEE_CATEGORY_KEYS } from "@/content/fee-categories";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\/.+/i;

export function isValidISODate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value: unknown): value is string {
  return typeof value === "string" && URL_RE.test(value.trim());
}

function isValidCategory(value: unknown): boolean {
  return typeof value === "string" && (FEE_CATEGORY_KEYS as readonly string[]).includes(value);
}

/**
 * Hard rule: omit invalid rows. Silence > incorrect data.
 *
 * Required:
 * - category (must be one of locked keys)
 * - amount (number|string)
 * - currency (non-empty)
 * - conditions (non-empty; can be long—UI should truncate if needed)
 * - source_url (http/https)
 * - last_verified (YYYY-MM-DD)
 */
export function validateFeeItem(item: FeeItem): { ok: true } | { ok: false; reason: string } {
  if (!item) return { ok: false, reason: "missing_item" };

  if (!isValidCategory(item.category)) return { ok: false, reason: "invalid_category" };

  if (typeof item.amount !== "number" && typeof item.amount !== "string") {
    return { ok: false, reason: "invalid_amount_type" };
  }

  if (!isNonEmptyString(item.currency)) return { ok: false, reason: "missing_currency" };

  if (!isNonEmptyString(item.conditions)) return { ok: false, reason: "missing_conditions" };

  // Do not warn about length here; conditions may contain verbatim airline wording.

  if (!isValidUrl(item.source_url)) return { ok: false, reason: "missing_or_invalid_source_url" };

  if (!isNonEmptyString(item.last_verified) || !isValidISODate(item.last_verified)) {
    return { ok: false, reason: "missing_or_invalid_last_verified" };
  }

  return { ok: true };
}
