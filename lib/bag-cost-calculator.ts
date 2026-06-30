import type { FeeItem } from "@/lib/types";

export type Card = {
  id: string;
  name: string;
  airline_slug: string;
  tier?: string;
  annual_fee_usd: number;
  free_checked_bags: number;
  applies_to_travelers: number;
  requires_purchase_with_card: boolean;
  notes?: string[];
  offer_url?: string;
  offer_label?: string;
  issuer_disclosure?: string;
  last_offer_verified?: string;
};

export type AirlineOverrides = Record<
  string,
  {
    requires_card_payment_for_free_bag?: boolean;
    amex_platinum_vanilla_free_bag?: boolean;
  }
>;

export type CardsJson = { cards: Card[] };

export function usd(n: number): string {
  return `$${Math.round(n)}`;
}

export function safeExternalUrl(v: string | undefined): string | null {
  if (!v) return null;
  try {
    const url = new URL(v);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function clampInt(v: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.round(n);
  return Math.min(max, Math.max(min, i));
}

export function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

function feeOrdinalScore(row: FeeItem, ordinal: number): number {
  const cond = typeof row.conditions === "string" ? row.conditions.toLowerCase() : "";
  if (ordinal === 1 && (cond.includes("first checked bag") || cond.includes("1st checked bag") || cond.includes("bag 1"))) {
    return 80;
  }
  if (ordinal === 2 && (cond.includes("2nd checked bag") || cond.includes("second checked bag") || cond.includes("bag 2"))) {
    return 80;
  }
  if (ordinal === 3 && (cond.includes("3rd checked bag") || cond.includes("third checked bag") || cond.includes("bag 3"))) {
    return 80;
  }
  return 0;
}

function routeScore(row: FeeItem): number {
  const region = typeof row.region_or_route === "string" ? row.region_or_route.toLowerCase() : "";
  if (region.includes("intra-island")) return -100;
  if (region.includes("asia") || region.includes("europe") || region.includes("oceania")) return -60;
  if (
    region.includes("most routes") ||
    region.includes("most markets") ||
    region.includes("north america") ||
    region.includes("u.s.") ||
    region.includes("domestic")
  ) {
    return 20;
  }
  return 0;
}

function currentRuleScore(row: FeeItem): number {
  const cond = typeof row.conditions === "string" ? row.conditions.toLowerCase() : "";
  const verified = typeof row.last_verified === "string" ? row.last_verified : "";
  let score = 0;

  if (cond.includes("on or after") || cond.includes("booked on or after") || cond.includes("current")) score += 120;
  if (cond.includes("before")) score -= 30;
  if (/^\d{4}-\d{2}-\d{2}$/.test(verified)) score += Number(verified.replace(/-/g, "")) / 1000000;

  return score;
}

export function findCheckedBagFeeUsd(fees: FeeItem[], ordinal: number): number | null {
  const matches = fees.filter((row) => {
    if (row.category !== "checked_baggage") return false;
    if (row.currency && row.currency.toUpperCase() !== "USD") return false;
    if (feeOrdinalScore(row, ordinal) <= 0) return false;

    const appliesTo = typeof row.applies_to === "string" ? row.applies_to.toLowerCase() : "";
    if (appliesTo.includes("blue plus")) return false;

    return typeof row.amount === "number" && Number.isFinite(row.amount);
  });

  if (!matches.length) return null;

  const row = matches.sort((a, b) => {
    const scoreA = feeOrdinalScore(a, ordinal) + routeScore(a) + currentRuleScore(a);
    const scoreB = feeOrdinalScore(b, ordinal) + routeScore(b) + currentRuleScore(b);
    return scoreB - scoreA;
  })[0];

  return typeof row.amount === "number" ? row.amount : null;
}

export function getCheckedBagFeeMap(fees: FeeItem[], maxBags: number): Map<number, number> {
  const map = new Map<number, number>();
  for (let ordinal = 1; ordinal <= maxBags; ordinal += 1) {
    const fee = findCheckedBagFeeUsd(fees, ordinal);
    if (fee != null) map.set(ordinal, fee);
  }
  return map;
}

export function calcCheckedBagTripCost(params: {
  fees: FeeItem[];
  travelers: number;
  bagsPerTravelerPerDirection: number;
  directions: number;
}): {
  canEstimate: boolean;
  feeByBagOrdinal: Map<number, number>;
  tripCostUsd: number;
  perDirectionCostUsd: number;
  missingBagOrdinals: number[];
  explanation: string;
} {
  const feeByBagOrdinal = getCheckedBagFeeMap(params.fees, params.bagsPerTravelerPerDirection);
  const missingBagOrdinals: number[] = [];
  let perTravelerPerDirection = 0;

  for (let ordinal = 1; ordinal <= params.bagsPerTravelerPerDirection; ordinal += 1) {
    const fee = feeByBagOrdinal.get(ordinal);
    if (fee == null) missingBagOrdinals.push(ordinal);
    else perTravelerPerDirection += fee;
  }

  if (params.bagsPerTravelerPerDirection === 0) {
    return {
      canEstimate: true,
      feeByBagOrdinal,
      tripCostUsd: 0,
      perDirectionCostUsd: 0,
      missingBagOrdinals,
      explanation: "No checked bags selected, so the modeled checked-bag cost is zero.",
    };
  }

  const canEstimate = missingBagOrdinals.length === 0;
  const perDirectionCostUsd = canEstimate ? perTravelerPerDirection * params.travelers : 0;
  const tripCostUsd = perDirectionCostUsd * params.directions;

  return {
    canEstimate,
    feeByBagOrdinal,
    tripCostUsd,
    perDirectionCostUsd,
    missingBagOrdinals,
    explanation: canEstimate
      ? "This estimate uses published USD checked-bag rows from the airline data and multiplies them by travelers and flight directions."
      : "This airline's checked-bag pricing cannot be fully modeled from the current dataset because one or more requested bag positions are route-, fare-, timing-, or market-dependent.",
  };
}

export function calcCardBagOffset(params: {
  feeByBagOrdinal: Map<number, number>;
  directions: number;
  roundtripsPerYear: number;
  travelers: number;
  bagsPerTravelerPerDirection: number;
  card: Card;
  userWillPayWithCard: boolean;
  airlineOverrides?: AirlineOverrides[string];
}): {
  eligible: boolean;
  savingsPerTripUsd: number;
  annualSavingsUsd: number;
  netAnnualUsd: number;
  breakEvenRoundtrips: number | null;
  warnings: string[];
} {
  const warnings: string[] = [];
  const mustPay =
    params.card.requires_purchase_with_card ||
    params.airlineOverrides?.requires_card_payment_for_free_bag === true;

  if (mustPay && !params.userWillPayWithCard) {
    return {
      eligible: false,
      savingsPerTripUsd: 0,
      annualSavingsUsd: 0,
      netAnnualUsd: -params.card.annual_fee_usd,
      breakEvenRoundtrips: null,
      warnings: ["This card's bag benefit requires paying for the ticket with the card."],
    };
  }

  const eligibleTravelers = Math.min(params.travelers, params.card.applies_to_travelers);
  const freeBagsPerDirection = Math.min(params.card.free_checked_bags, params.bagsPerTravelerPerDirection);
  let perTravelerPerDirectionSavings = 0;

  for (let ordinal = 1; ordinal <= freeBagsPerDirection; ordinal += 1) {
    const fee = params.feeByBagOrdinal.get(ordinal);
    if (fee == null) {
      warnings.push("The dataset is missing at least one checked-bag fee needed to model this card benefit.");
      return {
        eligible: false,
        savingsPerTripUsd: 0,
        annualSavingsUsd: 0,
        netAnnualUsd: -params.card.annual_fee_usd,
        breakEvenRoundtrips: null,
        warnings,
      };
    }
    perTravelerPerDirectionSavings += fee;
  }

  const savingsPerTripUsd = eligibleTravelers * perTravelerPerDirectionSavings * params.directions;
  const annualSavingsUsd = savingsPerTripUsd * params.roundtripsPerYear;
  const netAnnualUsd = annualSavingsUsd - params.card.annual_fee_usd;
  const breakEvenRoundtrips =
    savingsPerTripUsd > 0 ? Math.ceil(params.card.annual_fee_usd / savingsPerTripUsd) : null;

  if (savingsPerTripUsd <= 0) warnings.push("With these inputs, this card does not offset checked-bag fees.");

  return {
    eligible: true,
    savingsPerTripUsd,
    annualSavingsUsd,
    netAnnualUsd,
    breakEvenRoundtrips,
    warnings,
  };
}
