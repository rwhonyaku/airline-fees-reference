import fs from "fs/promises";
import path from "path";

type GearItem = {
  id: string;
  type: string;
  title: string;
  why_it_works: string;
  offer_url?: string;
};

type GearItemsJson = { gear_items: GearItem[] };
type GearRecsJson = Record<string, Record<string, string[]>>;

async function readJson<T>(rel: string): Promise<T> {
  const full = path.join(process.cwd(), rel);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
}

export async function getGearForSection(section: string) {
  const items = await readJson<GearItemsJson>("data/gear/items.json");
  const recs = await readJson<GearRecsJson>("data/gear/recommendations.json");

  const sectionMap = recs[section] ?? {};
  const byId = new Map(items.gear_items.map((x) => [x.id, x]));

  const resolved: Record<string, GearItem[]> = {};
  for (const [type, ids] of Object.entries(sectionMap)) {
    resolved[type] = ids.map((id) => byId.get(id)).filter(Boolean) as GearItem[];
  }
  return resolved;
}
