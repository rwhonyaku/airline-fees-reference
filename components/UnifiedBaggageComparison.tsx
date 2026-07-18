import { getAirlineBySlug } from "@/lib/data";
import { explainVariableCheckedBagPricing, findCheckedBagFeeUsd } from "@/lib/bag-cost-calculator";
import cardsJson from "@/data/cards/cards.json";
import {
  UnifiedBaggageComparisonClient,
  type BaggageComparisonAirline,
} from "@/components/UnifiedBaggageComparisonClient";

const DEFAULT_COMPARISON_SLUGS = [
  "alaska",
  "american",
  "delta",
  "united",
  "southwest",
  "jetblue",
  "air-canada",
  "air-france",
  "zipair",
  "frontier",
];

type Props = {
  focusSlug?: string;
  peerSlugs?: string[];
  compact?: boolean;
};

function uniqueSlugs(slugs: string[]) {
  return Array.from(new Set(slugs.filter(Boolean)));
}

function checkedFeeEntries(slug: string) {
  const airline = getAirlineBySlug(slug);
  if (!airline) return null;

  const feeByBagOrdinal = [1, 2, 3]
    .map((ordinal) => {
      const fee = findCheckedBagFeeUsd(airline.fees, ordinal);
      return fee == null ? null : ([ordinal, fee] as [number, number]);
    })
    .filter(Boolean) as Array<[number, number]>;

  return {
    slug: airline.slug,
    name: airline.name,
    feeByBagOrdinal,
    variableReasons: explainVariableCheckedBagPricing(airline.fees).reasons,
    cards: cardsJson.cards.filter((card) => card.airline_slug === airline.slug),
  } satisfies BaggageComparisonAirline;
}

export function UnifiedBaggageComparison({ focusSlug, peerSlugs = [], compact = false }: Props) {
  const slugs = uniqueSlugs([
    ...(focusSlug ? [focusSlug] : []),
    ...peerSlugs,
    ...DEFAULT_COMPARISON_SLUGS,
  ]).slice(0, 10);
  const airlines = slugs.map(checkedFeeEntries).filter(Boolean) as BaggageComparisonAirline[];

  if (airlines.length === 0) return null;

  return <UnifiedBaggageComparisonClient airlines={airlines} focusSlug={focusSlug} compact={compact} />;
}
