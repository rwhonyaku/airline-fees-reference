import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import { SizerRulesClient, type GearGroup } from "@/components/SizerRulesClient";
import { getAllAirlines } from "@/lib/data";
import { canonical } from "@/lib/seo";

type GearItem = {
  id: string;
  type: string;
  title: string;
  why_it_works: string;
  offer_url?: string;
};

type GearItemsJson = { gear_items: GearItem[] };
type GearRecsJson = Record<string, Record<string, string[]>>;

export const metadata: Metadata = {
  title: "Carry-on Sizer Rules by Airline",
  description:
    "Compare your bag dimensions with published airline carry-on and personal-item size rules, then see which bags fit, fail, or sit close to the limit.",
  alternates: {
    canonical: canonical("/sizer-rules"),
  },
};

async function readJson<T>(rel: string): Promise<T> {
  const full = path.join(process.cwd(), rel);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
}

async function getGearForSection(section: string): Promise<GearGroup[]> {
  const items = await readJson<GearItemsJson>("data/gear/items.json");
  const recs = await readJson<GearRecsJson>("data/gear/recommendations.json");
  const sectionMap = recs?.[section] ?? {};
  const byId = new Map(items.gear_items.map((item) => [item.id, item]));
  const resolved: GearGroup[] = [];

  for (const [type, ids] of Object.entries(sectionMap)) {
    const matchedItems = ids
      .map((id) => byId.get(id))
      .filter((item): item is GearItem => Boolean(item));
    if (matchedItems.length) resolved.push({ type, items: matchedItems });
  }

  return resolved;
}

export default async function SizerRulesPage() {
  const gearGroups = await getGearForSection("sizer_rules");

  return <SizerRulesClient airlines={getAllAirlines()} gearGroups={gearGroups} />;
}
