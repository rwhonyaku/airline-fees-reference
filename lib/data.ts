// lib/data.ts

import fs from "node:fs";
import path from "node:path";
import type { Airline, AirlineSummary, FeeCategoryKey, FeeRow, FeeItem } from "@/lib/types";
import { validateFeeItem } from "@/lib/normalize";

const AIRLINES_DIR = path.join(process.cwd(), "data", "airlines");

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
    for (const item of airline.fees ?? []) {
      const res = validateFeeItem(item);
      if (res.ok) validFees.push(item);
      else console.warn(`[data] Omitted fee row airline=${airline.slug} reason=${res.reason}`);
    }

    airlines.push({ ...airline, fees: validFees });
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
