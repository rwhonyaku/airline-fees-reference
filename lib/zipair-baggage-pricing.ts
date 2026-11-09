export const ZIPAIR_BAGGAGE_SOURCE = "https://www.zipair.net/en/service/baggage";
export const ZIPAIR_BAGGAGE_VERIFIED = "2026-11-09";

export type ZipairRoutePrice = {
  origin: string;
  destination: string;
  label: string;
  amount: number;
  currency: string;
};

const routePairs: Array<{
  city: string;
  code: string;
  fromTokyo: [number, string];
  toTokyo: [number, string];
}> = [
  { city: "Seoul", code: "ICN", fromTokyo: [4000, "JPY"], toTokyo: [38100, "KRW"] },
  { city: "Taipei", code: "TPE", fromTokyo: [6000, "JPY"], toTokyo: [1200, "TWD"] },
  { city: "Bangkok", code: "BKK", fromTokyo: [6000, "JPY"], toTokyo: [1523, "THB"] },
  { city: "Singapore", code: "SIN", fromTokyo: [6000, "JPY"], toTokyo: [61, "SGD"] },
  { city: "Kuala Lumpur", code: "KUL", fromTokyo: [7000, "JPY"], toTokyo: [200, "MYR"] },
  { city: "Honolulu", code: "HNL", fromTokyo: [7500, "JPY"], toTokyo: [58, "USD"] },
  { city: "Vancouver", code: "YVR", fromTokyo: [11000, "JPY"], toTokyo: [114, "CAD"] },
  { city: "San Francisco", code: "SFO", fromTokyo: [11000, "JPY"], toTokyo: [85, "USD"] },
  { city: "San Jose", code: "SJC", fromTokyo: [11000, "JPY"], toTokyo: [85, "USD"] },
  { city: "Los Angeles", code: "LAX", fromTokyo: [11000, "JPY"], toTokyo: [85, "USD"] },
  { city: "Houston", code: "IAH", fromTokyo: [11000, "JPY"], toTokyo: [85, "USD"] },
  { city: "Orlando", code: "MCO", fromTokyo: [11000, "JPY"], toTokyo: [85, "USD"] },
];

export const ZIPAIR_CHECKED_BAG_PRICES: ZipairRoutePrice[] = routePairs.flatMap((route) => [
  {
    origin: "NRT",
    destination: route.code,
    label: `Tokyo (NRT) to ${route.city} (${route.code})`,
    amount: route.fromTokyo[0],
    currency: route.fromTokyo[1],
  },
  {
    origin: route.code,
    destination: "NRT",
    label: `${route.city} (${route.code}) to Tokyo (NRT)`,
    amount: route.toTokyo[0],
    currency: route.toTokyo[1],
  },
]);

function normalizeRoute(value: string): string {
  return value.toUpperCase().replace(/[→–—-]/g, " TO ").replace(/[^A-Z0-9]+/g, " ").trim();
}

export function findZipairRoutePrice(routeLabel: string | null): ZipairRoutePrice | null {
  if (!routeLabel) return null;
  const normalized = normalizeRoute(routeLabel);
  return ZIPAIR_CHECKED_BAG_PRICES.find((route) => {
    const originIndex = normalized.indexOf(route.origin);
    const destinationIndex = normalized.indexOf(route.destination);
    return originIndex >= 0 && destinationIndex > originIndex;
  }) ?? null;
}

export function getZipairBaggageQuote(routeLabel: string | null, directions: number): ZipairRoutePrice[] {
  const outbound = findZipairRoutePrice(routeLabel);
  if (!outbound) return [];
  if (directions !== 2) return [outbound];
  const reverse = ZIPAIR_CHECKED_BAG_PRICES.find(
    (route) => route.origin === outbound.destination && route.destination === outbound.origin
  );
  return reverse ? [outbound, reverse] : [outbound];
}

export function formatZipairMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
