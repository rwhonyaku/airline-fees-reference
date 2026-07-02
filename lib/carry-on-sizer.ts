import type { Airline, FeeItem } from "@/lib/types";

export type BagDimensions = {
  heightIn: number;
  widthIn: number;
  depthIn: number;
};

export type SizerRule = {
  airlineSlug: string;
  airlineName: string;
  kind: "personal_item" | "cabin_bag";
  dimensionsIn: [number, number, number];
  rawText: string;
  sourceUrl: string;
};

export type SizerResult = SizerRule & {
  status: "fits" | "near_limit" | "fails";
  tightestMarginIn: number;
  overByIn: number;
};

function sortedDims(values: number[]): [number, number, number] {
  const sorted = [...values].sort((a, b) => b - a);
  return [sorted[0] ?? 0, sorted[1] ?? 0, sorted[2] ?? 0];
}

function roundInches(value: number): number {
  return Math.round(value * 10) / 10;
}

function parseDimensionTriplets(text: string): [number, number, number][] {
  const matches = Array.from(
    text.matchAll(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(cm|centimeters|inches|inch|in)?/gi),
  );

  return matches.map((match) => {
    const dims = [Number(match[1]), Number(match[2]), Number(match[3])];
    const unit = (match[4] ?? "").toLowerCase();
    const inDims = unit.startsWith("cm") || unit.startsWith("centimeter")
      ? dims.map((value) => roundInches(value / 2.54))
      : dims;
    return sortedDims(inDims);
  });
}

function ruleKind(row: FeeItem): "personal_item" | "cabin_bag" {
  const text = [row.conditions, row.applies_to, row.notes].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("personal item") || text.includes("small cabin bag") || text.includes("under-seat") || text.includes("under seat")) {
    return "personal_item";
  }
  return "cabin_bag";
}

export function extractSizerRules(airlines: Airline[]): SizerRule[] {
  const rules: SizerRule[] = [];

  for (const airline of airlines) {
    for (const row of airline.fees ?? []) {
      if (row.category !== "carry_on") continue;

      const rawText = [row.conditions, row.applies_to, row.region_or_route, row.notes].filter(Boolean).join(" ");
      const parsed = parseDimensionTriplets(rawText);
      if (!parsed.length) continue;

      for (const dimensionsIn of parsed) {
        rules.push({
          airlineSlug: airline.slug,
          airlineName: airline.name,
          kind: ruleKind(row),
          dimensionsIn,
          rawText: row.conditions,
          sourceUrl: row.source_url,
        });
      }
    }
  }

  return rules;
}

export function compareBagToRules(bag: BagDimensions, rules: SizerRule[]): SizerResult[] {
  const bagDims = sortedDims([bag.heightIn, bag.widthIn, bag.depthIn]);

  return rules.map((rule) => {
    const margins = rule.dimensionsIn.map((limit, index) => limit - bagDims[index]);
    const tightestMarginIn = Math.min(...margins);
    const overByIn = Math.max(0, ...margins.map((margin) => -margin));
    const status = overByIn > 0 ? "fails" : tightestMarginIn <= 0.5 ? "near_limit" : "fits";

    return {
      ...rule,
      status,
      tightestMarginIn: roundInches(tightestMarginIn),
      overByIn: roundInches(overByIn),
    };
  });
}

export function formatDims(dims: [number, number, number]): string {
  return `${dims.map((dim) => `${roundInches(dim)} in`).join(" × ")}`;
}
