import productsJson from "@/data/gear/carry-ons.json";
import { compareBagToRules, extractSizerRules, type SizerRule } from "@/lib/carry-on-sizer";
import { getAllAirlines } from "@/lib/data";

export type CarryOnProduct = {
  id: string;
  brand: string;
  model: string;
  category: string;
  dimensions_in: [number, number, number];
  expanded_depth_in: number | null;
  weight_lb: number;
  capacity_l: number | null;
  expanded_capacity_l?: number;
  price_usd: [number, number];
  verdict: string;
  advantages: string[];
  drawbacks: string[];
  source_url: string;
  source_label: string;
};

export const carryOnProducts = productsJson.products as CarryOnProduct[];
export const carryOnProductsVerified = productsJson.last_verified;

export function getPublishedCabinRules(): SizerRule[] {
  const airlines = getAllAirlines().map(({ slug, name, fees }) => ({
    slug,
    name,
    fees: fees.filter((fee) => fee.category === "carry_on"),
  }));
  return extractSizerRules(airlines).filter((rule) => rule.kind === "cabin_bag");
}

export function productFitSummary(product: CarryOnProduct, rules: SizerRule[]) {
  const results = compareBagToRules({
    heightIn: product.dimensions_in[0],
    widthIn: product.dimensions_in[1],
    depthIn: product.dimensions_in[2],
  }, rules);
  const byAirline = new Map<string, (typeof results)[number]>();
  for (const result of results) {
    const previous = byAirline.get(result.airlineSlug);
    if (!previous || (previous.status !== "fails" && result.status === "fails")) byAirline.set(result.airlineSlug, result);
  }
  const airlineResults = [...byAirline.values()];
  return {
    evaluated: airlineResults.length,
    fits: airlineResults.filter((result) => result.status !== "fails").length,
    results: airlineResults,
  };
}

export function productsForAirline(airlineSlug: string, rules: SizerRule[], limit = 3) {
  return carryOnProducts
    .map((product) => ({
      product,
      result: productFitSummary(product, rules).results.find((item) => item.airlineSlug === airlineSlug),
    }))
    .filter((item) => item.result && item.result.status !== "fails")
    .sort((a, b) => a.product.weight_lb - b.product.weight_lb)
    .slice(0, limit);
}

export function formatProductDimensions(product: CarryOnProduct) {
  return product.dimensions_in.map((value) => `${value}`).join(" × ") + " in";
}

export function formatProductPrice(product: CarryOnProduct) {
  const [low, high] = product.price_usd;
  return low === high ? `$${low}` : `$${low}–$${high}`;
}
