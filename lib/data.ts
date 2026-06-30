// lib/data.ts

import fs from "node:fs";
import path from "node:path";
import type { Airline, AirlineSummary, FeeCategoryKey, FeeRow, FeeItem } from "@/lib/types";

/**
 * NOTE:
 * This file intentionally performs *conservative* runtime validation to prevent:
 * - silent drops due to "invalid_category" when the project expands categories
 * - mutation/truncation of `conditions` (conditions must remain verbatim; truncate only in UI)
 *
 * This keeps data loading robust during expansion while still omitting clearly invalid rows.
 */

const AIRLINES_DIR = path.join(process.cwd(), "data", "airlines");

/**
 * Canonical category allowlist used at runtime by the loader.
 * Add new categories here when expanding coverage.
 *
 * Keep strings stable; do not rename.
 */
const ALLOWED_CATEGORIES = new Set<string>([
  // Core
  "checked_baggage",
  "seat_selection",
  "change_cancellation",
  "unaccompanied_minor",

  // Expansion (common high-volume categories)
  "carry_on",
  "overweight_baggage",
  "oversize_baggage",
  "same_day_change",
  "same_day_standby",
]);

/**
 * Runtime category aliases for legacy / expansion rows that still represent
 * existing fee intents in the current information architecture.
 *
 * We intentionally map only to already-supported categories so route
 * generation, fee hubs, and airline pages stay consistent.
 */
const CATEGORY_ALIASES: Record<string, FeeCategoryKey> = {
  additional_baggage: "checked_baggage",
  checked_baggage_included: "checked_baggage",
  sports_equipment: "checked_baggage",
};

/**
 * Lightweight runtime validation.
 * - Does NOT truncate/mutate `conditions`
 * - Omits only when a row is structurally invalid or category is not allowed
 */
function validateFeeItemLight(item: unknown): { ok: true; value: FeeItem } | { ok: false; reason: string } {
  if (!item || typeof item !== "object") return { ok: false, reason: "invalid_row" };

  const obj = item as Record<string, unknown>;

  const rawCategory = obj.category;
  if (typeof rawCategory !== "string") return { ok: false, reason: "missing_category" };
  const category = CATEGORY_ALIASES[rawCategory] ?? rawCategory;
  if (!ALLOWED_CATEGORIES.has(category)) return { ok: false, reason: "invalid_category" };

  const currency = obj.currency;
  if (typeof currency !== "string" || !currency.trim()) return { ok: false, reason: "missing_currency" };

  const conditions = obj.conditions;
  if (typeof conditions !== "string" || !conditions.trim()) return { ok: false, reason: "missing_conditions" };

  const applies_to = obj.applies_to;
  if (typeof applies_to !== "string" || !applies_to.trim()) return { ok: false, reason: "missing_applies_to" };

  const region_or_route = obj.region_or_route;
  if (typeof region_or_route !== "string" || !region_or_route.trim())
    return { ok: false, reason: "missing_region_or_route" };

  const timing = obj.timing;
  if (typeof timing !== "string" || !timing.trim()) return { ok: false, reason: "missing_timing" };

  const source_url = obj.source_url;
  if (typeof source_url !== "string" || !source_url.trim()) return { ok: false, reason: "missing_source_url" };

  const last_verified = obj.last_verified;
  if (typeof last_verified !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(last_verified))
    return { ok: false, reason: "invalid_last_verified" };

  const amount = obj.amount;
  const amountOk =
    typeof amount === "number" ||
    (typeof amount === "string" && amount.trim().length > 0); // allow "Varies", "Not permitted", ranges like "From 29 to 299"
  if (!amountOk) return { ok: false, reason: "missing_amount" };

  // Optional fields: keep as-is if present (no inference / no normalization here)
  // - applies_to already required above (per your project rules)
  // - region_or_route required above (per your project rules)

  return { ok: true, value: { ...(item as FeeItem), category } };
}

function extractUniqueInsights(item: unknown): Airline["unique_insights"] | null {
  if (!item || typeof item !== "object") return null;

  const maybeInsights = (item as Record<string, unknown>).unique_insights;
  if (!maybeInsights || typeof maybeInsights !== "object") return null;

  const raw = maybeInsights as Record<string, unknown>;
  const traps = Array.isArray(raw.traps)
    ? raw.traps.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];
  const proHack =
    typeof raw.pro_hack === "string" && raw.pro_hack.trim().length > 0 ? raw.pro_hack.trim() : undefined;

  if (!traps.length && !proHack) return null;

  return {
    traps: traps.length ? traps : undefined,
    pro_hack: proHack,
  };
}

function readJsonFileSafe<T>(absPath: string): { ok: true; data: T } | { ok: false; error: string } {
  let raw = "";
  try {
    raw = fs.readFileSync(absPath, "utf-8");
  } catch (e) {
    return { ok: false, error: `read_failed: ${(e as Error).message}` };
  }

  if (!raw.trim()) return { ok: false, error: "empty_file" };

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch (e) {
    return { ok: false, error: `json_parse_failed: ${(e as Error).message}` };
  }
}

export function getAllAirlines(): Airline[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(AIRLINES_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  files.sort((a, b) => a.localeCompare(b));

  const airlines: Airline[] = [];

  for (const file of files) {
    const abs = path.join(AIRLINES_DIR, file);
    const parsed = readJsonFileSafe<Airline>(abs);

    if (!parsed.ok) {
      console.warn(`[data] Skipped airline file ${file}: ${parsed.error}`);
      continue;
    }

    const airline = parsed.data;

    if (!airline?.slug || !airline?.name) {
      console.warn(`[data] Skipped airline file ${file}: missing slug/name`);
      continue;
    }

    const validFees: FeeItem[] = [];
    let uniqueInsights: Airline["unique_insights"] | undefined;
    for (const item of airline.fees ?? []) {
      const extractedInsights = extractUniqueInsights(item);
      if (extractedInsights) {
        uniqueInsights = extractedInsights;
        continue;
      }

      const res = validateFeeItemLight(item);
      if (res.ok) validFees.push(res.value);
      else console.warn(`[data] Omitted fee row airline=${airline.slug} reason=${res.reason}`);
    }

    airlines.push({ ...airline, unique_insights: uniqueInsights, fees: validFees });
  }

  return airlines;
}

export function getAirlineSlugs(): string[] {
  return getAllAirlines()
    .map((a) => a.slug)
    .sort((a, b) => a.localeCompare(b));
}

export function getAirlineBySlug(slug: string): Airline | null {
  const found = getAllAirlines().find((a) => a.slug === slug);
  return found ?? null;
}

export function getAirlinesIndex(): AirlineSummary[] {
  return getAllAirlines()
    .map(({ slug, name, iata, icao, country, region }) => ({ slug, name, iata, icao, country, region }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getFeeRowsByCategory(category: FeeCategoryKey): FeeRow[] {
  const airlines = getAllAirlines();

  const rows: FeeRow[] = [];
  for (const airline of airlines) {
    for (const item of airline.fees) {
      if (item.category === category) {
        rows.push({
          airline_slug: airline.slug,
          airline_name: airline.name,
          item,
        });
      }
    }
  }

  rows.sort((a, b) => a.airline_name.localeCompare(b.airline_name));
  return rows;
}
