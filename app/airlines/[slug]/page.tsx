import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BaggageDecisionWidget } from "@/components/BaggageDecisionWidget";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import { findCheckedBagFeeUsd } from "@/lib/bag-cost-calculator";
import type { FeeItem } from "@/lib/types";
import { RelatedTools } from "@/components/RelatedTools";
import { SizerCheck } from "@/components/SizerCheck";
import { Disclaimer } from "@/components/Disclaimer";
import { AIRLINE_STRATEGY, hasActiveStrategyPage, isCoreAirline } from "@/lib/airline-strategy";
import { UnifiedBaggageComparison } from "@/components/UnifiedBaggageComparison";
import { JsonLd } from "@/components/JsonLd";
import { canonical } from "@/lib/seo";
import { buildProvenanceSummary } from "@/lib/provenance-summary.mjs";
import airFranceProvenance from "@/data/provenance/air-france.json";
import provenanceReviewQueue from "@/data/provenance/review-queue.json";
import { getVerificationFreshness } from "@/lib/freshness";
import { CarryOnRecommendations } from "@/components/CarryOnRecommendations";
import { isFeeCategoryKey } from "@/content/fee-categories";
import { getTripCostPilotProfiles } from "@/lib/trip-cost-pilot";
import {
  formatZipairMoney,
  ZIPAIR_BAGGAGE_SOURCE,
  ZIPAIR_BAGGAGE_VERIFIED,
  ZIPAIR_CHECKED_BAG_PRICES,
} from "@/lib/zipair-baggage-pricing";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type DerivedTiming = {
  pricingUnit: string;
  whenCharged: string;
  extraForConditions: string | null;
};

type ReferenceLink = {
  href: string;
  label: string;
};

type ReferenceContent = {
  intro: {
    carryOn: string;
    personalItem: string;
    checkedBag: string;
    restrictions: string;
  };
  verificationNote?: string;
  statusUpdate?: {
    label: string;
    body: string;
  };
  avoidFees?: string[];
  relatedGuides?: ReferenceLink[];
  fareClasses: Array<{
    name: string;
    details: string;
  }>;
  scenarios: Array<{
    title: string;
    details: string;
  }>;
  exceptions: string[];
  comparisonLinks: ReferenceLink[];
};

type AirlineFaq = {
  question: string;
  answer: string;
};

const SEARCH_ENTRY_COPY: Record<string, { h1: string; verdict: string }> = {
  "air-france": {
    h1: "Air France baggage fees: checked, extra, and overweight bags",
    verdict:
      "Air France baggage costs depend on the fare and itinerary. Additional bags may cost less when purchased online in advance, while overweight and oversized bags are priced at the airport for the specific route.",
  },
  "air-canada": {
    h1: "Air Canada baggage fees by fare and route",
    verdict:
      "Air Canada does not have one universal baggage price. On current short-haul fares, Basic and Standard can charge CAD/USD 45 for the first bag; on current long-haul fares, Basic can charge CAD/USD 90 while Standard and Flex include the first bag. Check the route, fare, and ticket-purchase date before comparing fares.",
  },
  alaska: {
    h1: "Alaska Airlines baggage fees: checked bags and carry-on rules",
    verdict:
      "For most North America tickets issued on or after April 10, 2026, Alaska charges $45 for the first checked bag, $55 for the second, and $200 for each third-plus bag. Saver still includes one carry-on and one personal item. Hawaii, international, First Class, status, card, military, and resident-program rules can change the answer.",
  },
  zipair: {
    h1: "ZIPAIR baggage fees: checked bag prices and 7 kg carry-on",
    verdict:
      "ZIPAIR includes two cabin items weighing 7 kg combined. Every checked bag costs extra, with a route-specific price covering one piece up to 30 kg; an unpurchased bag at the airport also attracts a processing fee.",
  },
  "air-india": {
    h1: "Air India baggage fees: excess, extra, and checked bags",
    verdict:
      "Air India usually includes checked baggage, then charges excess differently by itinerary. Within India, airport excess weight is INR 800 per kg before applicable taxes; international weight-concept routes charge per kg, while piece-concept routes charge for an additional, heavy, or oversized piece.",
  },
  lufthansa: {
    h1: "Lufthansa baggage fees: Economy Basic, checked bags, and carry-on",
    verdict:
      "Lufthansa's short- and medium-haul Economy Basic fare includes only one 40 × 30 × 15 cm personal item. Other Economy fares include one 8 kg carry-on, while checked baggage depends on the route, cabin, fare, status, and ticketed allowance.",
  },
  "singapore-airlines": {
    h1: "Singapore Airlines baggage allowance and excess-baggage costs",
    verdict:
      "Singapore Airlines uses weight allowances on routes not involving Canada or the U.S. and piece allowances to or from Canada and the U.S. The ticketed allowance—not a universal first-bag fee—is the starting point, and advance excess baggage can be 10% to 25% cheaper.",
  },
  "eva-air": {
    h1: "EVA Air baggage allowance: fare, route, and extra bags",
    verdict:
      "EVA Air's checked allowance changes by long-haul versus intra-Asia travel and by fare family. Long-haul Economy usually includes two 23 kg pieces except Discount, while intra-Asia Basic and Discount generally include one; for travel from September 29, prepaid excess baggage is 10% less up to four hours ahead.",
  },
  "cathay-pacific": {
    h1: "Cathay Pacific baggage allowance: decode PC vs K before paying",
    verdict:
      "Start with the allowance printed on the ticket: 2PC is a piece allowance, while 23K is a shared weight allowance. That distinction controls whether Cathay charges for another piece or additional kilograms—and whether prepaid extra baggage is useful.",
  },
  "korean-air": {
    h1: "Korean Air baggage fees: route tables and stacked excess charges",
    verdict:
      "Korean Air usually includes checked baggage, but the included pieces and excess price depend on the route, cabin, fare, and operating carrier. Extra-piece, overweight, and oversize charges can stack, so price all three conditions before accepting a seemingly cheap fare.",
  },
  "malaysia-airlines": {
    h1: "Malaysia Airlines baggage fees: weight routes vs piece routes",
    verdict:
      "Malaysia Airlines uses total-weight allowances on many routes but switches to a piece system for Africa and the Americas. Identify the system first: extra weight can start from a per-kilogram rate, while an additional piece on Africa or Americas routes has a separate published price.",
  },
  "vietnam-airlines": {
    h1: "Vietnam Airlines baggage fees: domestic and international excess costs",
    verdict:
      "Vietnam Airlines publishes unusually concrete excess-baggage tables. Current examples start at VND 650,000 for a standard domestic extra piece and USD 110 internationally off-peak, while overweight and oversize conditions are charged separately.",
  },
  "qatar-airways": {
    h1: "Qatar Airways baggage fees: weight routes vs Africa and Americas",
    verdict:
      "Qatar prices excess baggage by kilogram on weight-concept routes but by piece on Africa and Americas itineraries. Extra-piece, overweight, and oversize conditions can also combine, so the cheapest action depends on the route printed on the ticket—not a universal bag fee.",
  },
  "turkish-airlines": {
    h1: "Turkish Airlines baggage fees: fare package and route rules",
    verdict:
      "Turkish Airlines baggage starts with two questions: which fare package did you buy, and does the route use pieces or total weight? Some EcoFly routes include no checked bag, while extra-baggage pricing can change with connections, stopovers, and the most significant carrier.",
  },
  ana: {
    h1: "ANA baggage fees: prepaid extra bags and route exclusions",
    verdict:
      "ANA includes checked baggage on many fares, but some fares have zero free pieces. Its prepaid product covers only one eligible extra bag, must be arranged at least six hours before departure, and excludes itineraries involving U.S. or Canadian cities, codeshares, and several other trip types.",
  },
  jal: {
    h1: "Japan Airlines baggage fees: extra pieces, weight, and size",
    verdict:
      "JAL international Economy commonly includes two 23 kg pieces, but excess charges are condition-specific. An extra piece can also attract overweight or oversize fees, and domestic baggage uses different per-kilogram pricing.",
  },
  "air-china": {
    h1: "Air China baggage fees: domestic fare formula vs international tables",
    verdict:
      "Air China calculates domestic excess baggage at 1.5% of the published full-fare Economy benchmark per kilogram. International and regional trips instead use route-specific piece, weight, and size tables, so the domestic formula should never be used to estimate an overseas bag.",
  },
  "china-eastern": {
    h1: "China Eastern baggage fees: domestic kilograms vs international pieces",
    verdict:
      "China Eastern uses a domestic per-kilogram fare formula but international and regional piece tables. On those international routes, an extra bag that is also overweight or oversized can trigger multiple charges rather than one all-inclusive fee.",
  },
  "china-southern": {
    h1: "China Southern baggage fees: domestic formula and international zones",
    verdict:
      "China Southern calculates domestic excess baggage with a published-fare percentage formula, while international and regional trips use route-area tables. Extra-piece, overweight, and oversize conditions can be charged together—and an oversized cabin bag can be checked and charged at the gate.",
  },
  xiamenair: {
    h1: "XiamenAir baggage fees: fare brands, route groups, and heavy bags",
    verdict:
      "XiamenAir Economy allowances range from two checked pieces to no free bag depending on fare brand and route. Domestic excess uses a 1.5% per-kilogram formula; international travel uses route-group tables where extra, heavy, and large-bag charges can accumulate.",
  },
  asiana: {
    h1: "Asiana Airlines baggage fees: U.S., non-U.S., and domestic rules",
    verdict:
      "Asiana publishes separate baggage systems for Korean domestic, U.S.-route, and other international travel. International travelers can prepay additional pieces at least 24 hours ahead for up to 10% less, but overweight and oversize charges remain separate.",
  },
  "garuda-indonesia": {
    h1: "Garuda Indonesia baggage fees: the 2026 ticket-date change",
    verdict:
      "Garuda's baggage system changes with the ticket issue date. Older tickets use kilogram allowances and route-zone prices sold in 5 kg blocks; tickets issued from September 1, 2026 move to a piece system on Garuda-operated flights.",
  },
  srilankan: {
    h1: "SriLankan Airlines baggage fees: prepaid kilograms vs Americas pieces",
    verdict:
      "SriLankan uses total weight on most routes but pieces for North, Central, and South America. On eligible weight routes, travelers can prepay 5–50 kg online up to three hours before departure; baggage above 158 cm has a separate USD 50 oversize fee.",
  },
  "hong-kong-airlines": {
    h1: "Hong Kong Airlines baggage fees: fare families, zones, and prepayment",
    verdict:
      "Hong Kong Airlines uses piece allowances that vary by fare family and route zone. Prepaid extra baggage must be bought at least four hours ahead and works only on eligible HX-marketed, HX-operated flights—not ordinary codeshares or interline segments.",
  },
  "china-airlines": {
    h1: "China Airlines baggage fees: fare classes, zones, and 5% prepay savings",
    verdict:
      "China Airlines uses piece allowances that vary by route and booking class; some trans-Tasman Discount or Basic fares include no checked bag. Eligible CI or Mandarin itineraries can receive a 5% prepaid excess discount, but heavy, large, and special items use separate rules.",
  },
  hainan: {
    h1: "Hainan Airlines baggage fees: domestic kilograms vs international pieces",
    verdict:
      "Hainan uses weight allowances and a 1.5% full-fare formula on Chinese domestic routes, but pieces and route tables internationally. Prepaid baggage does not cover bags outside its limits; pieces above 32 kg or 203 cm generally must be repacked or moved as cargo.",
  },
  egyptair: {
    h1: "EgyptAir baggage fees: prepay cutoff, Africa exception, and stacked charges",
    verdict:
      "EgyptAir prices extra 23 kg pieces by route and sales channel. Website or call-center rates close 24 hours before departure, some Africa departures are airport-only, and a bag that is both heavy and oversized can be charged at double the single-condition rate.",
  },
  "royal-air-maroc": {
    h1: "Royal Air Maroc baggage fees: fare products, pieces, and route tables",
    verdict:
      "Royal Air Maroc uses pieces, not pooled weight. Eco Essential can include no checked bag on short or medium haul but one 23 kg piece on long-haul or transit travel, while extra, overweight, and oversize prices depend on the route pair.",
  },
  "batik-air": {
    h1: "Batik Air baggage fees: ticketed allowance and prepaid weight blocks",
    verdict:
      "Batik Air Indonesia's checked allowance is whatever FBA appears on the ticket. Eligible travelers can add 5–30 kg in five-kilogram blocks up to six hours before departure, and passengers on the same booking can pool weight when they check in together.",
  },
  iberia: {
    h1: "Iberia baggage fees: Basic fares, online bags, and 32 kg limit",
    verdict:
      "Iberia Basic is the principal no-bag risk; Standard, Flex, and premium fares generally include checked baggage. Extra bags are itinerary-priced and usually cleaner to buy online, while pieces above 23 kg face airport overweight treatment up to a hard 32 kg ceiling.",
  },
  "iberia-express": {
    h1: "Iberia Express baggage fees: Express fare and 15, 23, or 32 kg bags",
    verdict:
      "The Express pack is Iberia Express's no-checked-bag fare. Travelers can add a 15, 23, or 32 kg bag at a route- and channel-specific price; exceeding the purchased tier triggers a published €60 airport charge, so buying the correct weight is the key decision.",
  },
  volaris: {
    h1: "Volaris baggage fees: Zero, Basic, and Plus compared",
    verdict:
      "Volaris reverses the usual baggage ladder: Zero is personal-item only, Basic includes a 15 kg checked bag but no overhead carry-on, and Plus includes a carry-on plus a 25 kg checked bag. Choose by the bags you will actually bring—not by the fare name.",
  },
  "viva-aerobus": {
    h1: "Viva Aerobus baggage fees: Zero, Light, Extra, and Smart compared",
    verdict:
      "Viva's bundles solve different packing needs: Zero is personal-item only, Light adds a 10 kg carry-on, Extra adds that carry-on plus a 15 kg checked bag, and Smart raises the cabin allowance to 15 kg and checked allowance to 25 kg. Compare the complete bundle—not isolated bag fees.",
  },
  "tap-air-portugal": {
    h1: "TAP baggage fees: Discount fare, extra bags, and high-season risk",
    verdict:
      "TAP Discount can exclude checked baggage and standard seat selection. Extra bags start from €30 online but vary by route, channel, advance timing, and season; overweight and oversize are separate charges, and high-season restrictions can limit what TAP accepts.",
  },
  emirates: {
    h1: "Emirates baggage fees: weight routes, piece routes, and prepay savings",
    verdict:
      "Emirates charges excess by kilogram on weight-concept routes and by bag on piece-concept routes. Eligible online purchases can be 35%–60% cheaper than airport rates, but no ordinary checked piece may exceed 32 kg or 203 cm.",
  },
  "kenya-airways": {
    h1: "Kenya Airways baggage fees: ticketed pieces, pooling, and Asante benefits",
    verdict:
      "Kenya Airways uses piece allowances on KQ-operated flights, but the e-ticket or departure system controls mixed-carrier trips. Families can pool the number of bags—not weight inside one bag—and Asante points or status can cover an eligible extra standard piece.",
  },
  "south-african-airways": {
    h1: "South African Airways baggage fees: extra bags, status, and cargo limits",
    verdict:
      "SAA additional baggage is route-priced, passenger-specific, and unavailable for lap infants. A date change on the same route can preserve the purchase, but a route change requires cancellation and repurchase; partner operation can also remove SAA status, card, or sports benefits.",
  },
  "air-astana": {
    h1: "Air Astana baggage fees: Basic fare and MyBAGGAGE rules",
    verdict:
      "Air Astana Economy Basic includes no checked bag, Classic includes one 23 kg piece, and Plus includes two. MyBAGGAGE can add up to 10 pieces only on Air Astana-operated flights and must be bought at least 36 hours ahead to avoid airport rates.",
  },
  frontier: {
    h1: "Frontier baggage fees: carry-on, checked bags, and bundles",
    verdict:
      "Frontier does not publish one universal carry-on price. Every ticket includes one personal item up to 14 × 18 × 8 inches; Basic prices a full-size carry-on by itinerary and purchase timing, while Economy, Premium, and Business include it. Buying at booking is the lowest-risk path because airport and gate prices can be higher.",
  },
  ryanair: {
    h1: "Ryanair baggage fees: small bag, Priority, and checked-bag choices",
    verdict:
      "Ryanair's free allowance is one 40 × 30 × 20 cm under-seat bag. If you need an overhead 10 kg bag, buy Priority & 2 Cabin Bags while it is available; if you need more weight, choose the correct 10 kg, 20 kg, or 23 kg checked product before airport or gate handling becomes the expensive path.",
  },
  easyjet: {
    h1: "easyJet baggage fees: small cabin bag, large cabin bag, and hold luggage",
    verdict:
      "easyJet includes one 45 × 36 × 20 cm under-seat bag up to 15 kg. A 56 × 45 × 25 cm large cabin bag must be added separately or covered by an eligible Inclusive Plus or easyJet Plus benefit; arriving at the gate without the correct entitlement costs £60.",
  },
  spirit: {
    h1: "Spirit Airlines fee archive and passenger refund reference",
    verdict:
      "Spirit Airlines ceased operations on May 2, 2026. This page preserves historical fee records for old tickets and comparisons; it must not be used to price a new trip or treated as evidence that Spirit flights are currently bookable.",
  },
  southwest: {
    h1: "Southwest baggage fees: checked bags and free carry-on",
    verdict:
      "Southwest still includes one carry-on and one personal item, but it no longer gives every fare two free checked bags. On current U.S. Mainland Basic, Choice, and Choice Preferred bookings, the first checked bag is $45 each way and the second is $55; Choice Extra includes both.",
  },
  united: {
    h1: "United Airlines baggage fees: the fare, date, and payment traps",
    verdict:
      "United does not have one reliable bag price for every trip. Check the fare first, because Basic Economy can restrict overhead-bin access; then check the ticket date and itinerary, because checked-bag pricing and exemptions depend on more than the airport pair alone.",
  },
  delta: {
    h1: "Delta baggage fees: checked bags, Basic fares, and card exceptions",
    verdict:
      "Delta Basic still includes a carry-on and personal item, so the main Basic-fare trap is flexibility—not overhead-bin access. For current domestic Delta Main and Delta Comfort travel without an exception, the common first- and second-bag baseline is $45 and $55 each way.",
  },
  american: {
    h1: "American Airlines baggage fees: ticket dates, Basic, and prepay prices",
    verdict:
      "American includes one carry-on and one personal item even on Basic Economy. The fee trap is checked baggage: current domestic and short-haul prices depend on fare family, ticket date, and whether the first two bags are paid online or at the airport.",
  },
  jetblue: {
    h1: "JetBlue baggage fees: current fares, peak dates, and bag benefits",
    verdict:
      "JetBlue includes a carry-on on every current fare, but checked-bag costs depend on the fare family, route, travel date, and when the bag is added. Main Base and EvenMore Base also charge $150 to change or cancel, so the lowest displayed fare is not always the lowest-risk choice.",
  },
};

const TARGET_REFERENCE_SLUGS = new Set([
  "southwest",
  "american",
  "united",
  "delta",
  "alaska",
  "air-india",
  "air-canada",
  "air-france",
  "eva-air",
  "jetblue",
  "lufthansa",
  "singapore-airlines",
  "british-airways",
  "klm",
  "emirates",
  "qatar-airways",
  "turkish-airlines",
  "cathay-pacific",
  "ana",
  "jal",
  "korean-air",
  "aer-lingus",
  "aeromexico",
  "air-new-zealand",
  "qantas",
  "tap-air-portugal",
  "avianca",
  "copa",
  "iberia",
  "latam",
  "westjet",
  "virgin-australia",
  "iberia-express",
  "norwegian",
  "saudia",
  "vueling",
  "jetstar",
  "scoot",
  "airasia",
  "indigo",
  "cebu-pacific",
  "spicejet",
  "vietjet-air",
  "volaris",
  "viva-aerobus",
  "jet2",
  "thai-airways",
  "philippine-airlines",
  "vistara",
  "jetstar-asia",
  "jetstar-japan",
  "etihad",
  "gulf-air",
  "oman-air",
  "flydubai",
  "egyptair",
  "ethiopian",
  "royal-air-maroc",
  "kenya-airways",
  "south-african-airways",
  "srilankan",
  "air-china",
  "china-southern",
  "hainan",
  "xiamenair",
  "air-astana",
  "aix-connect",
  "spring-airlines",
  "asiana",
  "china-airlines",
  "china-eastern",
  "hong-kong-airlines",
  "malaysia-airlines",
  "garuda-indonesia",
  "vietnam-airlines",
  "batik-air",
  "wizz-air",
  "spirit",
  "frontier",
  "ryanair",
  "easyjet",
  "spirit",
  "zipair",
]);

const DOT_REFERENCE_SLUGS = new Set([
  "southwest",
  "american",
  "united",
  "delta",
  "alaska",
  "air-canada",
  "jetblue",
  "spirit",
  "frontier",
  "zipair",
]);

const EU261_REFERENCE_SLUGS = new Set(["aer-lingus", "air-france", "american", "british-airways", "delta", "easyjet", "iberia", "iberia-express", "jetblue", "klm", "lufthansa", "norwegian", "ryanair", "tap-air-portugal", "united", "vueling", "zipair"]);

const DECISION_SCENARIO_SLUGS = new Set(["zipair"]);

const CARD_DECISION_SLUGS = new Set(["united", "delta", "american", "alaska", "jetblue", "southwest", "air-canada"]);

type AirlinePageArchetype = "ulcc" | "us-network" | "international-network" | "inclusive";

const ULCC_AIRLINE_SLUGS = new Set([
  "airasia",
  "cebu-pacific",
  "easyjet",
  "frontier",
  "indigo",
  "iberia-express",
  "jet2",
  "jetstar",
  "jetstar-asia",
  "jetstar-japan",
  "norwegian",
  "ryanair",
  "scoot",
  "spicejet",
  "spirit",
  "vietjet-air",
  "viva-aerobus",
  "volaris",
  "vueling",
  "wizz-air",
  "zipair",
]);

const US_NETWORK_AIRLINE_SLUGS = new Set([
  "alaska",
  "american",
  "delta",
  "jetblue",
  "southwest",
  "united",
]);

const INCLUSIVE_AIRLINE_SLUGS = new Set([
  "ana",
  "cathay-pacific",
  "emirates",
  "eva-air",
  "jal",
  "korean-air",
  "qatar-airways",
  "singapore-airlines",
  "turkish-airlines",
]);

const DEEP_ANALYSIS_SLUGS = new Set([
  "alaska",
  "american",
  "air-canada",
  "air-france",
  "air-india",
  "delta",
  "easyjet",
  "frontier",
  "ryanair",
  "southwest",
  "united",
  "zipair",
]);

const REAL_WORLD_SCENARIO_SLUGS = new Set([
  "air-france",
  "jetblue",
  "zipair",
]);

function getAirlinePageArchetype(slug: string): AirlinePageArchetype {
  if (ULCC_AIRLINE_SLUGS.has(slug)) return "ulcc";
  if (US_NETWORK_AIRLINE_SLUGS.has(slug)) return "us-network";
  if (INCLUSIVE_AIRLINE_SLUGS.has(slug)) return "inclusive";
  return "international-network";
}

function getSummaryLabels(archetype: AirlinePageArchetype) {
  if (archetype === "ulcc") {
    return {
      eyebrow: "Where the base fare stops",
      carryOn: "Cabin-bag trigger",
      personalItem: "What travels free",
      checkedBag: "Paid checked-bag model",
      restrictions: "Highest-risk restriction",
    };
  }

  if (archetype === "us-network") {
    return {
      eyebrow: "What changes the final price",
      carryOn: "Carry-on by fare",
      personalItem: "Personal-item baseline",
      checkedBag: "First checked-bag baseline",
      restrictions: "Fare, card, and status caveats",
    };
  }

  if (archetype === "inclusive") {
    return {
      eyebrow: "Included allowance first",
      carryOn: "Cabin allowance",
      personalItem: "Additional cabin item",
      checkedBag: "Included checked allowance",
      restrictions: "Where excess charges begin",
    };
  }

  return {
    eyebrow: "Route and fare determine the answer",
    carryOn: "Cabin allowance",
    personalItem: "Personal-item treatment",
    checkedBag: "Checked allowance or charge",
    restrictions: "Route and baggage-concept limits",
  };
}

const REFERENCE_AIRLINE_CONTENT: Record<string, ReferenceContent> = {
  "singapore-airlines": {
    intro: {
      carryOn:
        "Singapore Airlines includes cabin baggage, but the allowance changes by cabin: Economy and Premium Economy get one 7 kg cabin bag, while Business and First get two 7 kg cabin bags, with size limits still applying.",
      personalItem:
        "There is no separate personal-item charge shown here; the practical cabin-bag question is whether your booked cabin allows one or two main cabin pieces under the 7 kg-per-piece rule.",
      checkedBag:
        "Singapore Airlines is an included-allowance airline, not a simple paid-first-bag airline. Checked baggage is included on eligible fares, but the allowance depends on route, cabin, fare family, and whether the itinerary uses the weight concept or piece concept.",
      restrictions:
        "The main fee risk is excess baggage, not a simple first-bag charge: once you exceed the allowance attached to your route and fare, pricing moves into a route- and concept-based excess-baggage schedule.",
    },
    verificationNote:
      "Singapore Airlines cabin and checked allowances, baggage-concept rules, and advance-purchase discounts were rechecked against Singapore Airlines on 2026-09-28. Other categories retain their record-level dates.",
    avoidFees: [
      "Confirm whether your itinerary uses the weight concept or piece concept before packing; the excess charge is triggered by exceeding the allowance attached to that concept.",
      "Treat the 7 kg cabin-bag limit as real for Economy and Premium Economy. If your bag is close, move weight into the included checked allowance before reaching the airport.",
      "If you need more checked baggage, buy it more than 48 hours before departure when eligible for the 25% discount. The discount drops to 10% from 48 hours until the six-hour cutoff.",
      "Do not assume a seat is free just because standard selection is often included. Preferred or extra-legroom seats may still price by route and fare family.",
      "Check fare conditions before buying a restrictive fare, because change and cancellation costs depend on the fare rule rather than one flat Singapore Airlines fee.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/excess-baggage-calculator?airline=singapore-airlines&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
    ],
    fareClasses: [
      {
        name: "Economy / Premium Economy",
        details:
          "The carry-on allowance is one cabin bag up to 7 kg. Checked baggage may be included, but the actual allowance is tied to route, cabin, fare family, and whether the itinerary uses piece or weight concept rules.",
      },
      {
        name: "Business / First",
        details:
          "The carry-on allowance is two cabin bags up to 7 kg each. Premium-cabin excess-baggage pricing is still route- and concept-based rather than one universal amount.",
      },
      {
        name: "Standard seat selection",
        details:
          "Standard seat selection is included for most fares, but timing and availability depend on fare family and cabin.",
      },
      {
        name: "Preferred or extra-legroom seats",
        details:
          "Preferred or extra-legroom seats may cost extra on some Economy fares, with pricing depending on route and fare family.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Checked baggage is included under either the weight or piece concept depending on route.",
      "Business and First Class show two cabin bags instead of the one-bag Economy and Premium Economy allowance.",
      "Bags above the maximum accepted weight per checked bag are not handled as ordinary checked baggage.",
      "No co-branded credit-card baggage waiver is shown for Singapore Airlines.",
    ],
    comparisonLinks: [
      { href: "/airlines/eva-air", label: "EVA Air" },
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/emirates", label: "Emirates" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
    ],
  },
  lufthansa: {
    intro: {
      carryOn:
        "On long-haul flights, Economy and Premium Economy include one 8 kg carry-on and Business and First include two. On short- and medium-haul flights, Economy Basic is different: it includes only one personal item unless an eligible status exception applies.",
      personalItem:
        "Lufthansa allows an additional small item, such as a slim laptop bag, alongside the main cabin baggage allowance.",
      checkedBag:
        "Lufthansa checked baggage is fare-, cabin-, route-, and status-dependent rather than one global first-bag price. Economy Basic on selected European routes includes no checked bag; other tickets must be read from the booking or Lufthansa baggage calculator.",
      restrictions:
        "Economy Basic on selected short- and medium-haul routes is now the sharpest baggage restriction: no overhead carry-on, no checked bag, and no seat reservation are included. Economy Light is a different fare and does include one 8 kg carry-on.",
    },
    verificationNote:
      "Lufthansa carry-on and Economy Basic baggage rules were rechecked against Lufthansa on 2026-09-28. Other baggage and fare records retain their record-level dates.",
    avoidFees: [
      "On selected European routes, distinguish Economy Basic from Economy Light. Basic includes only a personal item; Light includes the 8 kg overhead carry-on.",
      "Price the exact origin, destination, and fare family before assuming a checked bag is included. The ticketed allowance is controlling.",
      "Keep Economy and Premium Economy checked bags at or below 23 kg and 158 cm total dimensions to avoid excess-baggage treatment.",
      "Use included or status-eligible seat-selection options where available instead of buying advance seat reservation by default.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/excess-baggage-calculator?airline=lufthansa&weight=25&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
    ],
    fareClasses: [
      {
        name: "Economy Basic — selected European routes",
        details:
          "Includes one personal item up to 40 × 30 × 15 cm. It does not include the 8 kg overhead carry-on, a checked bag, or seat reservation. Eligible HON Circle, Senator, and Star Alliance Gold members can receive a carry-on exception.",
      },
      {
        name: "Economy Light / Comfort / Flex",
        details:
          "On short- and medium-haul flights these fares include one personal item plus one carry-on up to 8 kg and 55 × 40 × 23 cm. Checked baggage still depends on the fare and route.",
      },
      {
        name: "Economy / Premium Economy baggage",
        details:
          "On long-haul flights, carry-on is one 8 kg item plus a personal item. Checked-bag allowance varies by fare, cabin, and route, with excess treatment above 23 kg or 158 cm total dimensions.",
      },
      {
        name: "Business / First",
        details:
          "Carry-on is two 8 kg items plus the personal item. Premium-cabin checked-bag fees are not reduced to one universal ladder here.",
      },
    ],
    scenarios: [],
    exceptions: [
      "The United States to Germany checked-bag amounts are examples, not a global Lufthansa checked-bag table.",
      "Bags above 32 kg are not accepted as ordinary travel baggage.",
      "Status can affect advance seat reservation treatment on eligible flights.",
      "No Lufthansa co-branded credit-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-france", label: "Air France" },
      { href: "/airlines/british-airways", label: "British Airways" },
      { href: "/airlines/klm", label: "KLM" },
      { href: "/airlines/united", label: "United Airlines" },
    ],
  },
  "air-france": {
    intro: {
      carryOn:
        "Air France carry-on is not one universal yes/no rule. Economy may include 0 to 1 hand baggage item plus one small bag, and the Basic fare can require a paid Hand Baggage option shown during booking.",
      personalItem:
        "Air France includes one small bag with maximum dimensions of 40 x 30 x 15 cm, even where the larger hand-baggage allowance depends on fare.",
      checkedBag:
        "Air France baggage fees depend on the operating carrier, itinerary, cabin, fare, and purchase channel. Premium can include up to two 23 kg checked bags depending on ticket conditions, while the published short- and medium-haul Business product includes two 32 kg bags. Economy allowance remains ticket-specific, so the booking confirmation is the controlling source.",
      restrictions:
        "The main traps are assuming an Air France flight number means Air France baggage rules, treating a cabin maximum as a universal fare allowance, and waiting until the airport. Partner-operated segments can use different rules; additional bags are route-priced; overweight and oversized options are airport-only.",
    },
    verificationNote:
      "Air France baggage allowances, additional-bag purchase rules, and overweight/oversize limits shown here were checked against official Air France sources on 2026-08-31. Air France does not publish one universal extra-bag price, so route-specific amounts are intentionally not invented.",
    avoidFees: [
      "If booking Basic, confirm whether the larger hand-baggage item is included or whether the Hand Baggage option is required before comparing the fare against a higher bundle.",
      "Buy additional baggage online at least 24 hours before departure when the route allows the discount; flights from or to Canada and the USA do not get a different online price.",
      "Keep checked bags within the ticketed allowance because Air France overweight and oversized baggage charges are airport-paid options that vary by itinerary.",
      "Use free seat-assignment eligibility when it applies, such as Flex fares or listed Flying Blue status benefits, instead of paying for seat selection too early.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=air-france&travelers=1&bags=1&directions=2&trips=1&pay=yes", label: "Checked baggage calculator" },
      { href: "/tools/excess-baggage-calculator?airline=air-france&bags=1&directions=2&weight=51&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=14&depth=9", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic fare",
        details:
          "Basic Economy can require a Hand Baggage option, with rates displayed during purchase and in My Bookings and purchase allowed up to 4 hours before departure.",
      },
      {
        name: "Economy Light",
        details:
          "Economy Light has the clearest seat-selection restriction: paid seats are available until check-in closes, otherwise seats are auto-assigned at check-in.",
      },
      {
        name: "Flex fares and eligible passengers",
        details:
          "Standard seat selection is free for Flex fares and certain eligible passenger groups, including listed Flying Blue status members and companions on the same booking.",
      },
      {
        name: "Additional baggage",
        details:
          "Additional checked-baggage prices are itinerary-based and shown in booking or My Bookings. The useful Air France baggage price is the one shown for your exact route, fare, and purchase timing, with the online timing rule depending on whether the itinerary touches Canada or the USA.",
      },
      {
        name: "Excess baggage",
        details:
          "Air France excess baggage fees for overweight or oversized bags are airport-priced by itinerary. Overweight treatment applies above the ticketed allowance and up to 32 kg; bags over 32 kg go to cargo instead of normal checked baggage.",
      },
    ],
    scenarios: [
      {
        title: "Booking Basic with a cabin bag",
        details:
          "The fare may not behave like a normal carry-on-inclusive ticket. Basic can require a paid Hand Baggage option, with the amount shown during purchase or in My Bookings.",
      },
      {
        title: "Adding a checked bag before travel",
        details:
          "Additional baggage pricing is itinerary-based and surfaced during purchase or in My Bookings. The practical move is to price the exact route before deciding whether Air France is cheaper than another carrier after baggage fees, charges, and seat add-ons.",
      },
      {
        title: "Checking Air France excess baggage cost",
        details:
          "Overweight bags up to 32 kg and oversized bags over 158 cm are airport-priced by itinerary. Over 32 kg goes to cargo instead of normal checked baggage.",
      },
      {
        title: "Skipping paid seat selection",
        details:
          "If you do not buy a seat, Air France can auto-assign a seat at check-in. That is a practical fallback, but Economy Light has less control before check-in closes.",
      },
    ],
    exceptions: [
      "The additional-baggage online discount rule has an exception for flights from or to Canada and the USA, where the online price is the same as the airport price.",
      "The Additional Baggage option does not cover lap infants, animals, or sports equipment; those use separate rules or rates.",
      "For partner-operated or mixed-carrier itineraries, check the operating carrier. Air France says baggage allowances can differ and recommends following the strictest rule when segments differ.",
      "Passengers with reduced mobility, children traveling alone, listed Flying Blue status members, companions on the same booking, and Flex fares have free standard seat-selection treatment.",
      "Bags over 32 kg must be handled via cargo.",
      "No Air France co-branded credit-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/lufthansa", label: "Lufthansa" },
      { href: "/airlines/klm", label: "KLM" },
      { href: "/airlines/british-airways", label: "British Airways" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
    ],
  },
  southwest: {
    intro: {
      carryOn:
        "Southwest still includes one carry-on bag and one personal item on every fare.",
      personalItem:
        "The personal item needs to be small enough to stow under a seat or in an overhead bin, so soft backpacks and laptop bags are safer than rigid totes.",
      checkedBag:
        "Southwest's old bag simplicity is gone. The current model separates included allowance from paid checked bags: Choice Extra keeps the first two checked bags included, while Basic, Choice, and Choice Preferred use paid first- and second-bag pricing on U.S. Mainland bookings ticketed or changed on or after April 9, 2026.",
      restrictions:
        "Basic is now the clear restriction point: no seat selection, no included first bag, and no free same-day change unless the fare is upgraded.",
    },
    verificationNote:
      "Southwest's current seat-assignment, same-day-change, and change/cancellation rules were rechecked on 2026-11-08. Carry-on and U.S. Mainland checked-bag rows retain their separate record-level verification dates.",
    avoidFees: [
      "Do not assume Southwest still means two checked bags for every fare. Compare Basic, Choice, and Choice Preferred against Choice Extra if anyone in the party is checking bags.",
      "For U.S. Mainland bookings, check the ticketing or change date before relying on a baggage amount; Southwest separates bookings before and after April 9, 2026.",
      "Keep the trip carry-on-only when possible. Southwest still includes one carry-on and one personal item, so the cleanest way to avoid the checked-bag fee is not checking a bag.",
      "If same-day flexibility matters, avoid Basic unless the lower fare still wins after bag, seat, and change restrictions are priced in.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/tools/checked-baggage-calculator?airline=southwest&travelers=2&bags=1&directions=2&trips=1&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=southwest&travelers=2&bags=1&trips=2&pay=yes", label: "Card bag-benefit calculator" },
      { href: "/guides/basic-economy-traps", label: "Restricted fare guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
    ],
    fareClasses: [
        {
          name: "Basic Fare",
          details:
          "Basic is the fare most likely to surprise longtime Southwest flyers. It keeps the carry-on, but on newer U.S. Mainland bookings it charges for the first and second checked bags and does not include seat selection or same-day change.",
        },
        {
          name: "Choice Fare",
          details:
          "Choice has the same newer first- and second-bag charges as Basic on U.S. Mainland bookings, but it restores free same-day change.",
        },
      {
        name: "Choice Preferred Fare",
        details:
          "Choice Preferred keeps the same checked-bag charges as Choice for later U.S. Mainland bookings, with same-day change listed at USD 0.",
      },
      {
        name: "Choice Extra Fare",
        details:
          "Choice Extra is the Southwest fare to compare when you are checking bags. The first two checked bags and same-day change are listed at USD 0.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "A carry-on-only Southwest trip still works cleanly across fare families because the carry-on and personal item remain included.",
      },
        {
          title: "Checking one standard bag",
          details:
          "On U.S. Mainland Basic, Choice, and Choice Preferred bookings ticketed or changed on or after April 9, 2026, the first checked bag is USD 45 one-way. Choice Extra lists the first checked bag at USD 0.",
        },
      {
        title: "Checking an overweight bag",
        details:
          "Southwest lists overweight pricing at USD 100 one-way for 51-70 lbs and USD 200 one-way for 71-100 lbs, in addition to the standard checked bag fee.",
      },
    ],
      exceptions: [
        "Choice Extra fares show the first and second checked bags at USD 0 in both U.S. Mainland booking windows.",
        "Before April 9, 2026, U.S. Mainland first- and second-bag amounts remain USD 35 and USD 45 for Basic, Choice, and Choice Preferred fares.",
        "All fare types are eligible for cancellations without a cancellation fee, but Southwest still requires canceling before departure to preserve eligible funds.",
      ],
    comparisonLinks: [
      { href: "/airlines/alaska", label: "Alaska Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/jetblue", label: "JetBlue" },
    ],
  },
  "air-india": {
    intro: {
      carryOn:
        "Air India includes cabin baggage on Air India-operated flights: Economy shows one cabin bag up to 7 kg plus one personal item, while premium cabins have higher allowances.",
      personalItem:
        "Air India includes one personal item alongside the cabin bag allowance on Air India-operated flights.",
      checkedBag:
        "Air India is an allowance airline, not a flat first-bag-fee airline. Domestic Economy Value includes 15 kg, Classic 20 kg, and Flex 25 kg; the select-route Economy Basic trial also includes 15 kg. International allowances depend on route, fare, cabin, and whether the ticket uses weight or piece concept.",
      restrictions:
        "The costly mistake is treating every kilogram and piece alike. Domestic airport excess is INR 800 per kg before applicable taxes, but piece-concept itineraries can charge separately for an extra piece, weight above 23 kg, and size above 158 cm.",
    },
    verificationNote:
      "Air India cabin baggage, checked-baggage allowances, and excess-baggage purchase rules were rechecked against Air India on 2026-09-27. Other fee rows retain their record-level verification dates.",
    avoidFees: [
      "Confirm whether the itinerary uses the piece concept or weight concept before buying extra baggage; the excess-baggage path depends on that structure.",
      "Treat the Economy 7 kg cabin-bag limit as a real packing constraint on Air India-operated flights. If the bag is close, solve the weight before the airport.",
      "For eligible 098-ticketed Air India flights, prepay excess baggage through Manage Booking up to two hours before departure and save up to 20% versus airport pricing. Interline and codeshare flights are excluded.",
      "For partner-operated or mixed itineraries, check the operating carrier rules because this cabin-baggage guidance is for Air India-operated flights.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/excess-baggage-calculator?airline=air-india&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
    ],
    fareClasses: [
      {
        name: "Domestic Economy",
        details:
          "Value includes 15 kg, Classic 20 kg, and Flex 25 kg of checked baggage. The optional Basic fare being trialled on select domestic routes also includes 15 kg. Below 25 kg of free allowance, Air India permits one checked piece; at 25 kg or more, it permits two.",
      },
      {
        name: "Premium cabins",
        details:
          "Business and First Class have higher cabin baggage allowances, but premium-cabin checked-bag and change-fee treatment is not reduced to one universal ladder here.",
      },
      {
        name: "International and purchase path",
        details:
          "International allowances and charges use either weight or piece concept. Eligible Air India tickets beginning 098 can prepay additional weight or pieces and save up to 20%, but the final price shown during purchase controls and a return flight requires a separate purchase.",
      },
      {
        name: "Partner or non-Air India operations",
        details:
          "The carry-on guidance is limited to Air India-operated flights. Partner-operated segments may use the operating carrier's baggage rules.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Domestic Economy allowances are fare-specific: Value and select-route Basic include 15 kg, Classic 20 kg, and Flex 25 kg.",
      "An Air India domestic segment on the same ticket as an Air India international segment receives the international allowance. Separate Air India tickets can also qualify when the connection is within 24 hours.",
      "No ordinary checked bag may exceed 32 kg. Bags over 158 cm are oversized; Air India publishes INR 2,000 domestic, USD 125 international excluding Canada, and CAD 180 for Canada.",
      "Business and First Class have higher cabin-baggage allowances.",
      "Maharaja Club Gold and Platinum add one 23 kg piece on piece-concept routes or 20 kg on weight-concept routes; Silver adds 5 kg only on eligible weight-concept Air India flights.",
    ],
    comparisonLinks: [
      { href: "/airlines/eva-air", label: "EVA Air" },
      { href: "/airlines/zipair", label: "ZIPAIR" },
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
    ],
  },
  "air-canada": {
    intro: {
      carryOn:
        "Most Air Canada fares include one standard carry-on and one personal item. Some Economy Basic itineraries purchased on or after January 3, 2025 allow only one personal item; an onward international connection can change that allowance. Check the carry-on lookup for the exact ticket before bringing an overhead bag.",
      personalItem:
        "One personal item is included. On affected Economy Basic itineraries it may be the only included cabin item, so a backpack that exceeds Air Canada's 33 × 43 × 16 cm personal-item limit can create a gate-check problem.",
      checkedBag:
        "For short-haul fares purchased on or after April 13, 2026, Basic and Standard charge CAD/USD 45 for the first bag and CAD/USD 60 for the second; Flex includes the first bag and charges CAD/USD 60 for the second. For listed long-haul fares purchased on or after May 14, 2026, Basic charges CAD/USD 90 then 120, while Standard and Flex include the first bag and charge CAD/USD 120 for the second. Taxes may apply.",
      restrictions:
        "Basic fares are the main restriction point: the checked bag fee can appear where higher fares include a bag, changes and refunds are not permitted after 24 hours except in qualifying circumstances, and advance seat selection starts as a paid product on Basic.",
    },
    verificationNote:
      "Air Canada's current first-, second-, and additional-bag fee structure was rechecked against Air Canada on 2026-11-06. Carry-on records retain their 2026-09-27 date; excess-baggage and Aeroplan card-benefit claims retain their 2026-09-09 dates; seat and change details retain their 2026-08-23 dates.",
    avoidFees: [
      "Do not assume Standard always includes the first bag: on current short-haul fares, Basic and Standard both charge CAD/USD 45. Flex is the first of these three fare families with an included first bag.",
      "Use Air Canada's baggage calculator for the exact itinerary. The fee changes by route, fare, purchase date, and operating carrier, so a generic trip-cost calculator should not invent one universal total.",
      "Keep bags under Air Canada's standard weight and size limits; overweight and oversize charges move into route-based ranges and bags over 32 kg are not accepted as ordinary checked baggage.",
      "If an eligible Aeroplan card benefit applies, check in with Air Canada before security. It can cover the first bag for up to nine people on the same reservation, but it does not cover a bag first presented at the gate.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/checked-baggage-calculator?airline=air-canada&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=air-canada&travelers=2&bags=1&trips=2&pay=yes", label: "Aeroplan checked-bag benefit" },
      { href: "/tools/excess-baggage-calculator?airline=air-canada&bags=1&directions=2&weight=51&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
    ],
    fareClasses: [
      {
        name: "Basic",
        details:
          "On the current published tiers, Basic charges CAD/USD 45 for the first short-haul bag or CAD/USD 90 for the first listed long-haul bag. Some Basic itineraries also limit the included cabin allowance to one personal item. This is the fare family where both checked- and carry-on rules need an itinerary-specific check.",
      },
      {
        name: "Standard and Flex",
        details:
          "Standard does not universally include the first bag: it pays CAD/USD 45 on the current short-haul tier but includes the first bag on the listed long-haul tier. Flex includes the first bag in both published groups. Higher cabins and fares can have different allowances.",
      },
      {
        name: "Preferred and extra-legroom seating",
        details:
          "Preferred or extra-legroom seats are listed separately with a CAD 25 to CAD 199 range depending on route and timing.",
      },
      {
        name: "International route differences",
        details:
          "Air Canada's listed long-haul tier covers Canada or the U.S. to Africa, Asia/South Pacific, Europe, the Middle East, and South America. Other itineraries, codeshares, and tickets issued before the effective dates can produce a different answer, so the booking confirmation remains controlling.",
      },
    ],
    scenarios: [],
    exceptions: [
      "The published 2026 amounts apply only to the listed route groups and tickets purchased on or after their effective dates.",
      "Codeshare and interline itineraries can follow the first operating carrier's baggage rules rather than the Air Canada baseline.",
      "A stopover longer than 24 hours can cause baggage fees to be assessed again.",
      "No change fee is shown for Standard and higher fares before departure, though fare difference can still apply.",
      "An eligible Aeroplan card's first-bag benefit applies at Air Canada check-in and does not add another free bag when the ticket already includes the first one.",
    ],
    comparisonLinks: [
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/air-india", label: "Air India" },
    ],
  },
  "eva-air": {
    intro: {
      carryOn:
        "EVA Air includes one 7 kg cabin bag in Economy and Premium Economy, or two 7 kg pieces in Royal Laurel, Premium Laurel, and Business, on EVA Air-operated flights.",
      personalItem:
        "EVA Air includes one personal item alongside the cabin bag allowance on EVA Air-operated flights.",
      checkedBag:
        "EVA Air is an included-allowance airline, but Economy allowance changes by route and fare. Long-haul Up, Standard, and Basic include two 23 kg pieces while Discount includes one; within Asia, Up and Standard include two while Basic and Discount include one.",
      restrictions:
        "The main trap is assuming every Economy fare includes two bags. EVA's Discount fare cuts the long-haul allowance to one piece, while both Basic and Discount do so within Asia. Interline rules can also replace EVA's allowance.",
    },
    verificationNote:
      "EVA Air cabin allowance, checked-bag fare tables, interline rules, and prepaid excess-baggage cutoff were rechecked against EVA Air on 2026-09-28. Other categories retain their record-level dates.",
    avoidFees: [
      "Check whether the trip is long-haul or within Asia and whether the Economy fare is Up, Standard, Basic, or Discount; that determines whether one or two checked pieces are included.",
      "Treat the Economy 7 kg cabin-bag limit as real on EVA Air-operated flights. If the bag is close, solve the weight before check-in.",
      "For travel on or after September 29, 2026, price the exact route and prepay eligible excess baggage at least four hours before departure for EVA's published 10% discount.",
      "For partner-operated segments, check the operating carrier rules because this cabin-baggage guidance is limited to EVA Air-operated flights.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/excess-baggage-calculator?airline=eva-air&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy cabin baggage is one bag up to 7 kg plus one personal item. Long-haul Up, Standard, and Basic include two checked pieces; Discount includes one. Within Asia, Up and Standard include two pieces while Basic and Discount include one.",
      },
      {
        name: "Premium Economy / Business",
        details:
          "Premium Economy and Business have higher cabin baggage allowances, but premium-cabin checked-bag and change-fee treatment is not reduced to one universal ladder here.",
      },
      {
        name: "Allowance and purchase path",
        details:
          "Additional baggage is calculator-priced by route. For travel on or after September 29, 2026, EVA publishes a 10% discount for eligible purchases made at least four hours before departure. Airport and irregular-item handling can differ.",
      },
      {
        name: "Partner or non-EVA operations",
        details:
          "The carry-on guidance is limited to EVA Air-operated flights. Partner-operated segments may use the operating carrier's baggage rules.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Checked baggage is included on most eligible fares rather than handled as one fixed universal paid first-bag rule.",
      "Additional baggage may be purchased in advance or at the airport where the route permits it, but no fixed extra-bag number applies systemwide.",
      "Premium Economy keeps one 7 kg cabin piece; Business-family cabins receive two pieces. The difference is cabin, not a paid carry-on product.",
      "Infinity MileageLands Diamond, Gold, and eligible Silver members can receive one additional checked piece under EVA's published conditions.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/zipair", label: "ZIPAIR" },
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/air-canada", label: "Air Canada" },
    ],
  },
  "british-airways": {
    intro: {
      carryOn:
        "British Airways includes one cabin bag and one personal item on all fares shown here, so the main cabin-bag risk is size and weight enforcement rather than a posted carry-on fee.",
      personalItem:
        "The personal item is capped at 40 x 30 x 15 cm, separate from the larger 56 x 45 x 25 cm cabin bag.",
      checkedBag:
        "British Airways checked baggage depends on cabin and fare type. Many fares include a checked-bag allowance, while Basic fares can require a paid checked bag whose price depends on route, cabin, and booking time.",
      restrictions:
        "The practical restrictions are Basic-fare checked baggage, Economy seat selection, and fare-rule-based changes or refunds. British Airways does not use one simple first-bag or change-fee number across all tickets.",
    },
    verificationNote:
      "The British Airways carry-on, checked-bag, oversize, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not compare Basic against a bag-included fare using base fare alone. If you need checked baggage, price the bag before booking.",
      "Keep each checked bag at or below 32 kg because British Airways does not accept bags over that limit as ordinary checked baggage.",
      "Skip advance seat selection if a free check-in seat is acceptable and your fare is eligible; paid Economy seat selection varies by route, seat type, and timing.",
      "Check fare rules before buying a restrictive ticket because change fees, fare differences, and refundability depend on the specific fare conditions.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=british-airways&weight=33&size=76", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=18&depth=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic fares",
        details:
          "Basic fares are the checked-bag pressure point: paid checked baggage can apply where a bag is not included, with price depending on route, cabin, and booking time.",
      },
      {
        name: "Bag-included fares",
        details:
          "Most non-Basic fare paths include checked baggage, but the actual allowance depends on cabin and fare type rather than one universal first-bag rule.",
      },
      {
        name: "Premium cabins",
        details:
          "First, Club World, Club Europe, and Club Europe Plus show seat selection included from booking.",
      },
      {
        name: "Economy seats and fare rules",
        details:
          "Some Economy fares charge for advance seat selection, while changes and refunds depend on ticket fare rules rather than one flat British Airways fee.",
      },
    ],
    scenarios: [
      {
        title: "Flying with cabin bags only",
        details:
          "One cabin bag and one personal item are included. The question is whether both pieces fit the size and weight limits.",
      },
      {
        title: "Booking Basic with one checked bag",
        details:
          "Basic checked-bag pricing depends on route, cabin, and booking time, so the bag price should be checked before deciding the fare is cheaper.",
      },
      {
        title: "Checking a bag over 32 kg",
        details:
          "A single checked bag over 32 kg is not accepted as checked baggage.",
      },
      {
        title: "Choosing a seat in Economy",
        details:
          "Advance Economy seat selection can be paid, but eligible fares can receive free seat selection at check-in 24 hours before departure.",
      },
    ],
    exceptions: [
      "Unaccompanied minors are not accepted on British Airways-operated flights.",
      "Premium cabin seat selection is included from booking.",
      "Oversize handling can depend on item and route within the maximum dimensions.",
      "No British Airways co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/lufthansa", label: "Lufthansa" },
      { href: "/airlines/air-france", label: "Air France" },
      { href: "/airlines/klm", label: "KLM" },
      { href: "/airlines/american", label: "American Airlines" },
    ],
  },
  klm: {
    intro: {
      carryOn:
        "KLM cabin baggage depends on fare and cabin. Economy passengers may bring one hand baggage item plus one accessory on KLM-operated flights, but Economy Light can require a paid hand-baggage option shown during booking or in My Trip.",
      personalItem:
        "The accessory allowance is 40 x 30 x 15 cm in Economy, separate from the larger hand baggage item.",
      checkedBag:
        "KLM checked baggage is fare- and route-dependent. Standard, Flex, and premium fares may include checked baggage, while extra baggage is priced during booking or in My Trip and can have online-purchase discount rules.",
      restrictions:
        "The weak points are Economy Light hand baggage, itinerary-priced extra baggage, airport-priced overweight or oversize baggage, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The KLM carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "If booking Economy Light, confirm whether the hand-baggage option is needed before comparing the fare against Standard or Flex.",
      "Buy additional checked baggage online before travel when the route allows it; KLM prices extra baggage during booking or in My Trip and airport handling is less flexible.",
      "Keep checked bags within the ticketed allowance because overweight and oversize charges are airport-paid and route-dependent.",
      "Use free seat-selection eligibility where it applies, including Flex fares and listed Flying Blue Elite benefits, instead of buying a seat by default.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=klm&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=14&depth=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy Light",
        details:
          "Economy Light is the cabin-bag restriction point. The hand-baggage option is shown during booking and in My Trip and must be purchased before check-in closes.",
      },
      {
        name: "Standard, Flex, and premium fares",
        details:
          "These fares may include checked baggage, but the actual allowance still depends on route and cabin.",
      },
      {
        name: "Additional baggage",
        details:
          "Additional checked baggage is priced in booking or My Trip, with online advance discounts and route exceptions, including certain USA and Canada routes.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on seat type, route, fare, and timing, while changes and cancellations depend on fare rules and possible fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Booking Economy Light with hand baggage",
        details:
          "The hand-baggage option is not one universal amount; it is displayed during booking and in My Trip and must be purchased before check-in closes.",
      },
      {
        title: "Adding one checked bag",
        details:
          "Extra baggage is priced during booking or in My Trip, so the useful answer is route-specific rather than a universal first-bag fee.",
      },
      {
        title: "Arriving with a 33 kg bag",
        details:
          "Bags over 32 kg must be shipped as cargo.",
      },
      {
        title: "Skipping paid seat selection",
        details:
          "Economy Light requires paid seat selection until check-in opens 30 hours before departure, while Flex and listed Flying Blue Elite benefits can change the seat math.",
      },
    ],
    exceptions: [
      "Children traveling alone and passengers with reduced mobility have free standard seat-selection treatment.",
      "Certain additional-baggage online discount exceptions apply on routes including USA and Canada.",
      "The unaccompanied-minor service depends on age and itinerary, so the page does not show one universal service fee.",
      "No KLM co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-france", label: "Air France" },
      { href: "/airlines/lufthansa", label: "Lufthansa" },
      { href: "/airlines/british-airways", label: "British Airways" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
    ],
  },
  emirates: {
    intro: {
      carryOn:
        "Emirates includes cabin baggage, but the allowance changes by cabin: Economy gets one 7 kg piece, Premium Economy gets one 10 kg piece, and Business or First get two 7 kg pieces.",
      personalItem:
        "There is no separate Emirates personal-item fee shown here; the practical cabin question is the number, weight, and size of the cabin pieces allowed by your cabin.",
      checkedBag:
        "Emirates includes checked baggage, then prices excess by kilogram on weight-concept routes or by additional piece on piece-concept routes. The allowance printed in the ticket or Manage Booking is the starting point.",
      restrictions:
        "Using the wrong baggage concept is the main pricing error. Airport tables start at USD 15 per kg or USD 100 per extra piece in selected markets, while eligible advance purchases can be 35%–60% less.",
    },
    verificationNote:
      "Emirates's cabin limits, weight and piece concepts, advance-purchase discounts, Skywards benefits, sports rules, and cargo cutoffs were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Confirm whether your route uses the weight concept or piece concept before packing; excess charges are triggered differently under each model.",
      "Price extra baggage online before travel when eligible; Emirates publishes advance discounts of 35%–60% against airport pricing.",
      "Split any piece above 32 kg and keep dimensions at or below 203 cm, because heavier or larger items leave normal checked baggage.",
      "Apply Skywards correctly: Silver adds allowance on weight routes, while piece-route extra-bag benefits begin at Gold.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=emirates&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Weight-concept routes",
        details:
          "The ticket shows a total kilogram allowance. Excess is purchased by additional weight, with airport examples starting at USD 15 per kg and eligible online discounts available.",
      },
      {
        name: "Piece-concept routes",
        details:
          "The ticket shows a number of pieces with weight and size limits. Another bag, an overweight bag, and an oversized bag are different conditions.",
      },
      {
        name: "Cabin allowances",
        details:
          "Economy gets one 7 kg cabin piece, Premium Economy one 10 kg piece, and Business or First two pieces up to 7 kg each. A rejected cabin bag enters the checked allowance calculation.",
      },
      {
        name: "Skywards allowance",
        details:
          "Silver, Gold, and Platinum can add weight on eligible weight routes; only Gold and Platinum receive the published piece-route addition.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with cabin baggage only",
        details:
          "The cabin baseline is one piece up to 7 kg. The risk is being over the cabin weight limit, not a simple carry-on fee.",
      },
      {
        title: "Needing 8 kg more on a weight route",
        details:
          "Buy kilograms rather than another fixed piece, and compare the eligible online price with the airport per-kilogram table.",
      },
      {
        title: "Needing another bag on a piece route",
        details:
          "Buy an extra piece. Keep it within the route's weight and size ceiling so extra-piece, overweight, or oversize treatment does not compound the cost.",
      },
      {
        title: "Checking a 34 kg or 210 cm item",
        details:
          "A normal checked piece cannot exceed 32 kg, and an item over 203 cm must move through cargo or freight. Prepaying excess does not override either cutoff.",
      },
    ],
    exceptions: [
      "Skywards Silver receives additional allowance on weight-concept travel but not the published extra piece on piece-concept routes.",
      "Bicycles should be arranged at least 24 hours in advance; equipment beyond accepted dimensions goes as cargo or freight.",
      "Infants receive 10 kg on weight routes or one 23 kg piece on piece routes, plus limited cabin necessities and stroller or carry-cot handling.",
    ],
    comparisonLinks: [
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/eva-air", label: "EVA Air" },
      { href: "/airlines/air-india", label: "Air India" },
    ],
  },
  "qatar-airways": {
    intro: {
      carryOn:
        "Qatar Airways Economy includes one 7 kg cabin bag. Business and First receive two pieces with a 15 kg combined allowance—not 7 kg for each piece as a traveler might infer from the Economy rule.",
      personalItem:
        "A small personal item does not create another full-size Economy carry-on. Qatar can move noncompliant cabin baggage into the checked system, where the route's piece or weight rules become important.",
      checkedBag:
        "Qatar uses piece allowances to and from Africa or the Americas and total-weight allowances on many other routes. On weight routes, another kilogram is the pricing unit; on piece routes, another bag, an overweight bag, and an oversize bag are separate conditions.",
      restrictions:
        "The costliest mistake is using Qatar's lowest published example as a global price. Airport rates start from USD 20 per kg or USD 130 per extra piece in selected table pairings, while piece-route overweight and oversize charges start from USD 75 and may combine.",
    },
    verificationNote:
      "Qatar Airways' cabin allowances, Africa and Americas piece system, weight-route excess tables, cumulative conditions, status benefits, and infant rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Identify Africa or Americas travel before doing any bag math: those routes use pieces, while many other routes charge excess by kilogram.",
      "On a weight route, reduce total kilograms; on a piece route, redistribute weight and size before buying another bag because conditions can stack.",
      "Keep every piece at or below 32 kg. A larger total allowance never permits one bag above Qatar's single-piece maximum.",
      "Apply eligible Privilege Club allowance first: Silver, Gold, and Platinum add kilograms or pieces differently according to the baggage system.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=qatar-airways&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Weight-concept routes",
        details:
          "Excess is purchased by kilogram after the ticketed allowance. Qatar's airport table begins at USD 20 per kg for its lowest region pairing, but the actual rate changes with origin and destination.",
      },
      {
        name: "Africa and Americas piece routes",
        details:
          "These routes price an additional piece separately. Selected airport cases begin at USD 130, while overweight and oversize conditions begin at USD 75 and can be added to the extra-piece charge.",
      },
      {
        name: "Privilege Club allowance",
        details:
          "Silver, Gold, and Platinum add 15, 20, or 25 kg on eligible weight routes, or one, one, or two pieces on piece routes. The itinerary must be Qatar-marketed and operated for the published benefit.",
      },
      {
        name: "Premium cabin baggage",
        details:
          "Business and First receive two cabin pieces totaling 15 kg. Checked allowance also rises by cabin and fare family, but the route still decides whether the allowance is expressed as weight or pieces.",
      },
    ],
    scenarios: [
      {
        title: "A weight-route itinerary is 4 kg over",
        details:
          "Price four excess kilograms using the exact origin-destination pairing. Adding another suitcase does not remove the excess because the allowance is measured by combined weight.",
      },
      {
        title: "An Americas itinerary needs one extra bag",
        details:
          "Use the piece table, where selected airport rates begin at USD 130. Then test that piece independently for the 23 kg and 158 cm thresholds.",
      },
      {
        title: "An extra piece is both heavy and oversized",
        details:
          "Qatar separates extra-piece, overweight, oversize, and combined conditions. Do not budget only the extra-piece rate; calculate the itinerary's combined treatment before travel.",
      },
      {
        title: "An infant travels to the Americas",
        details:
          "The published infant allowance is one 23 kg checked piece plus one baby item. Elsewhere, the infant checked allowance is commonly 10 kg, showing why route geography matters beyond adult tickets.",
      },
    ],
    exceptions: [
      "The lowest USD excess examples apply only to selected region pairings, not every Qatar itinerary.",
      "Extra-piece, overweight, and oversize conditions can combine on Africa or Americas piece routes.",
      "Privilege Club extra allowance requires an eligible Qatar Airways-marketed and operated trip.",
      "A single checked piece may not exceed 32 kg; split heavier baggage before check-in.",
    ],
    comparisonLinks: [
      { href: "/airlines/emirates", label: "Emirates" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/eva-air", label: "EVA Air" },
      { href: "/airlines/air-india", label: "Air India" },
    ],
  },
  "turkish-airlines": {
    intro: {
      carryOn:
        "Turkish Airlines Economy includes one 8 kg cabin bag; Business includes two 8 kg pieces. Checked baggage is less uniform because the fare package and route can change both the free allowance and the excess calculation.",
      personalItem:
        "A small personal item accompanies the cabin allowance, but it should not be treated as another full-size piece. The main cabin count remains one in Economy and two in Business.",
      checkedBag:
        "Do not assume every Turkish fare includes a checked bag. Some EcoFly routes have no checked allowance; other packages include baggage expressed as pieces or total weight. Turkish then prices excess through an itinerary calculator rather than one global fee table.",
      restrictions:
        "Connections complicate the answer. The most significant carrier, joint-flight rules, stopovers, domestic connections, and TRNC cases can override a simple origin-destination estimate. Sports equipment also uses its own table, not the normal extra-bag price.",
    },
    verificationNote:
      "Turkish Airlines' cabin allowance, fare-package baggage, piece-versus-weight rules, calculator caveats, Miles&Smiles benefits, sports equipment, infant baggage, and fare conditions were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Check the named fare package before comparing prices. An EcoFly fare with no checked allowance can erase a small base-fare saving.",
      "Run the exact itinerary through Turkish's excess calculator, including connections and stopovers, instead of transferring a price from another route.",
      "Split any piece above 32 kg. The airline will not accept a heavier ordinary checked bag simply because the total allowance is sufficient.",
      "Price sports equipment through the dedicated special-charge table; ordinary online extra baggage does not model those items.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=turkish-airlines&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "EcoFly",
        details:
          "EcoFly can carry no checked-bag allowance on selected routes. Confirm the package row before booking because adding baggage later may make ExtraFly the cheaper total trip.",
      },
      {
        name: "ExtraFly and PrimeFly",
        details:
          "Higher Economy packages can include more baggage and flexibility, but the exact allowance still changes by flight track and whether the route uses pieces or total weight.",
      },
      {
        name: "Route calculator and connections",
        details:
          "Extra baggage is calculator-priced by route, carrier, timing, stopovers, and baggage concept. Most-significant-carrier rules and joint flights can change the result shown for a simple Turkish-operated itinerary.",
      },
      {
        name: "Miles&Smiles allowance",
        details:
          "Eligible tiers add 10, 20, or 25 kg on weight routes or an additional piece on piece routes. Apply the status benefit before deciding whether the next fare package is worth buying.",
      },
    ],
    scenarios: [
      {
        title: "EcoFly is cheaper but you need a checked bag",
        details:
          "Compare EcoFly plus the calculator-priced bag against ExtraFly's total. The lowest advertised fare is not necessarily the lower trip cost when the route excludes checked baggage.",
      },
      {
        title: "A journey includes a partner-operated segment",
        details:
          "Do not rely on the Turkish-only allowance. The most significant carrier can control baggage, and the calculator itself warns that joint-flight exceptions apply.",
      },
      {
        title: "A checked piece weighs more than 32 kg",
        details:
          "Repack into separate bags before check-in. Turkish caps each ordinary piece at 32 kg even on weight-concept tickets with a larger combined allowance.",
      },
      {
        title: "Traveling with skis or another sports item",
        details:
          "Use Turkish's sports-equipment rules and special-charge zones. A normal extra-baggage purchase can give the wrong answer because equipment is sold under a separate framework.",
      },
    ],
    exceptions: [
      "Some EcoFly flight tracks include no checked baggage; fare-package benefits are not identical across all routes.",
      "Joint flights, stopovers, domestic connections, TRNC travel, and most-significant-carrier rules can change the calculator result.",
      "Sports equipment uses separate equipment and zone charges rather than ordinary extra-baggage pricing.",
      "No single checked piece may exceed 32 kg, including on weight-concept itineraries.",
    ],
    comparisonLinks: [
      { href: "/airlines/emirates", label: "Emirates" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
      { href: "/airlines/lufthansa", label: "Lufthansa" },
      { href: "/airlines/air-india", label: "Air India" },
    ],
  },
  "cathay-pacific": {
    intro: {
      carryOn:
        "Cathay's cabin allowance is straightforward compared with its checked-bag rules: Economy and Premium Economy receive one 7 kg cabin bag, while Business and First receive two 7 kg pieces. Do not use the premium-cabin count when comparing an Economy fare.",
      personalItem:
        "Cathay also permits a small personal item, but that does not increase the 7 kg limit on the main Economy cabin bag. Keep the personal item genuinely small instead of treating it as a second full-size carry-on.",
      checkedBag:
        "The ticket's baggage notation is the decision point. A piece-system allowance such as 2PC limits the number and weight of bags; a weight-system allowance such as 23K lets eligible bags share a total weight. The cheapest response to excess baggage is different under each system.",
      restrictions:
        "The costly mistakes are buying the wrong kind of excess allowance, missing Cathay's advance-purchase window, or arriving with one bag above 32 kg. Partner-operated segments can also apply a different carrier's baggage rules.",
    },
    verificationNote:
      "Cathay Pacific's cabin limits, piece-versus-weight treatment, prepaid extra-baggage conditions, 32 kg maximum, and related fare rules were fully reviewed against official sources on 2026-08-23.",
    avoidFees: [
      "Find PC or K on the e-ticket before buying baggage. PC means the number of pieces matters; K means the combined checked weight matters.",
      "On eligible Cathay-marketed, operated, and ticketed itineraries, prepay up to three extra pieces at least 24 hours before departure for a discount of up to 10%.",
      "Repack instead of paying when a single bag exceeds 32 kg: Cathay will not accept that piece as ordinary checked baggage.",
      "Recheck the operating carrier on every segment. Cathay's prepaid allowance is not a safe assumption for a partner-operated flight.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=cathay-pacific&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Read the ticket first: PC",
        details:
          "A notation such as 2PC is a piece-system allowance. Each bag must stay within its individual weight and size limit; a light first bag does not create extra weight for an overweight second bag.",
      },
      {
        name: "Read the ticket first: K",
        details:
          "A notation such as 23K is a weight-system allowance. The combined checked weight is the main constraint, so redistributing weight between bags can avoid a per-kilogram excess charge.",
      },
      {
        name: "Prepaid extra pieces",
        details:
          "Eligible Cathay-only bookings can add up to three pieces at least 24 hours before departure and receive up to a 10% discount. This is useful for a known extra piece, not as a substitute for fixing an overweight bag.",
      },
      {
        name: "Cabin and status allowances",
        details:
          "Business and First receive two 7 kg cabin pieces. Cathay Gold or Diamond and eligible oneworld status may add checked allowance, but the benefit still follows the itinerary's piece or weight system.",
      },
    ],
    scenarios: [
      {
        title: "Your ticket says 2PC and you need a third bag",
        details:
          "Treat this as an extra-piece problem. If the itinerary qualifies, buying the third piece at least 24 hours ahead can be up to 10% cheaper than resolving it late.",
      },
      {
        title: "Your ticket says 23K and your bags total 27 kg",
        details:
          "Treat the four kilograms as excess weight rather than assuming you need another piece. Repacking between bags may help with individual handling limits, but it does not reduce the combined excess kilograms.",
      },
      {
        title: "One checked bag weighs more than 32 kg",
        details:
          "Do not plan to pay an overweight fee and continue. Cathay caps an accepted checked piece at 32 kg, so move items to another bag or arrange cargo before arriving at the airport.",
      },
      {
        title: "A partner operates one flight",
        details:
          "The operating carrier and most-significant-carrier rules can change the allowance. Confirm the baggage line for the whole ticket before buying Cathay prepaid baggage that may not cover the partner segment.",
      },
    ],
    exceptions: [
      "Prepaid extra baggage requires an eligible Cathay-marketed, Cathay-operated, and Cathay-ticketed itinerary and closes 24 hours before departure.",
      "Sports equipment can count within the checked allowance, but size handling and a 203 cm threshold can still affect acceptance or charges.",
      "No single checked piece above 32 kg is accepted, even when the total ticket allowance is higher.",
      "Status benefits and partner flights can alter the printed allowance; the e-ticket remains the controlling starting point.",
    ],
    comparisonLinks: [
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/eva-air", label: "EVA Air" },
      { href: "/airlines/korean-air", label: "Korean Air" },
      { href: "/airlines/ana", label: "ANA" },
    ],
  },
  ana: {
    intro: {
      carryOn:
        "ANA's cabin limit is 10 kg combined across the carry-on and personal item. A light suitcase does not create a separate unrestricted allowance for a heavy personal bag.",
      personalItem:
        "The personal item shares the 10 kg total, making weight—not merely fit—the cabin-bag trap. Weigh both pieces together before leaving for the airport.",
      checkedBag:
        "ANA's included allowance changes between domestic and international travel, by cabin and fare, and some fares can carry zero free checked pieces. Its prepaid service solves one additional bag on a narrow set of eligible international itineraries; it is not a universal excess-baggage purchase.",
      restrictions:
        "The main mistake is assuming the prepaid option covers any trip or any baggage problem. It excludes U.S. and Canadian city itineraries, codeshares, other-airline operation, Japan-domestic-only sectors, and separate tickets, and it does not solve overweight baggage.",
    },
    verificationNote:
      "ANA's combined cabin limit, domestic and international allowances, one-piece prepaid product, premium benefits, sports-equipment exception, and family rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Read the ticketed free-piece count first; ANA warns that some fares include no checked bag.",
      "Use prepaid extra baggage only for one known additional piece on an eligible itinerary, and request it at least six hours before departure.",
      "Do not buy the prepaid product for overweight baggage—it covers an extra piece, not unlimited excess weight.",
      "If carrying listed sports equipment between 158 and 292 cm, check ANA's oversize-fee waiver and aircraft limits before paying a generic oversize charge.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=ana&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?height=22&width=16&depth=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Ticketed free allowance",
        details:
          "Domestic versus international rules, cabin, and fare control the checked allowance. Some fares have zero free pieces, which can also remove the usual infant or child baggage expectation.",
      },
      {
        name: "One prepaid extra piece",
        details:
          "Eligible ANA-ticketed international trips can prepay one additional piece at least six hours ahead. Published examples range from JPY 10,000 or USD 100 within some areas to JPY 20,000, EUR 150, or USD 200 across areas.",
      },
      {
        name: "Prepayment exclusions",
        details:
          "Trips involving U.S. or Canadian cities, codeshares, another operating airline, Japan-domestic-only sectors, or separate tickets are excluded from ANA's published prepaid product.",
      },
      {
        name: "Sports-equipment exception",
        details:
          "Listed sports equipment within the free allowance can receive an oversize-fee waiver from 158 to 292 cm on eligible ANA international flights, although route, aircraft, and acceptance limits remain.",
      },
    ],
    scenarios: [
      {
        title: "Carry-on plus personal item total 12 kg",
        details:
          "Repack or check weight before travel. ANA measures the two cabin items together against the 10 kg limit rather than giving each item its own allowance.",
      },
      {
        title: "One extra bag on an eligible international trip",
        details:
          "Prepay the single extra piece at least six hours before departure. Use the itinerary's departure currency and area pairing instead of assuming the lowest JPY or USD example.",
      },
      {
        title: "The trip connects through a U.S. or Canadian city",
        details:
          "ANA's published prepaid extra-bag option is not available. Budget using the airport or controlling-carrier rules rather than relying on the online one-piece product.",
      },
      {
        title: "Checking a 200 cm bicycle",
        details:
          "Eligible listed sports gear can receive ANA's oversize-fee waiver between 158 and 292 cm, but advance contact is still sensible because aircraft and route limits can prevent carriage.",
      },
    ],
    exceptions: [
      "ANA's prepaid product covers one extra piece only and closes six hours before departure.",
      "U.S./Canada city itineraries, codeshares, other-airline operation, domestic-only sectors, and separate tickets can be ineligible for prepayment.",
      "Sports-equipment oversize relief does not override aircraft, route, packing, or acceptance limits.",
      "Lap infants can receive one extra piece on eligible international fares, except where the fare has zero free checked allowance.",
    ],
    comparisonLinks: [
      { href: "/airlines/jal", label: "Japan Airlines" },
      { href: "/airlines/korean-air", label: "Korean Air" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/eva-air", label: "EVA Air" },
    ],
  },
  jal: {
    intro: {
      carryOn:
        "JAL includes 10 kg of cabin baggage in total across the main carry-on and personal item. The combined-weight rule matters more than the number of small bags.",
      personalItem:
        "The personal item shares the 10 kg ceiling. A compliant suitcase can still create a cabin issue when the laptop bag pushes the combined total over the limit.",
      checkedBag:
        "JAL international Economy and Premium Economy commonly include two 23 kg pieces. Excess is then classified as another piece, overweight, or oversize, with route-pair pricing; domestic baggage follows a different per-kilogram structure.",
      restrictions:
        "Charges can accumulate when one bag violates multiple limits. Acceptance is another constraint: a single piece above 200 × 90 × 90 cm is generally outside JAL's airport limits, and sports equipment can be refused when the aircraft lacks cargo space.",
    },
    verificationNote:
      "JAL's combined cabin allowance, international piece rules, domestic and international excess examples, status allowance, infant baggage, and equipment limits were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Keep each international Economy piece at or below 23 kg and 158 cm to avoid adding overweight or oversize charges to an extra-piece fee.",
      "Separate domestic and international pricing: domestic excess can be charged per kilogram, while international tables use area pairs and baggage conditions.",
      "Do not assume a through-check price from one route applies to another; JAL's own examples change with the international area pair and itinerary split.",
      "Contact JAL before taking long sports equipment because valid baggage can still be rejected when the scheduled aircraft has insufficient cargo length or space.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=jal&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?height=22&width=16&depth=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "International Economy allowance",
        details:
          "Economy and Premium Economy commonly include two pieces up to 23 kg each. Premium cabins use higher piece-weight limits, while status can add another piece.",
      },
      {
        name: "International excess conditions",
        details:
          "Extra-piece, overweight, and oversize charges use area-pair tables. JAL illustrates a through-check Osaka–Tokyo–London extra piece at JPY 20,000 plus JPY 10,000 when overweight.",
      },
      {
        name: "Domestic excess weight",
        details:
          "Japan domestic baggage uses different logic, including a published JPY 440 per kg excess example. Do not use that domestic figure to estimate an international extra piece.",
      },
      {
        name: "JMB and oneworld status",
        details:
          "Eligible status can raise international Economy or Premium Economy to three pieces. The weight limit varies by tier and JAL Global Club eligibility, so verify the exact member benefit.",
      },
    ],
    scenarios: [
      {
        title: "Two Economy bags weigh 23 kg each",
        details:
          "That commonly fits JAL's international Economy allowance, subject to the exact ticket and operating carrier. Check dimensions as well as weight before treating both pieces as included.",
      },
      {
        title: "A third bag also weighs 28 kg",
        details:
          "Budget for an extra-piece charge plus the relevant 23–32 kg overweight charge. JAL's route examples show that one condition does not cancel the other.",
      },
      {
        title: "Domestic baggage exceeds the free weight",
        details:
          "Use the domestic per-kilogram table rather than an international extra-piece price. The published domestic excess example is JPY 440 per kilogram.",
      },
      {
        title: "Taking skis on a smaller aircraft",
        details:
          "Even when the equipment otherwise qualifies, acceptance depends on packaging and available cargo length. Confirm the scheduled aircraft rather than assuming fee payment guarantees carriage.",
      },
    ],
    exceptions: [
      "International excess prices depend on the area pair and can combine extra-piece, overweight, and oversize conditions.",
      "Domestic per-kilogram examples do not price international baggage.",
      "A single piece above 200 × 90 × 90 cm is generally outside JAL's published airport limits.",
      "Sports-equipment acceptance depends on packing, aircraft cargo length, and available space.",
    ],
    comparisonLinks: [
      { href: "/airlines/ana", label: "ANA" },
      { href: "/airlines/korean-air", label: "Korean Air" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/eva-air", label: "EVA Air" },
    ],
  },
  "korean-air": {
    intro: {
      carryOn:
        "Korean Air Economy includes one 10 kg cabin bag; Prestige and First include two 10 kg pieces. The larger cost question is checked baggage, where route and cabin determine the included allowance before any fee is calculated.",
      personalItem:
        "A small personal item is allowed with the main cabin baggage, but it is not permission to bring a second full-size Economy carry-on. Pack to the stated cabin count and 10 kg limit.",
      checkedBag:
        "Korean Air does not have one universal first-bag price. Domestic and international routes, Saver fares, cabin, ticket date, and codeshare operation can change the included pieces. Calculate the free allowance first, then test each bag for extra-piece, overweight, and oversize charges.",
      restrictions:
        "Excess conditions can stack. A third bag that is also 24–32 kg and oversized can attract an extra-piece fee plus overweight and oversize charges. Large pieces above 203 cm may require advance approval rather than a simple airport payment.",
    },
    verificationNote:
      "Korean Air's cabin allowances, route-based checked baggage, advance excess purchase, Americas fee examples, Brazil exception, and stacked excess conditions were fully reviewed against official sources on 2026-08-23.",
    avoidFees: [
      "Use Korean Air's itinerary-specific baggage calculator before comparing fares; do not transplant an Americas allowance onto an intra-Asia or codeshare trip.",
      "Buy a known extra bag online in advance when the itinerary is eligible rather than waiting for airport check-in.",
      "Keep Economy pieces at or below 23 kg and 158 cm when possible. Crossing both thresholds can trigger two excess conditions on top of an extra-piece charge.",
      "Check whether SKYPASS status actually adds a piece or weight on this route; some Americas Economy cases are excluded.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=korean-air&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy and Saver",
        details:
          "Economy receives one 10 kg cabin bag, but the checked allowance is route-specific. Saver, Brazil ticket dates, and a codeshare operator can produce a different result from a standard Korean Air-operated itinerary.",
      },
      {
        name: "Americas route tables",
        details:
          "Korean Air publishes concrete fee tables for Americas itineraries. Current examples show a USD 200 third bag and USD 100 for a 24–32 kg bag on covered routes, but those figures are examples—not global prices.",
      },
      {
        name: "Brazil exception",
        details:
          "Travel involving Brazil has separate published treatment, including exceptions to the standard Americas overweight example. Confirm the route and ticket conditions instead of applying the USD 100 figure automatically.",
      },
      {
        name: "Prestige, First, and SKYPASS",
        details:
          "Prestige and First receive two 10 kg cabin pieces and higher checked allowances. Eligible SKYPASS status may add a piece or 10 kg, subject to route and Economy exclusions.",
      },
    ],
    scenarios: [
      {
        title: "Economy between Asia and the Americas",
        details:
          "Start with the exact ticketed allowance; the first bag is commonly included and the second can be included on many routes, but exceptions exist. The booking confirmation beats a generic two-bag assumption.",
      },
      {
        title: "Adding a third standard-size bag",
        details:
          "On covered Americas examples, Korean Air lists USD 200 for the third bag. Price the real itinerary and purchase in advance when eligible because another region can use a different amount.",
      },
      {
        title: "Checking a 24–32 kg bag",
        details:
          "Covered Americas examples show a USD 100 overweight charge, with separate Brazil treatment. If the bag is also additional or oversized, those charges can be added rather than replaced.",
      },
      {
        title: "Checking a piece larger than 203 cm",
        details:
          "Do not assume an oversize fee guarantees acceptance. Korean Air requires advance approval for pieces in the larger published band, and equipment or aircraft limits can still control carriage.",
      },
    ],
    exceptions: [
      "Codeshare flights can follow the operating carrier's baggage allowance and fee rules rather than Korean Air's tables.",
      "Brazil itineraries have separate published overweight and extra-piece treatment.",
      "Extra-piece, overweight, and oversize charges may be cumulative when one bag violates multiple limits.",
      "Infants on international tickets can receive one checked piece plus a stroller and car seat or bassinet; children generally follow the adult allowance.",
    ],
    comparisonLinks: [
      { href: "/airlines/ana", label: "ANA" },
      { href: "/airlines/jal", label: "Japan Airlines" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/eva-air", label: "EVA Air" },
    ],
  },
  "aer-lingus": {
    intro: {
      carryOn:
        "Aer Lingus Saver fares include only the small under-seat personal item by default. A 10 kg cabin bag is either bundled with higher fares or bought as an add-on, with the price changing by route and timing.",
      personalItem:
        "The included small item is capped at 33 x 25 x 20 cm and must fit under the seat. That is the true free cabin-bag path on Saver.",
      checkedBag:
        "Aer Lingus checked baggage is an add-on model. The 20 kg and 25 kg checked-bag options have ranges that vary by route, season, and purchase timing, while airport excess weight is charged per additional kg.",
      restrictions:
        "The main Aer Lingus fee traps are Saver baggage, paid seat selection, and Saver fare flexibility. The fare can stay cheap only if the bag and change needs are solved before booking.",
    },
    verificationNote:
      "The Aer Lingus carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Measure the under-seat bag before booking Saver; if you need a 10 kg cabin bag, compare the add-on against Plus, Advantage, or AerSpace.",
      "Buy checked baggage before the airport when possible. The 20 kg and 25 kg bag ranges depend on route, season, and purchase timing.",
      "Do not assume paid seat selection is necessary if a random check-in seat is acceptable.",
      "Avoid Saver if you may need changes or refunds; Saver is the restrictive fare path.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=aer-lingus&weight=21&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=16&depth=9", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Saver",
        details:
          "Saver includes the small under-seat item, while the 10 kg cabin bag and standard seat selection can become paid decisions.",
      },
      {
        name: "Plus / Advantage / AerSpace",
        details:
          "The 10 kg cabin bag is included with these fare paths, so compare the bundle against separate add-ons.",
      },
      {
        name: "Checked-bag add-ons",
        details:
          "The 20 kg and 25 kg bag products are priced by route, season, and purchase timing rather than one universal first-bag amount.",
      },
      {
        name: "Flexibility",
        details:
          "Saver changes are fee-based plus fare difference, while higher fare families allow changes with fewer restrictions.",
      },
    ],
    scenarios: [
      {
        title: "Saver with only a small bag",
        details:
          "This is the cleanest cheap path: one 33 x 25 x 20 cm item under the seat and no larger cabin bag.",
      },
      {
        title: "Adding a 10 kg cabin bag",
        details:
          "The 10 kg cabin bag has a EUR 6.99 to EUR 35.99 range and can also be bundled with higher fares.",
      },
      {
        title: "Checking a 20 kg bag",
        details:
          "The 20 kg checked bag has a EUR 14.99 to EUR 59.99 range that varies by route, season, and purchase timing.",
      },
      {
        title: "Going over purchased weight",
        details:
          "Excess baggage is charged at EUR 12 per additional kg at the airport.",
      },
    ],
    exceptions: [
      "Saver refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "Unaccompanied-minor service depends on route and age, so this page does not show one universal service fee.",
      "No Aer Lingus co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/easyjet", label: "easyJet" },
      { href: "/airlines/british-airways", label: "British Airways" },
      { href: "/airlines/tap-air-portugal", label: "TAP Air Portugal" },
    ],
  },
  aeromexico: {
    intro: {
      carryOn:
        "Aeromexico includes one cabin bag and one personal item, but the weight and size limits depend on cabin and fare family.",
      personalItem:
        "The personal item is included alongside the main cabin bag; there is no separate personal-item fee shown here.",
      checkedBag:
        "Aeromexico checked baggage is fare- and route-based. Classic, AM Plus, Premier, and some international fares include baggage, while Basic fares or excess allowance trigger paid checked-bag pricing by route and purchase timing.",
      restrictions:
        "The main pressure points are Basic checked baggage, airport excess baggage, seat-selection rules by fare family, and Basic fare change/cancellation restrictions.",
    },
    verificationNote:
      "The Aeromexico carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not compare Basic against Classic or AM Plus by base fare alone if you need a checked bag.",
      "Buy baggage before the airport when the route allows it because paid checked-bag pricing depends on route and purchase timing.",
      "Keep bags within the standard weight and size limits; overweight and oversize charges are airport-handled and route-dependent.",
      "Check fare-family restrictions before booking Basic if there is any chance you may change or cancel.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=aeromexico&weight=51&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic",
        details:
          "Basic is the checked-bag and flexibility pressure point. Bag fees apply where baggage is not included, and Basic fares are generally the most restrictive.",
      },
      {
        name: "Classic / AM Plus / Premier",
        details:
          "These fare paths can include checked baggage, but the allowance still depends on route and fare family.",
      },
      {
        name: "Seats",
        details:
          "Seat selection fees depend on fare family, seat type, and timing; some fares include standard seat selection.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Fees depend on fare family and route, with fare differences also possible.",
      },
    ],
    scenarios: [
      {
        title: "Flying carry-on only",
        details:
          "One cabin bag and one personal item are included, but the cabin and fare family determine the actual limits.",
      },
      {
        title: "Booking Basic with a checked bag",
        details:
          "Checked-bag fees apply on Basic or when exceeding free allowance, with the price depending on route and purchase timing.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight fees apply when the bag exceeds the standard allowance, and bags above the maximum weight are not accepted.",
      },
      {
        title: "Choosing a seat",
        details:
          "Seat fees depend on fare family, seat type, and timing, so the price shown during booking is the useful number.",
      },
    ],
    exceptions: [
      "Unaccompanied-minor service is available only on select routes and ages.",
      "Some international fares include checked baggage even where Basic-style fares may not.",
      "No Aeromexico co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/copa", label: "Copa Airlines" },
    ],
  },
  "air-new-zealand": {
    intro: {
      carryOn:
        "Air New Zealand includes cabin baggage on Air New Zealand-operated flights: Economy shows one carry-on up to 7 kg plus one personal item, while Premium Economy and Business have higher allowances.",
      personalItem:
        "The personal item is included alongside the Economy carry-on allowance.",
      checkedBag:
        "Air New Zealand checked baggage is usually an included allowance on eligible fares, then paid additional baggage is priced by route and timing when you need more than the allowance.",
      restrictions:
        "The main risks are additional checked bags, airport overweight/oversize handling, seat options by fare family, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The Air New Zealand carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Treat the Economy 7 kg cabin-bag allowance as a real packing limit on Air New Zealand-operated flights.",
      "Buy additional baggage before the airport when needed because pricing depends on route and timing.",
      "Keep checked bags at or below 32 kg because bags over 32 kg must be shipped as cargo.",
      "Use included standard seat selection on eligible fares or wait for check-in when that is the better fit.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=air-new-zealand&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy includes one carry-on up to 7 kg plus one personal item. Checked-bag allowance depends on route, cabin, and fare family.",
      },
      {
        name: "Premium Economy / Business",
        details:
          "Premium cabins have higher cabin baggage allowances, but premium-cabin excess-baggage pricing is still route-based rather than one universal ladder.",
      },
      {
        name: "Additional baggage",
        details:
          "Additional checked baggage can be bought before travel or at the airport, with pricing based on route and timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seat selection is included on higher fare families, while preferred seats and change/cancellation fees depend on fare family and route.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with carry-on only",
        details:
          "The Economy cabin baseline is one carry-on up to 7 kg plus one personal item on Air New Zealand-operated flights.",
      },
      {
        title: "Adding one checked bag",
        details:
          "Additional baggage pricing depends on route and timing, so this page should not be read as one universal extra-bag fee.",
      },
      {
        title: "Checking a bag over 32 kg",
        details:
          "Bags over 32 kg must be shipped as cargo.",
      },
      {
        title: "Choosing extra legroom",
        details:
          "Preferred or extra-legroom seats are paid products whose prices vary by route and timing.",
      },
    ],
    exceptions: [
      "The carry-on guidance is limited to Air New Zealand-operated flights.",
      "Bags over 32 kg must be shipped as cargo.",
      "No Air New Zealand co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/qantas", label: "Qantas" },
      { href: "/airlines/virgin-australia", label: "Virgin Australia" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
    ],
  },
  qantas: {
    intro: {
      carryOn:
        "Qantas includes carry-on baggage, with size and weight limits applying.",
      personalItem:
        "There is no separate Qantas personal-item fee shown here; the practical question is whether the cabin baggage stays inside the size and weight limits.",
      checkedBag:
        "Qantas checked baggage depends on itinerary, cabin class, and frequent-flyer status. Domestic airport extra-bag and heavy-bag charges are separate from pre-purchased additional baggage, which is sold by route and weight increment.",
      restrictions:
        "The main risks are exceeding the included allowance, buying extra baggage at the airport, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The Qantas baggage and change/cancellation details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the itinerary, cabin, and frequent-flyer allowance before assuming how much checked baggage is included.",
      "Pre-purchase additional baggage where possible; Qantas has a separate airport charge for each extra domestic bag.",
      "Keep domestic bags at or below 23 kg to avoid the heavy-bag charge.",
      "Read the fare rules before changing or canceling because fees depend on route and fare type outside the domestic example shown here.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=qantas&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Included allowance",
        details:
          "The free checked-baggage allowance depends on itinerary, cabin class, and frequent-flyer status rather than one universal number.",
      },
      {
        name: "Domestic airport baggage",
        details:
          "Australian domestic airport excess baggage is AUD 150 for each extra checked bag beyond the allowance.",
      },
      {
        name: "Heavy bags",
        details:
          "The domestic heavy-bag charge is AUD 60 for each piece weighing over 23 kg.",
      },
      {
        name: "Changes and cancellations",
        details:
          "The domestic example is AUD 100, while broader change and cancellation rules depend on fare rules and route.",
      },
    ],
    scenarios: [
      {
        title: "Flying with carry-on only",
        details:
          "Qantas includes carry-on baggage, but the size and weight limits still matter at the airport.",
      },
      {
        title: "Checking an extra domestic bag at the airport",
        details:
          "The Australian domestic airport charge is AUD 150 for each extra checked bag beyond the allowance.",
      },
      {
        title: "Checking a heavy domestic bag",
        details:
          "The Australian domestic heavy-bag charge is AUD 60 for each piece over 23 kg.",
      },
      {
        title: "Changing a domestic Economy ticket",
        details:
          "Many domestic Economy and Premium Economy fares issued on or after July 30, 2025 show an AUD 100 change or cancellation fee, excluding fare difference.",
      },
    ],
    exceptions: [
      "Checked-baggage allowance varies by itinerary, cabin class, and frequent-flyer status.",
      "Some premium cabins may have no change fees or different change conditions.",
      "No Qantas co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-new-zealand", label: "Air New Zealand" },
      { href: "/airlines/virgin-australia", label: "Virgin Australia" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
    ],
  },
  "tap-air-portugal": {
    intro: {
      carryOn:
        "TAP hand baggage is included, but the quantity and weight depend on fare, cabin, and route. Treat the allowance shown for the ticket as controlling rather than assuming every TAP cabin has the same limit.",
      personalItem:
        "The personal-item allowance accompanies eligible hand baggage, but airport enforcement still turns on the published dimensions and weight for the itinerary.",
      checkedBag:
        "Discount can have no included checked bag. Classic, Plus, and premium fares include baggage by route, while a Discount bag or extra piece starts from €30 online and changes with route, channel, advance timing, and season.",
      restrictions:
        "TAP separates extra-piece, overweight, and oversize decisions. A bag that is both additional and outside 23 kg or 158 cm can cost more than one simple add-on, and high-season limits can affect acceptance.",
    },
    verificationNote:
      "TAP's Discount exclusions, included-bag fares, advance and seasonal pricing, heavy/large-bag treatment, status benefits, and sports rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Compare Discount plus the exact bag and seat you need against Classic before choosing the lower headline fare.",
      "Buy an extra bag online and early when possible; the €30 figure is only a starting point, not a universal TAP bag price.",
      "Keep each piece at or below 23 kg and 158 cm because TAP prices extra, heavy, and large conditions separately.",
      "Confirm high-season and route acceptance before relying on extra baggage, especially for a heavy, large, or sports item.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=tap-air-portugal&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=16&depth=8", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Discount: price the missing pieces",
        details:
          "Checked baggage and standard seat choice can cost extra, and refunds are generally unavailable outside qualifying circumstances. Its value depends on the finished trip price.",
      },
      {
        name: "Classic / Plus / premium",
        details:
          "These paths include checked baggage and standard seat selection, but the number and weight of pieces still depend on fare, route, cabin, and status.",
      },
      {
        name: "Extra bag from €30 online",
        details:
          "This is an entry price. Channel, advance purchase, date, origin, destination, and high season determine the actual amount and availability.",
      },
      {
        name: "Miles&Go and sports equipment",
        details:
          "Miles&Go Gold can add baggage on eligible TAP-operated travel. Sports equipment counts within allowance only when fare, destination, status, 32 kg, and 158 cm conditions align.",
      },
    ],
    scenarios: [
      {
        title: "Discount needs a bag and selected seat",
        details:
          "Add TAP's itinerary-specific bag and Discount seat prices, then compare that total with Classic rather than relying on the headline gap.",
      },
      {
        title: "Flying carry-on only",
        details:
          "Economy generally includes one cabin bag plus a personal item, but fare, cabin, and weight limits still apply.",
      },
      {
        title: "Checking a 24 kg bag",
        details:
          "The 23–32 kg overweight charge is route- and season-priced. If the bag is also extra or oversized, do not assume one charge covers every condition.",
      },
      {
        title: "Taking sports equipment in high season",
        details:
          "Verify space and acceptance before travel. A piece within 32 kg and 158 cm may use the allowance, but larger or extra gear follows separate route and channel pricing.",
      },
    ],
    exceptions: [
      "High-season restrictions can limit excess-baggage acceptance even when a price is published.",
      "Infant and child checked allowance follows the fare; Discount can exclude a checked piece for them too.",
      "Miles&Go and sports benefits require the fare, destination, operating carrier, status, and baggage limits to align.",
    ],
    comparisonLinks: [
      { href: "/airlines/aer-lingus", label: "Aer Lingus" },
      { href: "/airlines/british-airways", label: "British Airways" },
      { href: "/airlines/air-france", label: "Air France" },
      { href: "/airlines/iberia", label: "Iberia" },
    ],
  },
  avianca: {
    intro: {
      carryOn:
        "Avianca's cheapest baggage trap is Basic fare cabin baggage. Basic includes a personal item only, while a full carry-on bag is purchased separately and priced by route and timing.",
      personalItem:
        "Basic still has a personal-item path, but that is not the same as a normal overhead carry-on. If the bag needs the bin, price the carry-on add-on before booking.",
      checkedBag:
        "Avianca checked baggage is fare- and route-based. Classic and Flex fares include checked baggage, while Basic checked baggage is paid and varies by route, bag weight, and timing.",
      restrictions:
        "The main risk is stacking Basic add-ons: carry-on, checked baggage, seat selection, and change/cancellation rules can all move the final price away from the headline fare.",
    },
    verificationNote:
      "The Avianca carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not book Basic unless a personal item is enough or the carry-on add-on still leaves Basic cheaper than the next fare.",
      "Compare Basic against Classic or Flex when checking a bag; checked-bag pricing depends on route, bag weight, and purchase timing.",
      "Keep checked bags within the allowance because overweight and oversize charges are airport-handled and route-based.",
      "Check fare-family rules before buying if plans may change; change and cancellation costs depend on fare family and route.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=avianca&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic",
        details:
          "Basic is the personal-item-only path. Carry-on and checked baggage are paid decisions whose prices depend on route and timing.",
      },
      {
        name: "Classic / Flex",
        details:
          "These fare families include checked baggage, but the allowance still varies by route and cabin.",
      },
      {
        name: "Seats",
        details:
          "Standard seats are included on eligible higher fare families, while preferred and extra-legroom seats are priced by route and timing.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Change and cancellation fees depend on fare family and route, with fare difference possible.",
      },
    ],
    scenarios: [
      {
        title: "Booking Basic with a roller bag",
        details:
          "Basic includes a personal item only, so the overhead carry-on must be priced as an add-on.",
      },
      {
        title: "Checking a bag on Basic",
        details:
          "Checked baggage is not included on Basic. The fee depends on route, bag weight, and whether it is bought before the airport.",
      },
      {
        title: "Flying Classic or Flex",
        details:
          "Checked baggage is included on eligible Classic and Flex fares, making them worth comparing whenever a bag is part of the trip.",
      },
      {
        title: "Taking an overweight bag",
        details:
          "Overweight baggage is airport-priced by route for bags above the allowance and up to 32 kg.",
      },
    ],
    exceptions: [
      "The carry-on guidance is for Avianca-operated flights.",
      "Oversize acceptance depends on route and aircraft, so oversized items should be checked against the operating flight.",
      "No Avianca co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/latam", label: "LATAM Airlines" },
      { href: "/airlines/copa", label: "Copa Airlines" },
      { href: "/airlines/aeromexico", label: "Aeromexico" },
      { href: "/airlines/american", label: "American Airlines" },
    ],
  },
  copa: {
    intro: {
      carryOn:
        "Copa includes one carry-on and one personal item on Copa-operated flights, but allowance details still vary by fare family.",
      personalItem:
        "The personal item is included alongside the carry-on; there is no separate personal-item fee shown here.",
      checkedBag:
        "Copa checked baggage depends on fare family and route. Classic and Full fares include checked baggage, while Basic checked baggage is paid and varies by route, bag weight, and purchase timing.",
      restrictions:
        "The main Copa fee risk is booking Basic for a trip that really needs a checked bag, preferred seat, or flexible change rules.",
    },
    verificationNote:
      "The Copa carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "If you need checked baggage, compare Basic against Classic or Full instead of looking only at the base fare.",
      "Buy baggage before the airport when possible because Basic checked-bag pricing depends on route, weight, and timing.",
      "Keep checked bags within the allowance; overweight and oversize charges are airport-handled and route-dependent.",
      "Use included standard seat selection on eligible fares where it solves the seat issue without buying a preferred seat.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=copa&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic",
        details:
          "Basic is the checked-bag pressure point: checked baggage is not included, and prices vary by route, baggage weight, and timing.",
      },
      {
        name: "Classic / Full",
        details:
          "These fare families include checked baggage, though the allowance varies by route and fare family.",
      },
      {
        name: "Preferred seats",
        details:
          "Preferred seats are paid by route and timing unless the fare family includes standard selection or another eligibility applies.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Fees depend on fare family and route, with fare difference possible.",
      },
    ],
    scenarios: [
      {
        title: "Flying Basic with no checked bag",
        details:
          "The fare can stay clean if the included carry-on and personal item are enough and no preferred seat is needed.",
      },
      {
        title: "Adding a checked bag to Basic",
        details:
          "Checked baggage is paid on Basic and depends on route, bag weight, and purchase timing.",
      },
      {
        title: "Checking a heavy bag",
        details:
          "Overweight baggage is airport-priced by route for bags above the allowance and up to 32 kg.",
      },
      {
        title: "Choosing a preferred seat",
        details:
          "Preferred-seat pricing varies by route and timing, so the booking flow is the meaningful price source.",
      },
    ],
    exceptions: [
      "The carry-on guidance applies to Copa-operated flights.",
      "Oversize acceptance depends on route and aircraft.",
      "No Copa co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/avianca", label: "Avianca" },
      { href: "/airlines/latam", label: "LATAM Airlines" },
      { href: "/airlines/aeromexico", label: "Aeromexico" },
      { href: "/airlines/united", label: "United Airlines" },
    ],
  },
  iberia: {
    intro: {
      carryOn:
        "Iberia includes a cabin bag plus a personal item, but the permitted cabin weight depends on cabin and operating carrier. Check the operator when an Iberia flight number is attached to a partner aircraft.",
      personalItem:
        "The personal item is included. The practical risk is not a separate personal-item charge but arriving with a cabin bag that exceeds the weight or dimensions applied by the operating carrier.",
      checkedBag:
        "Basic is Iberia's main zero-checked-bag risk. Standard, Flex, and premium fares generally include baggage; extra bags are priced for the itinerary and are usually simpler to add online than at the airport.",
      restrictions:
        "A cheap Basic fare can stack a checked-bag charge, paid seat choice, and restrictive refund terms. Standard checked pieces are generally limited to 23 kg and 158 cm, with 32 kg as the hard per-piece ceiling.",
    },
    verificationNote:
      "Iberia's fare-family baggage inclusions, itinerary-priced extra bags, seat rules, status benefits, irregular-baggage treatment, and 32 kg ceiling were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Price Basic with the bag and seat you will actually select, then compare that total with Standard rather than comparing headline fares.",
      "Add baggage online before travel when possible; Iberia prices extra pieces by itinerary and airport purchase is the least controlled option.",
      "Keep checked bags at or below 23 kg and 158 cm to avoid airport overweight or oversize treatment.",
      "Count a status bag only on an eligible Iberia Group-operated flight; do not assume an oneworld flight number makes the benefit apply on a partner operator.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=iberia&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=16&depth=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic: calculate the finished price",
        details:
          "Basic can exclude checked baggage and standard seat choice. It is only the cheaper decision when the required add-ons do not overtake the next fare family, and refunds are tightly restricted.",
      },
      {
        name: "Standard / Flex",
        details:
          "These fares generally include checked baggage and standard seat selection. Confirm the exact allowance on the itinerary because route, cabin, and operator still control the final rule.",
      },
      {
        name: "Iberia Group and status benefits",
        details:
          "Eligible Iberia Club Gold and oneworld Sapphire-or-higher travelers may add a 23 kg piece when the base allowance is zero or one, but the published benefit is tied to Iberia Group operation.",
      },
      {
        name: "Irregular and sports baggage",
        details:
          "An irregular-shaped piece can attract route-specific treatment even when its weight is acceptable. Certain Iberia Club sports benefits are tier-specific and should not be assumed from oneworld status alone.",
      },
    ],
    scenarios: [
      {
        title: "Basic needs one checked bag and a chosen seat",
        details:
          "Add Iberia's itinerary-specific bag price and the displayed seat price before comparing the fare. The Basic headline is not the trip total.",
      },
      {
        title: "Basic and Standard are close in price",
        details:
          "If Standard includes the bag and standard seat you need, the higher fare can be the cheaper and more flexible purchase after add-ons.",
      },
      {
        title: "Checking a 24 kg bag",
        details:
          "Overweight treatment applies above 23 kg and up to 32 kg; bags over 32 kg are not accepted.",
      },
      {
        title: "The flight is partner-operated",
        details:
          "Use the operating carrier's cabin and checked-bag rules. Do not transfer Iberia's allowance or status benefit automatically to the partner flight.",
      },
    ],
    exceptions: [
      "Bags over 32 kg are not accepted as checked baggage.",
      "Irregular-shaped pieces can receive a route-specific charge even when they remain within the normal weight ceiling.",
      "The published sports-equipment benefit is limited to eligible Iberia Club tiers and is not a general oneworld-only benefit.",
      "Infant allowance has route exceptions, including separate published treatment for Bolivia; verify the itinerary rather than applying the general rule universally.",
    ],
    comparisonLinks: [
      { href: "/airlines/tap-air-portugal", label: "TAP Air Portugal" },
      { href: "/airlines/british-airways", label: "British Airways" },
      { href: "/airlines/air-france", label: "Air France" },
      { href: "/airlines/aer-lingus", label: "Aer Lingus" },
    ],
  },
  latam: {
    intro: {
      carryOn:
        "LATAM's cheapest fare trap is Light: Light includes a personal item, while other fares include a carry-on bag up to 12 kg.",
      personalItem:
        "Light can work for a very small-bag trip, but it is not the same as having a normal carry-on allowance.",
      checkedBag:
        "LATAM checked baggage is fare- and route-based. Plus, Top, and Premium cabins include checked baggage, while Light fares or excess allowance trigger paid checked-bag pricing by route, fare family, and timing.",
      restrictions:
        "The main risks are Light fare baggage, Light seat selection, airport overweight/oversize handling, and restrictive change/cancellation treatment.",
    },
    verificationNote:
      "The LATAM carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not book Light unless the personal-item-only allowance is enough or paid baggage still leaves Light cheaper.",
      "Compare Light against Plus or Top when a checked bag is likely, because eligible higher fares include baggage.",
      "Keep checked bags at or below 23 kg and 158 cm to avoid airport overweight or oversize treatment.",
      "Check the country and route rules for unaccompanied-minor travel because availability and fees vary by country and route.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=latam&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Light",
        details:
          "Light includes a personal item. Checked bags and seat selection can become paid decisions based on route, fare family, and timing.",
      },
      {
        name: "Plus / Top",
        details:
          "These fare families include checked baggage and standard seat selection, though allowance varies by route and fare family.",
      },
      {
        name: "Premium cabins",
        details:
          "Premium cabins are included-allowance paths in the data, but excess baggage remains separate if the allowance is exceeded.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Fees depend on fare family and route, with Light generally the most restrictive.",
      },
    ],
    scenarios: [
      {
        title: "Flying Light with a personal item",
        details:
          "This is the cheapest clean path if the bag fits the personal-item allowance and no seat selection is needed.",
      },
      {
        title: "Adding a checked bag to Light",
        details:
          "Checked-bag fees apply on Light or when exceeding allowance, with the price based on route, fare family, and purchase timing.",
      },
      {
        title: "Taking a 12 kg carry-on",
        details:
          "Other fares include one carry-on bag up to 12 kg, while Light is the personal-item-only path.",
      },
      {
        title: "Checking a bag over 23 kg",
        details:
          "Overweight treatment applies above 23 kg and up to 32 kg; bags over 32 kg are not accepted.",
      },
    ],
    exceptions: [
      "Unaccompanied-minor service is available only on select routes and ages and varies by country and route.",
      "Bags over 32 kg are not accepted as checked baggage.",
      "No LATAM co-branded-card baggage waiver is shown here.",
    ],
    comparisonLinks: [
      { href: "/airlines/avianca", label: "Avianca" },
      { href: "/airlines/copa", label: "Copa Airlines" },
      { href: "/airlines/aeromexico", label: "Aeromexico" },
      { href: "/airlines/american", label: "American Airlines" },
    ],
  },
  westjet: {
    intro: {
      carryOn:
        "WestJet includes one carry-on and one personal item, but checked-bag and seat costs depend on the fare bundle.",
      personalItem:
        "The personal item is included with the carry-on allowance. Aircraft can affect how tight the cabin space feels, so soft bags are safer on smaller planes.",
      checkedBag:
        "WestJet separates included checked baggage from paid Econo baggage. EconoFlex, Premium, and Business include the first checked bag, while Econo shows CAD 35 for the first bag and CAD 50 for the second on the domestic and transborder examples available here.",
      restrictions:
        "The main WestJet fee trap is Econo: first checked bag, second checked bag, advance seat selection, and change fees can all matter.",
    },
    verificationNote:
      "WestJet carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Compare Econo against EconoFlex when checking a bag; EconoFlex includes the first checked bag.",
      "Keep checked bags at or below 23 kg and 158 cm to avoid the CAD 100 to CAD 150 overweight or oversize range.",
      "Skip advance seat selection on Econo only if seat choice is not important.",
      "Avoid restrictive Econo bundles when plans may change; EconoFlex and higher fares show no change fee, though fare difference still applies.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=westjet&travelers=2&bags=1&directions=2&trips=1&pay=yes", label: "Checked bag calculator" },
      { href: "/tools/excess-baggage-calculator?airline=westjet&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Econo",
        details:
          "Econo is the paid-bag and paid-seat path: CAD 35 first bag, CAD 50 second bag, and paid advance seat selection on applicable routes.",
      },
      {
        name: "EconoFlex",
        details:
          "EconoFlex includes the first checked bag and standard seat selection and has no change fee, though fare difference applies.",
      },
      {
        name: "Premium / Business",
        details:
          "Premium and Business are included-allowance paths for first checked bag and standard seat selection, with higher-bundle flexibility.",
      },
      {
        name: "Restrictive Econo bundles",
        details:
          "Refunds are not permitted on the most restrictive Econo bundles except for flight cancellation or qualifying circumstances.",
      },
    ],
    scenarios: [
      {
        title: "Econo with one checked bag",
        details:
          "The domestic and transborder row shows CAD 35 each way for the first checked bag on Econo fares.",
      },
      {
        title: "Two travelers checking one bag each",
        details:
          "That first-bag math can make EconoFlex worth comparing before booking, especially round trip.",
      },
      {
        title: "Checking a 24 kg bag",
        details:
          "The overweight row applies from 23 to 32 kg and shows a CAD 100 to CAD 150 range.",
      },
      {
        title: "Choosing an Econo seat early",
        details:
          "Advance seat selection on Econo shows a CAD 10 to CAD 60 range, while preferred or extra-legroom seats show a separate CAD 30 to CAD 199 range.",
      },
    ],
    exceptions: [
      "Checked-bag fees may vary by route outside the domestic and transborder examples shown here.",
      "Bags over 32 kg are not accepted under the overweight row.",
      "No WestJet co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-canada", label: "Air Canada" },
      { href: "/airlines/alaska", label: "Alaska Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/united", label: "United Airlines" },
    ],
  },
  "virgin-australia": {
    intro: {
      carryOn:
        "Virgin Australia includes carry-on baggage, but the useful detail is not just whether a bag is allowed. The allowance and weight limits depend on fare type and aircraft.",
      personalItem:
        "Virgin Australia does not list a separate personal-item charge here; the practical cabin-bag question is whether the full carry-on allowance fits the fare and aircraft.",
      checkedBag:
        "Virgin Australia separates Lite from the higher fare families. Choice, Flex, and Business include checked baggage, while Lite fares or extra bags use route- and timing-based paid baggage.",
      restrictions:
        "Lite is the fare to scrutinize: checked baggage, seat selection, and change/cancellation rules are the places where the cheap fare can become less useful.",
    },
    verificationNote:
      "Virgin Australia carry-on, checked-bag, excess-baggage, seat, and change/cancellation details were last verified on 2025-12-24.",
    avoidFees: [
      "Compare Lite against Choice before booking if you need a checked bag; Choice includes checked baggage.",
      "Buy checked baggage before the airport when possible because Lite and extra-bag pricing depends on route and timing.",
      "Keep checked bags within the standard allowance to avoid airport overweight or oversize handling.",
      "Avoid Lite when plans may change or seat choice matters, because Lite is the restrictive fare family.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=virgin-australia&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Lite",
        details:
          "Lite is the paid checked-bag and paid seat-selection path. It can work for light travel, but the bag and seat costs should be priced first.",
      },
      {
        name: "Choice / Flex",
        details:
          "Choice and Flex include checked baggage and standard seat selection, with allowance still affected by fare type and status.",
      },
      {
        name: "Business",
        details:
          "Business is an included-allowance path, but aircraft and fare rules still matter for carry-on and flexibility.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Change and cancellation fees depend on fare type, with Lite described as the most restrictive fare.",
      },
    ],
    scenarios: [
      {
        title: "Booking Lite with a checked bag",
        details:
          "Checked baggage fees apply on Lite or when exceeding allowance, with prices based on route and purchase timing.",
      },
      {
        title: "Booking Choice for a checked-bag trip",
        details:
          "Choice includes checked baggage, so it is the natural comparison against Lite when a bag is needed.",
      },
      {
        title: "Taking a borderline carry-on",
        details:
          "Carry-on allowance and weight limits depend on fare type and aircraft, so smaller aircraft can change how practical a bag feels.",
      },
      {
        title: "Changing plans after booking",
        details:
          "Lite is described as the most restrictive fare, while fees depend on fare type.",
      },
    ],
    exceptions: [
      "Checked-baggage allowance can vary by fare type and status.",
      "Carry-on allowance can vary by fare type and aircraft.",
      "No Virgin Australia co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/qantas", label: "Qantas" },
      { href: "/airlines/air-new-zealand", label: "Air New Zealand" },
      { href: "/airlines/jetstar", label: "Jetstar" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
    ],
  },
  "iberia-express": {
    intro: {
      carryOn:
        "Iberia Express includes a cabin bag and personal item on every fare. Aircraft storage and boarding conditions can still move a compliant cabin bag to the hold, but the central pricing decision is the checked-bag tier.",
      personalItem:
        "The personal item is included, so do not pay for a checked bag merely to replace a small under-seat item. Keep both cabin pieces inside the published limits.",
      checkedBag:
        "Only the Express pack has no included checked luggage. Other packages may include a 23 kg piece, while Express and additional-bag customers can buy 15, 23, or 32 kg tiers priced by route, timing, and channel.",
      restrictions:
        "Buying too little weight is a false economy: exceeding the purchased tier triggers a €60 airport charge. Basic also exposes travelers to paid seat selection and restrictive refund terms.",
    },
    verificationNote:
      "Iberia Express's fare inclusions, 15/23/32 kg bag products, €60 excess-weight charge, special-baggage rules, seats, and child-travel exceptions were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Compare the Express pack plus the exact bag tier you need against a package that already includes 23 kg.",
      "Choose 15, 23, or 32 kg from a realistic packed weight; a bag above its purchased tier can cost €60 at the airport.",
      "Add baggage online or during online check-in when eligible instead of leaving an itinerary-priced purchase to the airport.",
      "Reserve sports, musical, or bulky equipment at least 24 hours before check-in because space and aircraft limits matter.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=iberia-express&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=16&depth=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Express pack",
        details:
          "This is the no-checked-bag package. Price the required 15, 23, or 32 kg add-on before deciding it is cheaper than an included-bag fare.",
      },
      {
        name: "Included-bag packages",
        details:
          "Packages other than Express can include a 23 kg bag depending on the fare and route. Comfort and Business also include standard seat selection.",
      },
      {
        name: "15 / 23 / 32 kg add-ons",
        details:
          "These are different purchased weight ceilings, not interchangeable bag labels. Route, purchase timing, and channel determine the displayed price.",
      },
      {
        name: "Status and special baggage",
        details:
          "Eligible Iberia Plus and oneworld status can add ordinary baggage, but sports-equipment exceptions are narrower and apply only to specified Iberia Plus tiers.",
      },
    ],
    scenarios: [
      {
        title: "Express fare with an 18 kg suitcase",
        details:
          "Buy the 23 kg tier rather than 15 kg. Exceeding the purchased tier can trigger the published €60 airport excess-weight charge.",
      },
      {
        title: "Flying cabin-bag only",
        details:
          "One cabin bag and one personal item are included, with Economy generally capped at 10 kg.",
      },
      {
        title: "A 24 kg bag on a 23 kg allowance",
        details:
          "Repack below 23 kg or buy the 32 kg tier when available; otherwise the €60 excess-weight charge applies at the airport.",
      },
      {
        title: "Traveling with sports equipment",
        details:
          "Reserve space at least 24 hours before check-in. Published charges vary by item, and status exceptions do not extend equally to every oneworld elite.",
      },
    ],
    exceptions: [
      "Iberia Express does not offer an unaccompanied-minor service.",
      "Ordinary checked bags are capped at 32 kg; the published €150 treatment concerns certain bulky or heavy items in a separate 32–45 kg framework, not a normal 45 kg suitcase allowance.",
      "Children and infants receive the adult ticket's allowance plus one collapsible stroller under the published exception.",
    ],
    comparisonLinks: [
      { href: "/airlines/iberia", label: "Iberia" },
      { href: "/airlines/vueling", label: "Vueling" },
      { href: "/airlines/tap-air-portugal", label: "TAP Air Portugal" },
      { href: "/airlines/air-france", label: "Air France" },
    ],
  },
  norwegian: {
    intro: {
      carryOn:
        "Norwegian's LowFare path includes only a small under-seat personal item. LowFare+ and Flex include a 10 kg cabin bag, so the first decision is whether the cheapest fare actually covers your bag.",
      personalItem:
        "The included LowFare item is 30 x 20 x 38 cm and must fit under the seat. That is a smaller allowance than a normal overhead cabin bag.",
      checkedBag:
        "Norwegian checked baggage is bought as an add-on. The 20 kg and 23 kg bag prices vary by route, season, and purchase timing, while airport excess baggage is charged per additional kg.",
      restrictions:
        "The main Norwegian fee traps are LowFare cabin baggage, paid checked bags, seat selection, and LowFare refund limits.",
    },
    verificationNote:
      "Norwegian carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Do not book LowFare unless the 30 x 20 x 38 cm under-seat item is enough or the fare still wins after adding a bag.",
      "Compare LowFare+ or Flex when you need a 10 kg cabin bag, because those fare paths include it.",
      "Buy checked baggage before the airport when needed; 20 kg and 23 kg bag prices vary by route, season, and timing.",
      "Avoid LowFare if refunds matter, because the refund row says tickets are not refundable except for flight cancellation or qualifying circumstances.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=norwegian&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=16&depth=9", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "LowFare",
        details:
          "LowFare includes only the small under-seat item. A checked bag, selected seat, or change can turn it into a different trip cost.",
      },
      {
        name: "LowFare+",
        details:
          "LowFare+ includes a 10 kg cabin bag and allows changes with fewer restrictions than LowFare.",
      },
      {
        name: "Flex",
        details:
          "Flex includes the 10 kg cabin bag and is the less restrictive fare path in the change row.",
      },
      {
        name: "Checked-bag add-ons",
        details:
          "The 20 kg and 23 kg checked bags are paid add-ons whose prices vary by route, season, and purchase timing.",
      },
    ],
    scenarios: [
      {
        title: "Flying LowFare with only a small bag",
        details:
          "The included item is 30 x 20 x 38 cm and must fit under the seat in front.",
      },
      {
        title: "Needing an overhead cabin bag",
        details:
          "LowFare+ and Flex include a 10 kg cabin bag up to 55 x 40 x 23 cm.",
      },
      {
        title: "Checking a 20 kg bag",
        details:
          "The 20 kg checked bag has a EUR 9.90 to EUR 59.90 range based on route, season, and purchase timing.",
      },
      {
        title: "Going over purchased allowance",
        details:
          "Excess baggage is charged at EUR 12 per additional kg at the airport.",
      },
    ],
    exceptions: [
      "Norwegian does not offer an unaccompanied-minor service.",
      "Ticket refunds are not permitted on LowFare except for flight cancellation or qualifying circumstances.",
      "No Norwegian co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/easyjet", label: "easyJet" },
      { href: "/airlines/vueling", label: "Vueling" },
      { href: "/airlines/iberia-express", label: "Iberia Express" },
    ],
  },
  saudia: {
    intro: {
      carryOn:
        "Saudia includes cabin baggage on Saudia-operated flights. Economy shows one cabin bag up to 7 kg plus one personal item, while Business and First have higher allowances.",
      personalItem:
        "The personal item is included alongside the Economy cabin bag on Saudia-operated flights.",
      checkedBag:
        "Saudia is mainly an included-allowance airline, not a flat first-bag-fee airline. Checked baggage is included on most eligible fares, while additional baggage depends on route, baggage concept, and timing.",
      restrictions:
        "The key is the baggage concept: some itineraries price baggage by piece, while others use weight. Excess, overweight, and oversized baggage depend on that route-specific structure.",
    },
    verificationNote:
      "Saudia carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the itinerary uses a piece concept or weight concept before buying extra baggage.",
      "Keep Economy cabin baggage at or below 7 kg on Saudia-operated flights.",
      "Buy additional baggage before the airport when available because timing affects the paid extra-baggage path.",
      "Check fare-family rules before booking if plans may change; change and cancellation fees depend on fare family and route.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=saudia&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 7 kg plus one personal item on Saudia-operated flights. Checked-bag allowance depends on route, baggage concept, cabin, and fare family.",
      },
      {
        name: "Business / First",
        details:
          "Premium cabins have higher cabin baggage allowances, but excess baggage still depends on route and baggage concept.",
      },
      {
        name: "Additional baggage",
        details:
          "Additional checked baggage can be bought in advance or at the airport, with pricing based on route, baggage concept, and timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seat selection is included on eligible fare families, while lowest fare families and preferred seats can price by route and timing.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with carry-on only",
        details:
          "The Economy cabin allowance is one bag up to 7 kg plus one personal item on Saudia-operated flights.",
      },
      {
        title: "Adding extra baggage",
        details:
          "Additional baggage is not one universal fee; it depends on the route, whether the itinerary uses piece or weight rules, and when it is purchased.",
      },
      {
        title: "Checking a heavy bag",
        details:
          "Overweight baggage applies when the allowance is exceeded, with maximum single-bag weight shown as 32 kg.",
      },
      {
        title: "Choosing preferred seats",
        details:
          "Seat fees apply on lowest fare families and for preferred or extra-legroom seats, with pricing by route and timing.",
      },
    ],
    exceptions: [
      "The carry-on allowance applies to Saudia-operated flights.",
      "Checked-baggage allowance varies by route, cabin, fare family, and piece versus weight concept.",
      "No Saudia co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/emirates", label: "Emirates" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
      { href: "/airlines/turkish-airlines", label: "Turkish Airlines" },
      { href: "/airlines/air-india", label: "Air India" },
    ],
  },
  vueling: {
    intro: {
      carryOn:
        "Vueling Basic includes one small under-seat cabin bag. A larger 10 kg cabin bag is either bundled with TimeFlex, Optima, or Family fares, or bought as an add-on priced by route and timing.",
      personalItem:
        "The included Basic bag is 40 x 20 x 30 cm and must fit under the seat in front. That is the free path; an overhead cabin bag is a separate decision.",
      checkedBag:
        "Vueling checked baggage is purchased by weight allowance. The 15 kg, 20 kg, and 25 kg bag products each have their own route-, season-, and timing-based price range, and excess weight is charged per additional kg at the airport.",
      restrictions:
        "The main Vueling fee traps are Basic small-bag limits, paid large cabin bags, checked-bag timing, seat selection, and refund limits.",
    },
    verificationNote:
      "Vueling carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Measure the under-seat bag before booking Basic; if it needs the overhead bin, price the large cabin bag or a bundled fare.",
      "Buy checked baggage before the airport when needed because the 15 kg, 20 kg, and 25 kg bag ranges depend on route, season, and timing.",
      "Choose the lowest checked-bag weight that realistically works; buying too little can trigger the EUR 12 per-kg airport excess charge.",
      "Avoid relying on refunds; the refund row says tickets are not refundable except for flight cancellation or qualifying circumstances.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=vueling&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=22&width=16&depth=8", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic",
        details:
          "Basic includes the small 40 x 20 x 30 cm under-seat bag. A larger cabin bag, checked bag, or selected seat can change the trip cost.",
      },
      {
        name: "TimeFlex / Optima / Family",
        details:
          "These fare paths can include the large 10 kg cabin bag, so compare the bundle against buying the add-on separately.",
      },
      {
        name: "Checked-bag weights",
        details:
          "Vueling sells 15 kg, 20 kg, and 25 kg checked-bag products with separate ranges that vary by route, season, and purchase timing.",
      },
      {
        name: "Changes and refunds",
        details:
          "Flight changes are fee-based plus fare difference unless a fare such as TimeFlex gives fewer restrictions. Refunds are not permitted except for flight cancellation or qualifying circumstances.",
      },
    ],
    scenarios: [
      {
        title: "Flying Basic with only a small bag",
        details:
          "The free path is one 40 x 20 x 30 cm bag under the seat and no overhead cabin bag.",
      },
      {
        title: "Adding a large cabin bag",
        details:
          "The large cabin bag has a EUR 8 to EUR 75 range and can also be included with TimeFlex, Optima, or Family fares.",
      },
      {
        title: "Checking a 20 kg bag",
        details:
          "The 20 kg checked-bag row shows a EUR 14 to EUR 69 range based on route, season, and purchase timing.",
      },
      {
        title: "Going over purchased weight",
        details:
          "Excess baggage is charged at EUR 12 per additional kg at the airport.",
      },
    ],
    exceptions: [
      "Vueling does not offer an unaccompanied-minor service; passengers under 16 must travel with an adult.",
      "Ticket refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "No Vueling co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/iberia-express", label: "Iberia Express" },
      { href: "/airlines/iberia", label: "Iberia" },
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/easyjet", label: "easyJet" },
    ],
  },
  jetstar: {
    intro: {
      carryOn:
        "Jetstar's Starter fare includes cabin baggage up to 7 kg total. Higher fares may allow up to 14 kg, so the cheapest fare is only clean if the cabin bag is genuinely light.",
      personalItem:
        "The carry-on row is a combined cabin-baggage allowance rather than a separate personal-item fee row. Pack the personal item and cabin bag together under the allowed weight.",
      checkedBag:
        "Jetstar checked baggage is an add-on model. The 15 kg to 40 kg checked-bag options vary by weight selection, route, season, and purchase timing, while airport baggage is the expensive fallback.",
      restrictions:
        "The main Jetstar risk is solving bags too late: Starter fares, cabin-bag weight, checked-bag pre-purchase, seat selection, and Starter change rules all affect the final cost.",
    },
    verificationNote:
      "Jetstar carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Weigh the carry-on before travel. Starter includes up to 7 kg total cabin baggage, not a large no-questions-asked cabin allowance.",
      "Buy checked baggage before the airport when needed; airport baggage fees apply if no allowance was pre-purchased or the allowance is exceeded.",
      "Choose the checked-bag weight that realistically fits the trip, because the add-on price changes by weight, route, season, and timing.",
      "Avoid Starter if refunds or easy changes matter; the refund row says Starter refunds are not permitted except for flight cancellation or qualifying circumstances.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=jetstar&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Starter",
        details:
          "Starter is the lightest path: up to 7 kg total cabin baggage, paid checked baggage, paid seat selection, and fee-based changes plus fare difference.",
      },
      {
        name: "Starter Plus / Flex / Max",
        details:
          "These fares allow changes with fewer restrictions and may allow higher carry-on weight.",
      },
      {
        name: "Checked-bag weight options",
        details:
          "Checked baggage is bought as a weight allowance from 15 kg to 40 kg, with pricing based on weight selection, route, season, and purchase timing.",
      },
      {
        name: "Seats",
        details:
          "Starter standard seat selection is a paid option, while random seats can be assigned free at check-in if a seat is not purchased.",
      },
    ],
    scenarios: [
      {
        title: "Flying Starter with carry-on only",
        details:
          "The key number is 7 kg total cabin baggage. If the combined bags exceed that, the cheap fare can become a bag-fee problem.",
      },
      {
        title: "Adding checked baggage",
        details:
          "Checked baggage is sold in 15 kg to 40 kg options, and the price varies by weight, route, season, and timing.",
      },
      {
        title: "Arriving without pre-purchased baggage",
        details:
          "Airport baggage fees apply if no checked baggage was bought in advance or if the allowance is exceeded.",
      },
      {
        title: "Changing a Starter fare",
        details:
          "Changes are permitted for a fee plus fare difference, while higher fare families allow changes with fewer restrictions.",
      },
    ],
    exceptions: [
      "Jetstar does not offer an unaccompanied-minor service.",
      "Refunds are not permitted on Starter fares except for flight cancellation or qualifying circumstances.",
      "No Jetstar co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/qantas", label: "Qantas" },
      { href: "/airlines/virgin-australia", label: "Virgin Australia" },
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/scoot", label: "Scoot" },
    ],
  },
  scoot: {
    intro: {
      carryOn:
        "Scoot includes cabin baggage, with Economy and ScootPlus showing up to 10 kg total. The more important fee decision is checked baggage, which is not included by default on some fares.",
      personalItem:
        "Scoot does not list a separate personal-item charge here; the practical limit is the total carry-on allowance and size rules.",
      checkedBag:
        "Scoot checked baggage is usually bought in weight bundles. Pricing varies by route and timing, and airport handling is the fallback if the purchased allowance is not enough.",
      restrictions:
        "The main Scoot fee risks are checked-bag bundles, airport excess weight, sports equipment, paid seat selection, and limited cancellation flexibility.",
    },
    verificationNote:
      "Scoot carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Decide the checked-bag weight before booking or manage booking; fees vary by route and timing.",
      "Keep each checked bag at or below 32 kg, because a single checked bag must not exceed 32 kg.",
      "Pre-purchase sports equipment when needed; sports-equipment pricing depends on equipment type, route, and baggage bundle.",
      "Do not assume cancellation flexibility is included; cancellations are generally not permitted except where explicitly allowed.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=scoot&weight=33&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy / Scoot",
        details:
          "Carry-on is included up to the total allowance, while checked baggage may need to be bought as a weight bundle.",
      },
      {
        name: "ScootPlus",
        details:
          "ScootPlus is listed in the carry-on row, but checked-bag and seat details still depend on the fare bundle and route.",
      },
      {
        name: "Checked-bag bundles",
        details:
          "Checked baggage is bought in weight bundles, with prices based on route and timing rather than one flat first-bag fee.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and chargeable. Flight changes can require a fee plus fare difference, while cancellations are generally restricted.",
      },
    ],
    scenarios: [
      {
        title: "Flying with cabin baggage only",
        details:
          "Economy and ScootPlus show up to 10 kg total carry-on.",
      },
      {
        title: "Adding checked baggage",
        details:
          "Checked baggage is bought in weight bundles, with fees depending on route and timing.",
      },
      {
        title: "Packing a bag over 32 kg",
        details:
          "A single checked bag must not exceed 32 kg, and excess weight beyond the purchased allowance is charged at airport rates.",
      },
      {
        title: "Traveling with sports equipment",
        details:
          "Sports equipment must be pre-purchased and prices depend on equipment type, route, and selected baggage bundle.",
      },
    ],
    exceptions: [
      "Scoot does not offer an unaccompanied-minor service.",
      "Cancellations are generally not permitted except where explicitly allowed.",
      "No Scoot co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/cebu-pacific", label: "Cebu Pacific" },
      { href: "/airlines/jetstar", label: "Jetstar" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
    ],
  },
  airasia: {
    intro: {
      carryOn:
        "AirAsia includes one cabin bag and one personal item, but the combined carry-on weight is capped at 7 kg. That weight limit is the first bag check for a carry-on-only trip.",
      personalItem:
        "The personal item is included alongside the cabin bag, but both pieces share the 7 kg combined carry-on allowance.",
      checkedBag:
        "AirAsia checked baggage is not included by default. It is bought by weight tier, and prices depend on route and whether the baggage is purchased before the airport.",
      restrictions:
        "The main AirAsia risks are carry-on weight, pre-booked checked-bag tiers, sports equipment, paid seats, and fee-based changes.",
    },
    verificationNote:
      "AirAsia carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Weigh carry-on bags together; the cabin bag and personal item share a 7 kg combined limit.",
      "Pre-book checked baggage when needed because airport purchase is not the cheap path.",
      "Choose the right weight tier before travel; checked-bag pricing depends on 15 kg, 20 kg, 25 kg, 30 kg, or 40 kg tiers and route.",
      "Pre-book sports equipment if needed; fees depend on equipment type and route.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=airasia&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Base carry-on allowance",
        details:
          "AirAsia includes one cabin bag and one personal item, with combined weight not exceeding 7 kg.",
      },
      {
        name: "Checked-bag tiers",
        details:
          "Checked baggage is not included by default and is bought in weight tiers such as 15 kg, 20 kg, 25 kg, 30 kg, and 40 kg.",
      },
      {
        name: "Sports equipment",
        details:
          "Sports equipment must be pre-booked and pricing depends on equipment type and route.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and chargeable. Flight changes can require a fee plus fare difference, while cancellations are generally limited.",
      },
    ],
    scenarios: [
      {
        title: "Flying carry-on only",
        details:
          "The practical limit is 7 kg total across the cabin bag and personal item.",
      },
      {
        title: "Buying a 20 kg checked-bag tier",
        details:
          "Checked baggage pricing depends on the selected weight tier and route, and pre-booking is cheaper than airport purchase.",
      },
      {
        title: "Needing more checked-bag weight",
        details:
          "A single checked bag may not exceed 32 kg, and excess weight should be purchased in advance as additional baggage weight.",
      },
      {
        title: "Changing a flight",
        details:
          "Flight changes are permitted with a fee plus fare difference.",
      },
    ],
    exceptions: [
      "AirAsia does not offer an unaccompanied-minor service.",
      "Cancellations are generally not permitted except for specific fare products or add-ons.",
      "No AirAsia co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/scoot", label: "Scoot" },
      { href: "/airlines/cebu-pacific", label: "Cebu Pacific" },
      { href: "/airlines/jetstar", label: "Jetstar" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
    ],
  },
  indigo: {
    intro: {
      carryOn:
        "IndiGo domestic flights include one cabin bag up to 7 kg plus one personal item. International allowances vary by route, so the exact itinerary matters.",
      personalItem:
        "The personal item is included with the cabin bag on domestic flights, but international routes can use different allowances.",
      checkedBag:
        "IndiGo includes checked baggage on most eligible fares, but the allowance varies by route and fare type. Additional baggage can be bought before travel or at the airport, with pricing based on route and timing.",
      restrictions:
        "The main IndiGo fee risks are route-specific baggage allowance, added baggage, airport overweight charges, paid seat selection, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "IndiGo carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check the exact route before packing; domestic and international allowances can differ.",
      "Buy additional baggage before the airport when needed because pricing depends on route and timing.",
      "Keep checked baggage within the included allowance to avoid airport overweight charges.",
      "Use free seat assignment at check-in if seat choice is not important.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=indigo&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Domestic India",
        details:
          "Domestic flights show one cabin bag up to 7 kg plus one personal item, with checked baggage included on most eligible fares.",
      },
      {
        name: "International routes",
        details:
          "International allowances vary by route, so the route is the useful baggage rule rather than one universal IndiGo allowance.",
      },
      {
        name: "Additional baggage",
        details:
          "Additional checked baggage can be bought before travel or at the airport, with pricing based on route and timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat selection varies by seat type and route. Change and cancellation fees depend on fare rules and timing before departure.",
      },
    ],
    scenarios: [
      {
        title: "Domestic carry-on trip",
        details:
          "The domestic row includes one cabin bag up to 7 kg plus one personal item.",
      },
      {
        title: "International itinerary",
        details:
          "International allowances vary by route, so check the route before applying the domestic allowance.",
      },
      {
        title: "Adding checked baggage",
        details:
          "Additional baggage pricing depends on route and timing, and can be purchased in advance or at the airport.",
      },
      {
        title: "Choosing a seat",
        details:
          "Advance seat selection fees vary by seat type and route, while free assignment is available at check-in.",
      },
    ],
    exceptions: [
      "IndiGo does not offer an unaccompanied-minor service.",
      "International carry-on and checked-bag allowances vary by route.",
      "No IndiGo co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/spicejet", label: "SpiceJet" },
      { href: "/airlines/vistara", label: "Vistara" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
    ],
  },
  "cebu-pacific": {
    intro: {
      carryOn:
        "Cebu Pacific includes up to 7 kg total cabin baggage. That weight limit is the first thing to check before assuming the trip can stay carry-on-only.",
      personalItem:
        "Cebu Pacific does not list a separate personal-item charge here; the practical issue is staying within the total cabin-baggage allowance.",
      checkedBag:
        "Cebu Pacific checked baggage is not included by default. It is bought by weight tier, with pricing based on 20 kg, 32 kg, or 40 kg options and route.",
      restrictions:
        "The main Cebu Pacific fee risks are cabin-bag weight, checked-bag weight tier, airport per-kilo excess charges, sports equipment, paid seats, and limited cancellation flexibility.",
    },
    verificationNote:
      "Cebu Pacific carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Weigh cabin baggage before travel; the cabin allowance is up to 7 kg total.",
      "Pre-purchase checked baggage when needed because checked baggage is not included by default.",
      "Choose the correct weight tier before travel; Cebu Pacific lists 20 kg, 32 kg, and 40 kg checked-bag options.",
      "Avoid exceeding the purchased allowance because extra weight is charged per kilo at airport rates.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=cebu-pacific&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Base carry-on allowance",
        details:
          "Cebu Pacific includes up to 7 kg total cabin baggage, so packing light is the cleanest fee-avoidance path.",
      },
      {
        name: "Checked-bag weight tiers",
        details:
          "Checked baggage is not included by default and is bought through 20 kg, 32 kg, or 40 kg weight tiers depending on route.",
      },
      {
        name: "Sports equipment",
        details:
          "Sports equipment must be pre-booked, with charges based on equipment type and route.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and chargeable. Flight changes can require a fee plus fare difference, while cancellations are generally restricted.",
      },
    ],
    scenarios: [
      {
        title: "Flying carry-on only",
        details:
          "The cleanest path is staying within the 7 kg total cabin-baggage allowance.",
      },
      {
        title: "Buying a 20 kg checked bag",
        details:
          "Checked baggage is not included by default, and the fee depends on the selected weight tier and route.",
      },
      {
        title: "Going over purchased allowance",
        details:
          "Checked baggage above the purchased allowance is charged per kilo at airport rates.",
      },
      {
        title: "Traveling with sports equipment",
        details:
          "Sports equipment must be pre-booked and charges depend on equipment type and route.",
      },
    ],
    exceptions: [
      "Cebu Pacific does not offer an unaccompanied-minor service.",
      "Cancellations are generally not permitted except where explicitly allowed.",
      "No Cebu Pacific co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/scoot", label: "Scoot" },
      { href: "/airlines/philippine-airlines", label: "Philippine Airlines" },
      { href: "/airlines/jetstar", label: "Jetstar" },
    ],
  },
  spicejet: {
    intro: {
      carryOn:
        "SpiceJet includes one carry-on piece up to 7 kg. The checked-bag question depends on route because domestic and international allowances are not the same.",
      personalItem:
        "SpiceJet does not list a separate personal-item charge here; the practical cabin-bag limit is one carry-on piece up to 7 kg.",
      checkedBag:
        "SpiceJet includes checked baggage on eligible fares, but allowance varies between domestic India and international routes. Excess baggage is charged when the free allowance is exceeded and depends on route and weight.",
      restrictions:
        "The main SpiceJet fee risks are excess baggage, airport overweight charges, sports equipment, paid seats, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "SpiceJet carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the trip is domestic India or international before relying on a checked-bag allowance.",
      "Keep cabin baggage at or below 7 kg.",
      "Buy or arrange excess baggage before the airport where available because excess charges depend on route and weight.",
      "Check fare rules before booking the lowest fare if plans may change.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=spicejet&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Domestic India",
        details:
          "Carry-on is limited to one piece up to 7 kg. Checked-bag allowance is included on eligible fares but differs from international routes.",
      },
      {
        name: "International routes",
        details:
          "International checked-bag allowance varies by route, so the route matters more than one universal SpiceJet baggage number.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage charges apply when the free allowance is exceeded, with fees based on route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and chargeable. Change and cancellation fees depend on fare rules and timing.",
      },
    ],
    scenarios: [
      {
        title: "Flying carry-on only",
        details:
          "The cleanest path is one carry-on piece up to 7 kg.",
      },
      {
        title: "Domestic versus international allowance",
        details:
          "Checked baggage is included on eligible fares, but allowance varies by domestic and international routes.",
      },
      {
        title: "Going over the checked allowance",
        details:
          "Excess baggage charges depend on route and weight, so this is not one flat extra-bag fee.",
      },
      {
        title: "Traveling with sports equipment",
        details:
          "Sports equipment is accepted as checked baggage, with charges depending on equipment type and route.",
      },
    ],
    exceptions: [
      "Unaccompanied-minor service is available only on select domestic routes and ages.",
      "Checked-baggage allowance varies by domestic and international route.",
      "No SpiceJet co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/indigo", label: "IndiGo" },
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/vistara", label: "Vistara" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
    ],
  },
  "vietjet-air": {
    intro: {
      carryOn:
        "VietJet includes one cabin bag up to 7 kg plus a small personal item. Checked baggage is the bigger cost decision because it is not included by default.",
      personalItem:
        "The personal item is included alongside the 7 kg cabin bag, but the cabin-bag weight limit still matters.",
      checkedBag:
        "VietJet checked baggage is bought in weight packages such as 20 kg, 30 kg, and 40 kg. Prices vary by route and timing, and excess weight is charged per kilogram at airport rates.",
      restrictions:
        "The main VietJet fee risks are checked-bag package selection, airport excess weight, sports equipment, paid seats, and change rules by fare terms.",
    },
    verificationNote:
      "VietJet Air carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Keep the cabin bag at or below 7 kg.",
      "Buy the right checked-bag package before travel; checked baggage is not included by default.",
      "Avoid airport excess weight when possible because extra weight is charged per kilogram at airport rates.",
      "Pre-purchase sports equipment when needed because fees depend on equipment type and route.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=vietjet-air&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Base carry-on allowance",
        details:
          "VietJet includes one cabin bag up to 7 kg plus a small personal item. That is the cleanest low-cost path.",
      },
      {
        name: "Checked-bag packages",
        details:
          "Checked baggage is not included by default and is bought in weight packages such as 20 kg, 30 kg, and 40 kg.",
      },
      {
        name: "Sports equipment",
        details:
          "Sports equipment requires advance purchase, with fees based on equipment type and route.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Flight changes may require a fee plus fare difference, and cancellation rules depend on fare terms.",
      },
    ],
    scenarios: [
      {
        title: "Flying carry-on only",
        details:
          "The cabin bag is capped at 7 kg, with an additional small personal item permitted.",
      },
      {
        title: "Buying a 20 kg baggage package",
        details:
          "Checked baggage is bought by package, with fees depending on route and purchase timing.",
      },
      {
        title: "Going over purchased weight",
        details:
          "Excess weight beyond the purchased allowance is charged per kilogram at airport rates.",
      },
      {
        title: "Changing a flight",
        details:
          "Flight changes may require a fee plus fare difference, while cancellation rules depend on fare terms.",
      },
    ],
    exceptions: [
      "VietJet does not offer an unaccompanied-minor service.",
      "A single checked bag must not exceed 32 kg.",
      "No VietJet co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/scoot", label: "Scoot" },
      { href: "/airlines/cebu-pacific", label: "Cebu Pacific" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
    ],
  },
  volaris: {
    intro: {
      carryOn:
        "Zero and Basic include only a personal item; Plus includes the overhead carry-on. A paid add-on, More Baggage combo, or qualifying INVEX benefit can change that result.",
      personalItem:
        "The personal item is the only cabin baggage included with Zero and Basic. Do not mistake Basic's checked-bag inclusion for overhead-bin access.",
      checkedBag:
        "Basic includes one 15 kg checked bag, while Plus includes one 25 kg checked bag. Separately purchased checked bags generally use a 25 kg limit, with prices varying by route, timing, and channel.",
      restrictions:
        "The trap is choosing by fare label: Basic suits a traveler checking a light bag but carrying nothing overhead; Plus better fits a traveler who needs both cabin and checked baggage.",
    },
    verificationNote:
      "Volaris's Zero, Basic, and Plus baggage inclusions, INVEX conditions, checked-bag limits, equipment rules, and Baby Combo were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Choose Zero only when the personal item is genuinely enough; every larger bag must be priced into the comparison.",
      "Use Basic when a 15 kg checked bag solves the trip but an overhead carry-on does not; otherwise compare Plus before buying separate add-ons.",
      "Buy additional baggage before the airport and choose enough weight because airport excess depends on the allowance purchased or included.",
      "Count an INVEX benefit only when the eligible card pays, the cardholder travels, booking is direct and non-group, and the flight is not a codeshare.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=volaris&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Zero",
        details:
          "Includes only a personal item. It is the cleanest low-price option only for travelers who need neither an overhead carry-on nor a checked bag.",
      },
      {
        name: "Basic",
        details:
          "Includes a personal item and one 15 kg checked bag, but no overhead carry-on. That unusual combination is useful only when it matches how you pack.",
      },
      {
        name: "Plus",
        details:
          "Includes the carry-on and one 25 kg checked bag. Compare its finished price with lower fares plus the exact baggage add-ons needed.",
      },
      {
        name: "INVEX and bundles",
        details:
          "More Baggage and eligible INVEX benefits can alter the allowance, but card, channel, traveler, booking-type, and codeshare restrictions make them conditional rather than automatic.",
      },
    ],
    scenarios: [
      {
        title: "Zero with only a personal item",
        details:
          "This is the lowest-bag path, but it only works if the personal item is enough.",
      },
      {
        title: "Basic with a 12 kg suitcase",
        details:
          "Basic can fit this trip if the suitcase is checked: its included bag is capped at 15 kg, while cabin baggage remains personal-item only.",
      },
      {
        title: "Needing both an overhead bag and checked suitcase",
        details:
          "Compare Plus, which includes both the carry-on and a 25 kg checked bag, against Zero or Basic plus separate add-ons.",
      },
      {
        title: "Replacing an added bag with sports gear",
        details:
          "Eligible equipment within standard limits may replace a purchased extra bag; larger gear moves into special-baggage dimensions and possible extra charges.",
      },
    ],
    exceptions: [
      "Volaris does not offer an unaccompanied-minor service.",
      "A checked bag can be accepted with paid excess up to an absolute 45 kg maximum, but the standard purchased-bag limit is lower.",
      "INVEX is not a blanket waiver: codeshares, group bookings, indirect channels, absent cardholders, or ineligible payment can defeat the benefit.",
      "Baby Combo is a separately priced seasonal add-on that includes a diaper bag up to 10 kg and one documented infant item.",
    ],
    comparisonLinks: [
      { href: "/airlines/viva-aerobus", label: "Viva Aerobus" },
      { href: "/airlines/aeromexico", label: "Aeromexico" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
    ],
  },
  "viva-aerobus": {
    intro: {
      carryOn:
        "Every Viva fare includes a personal item. Light and Extra add a 10 kg carry-on, while Smart raises the cabin allowance to 15 kg.",
      personalItem:
        "Zero is personal-item only. A lap infant does not automatically add a separate carry-on; the adult allowance or optional Baby Package controls the extra infant items.",
      checkedBag:
        "Zero and Light have no included checked bag, Extra includes 15 kg, and Smart includes 25 kg. Add-on prices still vary by route and purchase timing.",
      restrictions:
        "Do not treat Light, Extra, and Smart as progressively vague upgrades: they solve different weight, seat, and change needs, and the correct bundle can cost less than stacking add-ons.",
    },
    verificationNote:
      "Viva Aerobus's Zero, Light, Extra, and Smart allowances, Doters conditions, special-equipment limits, changes, and Baby Package were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Use Zero only when a personal item is enough; choose Light when the missing item is specifically a 10 kg overhead bag.",
      "Compare Extra's 15 kg checked allowance with Smart's 25 kg allowance before paying later for more weight.",
      "Choose Smart when its 15 kg cabin allowance, 25 kg checked bag, seat selection, and unlimited changes match the trip; fare difference can still apply to changes.",
      "Count Doters baggage or seat benefits only when the tier, fare bundle, and booking path qualify—Zero can be excluded.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=viva-aerobus&weight=24&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Zero",
        details:
          "Zero includes only a personal item and does not include checked baggage.",
      },
      {
        name: "Light",
        details:
          "Adds a 10 kg carry-on but no checked bag. It fits cabin-bag travelers who do not need Smart's heavier allowances or seat/change package.",
      },
      {
        name: "Extra",
        details:
          "Includes a 10 kg carry-on and 15 kg checked bag. Limited penalty-free changes apply, though fare difference can remain.",
      },
      {
        name: "Smart",
        details:
          "Raises cabin allowance to 15 kg, includes a 25 kg checked bag and regular/front-row seat selection, and permits unlimited changes subject to fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Flying Zero with a personal item",
        details:
          "This is the cheapest clean path only if the personal item allowance is enough.",
      },
      {
        title: "A 9 kg cabin bag and no checked luggage",
        details:
          "Light directly fits this packing pattern. Zero would require an add-on, while Extra or Smart may include benefits you do not need.",
      },
      {
        title: "A 20 kg checked suitcase",
        details:
          "Extra's 15 kg inclusion is too low; compare an Extra weight add-on with Smart's included 25 kg bag before booking.",
      },
      {
        title: "Plans may change more than once",
        details:
          "Smart includes unlimited changes, while Light and Extra provide limited penalty-free changes. Fare difference can still make any change expensive.",
      },
    ],
    exceptions: [
      "Viva Aerobus does not offer an unaccompanied-minor service.",
      "Sports and musical equipment can use a separate hard-case framework up to 32 kg and 319 cm; that is not the normal suitcase limit.",
      "Lap infants do not receive an independent carry-on allowance unless the Baby Package changes the included setup.",
      "Doters benefits are tier-, bundle-, and booking-dependent rather than a universal waiver.",
    ],
    comparisonLinks: [
      { href: "/airlines/volaris", label: "Volaris" },
      { href: "/airlines/aeromexico", label: "Aeromexico" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
    ],
  },
  jet2: {
    intro: {
      carryOn:
        "Jet2 includes both a small under-seat bag and a 10 kg cabin bag. The bigger fee decision is checked baggage, which is sold as 22 kg or 26 kg add-ons.",
      personalItem:
        "The small under-seat bag is included up to 40 x 30 x 15 cm. A separate 10 kg cabin bag is also included.",
      checkedBag:
        "Jet2 checked baggage is bought as a 22 kg or 26 kg allowance. Prices vary by route, season, and purchase timing, and excess baggage is charged per additional kg at the airport.",
      restrictions:
        "The main Jet2 fee risks are choosing the wrong checked-bag weight, paying excess weight at the airport, seat selection, and fee-based changes.",
    },
    verificationNote:
      "Jet2 carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Use the included cabin allowance when possible: a small under-seat bag plus one 10 kg cabin bag are shown as included.",
      "Buy checked baggage before travel when needed because 22 kg and 26 kg bag prices vary by route, season, and timing.",
      "Choose the checked-bag allowance realistically; excess baggage is charged per additional kg at the airport.",
      "Avoid relying on refunds; the refund row says tickets are not refundable except for flight cancellation or qualifying circumstances.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=jet2&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?height=22&width=18&depth=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Carry-on included",
        details:
          "Jet2 includes one small under-seat bag plus one cabin bag up to 10 kg.",
      },
      {
        name: "22 kg checked bag",
        details:
          "The 22 kg checked-bag add-on has a GBP 8 to GBP 60 range depending on route, season, and purchase timing.",
      },
      {
        name: "26 kg checked bag",
        details:
          "The 26 kg checked-bag add-on has a GBP 12 to GBP 75 range depending on route, season, and purchase timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seat selection can be free by random assignment at check-in, while flight changes are fee-based plus fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Flying carry-on only",
        details:
          "The carry-on allowance includes a small under-seat bag plus one 10 kg cabin bag.",
      },
      {
        title: "Checking a 22 kg bag",
        details:
          "The 22 kg checked-bag row shows a GBP 8 to GBP 60 range based on route, season, and timing.",
      },
      {
        title: "Going over purchased allowance",
        details:
          "Excess baggage is charged at GBP 12 per additional kg at the airport.",
      },
      {
        title: "Choosing seats",
        details:
          "Standard seat selection can be free by random assignment at check-in, while extra-legroom or front-row seats use a separate paid range.",
      },
    ],
    exceptions: [
      "Jet2 does not offer an unaccompanied-minor service.",
      "Ticket refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "No Jet2 co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/easyjet", label: "easyJet" },
      { href: "/airlines/norwegian", label: "Norwegian" },
      { href: "/airlines/vueling", label: "Vueling" },
    ],
  },
  "thai-airways": {
    intro: {
      carryOn:
        "Thai Airways includes a cabin bag. Economy is listed as one cabin bag up to 7 kg, while premium cabins have higher allowances.",
      personalItem:
        "The practical cabin-bag issue is weight and size compliance, not buying a basic fare add-on. Keep the cabin bag within the allowance, especially on international connections.",
      checkedBag:
        "Thai Airways usually works from an included checked-bag allowance, but the allowance is not one universal number. It depends on route, cabin, fare family, and whether the itinerary uses the piece concept or weight concept.",
      restrictions:
        "The main Thai Airways fee risks are buying the wrong fare for your baggage needs, crossing into excess baggage, overweight or oversize airport handling, paid seat selection, and fare-rule change penalties.",
    },
    verificationNote:
      "Thai Airways carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your itinerary uses piece concept or weight concept before assuming a checked-bag allowance.",
      "Use the included checked allowance when possible; extra baggage is priced from Thai Airways' excess-baggage rules rather than a single flat first-bag fee.",
      "Handle extra baggage before the airport when the itinerary allows it, because excess charges depend on route and baggage concept.",
      "Do not pay for seat selection unless the exact seat matters; eligible fares can receive a seat at check-in.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=thai-airways&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy includes a carry-on bag up to 7 kg. Checked-bag allowance depends on the ticketed route, fare family, and baggage concept.",
      },
      {
        name: "Premium cabins",
        details:
          "Business and First Class have higher cabin allowances, and checked-bag treatment generally depends on cabin and route.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Thai Airways can use either a piece-based or weight-based checked-bag model depending on the countries served and ticket rules.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat charges depend on route, fare family, and seat type. Change and cancellation costs are governed by the fare rules and can also require a fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Long-haul trip with one checked bag",
        details:
          "Start by checking the included allowance for the exact route and cabin. The fee question usually begins only when you exceed that allowance.",
      },
      {
        title: "Itinerary that switches baggage concepts",
        details:
          "Do not assume a weight allowance if the trip uses piece concept. The applicable model depends on the countries in the itinerary.",
      },
      {
        title: "Bringing a heavy checked bag",
        details:
          "Overweight charges are route- and baggage-concept based, so the safer move is keeping each bag within the limit before airport check-in.",
      },
      {
        title: "Choosing a seat early",
        details:
          "Paid seat selection may be worth it for a specific seat, but a seat can be assigned at check-in for eligible fares.",
      },
    ],
    exceptions: [
      "Partner-operated or codeshare flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "No Thai Airways co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/eva-air", label: "EVA Air" },
    ],
  },
  "philippine-airlines": {
    intro: {
      carryOn:
        "Philippine Airlines includes a cabin bag. Economy is listed as one cabin bag up to 7 kg plus one personal item.",
      personalItem:
        "A personal item is included with the Economy carry-on row. The risk is usually an overweight or oversize cabin bag rather than a paid carry-on add-on.",
      checkedBag:
        "Philippine Airlines generally starts from an included checked-bag allowance, but the allowance depends on route, cabin, fare family, and whether the itinerary uses piece or weight concept.",
      restrictions:
        "The main Philippine Airlines fee risks are exceeding the included allowance, buying extra baggage too late, airport overweight or oversize handling, paid seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "Philippine Airlines carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check the allowance for the exact route and cabin before packing, because Philippine Airlines uses route-specific baggage rules.",
      "If extra baggage is needed, compare advance purchase against airport handling where available; the data says timing can affect the price.",
      "Keep checked bags within the published weight and size limits so the airport counter does not reprice the trip as excess baggage.",
      "Skip advance seat selection when seat location is not important and an eligible fare can receive a seat at check-in.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=philippine-airlines&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 7 kg plus one personal item in the row shown here. Checked baggage depends on route, cabin, and fare family.",
      },
      {
        name: "Premium Economy / Business",
        details:
          "Higher cabins have higher cabin allowances in the data and may also have different checked-bag allowances.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Philippine Airlines baggage can be calculated by pieces or by total weight depending on the route.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat charges depend on route, fare family, and seat type. Change and cancellation costs come from the ticket's fare rules and may include a fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Flying to or from North America",
        details:
          "Check whether the trip uses a piece-based allowance. Do not assume the same checked-bag math as a regional route.",
      },
      {
        title: "Regional trip with one checked bag",
        details:
          "Start with the included allowance for that route and fare. Additional baggage is priced separately when you go beyond it.",
      },
      {
        title: "Adding baggage after booking",
        details:
          "The data says extra baggage can be bought in advance or at the airport, with price affected by route, baggage concept, and timing.",
      },
      {
        title: "Traveling with children",
        details:
          "Unaccompanied-minor service depends on eligible ages and routing restrictions, so it should be checked before booking.",
      },
    ],
    exceptions: [
      "Partner-operated and codeshare itineraries can use the operating carrier's baggage rules.",
      "Oversize acceptance depends on aircraft and airport handling limits.",
      "No Philippine Airlines co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/cebu-pacific", label: "Cebu Pacific" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
      { href: "/airlines/airasia", label: "AirAsia" },
    ],
  },
  vistara: {
    intro: {
      carryOn:
        "Vistara includes cabin baggage: Economy and Premium Economy up to 7 kg, and Business Class up to 10 kg.",
      personalItem:
        "The carry-on issue is staying within the cabin weight and size limits. This is not a personal-item-only fare model.",
      checkedBag:
        "Vistara checked baggage is included on eligible fares, but the allowance changes by cabin, fare family, and route. Excess baggage is charged separately when the free allowance is exceeded.",
      restrictions:
        "The main Vistara fee risks are exceeding the included checked allowance, airport overweight handling, paid preferred or extra-legroom seats, and restrictive fare-family change rules.",
    },
    verificationNote:
      "Vistara carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check the included checked allowance for the fare family and route before buying extras.",
      "Pre-purchase excess baggage where available if you know the bag will exceed the free allowance.",
      "Keep bags within the single-bag weight limits because overweight treatment is handled at the airport.",
      "Use standard included seats when seat location does not matter; preferred and extra-legroom seats are the paid category.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=vistara&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy / Premium Economy",
        details:
          "Both are listed with cabin baggage up to 7 kg, while checked allowance depends on fare family and route.",
      },
      {
        name: "Business Class",
        details:
          "Business Class is listed with a 10 kg cabin allowance and can have a different checked-bag allowance.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage is the paid category when the free checked allowance is exceeded. The charge depends on route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seats are included on most fares, while preferred or extra-legroom seats are charged separately. Change and cancellation costs depend on fare family and route.",
      },
    ],
    scenarios: [
      {
        title: "Domestic India trip with a checked bag",
        details:
          "The first step is checking the fare-family allowance. Extra cost begins when the bag exceeds that allowance.",
      },
      {
        title: "Packing near the cabin-bag limit",
        details:
          "Economy and Premium Economy are listed at 7 kg. A heavy cabin bag can become an airport problem even when carry-on is included.",
      },
      {
        title: "Choosing extra legroom",
        details:
          "Seat selection can be included for standard seats, but preferred and extra-legroom seats are a separate paid category.",
      },
      {
        title: "Buying the cheapest fare",
        details:
          "Lowest fares are the most restrictive in the change/cancellation row, so compare fare savings against flexibility needs.",
      },
    ],
    exceptions: [
      "Vistara service and policies may be affected by Air India group integration, so verify the operating carrier on the ticket.",
      "Unaccompanied-minor service is limited to selected routes and age groups.",
      "No Vistara co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/indigo", label: "IndiGo" },
      { href: "/airlines/spicejet", label: "SpiceJet" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
    ],
  },
  "jetstar-asia": {
    intro: {
      carryOn:
        "Jetstar Asia is an add-on model. Starter includes 7 kg of carry-on allowance, while higher fares may allow more.",
      personalItem:
        "The cabin limit is based on total carry-on weight. A second item can still be a problem if the combined allowance is exceeded.",
      checkedBag:
        "Checked baggage is optional on Jetstar Asia. The price range depends on selected weight, route, season, and purchase timing; airport baggage is a separate, higher-risk category.",
      restrictions:
        "The main Jetstar Asia fee risks are underbuying bag weight, adding baggage at the airport, paid seat selection, Starter fare change fees, and no normal refunds on Starter fares.",
    },
    verificationNote:
      "Jetstar Asia carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Choose the correct checked-bag weight before travel instead of relying on airport baggage pricing.",
      "Use the 7 kg Starter carry-on allowance only if your bags are genuinely light enough.",
      "Skip paid seats if a random seat at check-in is acceptable.",
      "Avoid Starter if you may need flexibility; changes can require a fee plus fare difference and refunds are not normally permitted.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=jetstar-asia&weight=22&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Starter",
        details:
          "Starter includes 7 kg of carry-on allowance and no included checked baggage.",
      },
      {
        name: "Higher fares / bundles",
        details:
          "Higher fares may allow more carry-on weight or fewer change restrictions, so compare the bundle against buying add-ons one by one.",
      },
      {
        name: "Checked baggage add-ons",
        details:
          "Checked baggage is sold by weight selection, with price affected by route, season, and purchase timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seats are optional paid add-ons unless you accept random assignment. Starter changes can require a fee plus fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Weekend trip with 7 kg carry-on",
        details:
          "Starter can work if the total carry-on weight stays inside the allowance.",
      },
      {
        title: "Checking a bag",
        details:
          "Buy the right weight allowance before the airport. The checked-bag range depends on route, season, timing, and selected weight.",
      },
      {
        title: "Showing up with no baggage add-on",
        details:
          "Airport baggage is the expensive failure mode because it applies when no checked baggage was pre-purchased or the allowance is exceeded.",
      },
      {
        title: "Need to change plans",
        details:
          "Starter changes can require a fee plus fare difference, while higher fares have fewer restrictions.",
      },
    ],
    exceptions: [
      "Jetstar Asia does not offer an unaccompanied-minor service.",
      "Refunds are not permitted on Starter fares except for flight cancellation or qualifying circumstances.",
      "No Jetstar Asia co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/jetstar", label: "Jetstar" },
      { href: "/airlines/scoot", label: "Scoot" },
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/cebu-pacific", label: "Cebu Pacific" },
    ],
  },
  "jetstar-japan": {
    intro: {
      carryOn:
        "Jetstar Japan includes up to 7 kg total carry-on weight across two items. Anything beyond the allowance must be checked.",
      personalItem:
        "The two-item allowance does not mean unlimited cabin baggage. The combined 7 kg cap is the important rule.",
      checkedBag:
        "Jetstar Japan checked baggage is an optional add-on priced by selected weight, route, and purchase timing. Airport baggage is a separate cost category when bags were not bought in advance or the allowance is exceeded.",
      restrictions:
        "The main Jetstar Japan fee risks are missing the 7 kg carry-on cap, buying too little checked-bag weight, airport baggage pricing, paid seat selection, and Starter fare change/refund limits.",
    },
    verificationNote:
      "Jetstar Japan carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Weigh carry-on bags together; the limit is total weight across the allowed items.",
      "Buy checked baggage before travel if you need it, and choose enough weight for the actual bag.",
      "Use random seat assignment if seat location does not matter.",
      "Avoid Starter when plans may change because changes can require a fee plus fare difference and refunds are not normally permitted.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=jetstar-japan&weight=22&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Starter",
        details:
          "Starter includes up to 7 kg total carry-on weight and no included checked baggage.",
      },
      {
        name: "Starter Plus / Flex",
        details:
          "Higher fares can reduce change restrictions, so compare the bundle when flexibility is important.",
      },
      {
        name: "Checked baggage add-ons",
        details:
          "Checked baggage is bought by weight band, with JPY pricing that changes by weight selection, route, and timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard and extra-legroom seats are paid options if you choose them early. Starter changes can require a fee plus fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Domestic Japan trip with a small bag",
        details:
          "Starter can stay clean if both carry-on items together remain within 7 kg.",
      },
      {
        title: "Bringing a suitcase",
        details:
          "Buy checked baggage before the airport and choose the right weight band. The add-on price changes by route and timing.",
      },
      {
        title: "Cabin bag over 7 kg",
        details:
          "Excess carry-on must be checked, which can move the trip into airport baggage pricing.",
      },
      {
        title: "Changing dates",
        details:
          "Starter changes can require a fee plus fare difference, while higher fares have fewer restrictions.",
      },
    ],
    exceptions: [
      "Jetstar Japan does not offer an unaccompanied-minor service.",
      "Refunds are not permitted on Starter fares except for flight cancellation or qualifying circumstances.",
      "No Jetstar Japan co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/jetstar", label: "Jetstar" },
      { href: "/airlines/jetstar-asia", label: "Jetstar Asia" },
      { href: "/airlines/ana", label: "ANA" },
      { href: "/airlines/jal", label: "Japan Airlines" },
    ],
  },
  etihad: {
    intro: {
      carryOn:
        "Etihad includes cabin baggage. Economy is listed with one cabin bag up to 7 kg plus one personal item, while Business and First have higher allowances.",
      personalItem:
        "The personal item is included with the Economy carry-on row, so the practical issue is keeping the main cabin bag within Etihad's weight and size limits.",
      checkedBag:
        "Etihad is mostly an included-allowance airline, but the allowance changes by route, cabin, fare family, and baggage concept. Extra baggage is a separate route- and timing-sensitive purchase.",
      restrictions:
        "The main Etihad fee risks are exceeding the included allowance, waiting until the airport to handle extra baggage, paid seat selection on Value fares, and fare-family change or cancellation rules.",
    },
    verificationNote:
      "Etihad carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor policies were last checked on 2025-12-24.",
    avoidFees: [
      "Check whether the itinerary uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where possible; the data says online rates are lower than airport rates.",
      "Keep each checked bag at or below 32 kg because heavier bags are not treated as ordinary checked baggage.",
      "Compare Value against Comfort or Deluxe when seat selection matters, because standard seat selection is included on Comfort and Deluxe fares in the published policy.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=etihad&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy includes one 7 kg cabin bag plus one personal item in the row shown here. Checked allowance depends on route, fare family, cabin, and baggage concept.",
      },
      {
        name: "Value",
        details:
          "Value is the seat-selection pressure point in the data because seat fees apply on Value fares and for preferred or extra-legroom seats.",
      },
      {
        name: "Comfort / Deluxe",
        details:
          "Standard seat selection is included on Comfort and Deluxe fares in the published policy.",
      },
      {
        name: "Extra baggage",
        details:
          "Additional baggage is priced by route, baggage concept, and timing, with lower online rates than airport rates in the data.",
      },
    ],
    scenarios: [
      {
        title: "Long-haul trip with one checked bag",
        details:
          "Start with the route's included allowance. Etihad's bag math changes when the itinerary uses piece concept versus weight concept.",
      },
      {
        title: "Need one extra bag",
        details:
          "Do not wait for the airport if you can avoid it; additional baggage has separate online and airport treatment in the data.",
      },
      {
        title: "Booking Value and wanting a specific seat",
        details:
          "Seat selection can become part of the real fare comparison because Value fares can carry seat-selection charges.",
      },
      {
        title: "Checking an oversized item",
        details:
          "Oversize acceptance and fees depend on route and aircraft, so it is not a simple flat-fee item.",
      },
    ],
    exceptions: [
      "Partner-operated or codeshare flights can follow the operating carrier's baggage rules.",
      "Oversize baggage depends on route, aircraft, and airport handling limits.",
      "This fee table does not show an Etihad co-branded card baggage waiver.",
    ],
    comparisonLinks: [
      { href: "/airlines/emirates", label: "Emirates" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
      { href: "/airlines/oman-air", label: "Oman Air" },
      { href: "/airlines/gulf-air", label: "Gulf Air" },
    ],
  },
  "gulf-air": {
    intro: {
      carryOn:
        "Gulf Air includes carry-on baggage, with weight and size limits depending on cabin class.",
      personalItem:
        "Gulf Air does not list a separate paid personal-item charge here. The main cabin-bag issue is matching the cabin-class allowance.",
      checkedBag:
        "Gulf Air includes checked baggage on eligible fares, but the allowance depends on cabin class, fare family, and route. Excess baggage is charged separately by route and weight.",
      restrictions:
        "The main Gulf Air fee risks are exceeding the free checked allowance, overweight airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "Gulf Air carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check the included checked allowance for the exact cabin, fare family, and route.",
      "Pre-purchase excess baggage where available if the bag will exceed the free allowance.",
      "Keep checked bags within the standard weight limits to avoid airport overweight charges.",
      "Avoid paying for seat selection unless the seat type matters; some fares include standard seat selection.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=gulf-air&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Carry-on and checked allowances depend on the specific fare family and route, not one universal Gulf Air number.",
      },
      {
        name: "Premium cabins",
        details:
          "Cabin class affects both carry-on allowance and checked-bag allowance.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage applies when the free allowance is exceeded, with pricing driven by route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on fare family, seat type, and timing. Change and cancellation costs come from the fare rules and route.",
      },
    ],
    scenarios: [
      {
        title: "Checking one bag on a Gulf route",
        details:
          "The first step is confirming the included allowance for the specific route and fare family.",
      },
      {
        title: "Bag is close to the weight limit",
        details:
          "Overweight treatment is an airport risk, so weighing before travel is more useful than treating the allowance as flexible.",
      },
      {
        title: "Wanting a preferred seat",
        details:
          "Some standard seats may be included, but seat type and timing determine whether a fee applies.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service is limited by route and age, so it needs to be confirmed before booking.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage policy.",
      "Oversize-baggage treatment is not listed here as one separate flat fee, so confirm large items before travel.",
      "No Gulf Air co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/etihad", label: "Etihad" },
      { href: "/airlines/oman-air", label: "Oman Air" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
      { href: "/airlines/emirates", label: "Emirates" },
    ],
  },
  "oman-air": {
    intro: {
      carryOn:
        "Oman Air includes carry-on baggage. Economy is listed up to 7 kg, while Business and First have higher allowances.",
      personalItem:
        "Oman Air does not list a separate personal-item charge here. The practical cabin-bag question is whether the bag fits the cabin-class allowance.",
      checkedBag:
        "Oman Air includes checked baggage, but the allowance changes by fare family, cabin class, route, and frequent flyer status. Excess baggage is charged separately by route and weight.",
      restrictions:
        "The main Oman Air fee risks are exceeding the included allowance, overweight airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "Oman Air carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check the allowance attached to the exact fare family, cabin, route, and loyalty status before packing.",
      "Pre-purchase excess baggage where available if the bag will exceed the free allowance.",
      "Keep each checked bag at or below 32 kg because that is the single-bag maximum listed here.",
      "Use included standard seats when available instead of paying for a preferred seat by default.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=oman-air&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy carry-on is listed up to 7 kg. Checked allowance depends on fare family, route, and status.",
      },
      {
        name: "Business / First",
        details:
          "Premium cabins have higher carry-on allowances and can have different checked-bag treatment.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage begins when the free allowance is exceeded, and the charge depends on route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection depends on fare family and seat type. Change and cancellation costs are fare-rule based and may include fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with one checked bag",
        details:
          "Check the included allowance for the booked fare and route before assuming the bag is covered.",
      },
      {
        title: "Holding frequent flyer status",
        details:
          "The checked-bag allowance can vary by frequent flyer status, so status should be part of the baggage math.",
      },
      {
        title: "Heavy checked bag",
        details:
          "The 32 kg single-bag maximum makes overweight planning an airport-risk issue.",
      },
      {
        title: "Changing the ticket",
        details:
          "The fee is fare-rule based, so the lowest fare may not be the cheapest option if plans are uncertain.",
      },
    ],
    exceptions: [
      "Partner-operated or codeshare flights can use the operating carrier's baggage rules.",
      "Oversize-baggage treatment is not listed here as one separate flat fee, so confirm large items before travel.",
      "No Oman Air co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/etihad", label: "Etihad" },
      { href: "/airlines/gulf-air", label: "Gulf Air" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
      { href: "/airlines/emirates", label: "Emirates" },
    ],
  },
  flydubai: {
    intro: {
      carryOn:
        "flydubai includes one cabin bag up to 7 kg, with Business Class including an additional allowance.",
      personalItem:
        "The cabin-bag issue is the 7 kg Economy allowance. If the bag is heavier, the trip can shift into checked or excess baggage.",
      checkedBag:
        "flydubai is not a simple always-included checked-bag airline. Checked baggage is included only with certain fare types, and baggage can also be bought by weight option.",
      restrictions:
        "The main flydubai fee risks are buying a fare without the baggage you need, underbuying checked-bag weight, airport excess-weight charges, paid Economy seat selection, and fare-type change rules.",
    },
    verificationNote:
      "flydubai carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor policies were last checked on 2025-12-24.",
    avoidFees: [
      "Check whether the fare includes checked baggage before treating the base fare as the real trip price.",
      "Buy the correct checked-bag weight option before travel when baggage is needed.",
      "Do not rely on the airport for excess weight; the data says excess beyond purchased allowance is charged at airport rates.",
      "Skip paid Economy seat selection when seat location is not important.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/sports_equipment", label: "Sports equipment" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=flydubai&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy includes a 7 kg cabin bag in the data, while checked baggage depends on fare type and route.",
      },
      {
        name: "Business Class",
        details:
          "Business Class includes additional hand-baggage allowance and includes seat selection in the row shown here.",
      },
      {
        name: "Checked baggage by weight",
        details:
          "Checked baggage can be bought in weight options, with fees driven by route and fare.",
      },
      {
        name: "Seats and changes",
        details:
          "Economy seat selection is chargeable, while changes and cancellations depend on fare type and route.",
      },
    ],
    scenarios: [
      {
        title: "Booking the cheapest Economy fare",
        details:
          "Check whether checked baggage is included. If it is not, price the bag before deciding the fare is cheaper.",
      },
      {
        title: "Traveling with a 23 kg suitcase",
        details:
          "Buy the needed weight option before travel. Airport excess-weight rates are the risk if the purchased allowance is too low.",
      },
      {
        title: "Flying with sports equipment",
        details:
          "Sports equipment must be pre-booked as special baggage, and fees depend on route and equipment type.",
      },
      {
        title: "Child traveling alone",
        details:
          "flydubai does not offer unaccompanied-minor service in the row shown here, so children must travel with an adult.",
      },
    ],
    exceptions: [
      "Unaccompanied-minor service is not offered in the data shown here.",
      "Sports equipment must be handled as special baggage rather than assumed to be ordinary checked baggage.",
      "This fee table does not show a flydubai co-branded card baggage waiver.",
    ],
    comparisonLinks: [
      { href: "/airlines/emirates", label: "Emirates" },
      { href: "/airlines/etihad", label: "Etihad" },
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/scoot", label: "Scoot" },
    ],
  },
  egyptair: {
    intro: {
      carryOn:
        "EgyptAir includes carry-on baggage, with allowance depending on cabin class and size and weight limits.",
      personalItem:
        "EgyptAir does not list a separate paid personal-item charge here. The practical question is whether your cabin bag fits the cabin-class allowance.",
      checkedBag:
        "EgyptAir's allowance changes by route, cabin, fare, and status. From January 1, 2026, Asmara tickets are capped at one checked piece in both Economy and Business, making route exceptions more important than the cabin label.",
      restrictions:
        "The main trap is waiting past the 24-hour prepurchase cutoff or assuming every African route can be bought online. Heavy and oversize conditions also combine: EgyptAir states that a bag violating both can be charged double.",
    },
    verificationNote:
      "EgyptAir's channel-specific route tables, 24-hour cutoff, Africa airport-only cases, 2026 Asmara exception, cumulative excess rules, and sports treatment were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Check the route table and any 2026 exception before relying on the cabin's normal allowance.",
      "Buy an eligible extra piece more than 24 hours before departure; after that, airport pricing applies.",
      "For travel to Africa, verify whether prepayment is available at all because some Cairo or worldwide departures are airport-only.",
      "Repack a bag that is both above 23 kg and 158 cm to avoid EgyptAir's combined-charge treatment.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=egyptair&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Route and channel tables",
        details:
          "Extra 23 kg pieces have separate airport and website or call-center prices. Published examples span USD 30–650, showing why a universal extra-bag figure is misleading.",
      },
      {
        name: "Asmara 2026 exception",
        details:
          "Tickets to or from Asmara are limited to one checked piece in Economy and Business from January 1, 2026. A premium cabin does not restore the usual higher count.",
      },
      {
        name: "Heavy plus large bags",
        details:
          "Overweight applies from 23–32 kg and oversize from 158–203 cm. EgyptAir says a piece violating both is charged double the overweight or oversize price.",
      },
      {
        name: "EgyptAir Plus and sports items",
        details:
          "Status can add a piece or discount excess depending on tier. Sports gear can fall within allowance, pay 50% or 100% excess, or require cargo depending on the item.",
      },
    ],
    scenarios: [
      {
        title: "An extra piece is known before travel",
        details:
          "Price the website or call-center table and buy more than 24 hours ahead when eligible. Otherwise budget the airport route price.",
      },
      {
        title: "Travel is to an African destination",
        details:
          "Confirm whether prepayment is offered; selected Cairo or worldwide departures to Africa are handled only at the airport.",
      },
      {
        title: "A 28 kg bag also measures 170 cm",
        details:
          "It violates both the overweight and oversize bands. EgyptAir's combined rule can double the single-condition price, so repacking has unusually high value.",
      },
      {
        title: "A bicycle exceeds ordinary limits",
        details:
          "Check the sports table before arrival: bicycles can attract 100% excess, while items above 32 kg or two meters can require cargo.",
      },
    ],
    exceptions: [
      "Website and call-center excess pricing closes 24 hours before departure.",
      "Some Africa departures are airport-only for excess baggage.",
      "Asmara tickets are limited to one checked piece in both cabins from January 1, 2026.",
      "Heavy and oversize conditions can combine, while items above 203 cm need different handling.",
    ],
    comparisonLinks: [
      { href: "/airlines/royal-air-maroc", label: "Royal Air Maroc" },
      { href: "/airlines/ethiopian", label: "Ethiopian" },
      { href: "/airlines/etihad", label: "Etihad" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
    ],
  },
  ethiopian: {
    intro: {
      carryOn:
        "Ethiopian includes cabin baggage. Economy is listed as one cabin bag up to 7 kg plus one personal item, while Business Class has a higher allowance.",
      personalItem:
        "The personal item is included with the Economy cabin allowance, so the practical issue is keeping the main cabin bag within the 7 kg limit.",
      checkedBag:
        "Ethiopian usually starts from an included checked-bag allowance, but that allowance depends on route, cabin, fare family, and whether the itinerary uses piece concept or weight concept.",
      restrictions:
        "The main Ethiopian fee risks are exceeding the included allowance, extra baggage purchased too late, overweight or oversize airport handling, paid seats on lower fare families, and fare-family change rules.",
    },
    verificationNote:
      "Ethiopian carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the itinerary uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available because pricing depends on route, baggage concept, and timing.",
      "Keep each checked bag at or below 32 kg to avoid overweight treatment.",
      "Use free check-in seat assignment when the exact seat does not matter; paid seat selection is most relevant on lower fare families and preferred seats.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=ethiopian&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy includes one 7 kg cabin bag plus one personal item. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business Class",
        details:
          "Business Class has a higher cabin allowance and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Ethiopian baggage can be calculated by pieces or total weight depending on the route.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seat selection is included on higher fare families or at check-in for eligible fares. Change and cancellation costs depend on fare family and route.",
      },
    ],
    scenarios: [
      {
        title: "International trip with one checked bag",
        details:
          "Start with the route's included allowance. The fee question usually begins only when the bag exceeds that allowance.",
      },
      {
        title: "Route using piece concept",
        details:
          "Do not use weight-concept math on a piece-concept itinerary; the applicable model depends on the route.",
      },
      {
        title: "Extra bag after booking",
        details:
          "Additional baggage pricing depends on route, baggage concept, and timing, so airport handling is the less predictable path.",
      },
      {
        title: "Lowest fare and seat choice",
        details:
          "Lower fare families and preferred seats can carry seat-selection fees, so include that in the fare comparison.",
      },
    ],
    exceptions: [
      "Partner-operated or codeshare flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on aircraft and route.",
      "No Ethiopian co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/kenya-airways", label: "Kenya Airways" },
      { href: "/airlines/egyptair", label: "EgyptAir" },
      { href: "/airlines/royal-air-maroc", label: "Royal Air Maroc" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
    ],
  },
  "royal-air-maroc": {
    intro: {
      carryOn:
        "Royal Air Maroc includes carry-on baggage, with allowance depending on cabin class and size and weight limits.",
      personalItem:
        "Royal Air Maroc does not list a separate paid personal-item charge here. The main cabin-bag question is whether the bag fits the cabin-class allowance.",
      checkedBag:
        "Royal Air Maroc uses a piece system. Eco Essential can mean zero checked pieces on short or medium haul but one 23 kg piece on long-haul or transit itineraries, with high-season route exceptions.",
      restrictions:
        "Weight cannot be pooled between checked pieces. A light first bag does not offset an overweight second bag, and items above 203 cm must travel as freight rather than ordinary oversize baggage.",
    },
    verificationNote:
      "Royal Air Maroc's fare-product piece allowances, high-season exceptions, route tables, non-pooling rule, Safar Flyer awards, and sports pricing were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Check Eco Essential by route type; it can mean no bag on short or medium haul but one piece on long-haul or transit.",
      "Redistribute weight before check-in because Royal Air Maroc does not pool unused kilograms between pieces.",
      "Use the exact route-pair table for another, heavy, or large bag rather than a headline MAD or EUR example.",
      "If eligible, compare a Safar Flyer mileage award for one extra 23 kg piece or up to 9 kg overweight against the cash price.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=royal-air-maroc&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Eco Essential",
        details:
          "The same product can carry no checked bag on short or medium haul but one 23 kg piece on long-haul or transit travel. High-season sectors can add exceptions.",
      },
      {
        name: "Route-table cash prices",
        details:
          "Extra-piece, overweight, and 158–203 cm oversize charges are priced separately by origin and destination. Public examples range widely by route and currency.",
      },
      {
        name: "Safar Flyer awards",
        details:
          "Eligible members can redeem miles for one extra 23 kg piece or up to 9 kg overweight by zone. Awards are limited and tied to the member on the same flight.",
      },
      {
        name: "Sports and very large items",
        details:
          "Sports fees are zone-based, although golf, kitesurf, or fishing gear can be free within listed limits. Items above 203 cm must move as freight.",
      },
    ],
    scenarios: [
      {
        title: "Eco Essential on a short-haul trip",
        details:
          "Do not assume one included piece. Compare the no-bag fare plus the eligible prepaid first-piece example against a fare product that includes baggage.",
      },
      {
        title: "Two bags total 40 kg but one weighs 27 kg",
        details:
          "The heavy piece can still attract an overweight charge because RAM does not pool weight between pieces. Move four kilograms before check-in.",
      },
      {
        title: "A 190 cm suitcase",
        details:
          "Use the route's 158–203 cm oversize table. If the same piece is heavy or additional, calculate those conditions separately.",
      },
      {
        title: "Using Safar Flyer miles",
        details:
          "Compare the zone-based miles needed for one extra 23 kg piece or up to 9 kg overweight with the cash route-table charge before redeeming.",
      },
    ],
    exceptions: [
      "Checked-bag weight cannot be pooled between pieces.",
      "Eco Essential allowance changes between short/medium haul and long-haul or transit travel.",
      "Items above 203 cm must move as freight rather than ordinary checked baggage.",
      "Safar Flyer excess awards are zone-priced, limited, and tied to the member traveling on the flight.",
    ],
    comparisonLinks: [
      { href: "/airlines/egyptair", label: "EgyptAir" },
      { href: "/airlines/ethiopian", label: "Ethiopian" },
      { href: "/airlines/air-france", label: "Air France" },
      { href: "/airlines/tap-air-portugal", label: "TAP Air Portugal" },
    ],
  },
  "kenya-airways": {
    intro: {
      carryOn:
        "Kenya Airways includes carry-on baggage, with allowance depending on cabin class and size and weight limits.",
      personalItem:
        "Kenya Airways does not list a separate paid personal-item charge here. The practical cabin-bag issue is keeping the bag inside the cabin-class limit.",
      checkedBag:
        "Kenya Airways uses route- and cabin-based pieces on KQ-operated flights. On interline or codeshare journeys, the allowance in the e-ticket, trip summary, or departure-control system overrides a generic KQ table.",
      restrictions:
        "Families and groups can pool the number of bags, but not weight per piece. One 26 kg suitcase can therefore be overweight even when another traveler checks nothing.",
    },
    verificationNote:
      "Kenya Airways's KQ-operated piece system, interline control, group pooling, Asante status and points benefits, and special-baggage rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Use the ticketed allowance on any mixed-carrier trip; a public KQ route table is only an indication when another airline participates.",
      "Redistribute weight between family or group bags before check-in because pooling adds bag count, not kilograms to one piece.",
      "Compare cash pre-purchase with Asante points for one eligible standard extra bag; points do not erase overweight or special-item charges.",
      "Apply Asante benefits accurately: Ruby discounts a first extra bag, while Silver, Gold, and Platinum receive an eligible extra piece.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=kenya-airways&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "KQ-operated allowance",
        details:
          "Kenya Airways publishes route- and cabin-based pieces. The exact ticket remains controlling, especially when fare or status changes the baseline.",
      },
      {
        name: "Interline and codeshare trips",
        details:
          "IATA most-significant-carrier treatment and ticketed data can replace the simple KQ table. Read the e-ticket or trip summary before buying excess.",
      },
      {
        name: "Family and group pooling",
        details:
          "Eligible travelers can combine the number of pieces, but every individual bag must remain within its own weight limit.",
      },
      {
        name: "Asante status or points",
        details:
          "Ruby offers a discount, higher tiers add one standard piece, and points can redeem one eligible extra bag. None converts a heavy or special piece into standard baggage.",
      },
    ],
    scenarios: [
      {
        title: "A family has two allowances and one 26 kg bag",
        details:
          "The unused second allowance does not increase the first bag's weight ceiling. Redistribute into two compliant pieces to use pooling correctly.",
      },
      {
        title: "Connecting itinerary",
        details:
          "Partner-operated segments can change baggage rules, so check the operating carrier when the trip is not all Kenya Airways.",
      },
      {
        title: "Redeeming points for an extra bag",
        details:
          "Asante points can cover one eligible standard extra piece on qualifying KQ travel, but overweight and special-baggage conditions remain payable.",
      },
      {
        title: "A sports team pools its pieces",
        details:
          "The group may pool bag count, but a large, heavy, or special equipment case can still trigger separate treatment or cargo handling.",
      },
    ],
    exceptions: [
      "The ticket, trip summary, or departure-control system can override Kenya Airways's public route table on interline travel.",
      "Asante extra-piece benefits remain subject to standard weight and size limits.",
      "Infants receive one collapsible stroller and one car seat free in addition to cabin baggage, without overriding route-specific checked allowance.",
    ],
    comparisonLinks: [
      { href: "/airlines/ethiopian", label: "Ethiopian" },
      { href: "/airlines/south-african-airways", label: "South African Airways" },
      { href: "/airlines/egyptair", label: "EgyptAir" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
    ],
  },
  "south-african-airways": {
    intro: {
      carryOn:
        "SAA Economy includes one 8 kg cabin bag plus a personal item; Business includes two 8 kg cabin bags plus a personal item. A noncompliant cabin piece can be sent back to check-in.",
      personalItem:
        "The personal item is additional to the cabin-piece allowance, but it does not increase an 8 kg bag's limit. Infant cabin baggage has its own 8 kg ceiling.",
      checkedBag:
        "The included allowance depends on route, cabin, fare, and operating carrier. Additional bags are route-priced, non-transferable between passengers, and cannot be purchased for a lap infant.",
      restrictions:
        "A same-route date change can preserve an extra-bag purchase, but changing the route requires cancellation and repurchase. Codeshare operation can also defeat SAA-specific status, card, or sports treatment.",
    },
    verificationNote:
      "SAA's cabin limits, route-priced additional bags, change treatment, Voyager/Star Alliance/card benefits, infant allowance, and cargo-only sports thresholds were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Confirm that SAA actually operates the flight before relying on Voyager, Star Alliance, listed card, or special-baggage treatment.",
      "Buy an additional piece for the traveler who will use it; the purchase is route-priced and non-transferable.",
      "If the itinerary route changes, cancel and repurchase the bag rather than assuming the original add-on follows the ticket.",
      "Send sports gear above 200 cm and listed items such as canoes, kayaks, windsurfers, or hang-gliders through cargo instead of ordinary baggage.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=south-african-airways&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "SAA-operated allowance",
        details:
          "Economy cabin baggage is one 8 kg piece; Business receives two. Checked pieces depend on route, cabin, fare, and eligible status or card benefit.",
      },
      {
        name: "Additional-bag purchase",
        details:
          "The add-on is priced for the route and traveler. It survives an eligible date change on the same route but not a route change, and it cannot be bought for a lap infant.",
      },
      {
        name: "Voyager, Star Alliance, and card benefits",
        details:
          "Benefits differ by tier, cabin, card, and operating carrier. Partner-operated codeshares can be excluded even when the ticket carries an SAA flight number.",
      },
      {
        name: "Sports and special baggage",
        details:
          "Equipment can use the free allowance when eligible, but excess, pieces above 200 cm, listed cargo-only items, and partner-operated flights need separate treatment.",
      },
    ],
    scenarios: [
      {
        title: "Changing only the travel date",
        details:
          "An additional-bag purchase can remain valid when the route stays the same. Reconfirm it after the ticket change rather than buying it twice.",
      },
      {
        title: "Changing the origin or destination",
        details:
          "The original route-priced bag does not simply transfer. Cancel and repurchase baggage for the new route under SAA's published terms.",
      },
      {
        title: "A lap infant needs another checked bag",
        details:
          "SAA gives a lap infant one 23 kg piece plus a pram or buggy and car seat, but an additional-bag product cannot be purchased for that infant.",
      },
      {
        title: "Traveling with a 210 cm sports case",
        details:
          "Sports equipment over 200 cm is cargo-only. Paying ordinary excess baggage does not make the case acceptable at passenger check-in.",
      },
    ],
    exceptions: [
      "Codeshare partner-operated flights can exclude SAA baggage, sports, Voyager, Star Alliance, or listed card benefits.",
      "Additional baggage is non-transferable and cannot be purchased for a lap infant.",
      "Canoes, kayaks, windsurfers, hang-gliders, and sports items over 200 cm are cargo-only.",
    ],
    comparisonLinks: [
      { href: "/airlines/kenya-airways", label: "Kenya Airways" },
      { href: "/airlines/ethiopian", label: "Ethiopian" },
      { href: "/airlines/egyptair", label: "EgyptAir" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
    ],
  },
  srilankan: {
    intro: {
      carryOn:
        "SriLankan Economy includes one 7 kg cabin bag. Checked baggage then splits by geography: most routes use a total-weight allowance, while North, Central, and South America use pieces.",
      personalItem:
        "A small personal item does not create another full-size Economy carry-on. Keep the main cabin piece within 7 kg and the additional item within personal-item limits.",
      checkedBag:
        "On weight routes, SriLankan sells prepaid baggage in 5 kg blocks up to 50 kg. Americas itineraries use a piece allowance instead, so extra kilograms and another piece are not interchangeable purchases.",
      restrictions:
        "Prepayment closes three hours before departure and does not eliminate later excess: if the final bag total still exceeds the purchased allowance, airport per-kilogram rates apply. Bags above 158 cm also attract a separate USD 50 oversize fee, subject to acceptance.",
    },
    verificationNote:
      "SriLankan's weight-versus-Americas piece system, online 5–50 kg prepayment, three-hour cutoff, USD 50 oversize fee, and family and status rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Identify an Americas piece route before buying weight in 5 kg blocks; the products solve different problems.",
      "On eligible weight routes, prepay enough 5 kg blocks online before the three-hour cutoff instead of relying on airport per-kilogram rates.",
      "Measure every checked item as well as weighing it because the USD 50 oversize fee is separate above 158 cm.",
      "Recheck partner-operated segments and FlySmiLes or oneworld benefits before assuming SriLankan's allowance controls the whole ticket.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=srilankan&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Most routes: weight concept",
        details:
          "The checked allowance is total weight. Eligible travelers can add 5–50 kg online in five-kilogram blocks, with discounts from airport rates.",
      },
      {
        name: "Americas: piece concept",
        details:
          "North, Central, and South America itineraries use pieces. Apply the ticket's bag count and per-piece limits rather than the online weight-block logic.",
      },
      {
        name: "Prepaid baggage",
        details:
          "Prepayment is available through Manage My Booking up to three hours before departure. Additional airport excess can still be charged per kilogram when the prepaid amount is insufficient.",
      },
      {
        name: "Oversize and sports items",
        details:
          "Ordinary pieces above 158 cm carry a published USD 50 oversize fee, while sports equipment follows item-specific weight or piece rules and aircraft acceptance.",
      },
    ],
    scenarios: [
      {
        title: "A weight-route traveler needs 12 kg more",
        details:
          "Prepay enough five-kilogram blocks to cover the full excess—normally 15 kg rather than 10 kg—before the three-hour cutoff.",
      },
      {
        title: "An itinerary touches the Americas",
        details:
          "Use the piece allowance and extra-piece rules. Do not assume a prepaid kilogram bundle solves another-bag exposure.",
      },
      {
        title: "A checked item measures 170 cm",
        details:
          "Budget the USD 50 oversize fee in addition to any excess weight or piece charge, then confirm aircraft acceptance.",
      },
      {
        title: "Prepaid baggage is still insufficient",
        details:
          "SriLankan can charge the remaining excess at the airport's per-kilogram rate. Prepayment reduces exposure but does not cap the final charge.",
      },
    ],
    exceptions: [
      "Weight-block prepayment closes three hours before departure and is sold in 5 kg increments up to 50 kg.",
      "Americas routes use pieces rather than the normal total-weight system.",
      "The USD 50 oversize fee does not guarantee aircraft acceptance.",
      "Partner operation and elite benefits can change the ticketed allowance.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/vistara", label: "Vistara" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
    ],
  },
  "air-china": {
    intro: {
      carryOn:
        "Air China Economy includes one cabin bag up to 8 kg. The more consequential split is checked baggage: mainland domestic trips use weight allowances and a fare-based excess formula, while international and regional trips use route-specific tables.",
      personalItem:
        "There is no separate paid personal-item product to solve an overweight cabin bag. Keep the main Economy piece within 8 kg and the additional small item within the published cabin limits.",
      checkedBag:
        "Domestic Economy, Business, and First publish 20 kg, 30 kg, and 40 kg weight allowances. International and regional allowances vary by market and ticket, and excess can be classified by extra piece, heavy piece, or large piece.",
      restrictions:
        "The main trap is treating Air China's domestic 1.5% formula as a fixed CNY-per-kilogram price. The benchmark is the published full-fare Economy fare for the route, not necessarily the discounted fare paid, and international baggage requires a different appendix.",
    },
    verificationNote:
      "Air China's domestic weight allowances and 1.5% fare formula, international route appendices, PhoenixMiles benefits, sports-equipment rules, and transport limits were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Classify the itinerary as mainland domestic or international/regional before doing any fee calculation.",
      "For domestic excess, use 1.5% of the published full-fare Economy benchmark per excess kilogram—not 1.5% of your discounted ticket.",
      "For international travel, open the matching route appendix and test the bag for count, weight, and size separately.",
      "Contact Air China before bringing long sports equipment because aircraft acceptance or cargo handling can matter more than the excess fee.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=air-china&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=8", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Mainland domestic allowances",
        details:
          "Air China publishes 20 kg for Economy, 30 kg for Business, and 40 kg for First on domestic weight-concept travel. The allowance is total weight rather than a standard international piece count.",
      },
      {
        name: "Domestic excess formula",
        details:
          "Each excess kilogram is charged at 1.5% of the route's published full-fare Economy benchmark. Because that benchmark changes by route, there is no responsible universal CNY-per-kilogram headline.",
      },
      {
        name: "International and regional tables",
        details:
          "Japan, Americas-related, and other markets can carry different allowances and excess appendices. Use the ticketed route's extra-piece, overweight, and oversize bands rather than the domestic calculation.",
      },
      {
        name: "PhoenixMiles and Star Alliance",
        details:
          "Eligible members receive added allowance according to tier, cabin, route, and baggage system. The benefit changes the allowance; it is not a blanket waiver of every heavy or large-bag charge.",
      },
    ],
    scenarios: [
      {
        title: "Domestic Economy baggage totals 25 kg",
        details:
          "The published Economy allowance is 20 kg, leaving five excess kilograms. Multiply each kilogram by 1.5% of the route's full-fare Economy benchmark, not the fare shown in your booking receipt.",
      },
      {
        title: "An international itinerary needs another piece",
        details:
          "Ignore the domestic formula. Find the matching international route appendix, then verify whether the added piece also crosses that table's weight or size thresholds.",
      },
      {
        title: "A bag fits the maximum transport limit",
        details:
          "That does not make it free or even guarantee ordinary handling. Air China separates maximum acceptance limits from the ticket's free allowance and excess charges.",
      },
      {
        title: "Travel includes another operating airline",
        details:
          "Recheck the controlling baggage rule and status benefit. Air China's domestic formula and PhoenixMiles examples are not automatically portable to a partner-operated segment.",
      },
    ],
    exceptions: [
      "Domestic excess uses the published full-fare Economy benchmark, not necessarily the passenger's paid fare.",
      "International and regional baggage must be priced from the applicable route appendix.",
      "Staying below a maximum transport dimension or weight does not make a bag part of the free allowance.",
      "Sports equipment and partner-operated flights can require advance approval or different carrier rules.",
    ],
    comparisonLinks: [
      { href: "/airlines/china-southern", label: "China Southern" },
      { href: "/airlines/hainan", label: "Hainan Airlines" },
      { href: "/airlines/xiamenair", label: "XiamenAir" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
    ],
  },
  "china-southern": {
    intro: {
      carryOn:
        "China Southern Economy includes one 8 kg cabin bag, but a noncompliant bag can be checked and charged at the gate. That makes weight and dimensions a boarding-time cost risk rather than merely a packing guideline.",
      personalItem:
        "A small personal item does not create another full-size cabin allowance. Pack the main Economy piece within 8 kg and keep both items inside the airline's stated cabin limits.",
      checkedBag:
        "Domestic Economy and Premium Economy publish 20 kg, Business 30 kg, and First 40 kg. International and regional allowances instead vary by route area and fare brand, with excess priced by piece count, weight band, and size band.",
      restrictions:
        "International charges can accumulate. China Southern publishes separate 23–28 kg, 28–32 kg, and on some routes 32–45 kg bands, plus oversize and extra-piece charges. Paying one does not necessarily clear the others.",
    },
    verificationNote:
      "China Southern's gate-check warning, domestic allowances and fare formula, international route-area tables, cumulative conditions, and Sky Pearl benefits were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Weigh the Economy cabin bag before departure; an over-limit piece can become chargeable checked baggage at the gate.",
      "Use the domestic fare formula only for domestic travel and the correct route-area table for international or regional travel.",
      "On a piece route, test each bag for extra-piece, overweight, and oversize exposure separately.",
      "Apply eligible Sky Pearl allowance before purchasing baggage because status adds kilograms on weight routes but a piece on piece routes.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=china-southern&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=8", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Domestic weight allowance",
        details:
          "Domestic Economy and Premium Economy receive 20 kg, Business 30 kg, and First 40 kg. Excess uses China Southern's published-fare percentage calculation per kilogram.",
      },
      {
        name: "International route areas",
        details:
          "International and regional allowances and prices change by route area, currency, cabin, and fare brand. There is no single CNY or USD extra-bag amount.",
      },
      {
        name: "Weight and size bands",
        details:
          "Published overweight examples range from CNY 390 to 3,000 or USD 65 to 495 by route and band. A 159–203 cm oversize example is around CNY 1,000 or USD 165–170 on selected areas.",
      },
      {
        name: "Sky Pearl status",
        details:
          "Eligible Gold and Silver members receive extra kilograms on weight-based routes or another piece on piece-based routes. The benefit follows the itinerary's baggage system.",
      },
    ],
    scenarios: [
      {
        title: "Domestic Economy baggage totals 26 kg",
        details:
          "Start from the 20 kg allowance and price six excess kilograms using the domestic published-fare formula. Do not substitute an international overweight-table example.",
      },
      {
        title: "An international bag weighs 30 kg",
        details:
          "Use the route area's 28–32 kg band. If the bag is also additional or oversized, calculate those conditions too because China Southern charges exceeded limits cumulatively.",
      },
      {
        title: "A cabin bag fails at the gate",
        details:
          "China Southern can move it into checked baggage and charge under the applicable route rules. The absence of a normal carry-on fee does not make an oversized cabin bag free.",
      },
      {
        title: "Sports equipment exceeds ordinary limits",
        details:
          "Check whether the item can count within allowance, then apply the route's weight and size conditions. Special packing and aircraft acceptance can still require advance contact.",
      },
    ],
    exceptions: [
      "An over-limit carry-on can be gate-checked and charged under the checked-baggage rules.",
      "Domestic formula pricing and international route-area tables are not interchangeable.",
      "Extra-piece, overweight, and oversize conditions can be charged cumulatively.",
      "Sky Pearl benefits differ between weight-based and piece-based itineraries.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-china", label: "Air China" },
      { href: "/airlines/hainan", label: "Hainan Airlines" },
      { href: "/airlines/xiamenair", label: "XiamenAir" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
    ],
  },
  hainan: {
    intro: {
      carryOn:
        "Hainan Economy includes one 10 kg cabin bag. Checked baggage then splits into Chinese domestic weight rules and international or regional piece rules.",
      personalItem:
        "The relatively generous 10 kg Economy cabin limit still has size constraints. A small personal item does not justify a second full-size carry-on.",
      checkedBag:
        "Domestic excess can be charged per kilogram at 1.5% of the published one-way full-fare Economy benchmark. International and regional itineraries use pieces and route tables instead.",
      restrictions:
        "Prepaid baggage is route- and platform-specific and excludes bags above its weight or size limits. International pieces above 32 kg or 203 cm generally must be repacked, split, or handled as cargo.",
    },
    verificationNote:
      "Hainan's domestic weight formula, international piece tables, prepaid limitations, July 2026 excess standards, hard handling limits, and Fortune Wings benefit were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Classify the trip as Chinese domestic weight travel or international piece travel before using any fee example.",
      "For domestic excess, calculate 1.5% of the published full-fare Economy benchmark per kilogram—not the discounted ticket price.",
      "Use prepaid baggage only when the route, platform, weight, and dimensions qualify; otherwise the airport schedule controls.",
      "Repack international pieces above 32 kg or 203 cm before check-in because a larger fee may not make them acceptable.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=hainan&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Chinese domestic routes",
        details:
          "Domestic baggage uses total weight. Excess is calculated at 1.5% of the published one-way full-fare Economy price per kilogram.",
      },
      {
        name: "International and regional routes",
        details:
          "These routes use piece allowances and route-specific extra, overweight, and oversize tables. Current allowance tables carry an August 25, 2025 effective context.",
      },
      {
        name: "Prepaid baggage limits",
        details:
          "Eligible routes can offer prepaid kilograms or baggage, but out-of-limit heavy or large pieces remain airport-priced and may require repacking or cargo.",
      },
      {
        name: "Fortune Wings allowance",
        details:
          "Eligible elite members receive one additional checked bag above the ticketed allowance on Hainan-operated flights. The piece still follows the route's weight and size limits.",
      },
    ],
    scenarios: [
      {
        title: "Domestic baggage is 6 kg over",
        details:
          "Multiply six kilograms by 1.5% of the route's published full-fare Economy benchmark. Do not use the fare paid or an international extra-piece price.",
      },
      {
        title: "An international trip needs another piece",
        details:
          "Use the applicable route table, then check whether the added piece also exceeds 32 kg or the normal size threshold.",
      },
      {
        title: "A prepaid bag is above 203 cm",
        details:
          "The prepaid purchase does not solve acceptance. Hainan generally requires the piece to be repacked, split, or moved through cargo handling.",
      },
      {
        title: "Traveling with sports equipment",
        details:
          "Check the item-specific rules before travel; some equipment counts within allowance while other items use special charges and packing conditions.",
      },
    ],
    exceptions: [
      "Domestic excess uses 1.5% of the published full-fare Economy benchmark per kilogram.",
      "International and regional travel uses piece and route-table logic instead.",
      "Prepaid baggage excludes some heavy or oversized pieces; above 32 kg or 203 cm generally requires repacking or cargo.",
      "Departure-date rules, partner operation, and special-equipment treatment can change the result.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-china", label: "Air China" },
      { href: "/airlines/china-southern", label: "China Southern" },
      { href: "/airlines/xiamenair", label: "XiamenAir" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
    ],
  },
  xiamenair: {
    intro: {
      carryOn:
        "XiamenAir Economy includes one 7 kg cabin bag. The checked-bag answer depends heavily on the Economy brand: international Flex, Comfort, Standard, and Light can range from two included pieces to no free checked bag.",
      personalItem:
        "A small personal item is not a workaround for the 7 kg Economy cabin limit. Keep the main piece compliant and verify whether the specific aircraft imposes tighter cabin handling.",
      checkedBag:
        "Domestic travel uses weight allowances and a 1.5% per-kilogram fare formula. International and regional travel uses pieces and route groups, with added charges for 23–32 kg, 32–45 kg, and oversize bands.",
      restrictions:
        "The hard limits matter: some large items need advance approval, and a single piece above 45 kg or 300 cm is not accepted as checked baggage. U.S. and Canada itineraries also have special heavy-bag and confirmation rules.",
    },
    verificationNote:
      "XiamenAir's Economy-brand allowances, domestic 1.5% formula, international route groups, cumulative conditions, U.S./Canada handling, and Egret benefits were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Compare Economy fare brands using their checked-bag inclusion; a Light fare can carry no free checked bag where another brand includes pieces.",
      "Use the domestic 1.5% formula only on domestic weight-concept travel and the route-group table internationally.",
      "Repack any international bag that is extra, above 23 kg, and above 158 cm because those charges can accumulate.",
      "Request approval before travel for a piece near 45 kg, 300 cm, or the U.S./Canada heavy-bag limits; payment does not guarantee acceptance.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=xiamenair&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy fare brands",
        details:
          "International Flex, Comfort, Standard, and Light can have materially different free baggage—from two pieces to none. Compare the fare plus required baggage rather than the base fare alone.",
      },
      {
        name: "Domestic weight formula",
        details:
          "Domestic allowance is expressed in kilograms, and excess is charged at 1.5% of the applicable fare benchmark per kilogram. It is not an international extra-piece price.",
      },
      {
        name: "International route groups",
        details:
          "Additional pieces, 23–32 kg bags, 32–45 kg bags, and 159–203 cm pieces use route-group tables. Published heavy-bag examples range from CNY 1,000 to 3,000 or USD 150 to 440.",
      },
      {
        name: "Egret and SkyTeam status",
        details:
          "Eligible members receive one extra checked piece within published limits, but the benefit is not stackable with some other special allowance categories and can change on partner flights.",
      },
    ],
    scenarios: [
      {
        title: "Light is cheaper but includes no checked bag",
        details:
          "Compare Light plus the route-group extra-piece charge against Standard, Comfort, or Flex. The lower fare may not produce the lower trip cost when baggage is certain.",
      },
      {
        title: "Domestic baggage exceeds the weight allowance",
        details:
          "Price the excess kilograms with XiamenAir's 1.5% fare formula. Do not use the international CNY 1,000 heavy-bag example for a domestic trip.",
      },
      {
        title: "An international extra piece weighs 35 kg",
        details:
          "Calculate the extra-piece fee and the route group's 32–45 kg band. If it is also above 158 cm, add the applicable size condition rather than assuming one charge covers all three.",
      },
      {
        title: "A large piece involves the U.S. or Canada",
        details:
          "Seek confirmation before travel. XiamenAir applies special heavy-bag handling on these routes, and pieces above the published maximum can be refused regardless of willingness to pay.",
      },
    ],
    exceptions: [
      "Economy fare brands can range from two free pieces to no checked allowance.",
      "International extra-piece, overweight, and oversize conditions can accumulate.",
      "Pieces above 45 kg or 300 cm are not accepted as checked baggage; some smaller large items still need approval.",
      "Egret or SkyTeam extra allowance may not stack with other special allowances and can change on partner operation.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-china", label: "Air China" },
      { href: "/airlines/china-southern", label: "China Southern" },
      { href: "/airlines/hainan", label: "Hainan Airlines" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
    ],
  },
  "air-astana": {
    intro: {
      carryOn:
        "Air Astana includes carry-on baggage. Economy is listed up to 8 kg, while Business Class is listed up to 12 kg.",
      personalItem:
        "Air Astana does not list a separate paid personal-item charge here. The practical cabin-bag issue is matching the Economy or Business cabin allowance.",
      checkedBag:
        "Economy Basic includes no checked bag, Classic includes one 23 kg piece, and Plus includes two 23 kg pieces. Nomad Club can add pieces by tier.",
      restrictions:
        "MyBAGGAGE only works on Air Astana-operated flights, is non-transferable, and moves to airport pricing inside 36 hours. Oversized items cannot be prepaid through it.",
    },
    verificationNote:
      "Air Astana's Basic/Classic/Plus allowances, MyBAGGAGE operator and 36-hour rules, Nomad Club pieces, oversize approval, and cargo cutoff were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Compare Economy Basic plus the required MyBAGGAGE pieces against Classic or Plus before choosing the no-bag fare.",
      "Buy MyBAGGAGE at least 36 hours before departure and only for an Air Astana-operated itinerary; partner segments are ineligible.",
      "Seek prior approval for anything above 158 cm because oversize items are airport-paid and cannot be prepaid as ordinary extra pieces.",
      "Split an item above 32 kg or arrange cargo; buying another MyBAGGAGE piece does not raise the per-item ceiling.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=air-astana&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=8", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy Basic",
        details:
          "Includes cabin baggage but no checked piece. Its true price is the fare plus every MyBAGGAGE piece required for the trip.",
      },
      {
        name: "Economy Classic / Plus",
        details:
          "Classic includes one 23 kg checked piece; Plus includes two. Compare those inclusions directly with Basic plus add-ons.",
      },
      {
        name: "MyBAGGAGE",
        details:
          "Adds up to 10 pieces on Air Astana-operated flights. It is non-transferable, unavailable on interline or codeshare travel, and uses airport rates inside 36 hours.",
      },
      {
        name: "Nomad Club",
        details:
          "Silver adds one eligible piece; Gold and Diamond add two. Status does not override cabin limits, oversize approval, or the 32 kg cargo threshold.",
      },
    ],
    scenarios: [
      {
        title: "Basic needs one checked suitcase",
        details:
          "Compare Basic plus one advance MyBAGGAGE piece with Classic's included 23 kg bag before booking.",
      },
      {
        title: "Buying baggage 24 hours before departure",
        details:
          "The advance window has closed: less than 36 hours means airport rates, even if the itinerary otherwise qualifies for MyBAGGAGE.",
      },
      {
        title: "A 170 cm suitcase",
        details:
          "Request approval before travel and expect airport handling. MyBAGGAGE does not prepay an item above the normal 158 cm limit.",
      },
      {
        title: "A 34 kg undivided item",
        details:
          "It is outside ordinary checked baggage and must move as cargo unless it can be split into compliant pieces.",
      },
    ],
    exceptions: [
      "MyBAGGAGE is unavailable on interline and codeshare flights even when Air Astana appears in the itinerary.",
      "Items above 158 cm require prior approval and airport payment; undivided items above 32 kg go as cargo.",
      "A child stroller is free, but gate return, cabin stroller or crib limits, and car-seat handling depend on airport and whether the infant has a seat.",
    ],
    comparisonLinks: [
      { href: "/airlines/turkish-airlines", label: "Turkish Airlines" },
      { href: "/airlines/qatar-airways", label: "Qatar Airways" },
      { href: "/airlines/air-china", label: "Air China" },
      { href: "/airlines/ethiopian", label: "Ethiopian" },
    ],
  },
  asiana: {
    intro: {
      carryOn:
        "Asiana Economy includes one 10 kg cabin bag. Checked baggage is less uniform because the airline publishes separate allowance and excess tables for Korean domestic, U.S.-route, and non-U.S. international travel.",
      personalItem:
        "A small personal item does not increase the Economy cabin bag's 10 kg limit. Keep the main piece compliant and treat the additional item as genuinely personal-sized.",
      checkedBag:
        "Start with the route family rather than a universal free-bag assumption. U.S. itineraries use published piece examples, other international travel has its own table, and Korean domestic travel follows domestic weight and handling rules.",
      restrictions:
        "Prepaid baggage solves additional international pieces only. It does not replace overweight or oversize fees, and charges can combine when a new piece is also above 23 kg or 158 cm.",
    },
    verificationNote:
      "Asiana's domestic, U.S., and non-U.S. allowance tables, prepaid extra-piece discount, cumulative charges, status caveats, sports equipment, and infant rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Classify the trip as Korean domestic, U.S.-route, or other international before applying any allowance or fee example.",
      "For a known international extra piece, prepay at least 24 hours before departure for up to 10% off the airport rate.",
      "Repack an extra piece that is also heavy or large; the prepaid purchase does not erase overweight or oversize exposure.",
      "Check Asiana Club benefits against the route and cabin, and recheck codeshares because partner rules can replace them.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=asiana&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "U.S.-route piece table",
        details:
          "Published examples include airport extra pieces at USD 100–200, 24–32 kg overweight from USD 100, and 158–203 cm oversize from USD 100–200.",
      },
      {
        name: "Other international routes",
        details:
          "Non-U.S. international travel follows a separate allowance and fee table. Do not transfer the U.S. dollar examples to another region without checking the itinerary.",
      },
      {
        name: "Korean domestic travel",
        details:
          "Domestic Korean baggage follows domestic allowance and large-item handling rules. International prepaid extra baggage is not the product for a domestic excess problem.",
      },
      {
        name: "Prepaid additional pieces",
        details:
          "Eligible international additional pieces can be purchased at least 24 hours before departure for up to 10% less. Weight and size violations remain separately chargeable.",
      },
    ],
    scenarios: [
      {
        title: "A U.S.-route Economy trip needs another bag",
        details:
          "Use Asiana's U.S. piece table and prepay 24 or more hours ahead when eligible. Airport examples start around USD 100–200, with prepaid pricing up to 10% lower.",
      },
      {
        title: "The extra bag weighs 29 kg",
        details:
          "Calculate both the additional-piece amount and the 24–32 kg overweight amount. On shown U.S. routes, the overweight example starts at USD 100 and does not replace the piece charge.",
      },
      {
        title: "Sports equipment fits the free allowance",
        details:
          "It can count within the allowance when piece and weight limits are met. A sports exception does not automatically waive overweight or extra-piece charges.",
      },
      {
        title: "A codeshare appears on the itinerary",
        details:
          "Confirm which carrier's rules apply before buying Asiana prepaid baggage or relying on Asiana Club allowance. Partner operation can change both.",
      },
    ],
    exceptions: [
      "Prepaid baggage is international-only, additional-piece-only, and must be purchased at least 24 hours before departure.",
      "Extra-piece, overweight, and oversize charges can apply together.",
      "Korean domestic, U.S.-route, and non-U.S. international rules are separate.",
      "Asiana Club benefits can change on Star Alliance partner or codeshare operation.",
    ],
    comparisonLinks: [
      { href: "/airlines/korean-air", label: "Korean Air" },
      { href: "/airlines/ana", label: "ANA" },
      { href: "/airlines/jal", label: "Japan Airlines" },
      { href: "/airlines/china-airlines", label: "China Airlines" },
    ],
  },
  "china-airlines": {
    intro: {
      carryOn:
        "China Airlines Economy includes one 7 kg cabin bag plus a personal item. Checked baggage is piece-based, but the included count changes by route, booking class, reward ticket, and first carrier.",
      personalItem:
        "The personal item does not raise the main cabin bag's 7 kg limit. An excess cabin item can be moved into checked baggage and consume or exceed the ticketed piece allowance.",
      checkedBag:
        "There is no universal Economy bag count. Some trans-Tasman Discount or Basic tickets can include zero pieces, while other markets and booking classes include baggage. Eligible prepaid excess is then priced by zone.",
      restrictions:
        "The 5% prepaid discount applies only to eligible tickets and CI or Mandarin operation. Overweight, oversize, pets, instruments, and some sports equipment use separate rules and cannot safely be modeled as a normal extra piece.",
    },
    verificationNote:
      "China Airlines' route and booking-class allowances, zero-piece trans-Tasman cases, 5% zone-based prepayment, Dynasty Flyer benefits, and special-baggage rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Read the booking-class and route row before assuming Economy includes a checked bag, especially on trans-Tasman Discount or Basic tickets.",
      "Use the 5% prepaid discount only after confirming CI or Mandarin operation and online eligibility.",
      "Keep every ordinary checked piece at or below 32 kg; China Airlines generally refuses heavier pieces rather than selling a larger overweight tier.",
      "Price sports equipment from its specific rules because items above 292 cm can count as two pieces unless exempted.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=china-airlines&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Route and booking class",
        details:
          "Piece allowance changes by market and fare class. Selected trans-Tasman Discount or Basic tickets can have no free checked piece, making the fare label alone insufficient.",
      },
      {
        name: "Prepaid zone pricing",
        details:
          "Eligible excess baggage is priced by itinerary zone and receives a published 5% prepaid discount. Ticket, operator, itinerary, and timing determine availability.",
      },
      {
        name: "Dynasty Flyer status",
        details:
          "Gold and Emerald receive one extra piece and Paragon two on eligible China Airlines or Mandarin self-operated flights. Partner operation can remove that benefit.",
      },
      {
        name: "Special and large baggage",
        details:
          "Heavy, oversize, pet, instrument, and sports items follow separate rules. Some sports equipment above 292 cm can be charged as two pieces unless specifically dimension-exempt.",
      },
    ],
    scenarios: [
      {
        title: "A trans-Tasman Basic fare has zero pieces",
        details:
          "Compare the fare plus a zone-priced extra piece against a higher booking class that includes baggage. The lowest base fare can lose once the bag is added.",
      },
      {
        title: "Prepaying an ordinary extra piece",
        details:
          "Confirm eligible CI or Mandarin operation, then use the zone price with the 5% discount. Recheck weight and size because prepayment does not waive those limits.",
      },
      {
        title: "A checked piece weighs more than 32 kg",
        details:
          "Repack before check-in. China Airlines generally refuses pieces above 32 kg rather than accepting them under the ordinary overweight schedule.",
      },
      {
        title: "Sports equipment exceeds 292 cm",
        details:
          "It can be charged as a two-piece equivalent unless the item appears in a dimension-exempt sports category. Confirm packing and aircraft handling in advance.",
      },
    ],
    exceptions: [
      "Some trans-Tasman Discount or Basic Economy tickets include zero checked pieces.",
      "The 5% prepaid discount requires an eligible ticket, itinerary, timing, and CI or Mandarin operation.",
      "Pieces above 32 kg are generally refused and should be repacked.",
      "Sports equipment, pets, and instruments can use special rules instead of ordinary prepaid excess.",
    ],
    comparisonLinks: [
      { href: "/airlines/eva-air", label: "EVA Air" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/asiana", label: "Asiana" },
      { href: "/airlines/china-eastern", label: "China Eastern" },
    ],
  },
  "china-eastern": {
    intro: {
      carryOn:
        "China Eastern Economy includes one cabin bag up to 8 kg. Checked baggage then splits sharply: domestic travel uses a weight allowance and fare formula, while international and regional travel uses pieces and route bands.",
      personalItem:
        "A small additional cabin item does not replace the 8 kg Economy limit. Infant journey supplies and a compact stroller have separate published treatment when they meet cabin constraints.",
      checkedBag:
        "Domestic excess is calculated per kilogram from a fare benchmark. International and regional itineraries use an extra-piece table by route band, then add separate overweight or oversize amounts when the same piece crosses those limits.",
      restrictions:
        "International condition stacking is the largest cost trap. Published examples commonly show RMB 1,000 or more for a 23–32 kg Economy piece and RMB 1,000–2,700 for oversize bands, before considering whether the bag is also an extra piece.",
    },
    verificationNote:
      "China Eastern's domestic fare formula, international route-band tables, cumulative excess conditions, Eastern Miles benefits, and special-baggage pricing were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Separate domestic weight travel from international piece travel before applying any price example.",
      "On international routes, test every bag for three conditions: additional piece, above 23 kg, and above 158 cm.",
      "Repack a bag that is both heavy and large; reducing one condition can remove an entire stacked charge.",
      "Use the special-baggage table for sports gear or instruments because item type and route can matter as much as weight.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=china-eastern&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=8", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Domestic weight concept",
        details:
          "Domestic included baggage and excess are measured by total weight. The excess calculation uses a per-kilogram fare formula rather than the international extra-piece table.",
      },
      {
        name: "International piece concept",
        details:
          "International and regional allowances use pieces, with added bags priced by route band. A new piece must still be checked for weight and dimensions.",
      },
      {
        name: "Heavy and large pieces",
        details:
          "Published international examples often start around RMB 1,000 for a 23–32 kg Economy piece and around RMB 1,000 for 159–203 cm, rising on larger or longer-haul bands. Conditions can stack.",
      },
      {
        name: "Eastern Miles and special items",
        details:
          "Eligible status adds weight or pieces according to the itinerary's baggage system. Sports equipment and instruments can use separate item-and-route tables with examples from RMB 1,000 to RMB 6,000.",
      },
    ],
    scenarios: [
      {
        title: "Domestic baggage exceeds the allowance",
        details:
          "Use China Eastern's domestic per-kilogram fare formula. Do not apply an RMB 1,000 international overweight example to this weight-concept trip.",
      },
      {
        title: "An international third bag weighs 28 kg",
        details:
          "Calculate the route-band extra-piece fee and the 23–32 kg overweight fee. One does not replace the other under the published international structure.",
      },
      {
        title: "A 170 cm bag is also overweight",
        details:
          "The piece enters both the 159–203 cm oversize band and the overweight band. Repacking either dimensions or weight can remove one charge from the stack.",
      },
      {
        title: "Checking sports equipment",
        details:
          "Check the item-specific special-baggage table and seek approval when required. Ordinary extra-piece pricing may not model the equipment correctly.",
      },
    ],
    exceptions: [
      "Domestic fare-formula prices and international route-band prices are not interchangeable.",
      "International extra-piece, overweight, and oversize charges can apply to the same bag.",
      "Special baggage uses separate item, route, and baggage-system tables.",
      "Eastern Miles benefits and allowances can change on partner-operated or interline segments.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-china", label: "Air China" },
      { href: "/airlines/china-southern", label: "China Southern" },
      { href: "/airlines/china-airlines", label: "China Airlines" },
      { href: "/airlines/hainan", label: "Hainan Airlines" },
    ],
  },
  "hong-kong-airlines": {
    intro: {
      carryOn:
        "Hong Kong Airlines Economy includes one 7 kg cabin bag plus small personal effects. The checked allowance is piece-based and changes by fare family and route zone under the current post-April 30, 2025 table.",
      personalItem:
        "Small personal effects do not turn Economy into a second full-size carry-on. Keep the main bag at or below 7 kg and within the published dimensions.",
      checkedBag:
        "Basic, Main, and FlexiPlus can receive different bag counts across Zones 1–5. The table applies to HX-operated flights and excludes specified codeshares operated by carriers such as Asiana, Hainan, or Grand China.",
      restrictions:
        "Prepaid baggage requires an eligible HX-marketed and HX-operated flight, purchase at least four hours ahead, and is generally nonrefundable if unused. Overweight and oversize charges can also accumulate.",
    },
    verificationNote:
      "Hong Kong Airlines' current zone and fare-family allowances, four-hour prepaid cutoff, operating-carrier exclusions, cumulative charges, and special-equipment rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Compare Basic, Main, and FlexiPlus using the itinerary's zone before assuming the cheapest fare has the same checked bags.",
      "Confirm both HX marketing and HX operation before purchasing prepaid baggage.",
      "Buy eligible extra baggage at least four hours ahead only when certain it will be used, because unused purchases are generally not refunded.",
      "Repack any piece above 32 kg or 203 cm; Hong Kong Airlines requires it to be split rather than accepted for a larger fee.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=hong-kong-airlines&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic, Main, and FlexiPlus",
        details:
          "Current checked-bag counts differ by fare family and Zones 1–5. Read the exact row for the ticket instead of applying one Economy allowance.",
      },
      {
        name: "HX-operated flights",
        details:
          "The published allowance and prepaid product are built for Hong Kong Airlines operation. Specified OZ, HU, CN, interline, and other codeshare flights can follow different rules.",
      },
      {
        name: "Prepaid additional baggage",
        details:
          "Eligible extra baggage is sold per passenger per flight and must be purchased at least four hours before departure. Airport pricing follows the applicable route-zone table.",
      },
      {
        name: "Heavy, large, and sports items",
        details:
          "Weight and size charges accumulate. Bicycles require 48-hour pre-advice, while surf and windsurf equipment use separate special-handling examples.",
      },
    ],
    scenarios: [
      {
        title: "Basic and Main have different allowances",
        details:
          "Compare the fare difference with the route-zone prepaid piece price. Main can be cheaper overall when a checked bag is certain.",
      },
      {
        title: "Buying baggage for an HX-operated flight",
        details:
          "Prepay at least four hours ahead after confirming the zone and need. The purchase is generally not refundable merely because the bag is unused.",
      },
      {
        title: "A bag is both heavy and 170 cm",
        details:
          "Calculate both the route-zone overweight amount and the 158–203 cm oversize charge. Hong Kong Airlines states that weight and size charges accumulate.",
      },
      {
        title: "Traveling with a bicycle",
        details:
          "Provide at least 48 hours' notice and budget the special handling example rather than treating it as an ordinary extra piece.",
      },
    ],
    exceptions: [
      "Prepaid baggage requires eligible HX marketing and operation and closes four hours before departure.",
      "Unused prepaid baggage is generally nonrefundable.",
      "Overweight and oversize charges can accumulate; pieces above 32 kg or 203 cm must be repacked or split.",
      "Bicycles require 48-hour pre-advice, and codeshares can follow another carrier's allowance.",
    ],
    comparisonLinks: [
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/china-airlines", label: "China Airlines" },
      { href: "/airlines/china-eastern", label: "China Eastern" },
      { href: "/airlines/hainan", label: "Hainan Airlines" },
    ],
  },
  "malaysia-airlines": {
    intro: {
      carryOn:
        "Malaysia Airlines Economy includes one 7 kg cabin bag plus a personal item. The more important distinction is checked baggage: many routes use a total-weight allowance, while Africa and Americas itineraries use a piece allowance.",
      personalItem:
        "The included personal item does not turn Economy into a two-carry-on allowance. Keep the main cabin bag within 7 kg and the personal item small enough for under-seat use.",
      checkedBag:
        "The ticketed allowance must be read in the correct system. On a weight-concept trip, excess is sold by kilogram; on Africa and Americas piece-concept trips, another bag and an overweight bag are different chargeable conditions.",
      restrictions:
        "The main traps are applying a per-kilogram example to a piece route, waiting until the airport and losing the advance discount, or assuming a very large special item will travel as normal baggage. Items above 204 cm may require cargo handling.",
    },
    verificationNote:
      "Malaysia Airlines' 2026 allowance updates, weight-versus-piece system, Enrich and oneworld benefits, 20% advance discount, excess examples, and special-baggage limits were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Look for a kilogram allowance or a piece count on the ticket before pricing an extra bag; the two systems use different fee logic.",
      "When eligible, buy extra baggage online or through the call centre at least 24 hours before departure for 20% off the applicable rate.",
      "On weight routes, remove unnecessary kilograms rather than buying another suitcase—the charge follows total excess weight.",
      "Contact the airline before taking a special item near 204 cm because it may need MASKargo instead of ordinary check-in.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=malaysia-airlines&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Weight-concept routes",
        details:
          "Many routes provide a total checked-weight allowance. Published excess examples begin at USD 15 per kg in Zone 1 and rise by zone, so the relevant calculation is excess kilograms rather than bag count.",
      },
      {
        name: "Africa and Americas piece routes",
        details:
          "These itineraries use a piece allowance. Malaysia Airlines publishes a USD 280 additional-piece example and a separate USD 83 Economy overweight example up to 32 kg; verify the route before applying either figure.",
      },
      {
        name: "Advance extra baggage",
        details:
          "Eligible purchases made online or through the call centre up to 24 hours before departure receive 20% off. The discount applies to the route's underlying per-kilogram or per-piece rate.",
      },
      {
        name: "Enrich and oneworld status",
        details:
          "Enrich Silver adds 10 kg on eligible Malaysia Airlines flights, while higher Enrich and oneworld tiers vary by cabin and route. Confirm exclusions rather than treating status as a universal free bag.",
      },
    ],
    scenarios: [
      {
        title: "A weight-route ticket is 5 kg over allowance",
        details:
          "Price five excess kilograms using the applicable zone. Adding another physical suitcase does not erase the excess because the checked allowance is still measured by combined weight.",
      },
      {
        title: "An Americas ticket needs one additional bag",
        details:
          "Treat this as an additional-piece purchase, not a per-kilogram charge. The published example is USD 280 before any eligible 20% advance discount.",
      },
      {
        title: "An Economy piece weighs 28 kg",
        details:
          "On the published Africa or Americas piece example, 23–32 kg creates an USD 83 overweight surcharge. If it is also an extra piece, do not assume the overweight charge replaces the extra-piece fee.",
      },
      {
        title: "A special item measures more than 204 cm",
        details:
          "Normal oversize payment may not solve acceptance. Malaysia Airlines says items above 204 cm may need cargo or another logistics provider, so arrange carriage before airport check-in.",
      },
    ],
    exceptions: [
      "The 20% advance discount closes 24 hours before departure and depends on purchase eligibility.",
      "Africa and Americas routes use the piece system; many other routes use combined checked weight.",
      "Special baggage above 158 cm or 32 kg can incur a surcharge, while items above 204 cm may require cargo.",
      "Partner-operated segments and Enrich or oneworld exclusions can change the ticketed allowance.",
    ],
    comparisonLinks: [
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/china-airlines", label: "China Airlines" },
    ],
  },
  "garuda-indonesia": {
    intro: {
      carryOn:
        "Garuda Economy includes one 7 kg cabin bag plus a personal item. The checked-bag decision is unusually date-sensitive because Garuda is changing from kilogram allowances to pieces during 2026.",
      personalItem:
        "The personal item does not increase the main Economy bag's 7 kg ceiling. Keep it small enough for under-seat use instead of treating it as another full-size cabin piece.",
      checkedBag:
        "For tickets purchased or issued before September 1, 2026, many Garuda tables remain weight-based and price excess in 5 kg route-zone blocks. Tickets issued from that date move to a piece system on Garuda-operated flights.",
      restrictions:
        "The ticket issue date is a pricing rule, not a footnote. Applying the new piece system to an older ticket—or the June 2026 five-kilogram table to a newer ticket—can produce the wrong allowance and excess cost.",
    },
    verificationNote:
      "Garuda's June 12, 2026 route-zone tables, September 1 piece-system transition, status changes, cabin allowance, and special-baggage treatment were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Check the ticket issue date before reading any Garuda allowance or excess table.",
      "For pre-transition tickets, calculate excess in 5 kg blocks using the domestic or international route zone; do not estimate per bag.",
      "For September 1, 2026 and later tickets, use the new piece allowance only on Garuda-operated flights and recheck any codeshare.",
      "Confirm large sports or bulky items before travel because packing, aircraft, and cargo limits can override ordinary baggage treatment.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=garuda-indonesia&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Before September 1, 2026",
        details:
          "Many tickets use a kilogram allowance. The June 12, 2026 excess table prices domestic and outbound international routes in 5 kg zone blocks.",
      },
      {
        name: "From September 1, 2026",
        details:
          "Tickets purchased or issued from this date use a piece concept on Garuda-operated flights. The included count and excess treatment must come from the new ticket rules.",
      },
      {
        name: "Pre-transition route zones",
        details:
          "Published examples vary by domestic or international zone and can range roughly from IDR 220,000 to 714,000 per 5 kg. The origin and destination determine the block price.",
      },
      {
        name: "GarudaMiles and SkyTeam",
        details:
          "Elite benefits also transition from additional kilograms to piece or discount logic according to ticket date. Apply the benefit under the same system as the ticket.",
      },
    ],
    scenarios: [
      {
        title: "An August 2026 ticket is 7 kg over",
        details:
          "Use the applicable pre-transition route-zone table and purchase enough 5 kg blocks to cover the excess. Do not price it as one new piece.",
      },
      {
        title: "A September 2026 ticket needs another bag",
        details:
          "Use the new piece-concept rules for Garuda-operated flights. Confirm the issue date and operator rather than applying the older per-5 kg table.",
      },
      {
        title: "The itinerary includes a codeshare",
        details:
          "Do not assume Garuda's new piece system controls the partner segment. Check the operating carrier and ticketed allowance for the full journey.",
      },
      {
        title: "Traveling with bulky sports equipment",
        details:
          "Start with the ticket-date baggage system, then check route zone, dimensions, packing, and aircraft limits. Ordinary excess payment may not guarantee acceptance.",
      },
    ],
    exceptions: [
      "The September 1, 2026 piece transition is based on ticket purchase or issue date and applies to Garuda-operated flights.",
      "Earlier tickets can use route-zone excess pricing in 5 kg increments.",
      "GarudaMiles and SkyTeam benefits change with the same ticket-date transition.",
      "Codeshares, bulky items, and sports equipment require separate operator and acceptance checks.",
    ],
    comparisonLinks: [
      { href: "/airlines/malaysia-airlines", label: "Malaysia Airlines" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
      { href: "/airlines/batik-air", label: "Batik Air" },
    ],
  },
  "vietnam-airlines": {
    intro: {
      carryOn:
        "Vietnam Airlines' cabin allowance is route- and aircraft-sensitive: Economy and Premium Economy receive 10–12 kg on published route groups, Business receives 18 kg, and ATR72 flights drop to 7 kg.",
      personalItem:
        "A personal item is included, but the route's total cabin allowance remains the controlling limit. The ATR72 exception is especially important on a connecting itinerary with a smaller domestic aircraft.",
      checkedBag:
        "Most eligible fares include checked baggage, then Vietnam Airlines uses published domestic and international tables for another piece, overweight baggage, and oversize baggage. Those are separate conditions rather than one generic excess fee.",
      restrictions:
        "The cost can change by domestic versus international travel, international zone, peak period, and whether one piece is both heavy and large. Special equipment is also priced outside the ordinary checked-bag table unless an exception applies.",
    },
    verificationNote:
      "Vietnam Airlines' route-specific cabin limits, 2026 domestic excess update, international zone and peak tables, overweight and oversize pricing, status benefits, and infant allowances were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Check every aircraft on the itinerary: an ATR72 segment reduces the cabin allowance to 7 kg even when a longer segment allows more.",
      "Separate the problem into extra piece, overweight, and oversize before calculating cost; one bag can trigger more than one table.",
      "Use the correct domestic or international zone and check whether peak pricing applies instead of relying on the lowest published example.",
      "Apply eligible Lotusmiles extra pieces before buying baggage: Titanium and Gold receive one, while Platinum and Million Miler receive two.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=vietnam-airlines&weight=28&size=64", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=10", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Domestic extra baggage",
        details:
          "For tickets issued or changed from June 1, 2026, the airport table lists VND 650,000 for a standard domestic excess piece. A domestic overweight or oversize condition is listed separately at VND 800,000.",
      },
      {
        name: "International zones and seasons",
        details:
          "International standard excess starts from USD 110 in the published off-peak table, but the amount changes by zone and can be higher in peak periods. Overweight starts from USD 80 and oversize from USD 110.",
      },
      {
        name: "Cabin allowance by route and aircraft",
        details:
          "Economy and Premium Economy receive 10–12 kg depending on route, Business receives 18 kg, and ATR72-operated flights use a 7 kg limit. Use the lowest applicable segment limit when packing through an aircraft change.",
      },
      {
        name: "Lotusmiles extra pieces",
        details:
          "Eligible Titanium and Gold members receive one additional 23 kg piece; Platinum and Million Miler members receive two. The benefit applies on eligible Vietnam Airlines-operated flights.",
      },
    ],
    scenarios: [
      {
        title: "Adding one standard bag on a domestic trip",
        details:
          "After using the fare's included allowance, the current airport example is VND 650,000 for a standard extra piece on eligible tickets issued or changed from June 1, 2026.",
      },
      {
        title: "A domestic bag weighs 25 kg",
        details:
          "A piece between 23 and 32 kg enters the domestic overweight table, currently VND 800,000. If it is also an additional piece, calculate both conditions rather than using only the heavier-bag fee.",
      },
      {
        title: "An international piece is 170 cm",
        details:
          "A piece from 158 to 203 cm enters the international oversize table, starting at USD 110 and rising by zone. Weight and extra-piece exposure must still be checked separately.",
      },
      {
        title: "A long-haul itinerary connects to an ATR72",
        details:
          "Pack for the ATR72's 7 kg cabin limit rather than the higher allowance on the long-haul segment, or move the difference into the checked allowance before travel.",
      },
    ],
    exceptions: [
      "International excess prices vary by zone and peak period; the lowest USD example is not a universal price.",
      "ATR72-operated flights use a 7 kg cabin allowance.",
      "Lap infants receive one 23 kg piece to or from the Americas but 10 kg on many other routes, plus a stroller.",
      "Sports equipment and other special baggage can use separate charges instead of the standard excess table.",
    ],
    comparisonLinks: [
      { href: "/airlines/vietjet-air", label: "VietJet Air" },
      { href: "/airlines/thai-airways", label: "Thai Airways" },
      { href: "/airlines/malaysia-airlines", label: "Malaysia Airlines" },
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
    ],
  },
  "batik-air": {
    intro: {
      carryOn:
        "Batik Air includes cabin baggage. Economy is listed as one cabin bag up to 7 kg plus one personal item.",
      personalItem:
        "The personal item is included with the Economy cabin allowance. The practical issue is staying within the one-bag, 7 kg cabin limit.",
      checkedBag:
        "Batik Air's free baggage allowance is the FBA printed on the ticket and can use weight or pieces. Same-PNR passengers checking in together can pool eligible weight, while prepaid baggage adds 5–30 kg per passenger.",
      restrictions:
        "Prepaid baggage closes six hours before departure and tops out at 30 kg per passenger. It adds weight to the allowance but does not permit a single checked piece above 32 kg.",
    },
    verificationNote:
      "Batik Air Indonesia's 2026 FBA rules, weight and piece systems, same-PNR pooling, 5–30 kg prepaid blocks, six-hour cutoff, and infant rules were fully reviewed on 2026-08-23.",
    avoidFees: [
      "Read the FBA on the ticket rather than assuming every Batik fare includes the same kilograms.",
      "Pool eligible weight with same-PNR companions by checking in together before buying more baggage.",
      "Buy only the needed 5 kg block up to the 30 kg maximum and complete the purchase at least six hours before departure.",
      "Split any piece above 32 kg even when the combined FBA and prepaid allowance is sufficient.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=batik-air&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Ticketed FBA",
        details:
          "The free allowance depends on route, fare, passenger count, and baggage system. The FBA printed on the booking is the starting point.",
      },
      {
        name: "Same-PNR pooling",
        details:
          "Passengers on the same booking can combine eligible weight when they present baggage together. Pooling does not lift the 32 kg maximum for one piece.",
      },
      {
        name: "Prepaid 5–30 kg",
        details:
          "Batik sells 5, 10, 15, 20, 25, or 30 kg blocks until six hours before departure. Airport excess applies beyond FBA plus prepaid weight.",
      },
      {
        name: "Infants and special items",
        details:
          "Lap infants have no checked allowance, although an infant stroller can travel free. Sports gear can count within allowance when it meets item and aircraft limits.",
      },
    ],
    scenarios: [
      {
        title: "Two companions are on one booking",
        details:
          "Check in together and pool eligible weight before purchasing more. A light bag can offset a heavier companion bag only within the individual 32 kg handling limit.",
      },
      {
        title: "The trip needs 12 kg above FBA",
        details:
          "Buy a 15 kg block rather than 10 kg, because prepaid baggage is sold in five-kilogram increments and airport excess applies above the purchased total.",
      },
      {
        title: "A single checked piece weighs 34 kg",
        details:
          "Repack it even if enough weight was prepaid. Batik caps an ordinary checked piece at 32 kg.",
      },
      {
        title: "Traveling with an infant",
        details:
          "Do not budget an infant checked allowance. A stroller used by the infant can be tagged as free special baggage, but the infant otherwise has no FBA.",
      },
    ],
    exceptions: [
      "Prepaid baggage is sold in 5 kg blocks, closes six hours before departure, and is capped at 30 kg per passenger.",
      "Same-PNR pooling requires passengers to check bags together and does not lift the 32 kg per-piece maximum.",
      "Lap infants have no free checked allowance, although an eligible stroller can travel free.",
      "Sports and oversize items remain subject to packing, route, and aircraft acceptance.",
    ],
    comparisonLinks: [
      { href: "/airlines/garuda-indonesia", label: "Garuda Indonesia" },
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/malaysia-airlines", label: "Malaysia Airlines" },
      { href: "/airlines/scoot", label: "Scoot" },
    ],
  },
  "wizz-air": {
    intro: {
      carryOn:
        "Wizz Air includes only one small under-seat item in the Basic fare. A trolley bag requires WIZZ Priority, which adds a 10 kg cabin bag and prices by route, season, and timing.",
      personalItem:
        "The free bag is the 40 x 30 x 20 cm under-seat item. If the bag needs the overhead bin, it is no longer the free path.",
      checkedBag:
        "Wizz Air checked baggage is an add-on model. Travelers buy 10 kg, 20 kg, or 32 kg checked-bag products, and prices vary by route, season, and purchase timing.",
      restrictions:
        "The main Wizz Air fee risks are assuming Basic includes a normal carry-on, buying the wrong checked-bag weight, airport excess-weight charges, paid seats, and fee-based flight changes.",
    },
    verificationNote:
      "Wizz Air carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Measure the under-seat item before booking. Basic works only if the bag fits 40 x 30 x 20 cm.",
      "Compare WIZZ Priority against checked baggage when you need a trolley bag.",
      "Buy the correct checked-bag weight before the airport; excess baggage is charged per additional kg at the airport.",
      "Skip paid seat selection when random check-in assignment is acceptable.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=wizz-air&weight=22&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules?height=16&width=12&depth=8", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic",
        details:
          "Basic includes one small under-seat item. A normal trolley bag requires WIZZ Priority or checked baggage.",
      },
      {
        name: "WIZZ Priority",
        details:
          "WIZZ Priority includes the small personal item plus one 10 kg trolley bag up to 55 x 40 x 23 cm.",
      },
      {
        name: "Checked baggage add-ons",
        details:
          "Checked baggage is bought as 10 kg, 20 kg, or 32 kg allowances, with route-, season-, and timing-based price ranges.",
      },
      {
        name: "Seats and changes",
        details:
          "Random seat assignment can be free at check-in. Online flight changes are fee-based, with a higher amount within 14 days of departure.",
      },
    ],
    scenarios: [
      {
        title: "Flying with the free bag only",
        details:
          "The free path is one 40 x 30 x 20 cm under-seat item and no trolley or checked bag.",
      },
      {
        title: "Need an overhead trolley",
        details:
          "WIZZ Priority is the cabin-bag path because it adds a 10 kg trolley bag.",
      },
      {
        title: "Checking a 20 kg bag",
        details:
          "The 20 kg checked-bag add-on has a EUR 15 to EUR 85 range depending on route, season, and purchase timing.",
      },
      {
        title: "Changing close to departure",
        details:
          "Online flight changes are EUR 40 more than 14 days before departure and EUR 50 within 14 days, plus any fare difference.",
      },
    ],
    exceptions: [
      "Ticket refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "Wizz Air does not offer an unaccompanied-minor service; passengers under 14 must travel with an adult.",
      "No Wizz Air co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/easyjet", label: "easyJet" },
      { href: "/airlines/vueling", label: "Vueling" },
      { href: "/airlines/norwegian", label: "Norwegian" },
    ],
  },
  jetblue: {
    intro: {
      carryOn:
        "JetBlue includes one carry-on bag and one personal item on every current fare, including Main Base and EvenMore Base. The cabin-bag allowance is not the main JetBlue fee trap.",
      personalItem:
        "A personal item is included; the practical question is whether the item fits JetBlue's under-seat expectations for the aircraft and seat area.",
      checkedBag:
        "JetBlue checked-bag pricing is fare-, route-, date-, and timing-sensitive. On the U.S., Latin America, Caribbean, and Canada chart, the first bag is generally paid on Main and EvenMore fares unless a status, card, or premium-cabin benefit applies. Transatlantic Main and EvenMore Standard or Flex fares include the first bag, while Base fares do not.",
      restrictions:
        "Main Base and EvenMore Base include cabin bags but charge USD 150 per person to change or cancel. Standard and Flex fares remove that fee, although fare differences can still apply; same-day flexibility also differs by tier.",
    },
    verificationNote:
      "JetBlue's current fare names, checked-bag tables, carry-on inclusion, change rules, status benefits, and card exceptions were reviewed against JetBlue-published sources on 2026-09-27. JetBlue introduced the Base, Standard, and Flex structure in July 2026, so older Blue and Blue Plus labels should not be used to price a new booking.",
    avoidFees: [
      "Add the first two checked bags at least 24 hours before departure when the published chart applies; JetBlue says this can save up to USD 10 per bag.",
      "Compare a Base fare with Standard before booking when plans may change. One USD 150 change or cancellation charge can erase a small fare saving.",
      "Check the travel dates as well as the route. JetBlue's first- and second-bag prices rise during published peak periods.",
      "Do not assume a JetBlue-branded card always waives a bag. The recurring first-bag benefit is tied to eligible Plus or Premier cards and JetBlue-operated flights.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/checked-baggage-calculator?airline=jetblue&travelers=2&bags=1&directions=2&trips=1&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=jetblue&travelers=2&bags=1&trips=2&pay=yes", label: "Card bag-benefit calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
    ],
    fareClasses: [
      {
        name: "Main Base / EvenMore Base",
        details:
          "Base includes one carry-on and one personal item but charges USD 150 per person to change or cancel. Advance seat selection is not bundled. On transatlantic routes, the first checked bag is also paid.",
      },
      {
        name: "Main / EvenMore",
        details:
          "Standard fares have no change or cancellation fee, although a fare difference can apply. A first checked bag is paid on the regional chart but included on transatlantic itineraries; same-day changes or standby cost USD 100 where eligible.",
      },
      {
        name: "Main Flex / EvenMore Flex",
        details:
          "Flex removes the change or cancellation fee and includes eligible same-day changes and standby. The checked-bag treatment still follows the route family rather than becoming universally free.",
      },
      {
        name: "Mint / Mint Flex",
        details:
          "Mint includes two checked bags under the published tables. Mint and Mint Flex have separate flexibility and refund treatment, so do not apply the Main fare ladder to a premium-cabin ticket.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Mosaic 1 includes the first checked bag; Mosaic 2 through 4 include the first two under JetBlue's published benefit table.",
      "Eligible JetBlue Plus and Premier cardmembers receive a first-bag benefit for themselves and up to three companions on JetBlue-operated flights; the no-annual-fee JetBlue Card does not publish that recurring benefit.",
      "Overweight, oversized, and excess-piece charges are separate and can stack. Some destinations also restrict overweight bags.",
    ],
    comparisonLinks: [
      { href: "/airlines/alaska", label: "Alaska Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/american", label: "American Airlines" },
    ],
  },
  american: {
    intro: {
      carryOn:
        "American includes one carry-on bag and one personal item on all fares.",
      personalItem:
        "The personal item still needs to meet American's size and placement requirements, so soft under-seat bags are safer than rigid totes.",
      checkedBag:
        "American's checked-bag model is route-, ticket-date-, fare-family-, and purchase-channel based. Domestic and short-haul pricing distinguishes online versus airport payment, while longer international examples use separate route tables rather than one universal first-bag rule.",
      restrictions:
        "American's fee traps are route, fare-family, and timing based: Basic Economy can now cost more for domestic and short-haul checked bags, same-day confirmed change starts at USD 60 on eligible domestic itineraries, and seat pricing varies by product.",
    },
    verificationNote:
      "American's seat, same-day-change, and unaccompanied-minor rules were rechecked on 2026-11-07. Carry-on, baggage, card/status, military, sports-equipment, and Basic Economy rows retain their separate record-level verification dates.",
    avoidFees: [
      "Pay for checked bags online when American offers a lower online price; the airport price is higher on the newer domestic and short-haul pricing structure.",
      "Check the ticket issue date before estimating bags. American's checked-bag pricing changes by ticketing window, fare family, and whether the bag is added online or at the airport.",
      "Price Basic Economy against Main Cabin when checking bags. On newer domestic and short-haul tickets, Basic Economy can be USD 5 higher for the same first or second bag position.",
      "For repeat domestic American trips, run the card bag-benefit math before paying cash for first checked bags.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/checked-baggage-calculator?airline=american&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=american&travelers=2&bags=1&trips=2&pay=yes", label: "American card bag math" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
    ],
    fareClasses: [
      {
        name: "Basic Economy",
        details:
          "Carry-on is included for all fares, but Basic Economy has its own checked-bag trap on many domestic and short-haul tickets issued on or after May 18, 2026: the first bag is USD 50 online or USD 55 at the airport, and the second bag is USD 60 online or USD 65 at the airport. Older ticketing windows and longer international routes can use different rules.",
      },
      {
        name: "Economy (non-Basic)",
        details:
          "For Main Cabin/Economy tickets issued on or after April 9, 2026, the domestic and short-haul first bag is USD 45 online or USD 50 at the airport, and the second bag is USD 55 online or USD 60 at the airport. Earlier ticketing windows and route-specific international pricing can differ.",
      },
      {
        name: "Main Cabin seat products",
        details:
          "Preferred seats and Main Cabin Extra are separate, flight-dependent purchases. A paid seat position does not by itself change the checked-bag allowance or Basic Economy restrictions.",
      },
      {
        name: "Premium cabins",
        details:
          "This page is focused on the Economy/Main Cabin facts available here; do not read it as a full premium-cabin allowance chart.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "American includes one carry-on bag and one personal item.",
      },
      {
        title: "Checking one standard bag on a U.S., Canada, or short-haul international trip",
        details:
          "For Main Cabin/Economy (non-Basic), the first-bag baseline is USD 45 online or USD 50 at the airport on tickets issued on or after April 9, 2026. For Basic Economy tickets issued on or after May 18, 2026, it is USD 50 online or USD 55 at the airport.",
      },
      {
        title: "Checking two standard bags on a newer domestic or short-haul ticket",
        details:
          "For Main Cabin/Economy (non-Basic), the second checked bag is USD 55 online or USD 60 at the airport on tickets issued on or after April 9, 2026. For Basic Economy tickets issued on or after May 18, 2026, it is USD 60 online or USD 65 at the airport.",
      },
      {
        title: "Checking one overweight bag",
        details:
          "American lists overweight pricing at USD 100 each way for 51-70 lbs and USD 200 each way for 71-100 lbs.",
      },
      {
        title: "Checking one standard bag on a transatlantic trip",
        details:
          "The first-bag amount shown here is USD 75 each way for Economy (non-Basic) on U.S. to Europe itineraries.",
      },
    ],
    exceptions: [
      "Same-day standby is USD 0 on eligible domestic fares.",
      "Checked-bag pricing is split by ticketing date and fare family: pre-April 9, 2026 domestic, Canada, and short-haul international tickets remain at USD 35 prepaid or USD 40 at the airport for the first bag and USD 45 prepaid or USD 50 at the airport for the second bag; Main Cabin/Economy tickets issued on or after April 9, 2026 use the newer USD 45/50 and USD 55/60 online-versus-airport structure; Basic Economy tickets issued on or after May 18, 2026 are USD 5 higher for those same bag positions.",
      "This airline fee table does not model elite-status or co-branded-card waivers directly; use the card-benefit guide for verified American checked-bag card benefits.",
    ],
    comparisonLinks: [
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/alaska", label: "Alaska Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
    ],
  },
  united: {
    intro: {
      carryOn:
        "United's main cabin-bag risk is fare-specific: Basic Economy is more restrictive than regular Economy, so do not assume every cheap United fare includes the same overhead-bin access.",
      personalItem:
        "A personal-item-only strategy is safest on Basic Economy. On small United Express aircraft, keep the item soft enough to fit into tighter under-seat spaces.",
      checkedBag:
        "United's checked-bag model is ticket-date, market, fare, and payment-channel based. In most markets on Economy (non-Basic) tickets purchased on or after April 3, 2026, the first and second checked bags are cheaper when prepaid online than when paid at the airport.",
      restrictions:
        "Basic Economy is the restriction product: changes and cancellations are listed as not permitted after 24 hours, while advance seat assignment is priced in the live booking flow rather than at one reliable systemwide amount.",
    },
    verificationNote:
      "United's seat-selection and change/cancellation rules were rechecked on 2026-11-07. Baggage and card/status rows retain their separate record-level verification dates; the unaccompanied-minor fee still needs an accessible official confirmation.",
    avoidFees: [
      "Prepay checked bags online when United offers an online-versus-airport difference; the airport amount is higher in the newer most-market pricing.",
      "Avoid Basic Economy when you need normal flexibility, advance seat control, or reliable cabin-bag access. The low fare can shift costs into seats and restrictions.",
      "Use United's trip-specific bag calculator for markets not covered by the simple most-market pricing, especially international or mixed-itinerary travel.",
      "For repeat United travel, check whether a verified United card benefit beats paying cash for checked bags; many United bag benefits depend on using the eligible card correctly.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/checked-baggage-calculator?airline=united&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=united&travelers=2&bags=1&trips=2&pay=yes", label: "United card bag math" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
    ],
    fareClasses: [
      {
        name: "Basic Economy",
        details:
          "Basic Economy is where United's fee stack starts. It can restrict full-size carry-on access and post-booking flexibility, while advance seat selection is a paid, route- and seat-map-dependent add-on.",
      },
      {
        name: "Economy (non-Basic)",
        details:
          "Economy (non-Basic) is the cleaner product if you need normal flexibility. On newer tickets, the first and second checked bags are cheaper online than at the airport, standard seat selection is included, and no change fee is listed apart from any fare difference.",
      },
      {
        name: "Economy Plus",
        details:
          "Economy Plus is a paid seat product rather than a different baggage fare family. Price it separately from the checked-bag decision instead of treating the upsell as a bag allowance.",
      },
      {
        name: "Premium cabins",
        details:
          "This is an Economy-focused reference; premium-cabin baggage and cancellation rules can follow separate allowance and fare-rule tables.",
      },
    ],
    scenarios: [
      {
        title: "Traveling without a checked bag",
        details:
          "If you are buying Basic Economy, verify cabin-bag access before relying on the overhead bin. If you are buying regular Economy, the bigger fee exposure usually moves to seats and checked bags.",
      },
      {
        title: "Checking one standard bag on a U.S. domestic trip",
        details:
          "United lists USD 45 prepaid online or USD 50 at the airport for the first checked bag in Economy (non-Basic) on tickets purchased on or after April 3, 2026.",
      },
      {
        title: "Checking three bags on a newer ticket",
        details:
          "United lists USD 200 each way for the third checked bag on tickets purchased on or after April 3, 2026, in most markets, with trip-specific pricing handled in United's baggage fee calculator.",
      },
      {
        title: "Purchasing a seat on Basic Economy",
        details:
          "United prices advance seat assignment in the live booking flow. Use the displayed itinerary-specific amount instead of assuming a systemwide starting price.",
      },
      {
        title: "Changing a non-Basic domestic itinerary",
        details:
          "Change pricing is USD 0 for Economy (non-Basic), with fare difference applying.",
      },
    ],
    exceptions: [
      "Economy (non-Basic) shows no change fee, with fare difference applying.",
      "Checked-bag pricing is split by ticket purchase date: pre-April 3, 2026 most-market pricing remains at USD 35, USD 45, and USD 150, while later-ticket pricing moves to USD 45, USD 55, and USD 200 in most markets.",
      "United card benefits can offset checked-bag fees, but many United card baggage benefits require paying with the eligible card. Check the card-benefit guide before assuming the waiver applies.",
    ],
    comparisonLinks: [
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/alaska", label: "Alaska Airlines" },
      { href: "/airlines/air-canada", label: "Air Canada" },
    ],
  },
  delta: {
    intro: {
      carryOn:
        "Delta includes one carry-on bag and one personal item on all fares.",
      personalItem:
        "The personal item still needs to meet Delta's size and placement requirements, so soft under-seat bags are safer than rigid totes.",
      checkedBag:
        "Delta's domestic bag baseline is easy to price, but the full model still depends on route, fare, and exceptions. The common domestic chart shows paid first and second standard checked bags before card, status, military, or cabin exceptions; international and exception cases should not be collapsed into one flat fee.",
      restrictions:
        "Delta Basic Economy is not mainly a carry-on trap. The bigger risk is flexibility: Basic change or cancellation fees differ by region, and older Basic tickets can still have stricter no-change treatment.",
    },
    verificationNote:
      "Delta's seat-selection and same-day-change rules were rechecked on 2026-11-07. Carry-on, checked-bag, card, status, military, change/cancellation, overweight, and oversize rows retain their separate record-level verification dates.",
    avoidFees: [
      "Do not treat Basic Economy as a carry-on restriction; Delta's bigger Basic risk is change and cancellation flexibility.",
      "Check card, Medallion, military, and cabin exceptions before paying the domestic first-bag amount shown in the common chart.",
      "Keep checked bags under the standard weight and size limits. Delta's overweight and oversized fees can quickly matter more than the base first-bag fee.",
      "For repeat Delta domestic travel, use the card bag-benefit calculator before paying cash for first checked bags.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/checked-baggage-calculator?airline=delta&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=delta&travelers=2&bags=1&trips=2&pay=yes", label: "Delta card bag math" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
    ],
    fareClasses: [
      {
        name: "Basic Economy",
        details:
          "Basic keeps the normal carry-on allowance, so flexibility is the catch. Current U.S./Canada-origin Main Basic and Comfort Basic change or cancellation fees are $99 for nearby regions and $199 for long-haul regions; older tickets can follow different treatment.",
      },
        {
          name: "Economy (non-Basic)",
          details:
          "Economy (non-Basic) keeps the USD 45 and USD 55 domestic bag baseline, but the practical advantage over Basic is flexibility: the listed U.S./Canada-origin regions show no change or cancellation fee for Classic/Main-style tickets.",
        },
      {
        name: "Main Cabin seat products",
        details:
          "Preferred seats are a separate, flight-dependent purchase. Do not confuse a paid seat position with a fare upgrade that changes baggage or flexibility rules.",
      },
      {
        name: "Medallion-linked same-day products",
        details:
          "Same-day confirmed change is USD 75 for eligible fares, but Diamond, Platinum, and Gold Medallion members have the fee waived.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "Delta includes one carry-on bag and one personal item on all fares.",
      },
      {
        title: "Checking one standard domestic bag",
        details:
          "The common domestic chart lists the first standard checked bag at USD 45 each way before card, status, cabin, or military exceptions.",
      },
      {
        title: "Checking two standard domestic bags",
        details:
          "The second standard checked bag is USD 55 each way in the common domestic chart.",
      },
      {
        title: "Checking one overweight bag",
        details:
          "Delta lists overweight pricing at USD 100 each way for 51-70 lbs and USD 200 each way for 71-100 lbs.",
      },
      {
        title: "Changing a Basic Economy long-haul itinerary",
        details:
          "The long-haul Basic Economy example shown here lists change or cancellation pricing at USD 199 each way; other regions and ticket dates can follow different rules.",
      },
    ],
    exceptions: [
      "Same-day confirmed change is waived for Diamond, Platinum, and Gold Medallion members.",
      "Economy (non-Basic) shows no change or cancellation fee in the listed regions, but fare difference can still apply.",
      "Basic Economy can differ by ticket era: the current regional groups show USD 99 or USD 199 change/cancellation pricing, while older Basic Economy tickets purchased before Nov. 6, 2025 can still be listed as not permitted.",
    ],
    comparisonLinks: [
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
      { href: "/airlines/jetblue", label: "JetBlue" },
    ],
  },
  alaska: {
    intro: {
      carryOn:
        "Alaska does not charge a carry-on fee here: one carry-on bag up to 22 x 14 x 9 inches and one personal item are included on all fares, including Saver.",
      personalItem:
        "The smaller personal item is included with the cabin bag allowance, so the practical issue is fit, not a separate personal-item fee.",
      checkedBag:
        "Alaska's standard North America bag price is now ticketing-date sensitive. On most North American routes ticketed on or after April 10, 2026, the first checked bag is USD 45 and the second is USD 55; earlier ticketed bookings retain the prior USD 40 and USD 45 amounts. The former online/mobile prepay discount is no longer part of the newer structure.",
      restrictions:
        "Saver is the most restrictive fare family after the 24-hour cancellation window, while preferred seats may cost extra in Main Cabin.",
    },
    verificationNote:
      "Alaska's seat-selection and child-travel rules were rechecked on 2026-11-07. Current bag prices, carry-on inclusion, excess-bag charges, benefit exceptions, and cancellation rules retain their separate record-level verification dates.",
    avoidFees: [
      "Use the ticketing date first. Alaska's North America checked-bag pricing changed on April 10, 2026, so an old reservation and a new reservation can price differently.",
      "Do not treat Alaska as one domestic bag ladder. Wholly within Hawaii, First Class, and international Main Cabin examples have their own baggage treatment.",
      "Keep the trip carry-on-only when possible. Saver still includes one carry-on and one personal item, so the main Saver tradeoff is flexibility rather than overhead-bin access.",
      "If you fly Alaska repeatedly with checked bags, compare the cash bag bill against the verified Alaska card baggage benefit before paying bag fees trip by trip.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/checked-baggage-calculator?airline=alaska&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=alaska&travelers=2&bags=1&trips=2&pay=yes", label: "Alaska card bag math" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
    ],
    fareClasses: [
      {
        name: "Saver",
        details:
          "Saver still includes one carry-on bag and one personal item, so the problem is not overhead-bin access. The tradeoff is flexibility after the 24-hour cancellation window.",
      },
      {
        name: "Main Cabin",
        details:
          "Main Cabin uses the newer USD 45 and USD 55 most-route North America checked-bag baseline on flights ticketed on or after April 10, 2026. Standard seat selection is listed at USD 0, while preferred seats remain variable.",
      },
      {
        name: "Preferred seating products",
        details:
          "Preferred seats are listed separately with variable pricing on top of Main Cabin.",
      },
      {
        name: "First Class and route exceptions",
        details:
          "Alaska's bag pricing is not one universal domestic ladder. First Class receives two checked bags, while intrastate Hawaii and international Main Cabin examples use separate baggage treatment.",
      },
    ],
    scenarios: [],
    exceptions: [
      "All fares show a full refund when canceled within 24 hours of booking.",
      "Mileage Plan elite members, eligible co-branded cardholders, Atmos Rewards status holders, and eligible Alaska and Hawaii resident programs such as Club 49 and Huaka'i can receive baggage benefits or exceptions under Alaska's program terms.",
      "Strollers, car seats, mobility aids or medical assistive devices, qualifying pineapple from Hawaii, and qualifying wine shipments have special baggage treatment under Alaska's baggage exceptions.",
      "First Class includes two checked bags at 70 lbs each.",
      "Pre-April 10, 2026 most-route baggage pricing remains at USD 40 for the first bag and USD 45 for the second bag.",
    ],
    comparisonLinks: [
      { href: "/airlines/southwest", label: "Southwest Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/jetblue", label: "JetBlue" },
    ],
  },
  spirit: {
    intro: {
      carryOn:
        "Spirit Airlines ceased operations on May 2, 2026, so this page should be read as a historical fee reference for old Spirit tickets, refunds, and comparisons rather than current booking advice. Spirit's former fee model started with one personal item at USD 0; a full-size carry-on was either included through Premium Economy or Spirit First, or priced for Value based on when and where the bag was purchased.",
      personalItem:
        "Under Spirit's former model, the free item was the under-seat personal item. If the bag needed the overhead bin, it was no longer the free-bag path.",
      checkedBag:
        "Checked baggage was not a flat universal first-bag fee. Value and Premium Economy used route- and timing-based paid checked-bag pricing, while Spirit First included the first checked bag.",
      restrictions:
        "For historical Spirit fares, the key split was Value versus the bundled travel options. Value was where bag timing mattered most; Premium Economy and Spirit First included more upfront.",
    },
    verificationNote:
      "Spirit ceased operations on May 2, 2026. The historical Spirit travel-option, carry-on, checked-bag, change/cancellation, and unaccompanied-minor details shown here were last verified on 2026-05-06. Overweight and oversize details were last verified on 2025-12-24.",
    statusUpdate: {
      label: "Airline no longer operating",
      body: "Spirit cancelled all flights during its May 2, 2026 wind-down. The rows below are an archive for old-ticket, refund, and historical comparison work—not current booking guidance.",
    },
    avoidFees: [
      "Do not use old Spirit fee math to plan a new trip. Since Spirit is no longer operating, compare replacement carriers instead.",
      "For an old disrupted Spirit booking, focus first on refund rights and the payment channel used to buy the ticket.",
      "For historical comparisons, Spirit's cheapest legitimate path was personal-item-only travel; the moment a full-size carry-on or checked bag was needed, the fare stopped being a simple base-price comparison.",
      "When comparing replacement low-cost carriers, check whether the new airline prices bags by route, timing, bundle, or airport purchase.",
    ],
    relatedGuides: [
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
    ],
    fareClasses: [
      {
        name: "Value",
        details:
          "Value was Spirit's unbundled product. The personal item was included, but carry-on pricing depended on purchase timing and checked-bag pricing depended on route and purchase timing.",
      },
      {
        name: "Personal-item-only travel",
        details:
          "One under-seat personal item is included at USD 0.",
      },
      {
        name: "Premium Economy and Spirit First",
        details:
          "Premium Economy includes a carry-on bag with no change or cancellation fee. Spirit First includes a carry-on bag, the first checked bag, and no change or cancellation fee.",
      },
      {
        name: "Change and cancellation policy",
        details:
          "Value is the fee-based change/cancellation path, while Premium Economy and Spirit First show no change or cancellation fee. Fare difference can still apply.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Spirit Airlines is no longer operating scheduled flights; use this page as historical context, not current booking guidance.",
      "Premium Economy and Spirit First show no change or cancellation fee, with fare difference still possibly applying.",
      "No elite-status or co-branded-card checked-bag waiver is shown here for Spirit.",
    ],
    comparisonLinks: [
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/easyjet", label: "easyJet" },
    ],
  },
  frontier: {
    intro: {
      carryOn:
        "Frontier includes one personal item up to 14 × 18 × 8 inches. A full-size carry-on up to 24 × 16 × 10 inches and 35 lbs is priced separately on Basic but included with Economy, Premium, and Business; a Basic-fare bag costs less when solved at booking instead of the airport or gate.",
      personalItem:
        "The free 14 × 18 × 8 inch item must fit under the seat. Frontier says its size is checked during boarding, so an overpacked personal item can turn the cheapest fare into a gate charge.",
      checkedBag:
        "Basic does not include a checked bag. A standard checked bag is limited to 40 lbs and 62 linear inches, and its base price depends on travel date and purchase timing. Overweight and oversize charges are added separately.",
      restrictions:
        "For bookings made on or after September 25, 2026, Basic Fare and Standard cost USD 149 to change within 59 days of departure or to cancel. Economy Fare and Economy, Premium, or Business bundles list no change or cancellation fee, although fare differences can still apply.",
    },
    verificationNote:
      "Frontier carry-on pricing logic and current bundle inclusions were rechecked against Frontier-published sources on 2026-11-06. Checked-bag, overweight, oversize, and change/cancellation records retain their individual verification dates; older booking-date rows remain visible because Frontier applies different change fees to earlier reservations.",
    avoidFees: [
      "Decide on bags before checkout. Frontier's carry-on and checked-bag pricing is timing-sensitive, so late airport or gate decisions can change the economics of the fare.",
      "If you need flexibility, compare Basic Fare or Standard against Economy, Premium, or Business bundles before booking; those bundles show no change or cancellation fee.",
      "Keep bags under 40 lbs and within 62 linear inches when possible. Frontier's overweight and oversize charges are separate from the base bag purchase.",
      "For personal-item-only trips, measure the bag shape, not just the label. Frontier's cheapest path depends on the item fitting under the seat.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/excess-baggage-calculator?airline=frontier&weight=51&size=62", label: "Overweight and oversize calculator" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Restricted fare guide" },
    ],
    fareClasses: [
      {
        name: "Basic Fare / Standard",
        details:
          "For bookings made on or after September 25, 2026, changes remain free at least 60 days before departure but cost USD 149 within 59 days. Cancellation is USD 149 per passenger, per direction. Earlier 2026 bookings retain their older fee ladders.",
      },
      {
        name: "Economy / Premium / Business bundle",
        details:
          "Economy includes a personal item, carry-on, standard seat, and no change/cancel fee. Premium adds a premium seat and Board First with overhead-bin space. Business adds two checked bags up to 50 lbs each and UpFront Plus seating. Bundle prices still vary by itinerary.",
      },
      {
        name: "Personal-item-only travel",
        details:
          "One under-seat personal item is included at USD 0.",
      },
      {
        name: "Paid carry-on and checked-bag products",
        details:
          "Carry-on pricing depends on purchase timing, and checked-bag pricing depends on both route and purchase timing. That is why Frontier bag math should be done before the airport.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Economy and Premium include a carry-on but not a checked bag; Business includes two checked bags up to 50 lbs each.",
      "Frontier checks personal-item and carry-on dimensions during boarding. An item outside the limit can trigger an additional charge.",
      "Overweight and oversize charges are separate from the route- and timing-dependent base bag price.",
      "Basic Fare and Standard show a USD 0 change amount when the request is made 60 or more days before departure; the paid tier inside that window depends on the original booking date.",
    ],
    comparisonLinks: [
      { href: "/airlines/southwest", label: "Southwest Airlines" },
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/easyjet", label: "easyJet" },
    ],
  },
  ryanair: {
    intro: {
      carryOn:
        "Ryanair includes only the small under-seat bag in the base fare. Overhead-bin access is usually solved through Priority & 2 Cabin Bags, which includes the small bag plus a 10 kg cabin bag and prices by route and timing.",
      personalItem:
        "The included personal bag is the small 40 x 30 x 20 cm item that must fit under the seat in front. That is the real free allowance; a normal roller bag is a separate decision.",
      checkedBag:
        "Ryanair checked baggage is an add-on model, not a universal included allowance. The 10 kg and 20 kg checked-bag ranges change by route, season, and purchase timing, while excess weight is charged per additional kg at the airport.",
      restrictions:
        "The main Ryanair trap is solving the bag too late. Priority, checked bags, seats, and flight changes all have route, timing, or channel rules that can make a cheap base fare less cheap.",
    },
    verificationNote:
      "Ryanair's small-bag allowance, Priority cabin-bag rules, current checked-bag ranges, gate handling, and excess-weight charge were rechecked against Ryanair-published sources on 2026-09-27. Seat, refund, and minor-travel records retain their individual verification dates.",
    avoidFees: [
      "Measure the under-seat bag before booking. If it cannot stay within 40 x 30 x 20 cm, compare Priority & 2 Cabin Bags against a checked-bag add-on before prices or availability change.",
      "Buy the correct bag product before the airport. Ryanair's checked-bag ranges depend on route, season, and purchase timing, while excess weight is charged per kg at the airport.",
      "Skip paid seat selection only if a random seat is acceptable. Standard seats can be free at check-in if you do not buy a seat, but that trades control for savings.",
      "Use the online change path when a change is unavoidable. The online flight-change fee is lower than the airport or call-center fee.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/excess-baggage-calculator?airline=ryanair&weight=22&size=62", label: "Excess baggage calculator" },
      { href: "/sizer-rules?height=16&width=12&depth=8", label: "Sizer rules" },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
    ],
    fareClasses: [
      {
        name: "Basic fare",
        details:
          "The base fare includes only the small under-seat personal bag. It is the cheapest path only when the traveler can genuinely fit within the 40 x 30 x 20 cm allowance.",
      },
      {
        name: "Priority & 2 Cabin Bags",
        details:
          "This add-on includes the small personal bag plus a 10 kg cabin bag up to 55 x 40 x 20 cm. The price range depends on route and timing.",
      },
      {
        name: "10 kg and 20 kg checked-bag add-ons",
        details:
          "Checked baggage is purchased separately. Price ranges vary by route, season, and purchase timing rather than one flat first-bag fee.",
      },
      {
        name: "Seats and changes",
        details:
          "Random seating can be free at check-in, while selected seats and flight changes are paid products with separate standard, extra-legroom, online, and airport/call-center pricing.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "Ryanair does not offer an unaccompanied-minor service; passengers under 16 must travel with an adult aged 18 or over.",
      "This fee table does not show a co-branded credit-card baggage waiver for Ryanair.",
    ],
    comparisonLinks: [
      { href: "/airlines/easyjet", label: "easyJet" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/jetblue", label: "JetBlue" },
    ],
  },
  easyjet: {
    intro: {
      carryOn:
        "easyJet includes one small under-seat cabin bag by default. The larger cabin bag is a paid add-on or comes through an eligible Inclusive Plus fare or easyJet Plus membership benefit, so the cheapest fare is not automatically overhead-bin friendly.",
      personalItem:
        "The included small cabin bag is 45 x 36 x 20 cm and must fit under the seat in front. That is the baseline personal-item-style allowance.",
      checkedBag:
        "easyJet checked baggage is purchased as a hold-bag allowance rather than treated as one flat first-bag fee. The 15 kg and 23 kg hold-bag ranges vary by route, season, and purchase timing; excess weight is charged per additional kg at the airport.",
      restrictions:
        "The practical easyJet decision is whether to buy a large cabin bag directly, use an eligible fare or membership benefit, or move the weight into a hold bag before the GBP 60 gate path applies.",
    },
    verificationNote:
      "easyJet's small- and large-cabin-bag rules, GBP 60 gate charge, membership/fare benefits, hold-bag limits, and excess-weight rules were rechecked against easyJet-published sources on 2026-09-27. Older seat, change, and child-travel records retain their individual verification dates.",
    avoidFees: [
      "Start with bag size. If the trip fits inside the included 45 x 36 x 20 cm small cabin bag, the base fare can stay clean.",
      "If you need the larger cabin bag, add it before the airport or verify that Inclusive Plus or easyJet Plus covers it. A seat location alone should not be treated as proof of a bag entitlement.",
      "Buy hold baggage before the airport when you need it. The 15 kg and 23 kg ranges vary by route, season, and purchase timing, and excess weight is a separate per-kg airport charge.",
      "Do not rely on refunds for ordinary plan changes. Tickets are not refundable except for flight cancellation or qualifying circumstances.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/tools/excess-baggage-calculator?airline=easyjet&weight=51&size=62", label: "Excess baggage calculator" },
      { href: "/sizer-rules?height=18&width=14&depth=8", label: "Sizer rules" },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
    ],
    fareClasses: [
      {
        name: "Standard small-bag path",
        details:
          "The included allowance is one small cabin bag up to 45 x 36 x 20 cm. It must fit under the seat, so a standard roller bag does not fit the free baseline.",
      },
      {
        name: "Large cabin bag path",
        details:
          "The 56 x 45 x 25 cm large cabin bag is purchased as an add-on or included through an eligible Inclusive Plus fare or easyJet Plus membership benefit. Availability and prices vary by flight and timing.",
      },
      {
        name: "15 kg and 23 kg hold bags",
        details:
          "Hold baggage is bought as a weight allowance. The 15 kg and 23 kg options have separate ranges that vary by route, season, and purchase timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seats can be free by random assignment at check-in, while Up Front and Extra Legroom seats are paid products. Flight changes are allowed for a fee plus fare difference.",
      },
    ],
    scenarios: [],
    exceptions: [
      "Ticket refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "easyJet does not offer an unaccompanied-minor service; passengers under 16 must travel with an adult.",
      "This fee table does not show a co-branded credit-card baggage waiver for easyJet.",
    ],
    comparisonLinks: [
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/jetblue", label: "JetBlue" },
    ],
  },
  "aix-connect": {
    intro: {
      carryOn:
        "AIX Connect follows Air India Express-aligned baggage rules. Carry-on is limited to one piece up to 7 kg.",
      personalItem:
        "AIX Connect does not list a separate paid personal-item charge here. The cabin-bag issue is the 7 kg one-piece limit.",
      checkedBag:
        "AIX Connect includes checked baggage on most eligible fares, but the allowance differs between domestic India and international routes. Excess baggage is charged separately by route and weight.",
      restrictions:
        "The main AIX Connect fee risks are exceeding the included allowance, airport overweight handling, paid seat selection, and restrictive fare-rule change or cancellation costs.",
    },
    verificationNote:
      "AIX Connect carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the trip is domestic India or international before assuming the checked-bag allowance.",
      "Pre-purchase excess baggage where available if the free allowance will not be enough.",
      "Keep the cabin bag at or below 7 kg and checked bags within the per-bag limits.",
      "Skip paid seat selection when seat location does not matter.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=aix-connect&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Domestic India",
        details:
          "The checked-bag allowance can differ from international routes, so domestic itineraries should be checked against the exact ticket.",
      },
      {
        name: "International",
        details:
          "International routes can have a different included allowance and excess-baggage treatment.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage applies when the free allowance is exceeded, with fees driven by route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and paid. Change and cancellation costs depend on fare rules and timing, with lowest fares the most restrictive.",
      },
    ],
    scenarios: [
      {
        title: "Domestic India trip with one checked bag",
        details:
          "Check the domestic allowance before buying extra baggage; the allowance is not necessarily the same as an international route.",
      },
      {
        title: "International route with extra weight",
        details:
          "Excess baggage depends on route and weight, and pre-purchase may be available before airport handling.",
      },
      {
        title: "Carry-on-only trip",
        details:
          "The carry-on allowance is one piece up to 7 kg, so a heavy cabin bag can break the plan.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service is generally not offered.",
      },
    ],
    exceptions: [
      "AIX Connect policy is aligned with Air India Express rules in the current fee details.",
      "Unaccompanied-minor service is generally not offered.",
      "No AIX Connect co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/indigo", label: "IndiGo" },
      { href: "/airlines/spicejet", label: "SpiceJet" },
      { href: "/airlines/vistara", label: "Vistara" },
    ],
  },
  "spring-airlines": {
    intro: {
      carryOn:
        "Spring Airlines is an add-on-sensitive carrier. Carry-on is limited to one piece, and the weight and size limits depend on fare type.",
      personalItem:
        "Some basic fares may restrict cabin baggage, so the personal-item question is really a fare-type question rather than a universal free allowance.",
      checkedBag:
        "Checked baggage is included only on select fare products. On most fares, checked baggage is bought separately by weight package and route.",
      restrictions:
        "The main Spring Airlines fee risks are booking a fare with too little cabin or checked baggage, buying the wrong weight package, paid seat selection, restrictive change rules, and no unaccompanied-minor service.",
    },
    verificationNote:
      "Spring Airlines carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor details were last verified on 2025-12-24.",
    avoidFees: [
      "Check the fare type before assuming a normal cabin-bag allowance.",
      "Buy the right checked-bag weight package before the airport when baggage is needed.",
      "Do not exceed the purchased checked-bag allowance because overweight charges apply at the airport.",
      "Skip optional seat selection if seat location is not important.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=spring-airlines&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic / restricted fares",
        details:
          "Some basic fares may restrict cabin baggage, making the carry-on rule part of the fare comparison.",
      },
      {
        name: "Fare products with baggage",
        details:
          "Checked baggage is included only on select fare products.",
      },
      {
        name: "Purchased weight packages",
        details:
          "Checked baggage is usually purchased by weight package and route rather than included by default.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and paid. Change and cancellation fees depend on fare product and timing.",
      },
    ],
    scenarios: [
      {
        title: "Booking the lowest fare",
        details:
          "Check the cabin-bag restriction before assuming the fare works with your bag.",
      },
      {
        title: "Adding checked baggage",
        details:
          "Buy the weight package that matches the actual bag; the fee depends on package and route.",
      },
      {
        title: "Bag exceeds purchased allowance",
        details:
          "Overweight charges apply when the checked bag exceeds the purchased allowance.",
      },
      {
        title: "Minor traveling alone",
        details:
          "Unaccompanied-minor service is generally not offered.",
      },
    ],
    exceptions: [
      "Unaccompanied-minor service is generally not offered.",
      "Some basic fares may restrict cabin baggage; verify the fare type before booking.",
      "No Spring Airlines co-branded card baggage waiver is listed in the current fee details.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-china", label: "Air China" },
      { href: "/airlines/china-southern", label: "China Southern" },
      { href: "/airlines/hainan", label: "Hainan Airlines" },
      { href: "/airlines/xiamenair", label: "XiamenAir" },
    ],
  },
  zipair: {
    intro: {
      carryOn:
        "ZIPAIR includes one cabin bag plus one personal item, but both items share a combined 7 kg carry-on weight limit. That combined limit is the first rule to check before assuming a ZIPAIR trip can stay cabin-only.",
      personalItem:
        "The personal item is not extra weight. It counts toward the same combined 7 kg cabin allowance as the cabin bag.",
      checkedBag:
        "ZIPAIR checked baggage is not included by default. It is purchased as an add-on by weight, with the baggage price driven by route and purchase timing rather than one flat first-bag fee.",
      restrictions:
        "ZIPAIR is an optional-service model: checked bags, extra baggage weight, seats, sports equipment, and changes are separate add-on decisions. Unaccompanied-minor service is not offered.",
    },
    verificationNote:
      "ZIPAIR carry-on, checked-bag, route-price, and excess-baggage details were reverified against the current official baggage page on 2026-11-09.",
    avoidFees: [
      "Weigh cabin items together because the carry-on row uses a combined 7 kg limit across the cabin bag and personal item.",
      "Buy checked baggage by weight before travel when needed; ZIPAIR checked baggage is not included by default.",
      "Choose enough checked-bag weight in advance because excess weight beyond the purchased allowance is charged at airport rates.",
      "Skip paid seat selection if seat location is not important, and do not book ZIPAIR for an unaccompanied minor because the service is not offered.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/sports_equipment", label: "Sports equipment" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=zipair&travelers=1&bags=1&directions=2&trips=1&pay=yes&route=Los+Angeles+%28LAX%29+to+Tokyo+%28NRT%29", label: "ZIPAIR route bag calculator" },
      { href: "/tools/excess-baggage-calculator?airline=zipair&weight=31&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "All fares",
        details:
          "ZIPAIR works more like an optional-service structure than a fare-family ladder with included baggage tiers.",
      },
      {
        name: "Cabin-only travel",
        details:
          "Cabin-only travel means one cabin bag and one personal item together up to 7 kg. If laptop, camera, clothing, and souvenirs push the combined weight over 7 kg, the trip may need a paid checked-bag weight allowance.",
      },
      {
        name: "Checked-baggage add-on structure",
        details:
          "Checked baggage is purchased by weight and is not included by default. The useful ZIPAIR baggage cost is the add-on price shown for the exact route, weight package, and purchase timing.",
      },
      {
        name: "Seat and change products",
        details:
          "Seat selection is listed as an optional paid add-on, and flight changes are listed as fee-based with fare difference possibly applying.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "The cabin-only path allows one cabin bag and one personal item together up to 7 kg. Weigh both together, not separately.",
      },
      {
        title: "Adding one ZIPAIR checked bag",
        details:
          "Checked baggage is purchased by weight, with price depending on route and purchase timing. Use the route preset links before checkout to decide whether the base fare still wins.",
      },
      {
        title: "Arriving at the airport with excess checked-bag weight",
        details:
          "ZIPAIR does not publish a normal overweight tier above 30 kg. Repack so every piece is 30 kg or less; an additional unpurchased piece is charged the route's checked-bag fee plus an airport processing fee.",
      },
      {
        title: "Traveling as an unaccompanied minor",
        details:
          "ZIPAIR does not offer unaccompanied-minor service.",
      },
    ],
    exceptions: [
      "No fare-bundle, elite-status, or co-branded card checked-bag waiver is listed for ZIPAIR.",
    ],
    comparisonLinks: [
      { href: "/airlines/jetstar-japan", label: "Jetstar Japan" },
      { href: "/airlines/jetstar-asia", label: "Jetstar Asia" },
      { href: "/airlines/ana", label: "ANA" },
      { href: "/airlines/jal", label: "Japan Airlines" },
    ],
  },
};

const AIRLINE_FAQS: Record<string, AirlineFaq[]> = {
  alaska: [
    {
      question: "How much does Alaska Airlines charge for checked baggage?",
      answer:
        "For most North America tickets issued on or after April 10, 2026, Alaska charges $45 for the first checked bag, $55 for the second, and $200 for each third or additional bag. Route, cabin, ticket date, status, card benefits, and resident programs can change those amounts.",
    },
    {
      question: "Does Alaska Airlines charge for a carry-on?",
      answer:
        "No standard carry-on fee is published. Saver and Main Cabin include one carry-on up to 22 by 14 by 9 inches plus one personal item, although Saver boards last and overhead space is first come, first served.",
    },
    {
      question: "Does Alaska Saver include a checked bag?",
      answer:
        "Saver uses the same standard checked-baggage allowance as Main Cabin, which means a checked bag is normally paid on North America routes unless a card, status, cabin, military, or route-specific exception applies.",
    },
    {
      question: "Can I save money by prepaying Alaska baggage online?",
      answer:
        "Not under the current North America structure for tickets issued on or after April 10, 2026. Alaska removed the previous $5 online or mobile prepayment discount when the new fees took effect.",
    },
    {
      question: "Are Alaska baggage fees different for Hawaii or international flights?",
      answer:
        "Yes. Wholly intra-Hawaii travel retains a $30 first bag and $40 second bag, while Alaska publishes separate Main Cabin allowances for Asia, Europe, and Oceania. Check the itinerary instead of applying the North America ladder universally.",
    },
  ],
  "air-canada": [
    {
      question: "How much does Air Canada charge for a checked bag?",
      answer:
        "It depends on route, fare, and ticket date. For current published short-haul tiers, Basic and Standard charge CAD/USD 45 for the first bag and 60 for the second; Flex includes the first bag. On listed long-haul tiers, Basic charges CAD/USD 90 then 120, while Standard and Flex include the first bag and charge 120 for the second. Taxes may apply.",
    },
    {
      question: "Does Air Canada Standard include a checked bag?",
      answer:
        "Not universally. Standard pays for the first bag on Air Canada's current short-haul tier but includes it on the listed long-haul tier. Use the baggage calculator or booking confirmation for the exact itinerary.",
    },
    {
      question: "Does Air Canada Basic include a carry-on?",
      answer:
        "Some Economy Basic itineraries purchased on or after January 3, 2025 include only one personal item. An onward international connection can change the allowance, so check the official carry-on lookup for the ticket.",
    },
    {
      question: "What is Air Canada's overweight baggage fee?",
      answer:
        "Air Canada publishes route-dependent overweight charges in a CAD 100 to 225 range for bags over 23 kg and up to 32 kg. The normal checked-bag fee may also apply, and heavier bags must travel as cargo rather than ordinary checked baggage.",
    },
    {
      question: "What is Air Canada's extra baggage fee?",
      answer:
        "For an additional bag above the ticket's standard allowance, Air Canada's current Canadian fee schedule lists CAD 100 to 120 within Canada and between Canada and the U.S., or CAD 225 to 270 for the Caribbean, Mexico, Central America, and other international destinations. Use Air Canada's calculator for the itinerary-specific amount and allowance.",
    },
    {
      question: "Does an Aeroplan credit card give a free checked bag?",
      answer:
        "Eligible Aeroplan cardholders and up to eight companions on the same reservation can receive one free checked bag up to 23 kg on Air Canada, Rouge, or Express flights. The bag must be presented at Air Canada check-in before security; gate-checked bags are excluded.",
    },
  ],
  "air-france": [
    {
      question: "How much does Air France charge for baggage?",
      answer:
        "Air France baggage charges depend on the itinerary, fare family, and purchase path. Additional checked baggage is priced during purchase or in My Bookings, while overweight and oversized baggage are airport-priced by itinerary.",
    },
    {
      question: "Why does Air France not show one baggage price?",
      answer:
        "Air France separates included baggage allowance, additional checked baggage, and excess baggage. The final baggage price can change by route, fare, timing, and whether the itinerary touches Canada or the USA.",
    },
    {
      question: "What are Air France excess baggage fees?",
      answer:
        "Air France excess baggage fees apply when a bag is above the ticketed weight allowance or over the standard-size limit. Overweight bags up to 32 kg and oversized bags over 158 cm are priced at the airport by itinerary.",
    },
    {
      question: "How much does it cost to check a bag on Air France?",
      answer:
        "First check whether your fare already includes checked baggage. If you need an additional checked bag, the price is shown during purchase or in My Bookings for the exact itinerary and fare.",
    },
    {
      question: "How much is a 23 kg extra bag on Air France?",
      answer:
        "Air France does not publish one universal price for a 23 kg extra bag. In Economy and Premium, 23 kg is the maximum weight for a standard additional piece; its itinerary-specific price appears during booking or in My Bookings. This is different from an overweight charge, which applies when one bag exceeds the weight allowance on your ticket and is paid at the airport.",
    },
    {
      question: "Can you save by buying Air France baggage online?",
      answer:
        "Air France lists an online discount for additional baggage bought at least 24 hours before departure, except on flights from or to Canada and the USA, where the online and airport prices are the same.",
    },
    {
      question: "What is Air France's international baggage allowance?",
      answer:
        "There is no single international allowance across every Air France ticket. The included number of checked bags depends on the cabin, fare, itinerary, and operating carrier. Air France says to use the baggage allowance shown on the ticket and to check partner-airline rules for partner-operated segments.",
    },
  ],
  zipair: [
    {
      question: "What is ZIPAIR baggage allowance?",
      answer:
        "ZIPAIR includes one cabin bag plus one personal item, but both items share a combined 7 kg carry-on weight limit. Checked baggage is not included by default and is purchased separately by weight.",
    },
    {
      question: "How much is a ZIPAIR checked bag?",
      answer:
        "ZIPAIR checked bag fees are route-, weight-, and timing-dependent. The useful price is the add-on quote shown during booking or manage booking, not one universal first-bag fee.",
    },
    {
      question: "How do ZIPAIR Tokyo baggage fees work?",
      answer:
        "For Tokyo routes such as Los Angeles, San Francisco, Honolulu, Seoul, Bangkok, or Singapore to or from Narita, start with ZIPAIR's included 7 kg combined cabin allowance. Checked baggage is then purchased separately by route, weight allowance, and timing.",
    },
    {
      question: "What is the ZIPAIR checked bag weight limit?",
      answer:
        "A ZIPAIR checked-bag purchase covers one piece up to 30 kg. ZIPAIR permits up to five checked pieces, each no larger than 203 cm in total dimensions, and does not publish a standard overweight tier above 30 kg.",
    },
    {
      question: "What is the ZIPAIR extra baggage fee?",
      answer:
        "Each additional ZIPAIR checked piece is charged separately at the route price. If you arrive with more pieces than you purchased, ZIPAIR charges the additional checked-bag fee plus a separate airport processing fee; airport payment is by credit card.",
    },
    {
      question: "Does ZIPAIR have international baggage allowance?",
      answer:
        "ZIPAIR's international baggage model starts with the included 7 kg combined cabin allowance. Checked baggage is a separate add-on by route and weight, so international baggage allowance should be priced for the specific flight.",
    },
  ],
};

function airlineFaqJsonLd(slug: string) {
  const faqs = AIRLINE_FAQS[slug];
  if (!faqs?.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": canonical(`/airlines/${slug}#faq`),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function deriveTiming(timing: unknown): DerivedTiming {
  const raw = typeof timing === "string" ? timing.trim() : "";
  if (!raw) return { pricingUnit: "Not published", whenCharged: "Not published", extraForConditions: null };
  const v = raw.toLowerCase();

  if (v === "each way" || v === "one-way" || v === "per direction") {
    return { pricingUnit: "per direction", whenCharged: "Not published", extraForConditions: null };
  }
  if (v.includes("at booking") && v.includes("manage")) {
    return { pricingUnit: "Not published", whenCharged: "at booking / manage trip", extraForConditions: null };
  }
  if (v === "at booking") return { pricingUnit: "Not published", whenCharged: "at booking", extraForConditions: null };
  if (v === "manage trip" || v === "manage booking") {
    return { pricingUnit: "Not published", whenCharged: "manage trip", extraForConditions: null };
  }
  if (v === "check-in / boarding" || v === "check-in" || v === "boarding") {
    return { pricingUnit: "Not published", whenCharged: "check-in / boarding", extraForConditions: null };
  }
  if (v === "at airport") return { pricingUnit: "Not published", whenCharged: "at airport", extraForConditions: null };

  return { pricingUnit: "Not published", whenCharged: raw, extraForConditions: null };
}

function appendToConditions(conditions: unknown, extra: string | null): string {
  const c = typeof conditions === "string" ? conditions.trim() : "";
  if (!extra) return c || "Not published";
  if (!c) return extra;
  return `${c}; ${extra}`;
}

function safeText(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "Not published";
}

function readerCopy(text: string): string {
  return text
    .replaceAll("The current dataset does not publish", "The official sources reviewed do not provide")
    .replaceAll("This dataset does not publish", "The official sources reviewed do not provide")
    .replaceAll("The dataset does not publish", "The official sources reviewed do not provide")
    .replaceAll("this dataset", "the official sources reviewed")
    .replaceAll("This dataset", "The official sources reviewed")
    .replaceAll("the dataset", "the official sources reviewed")
    .replaceAll("The dataset", "The official sources reviewed")
    .replaceAll("current dataset", "official sources reviewed")
    .replaceAll("current fee table", "published policy")
    .replaceAll("fee table", "published policy")
    .replaceAll("rows shown here", "published policy details shown here")
    .replaceAll("published rows shown on this page", "published fees shown here")
    .replaceAll("published rows included in the current fee table", "published fees included here")
    .replaceAll("published rows below", "published fees below")
    .replaceAll("Published rows below", "Published fees below")
    .replaceAll("row-level source checks", "source checks for the fees")
    .replaceAll("Last verified support on this page comes from", "Last verified dates come from")
    .replaceAll("does not publish", "does not provide a broadly applicable price for");
}

function safeUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  try {
    return new URL(s).toString();
  } catch {
    return null;
  }
}

function getLatestVerifiedDate(fees: FeeItem[]): string {
  const dates = fees
    .map((fee) => (typeof fee.last_verified === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fee.last_verified) ? fee.last_verified : ""))
    .filter(Boolean);
  return dates.length ? dates.sort().at(-1)! : "Not published";
}

function getOldestVerifiedDate(fees: FeeItem[]): string {
  const dates = fees
    .map((fee) => (typeof fee.last_verified === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fee.last_verified) ? fee.last_verified : ""))
    .filter(Boolean)
    .sort();
  return dates.at(0) ?? "Not published";
}

function formatAmount(amount: unknown, currency: unknown): string {
  const cur = typeof currency === "string" ? currency.trim() : "";
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return cur ? `${amount.toFixed(2)} ${cur}` : amount.toFixed(2);
  }
  if (typeof amount === "string" && amount.trim()) {
    return cur ? `${amount.trim()} ${cur}` : amount.trim();
  }
  return "Not published";
}

function formatContextualAmount(row: FeeItem): string {
  if (typeof row.amount === "number" && Number.isFinite(row.amount)) return formatAmount(row.amount, row.currency);
  if (typeof row.amount !== "string" || !row.amount.trim()) return "Not published";

  const raw = row.amount.trim();
  if (raw.toLowerCase() !== "varies") return formatAmount(row.amount, row.currency);

  const text = [row.conditions, row.applies_to, row.region_or_route, row.timing, row.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (row.category === "checked_baggage" && (text.includes("additional") || text.includes("my bookings") || text.includes("purchase"))) {
    return "Shown during booking / manage booking";
  }
  if (row.category === "checked_baggage") return "Depends on route and fare";
  if (row.category === "carry_on" && text.includes("basic")) return "Basic fare add-on shown in booking";
  if (row.category === "carry_on") return "Depends on fare and purchase timing";
  if (row.category === "overweight_baggage") return "Airport-priced by route and weight";
  if (row.category === "oversize_baggage") return "Airport-priced by route and size";
  if (row.category === "seat_selection") return "Depends on route, fare, and seat type";
  if (row.category === "change_cancellation") return "Depends on fare conditions";
  if (row.category === "unaccompanied_minor") return "Depends on age and itinerary";

  return "Depends on route, fare, or timing";
}

function prettyCategoryLabel(category: string): string {
  const c = category.replace(/_/g, " ").trim();
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : category;
}

function summarizeRows(fees: FeeItem[]) {
  const firstBag = fees.find(
    (row) =>
      row.category === "checked_baggage" &&
      typeof row.conditions === "string" &&
      row.conditions.toLowerCase().includes("1st")
  );
  const carryOn = fees.find((row) => row.category === "carry_on");
  const seat = fees.find((row) => row.category === "seat_selection");
  const change = fees.find((row) => row.category === "change_cancellation");

  return [
    firstBag
      ? {
          label: "First bag pressure point",
          value: formatAmount(firstBag.amount, firstBag.currency),
          detail: safeText(firstBag.conditions),
          href: "/fees/checked_baggage",
        }
      : null,
    carryOn
      ? {
          label: "Carry-on policy",
          value: formatAmount(carryOn.amount, carryOn.currency),
          detail: safeText(carryOn.conditions),
          href: "/fees/carry_on",
        }
      : null,
    seat
      ? {
          label: "Seat upsell signal",
          value: formatAmount(seat.amount, seat.currency),
          detail: safeText(seat.conditions),
          href: "/fees/seat_selection",
        }
      : null,
    change
      ? {
          label: "Change flexibility",
          value: formatAmount(change.amount, change.currency),
          detail: safeText(change.conditions),
          href: "/fees/change_cancellation",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; detail: string; href: string }>;
}

function getNumericCheckedBagFees(fees: FeeItem[]): Array<[number, number]> {
  return [1, 2, 3]
    .map((ordinal) => {
      const fee = findCheckedBagFeeUsd(fees, ordinal);
      return fee == null ? null : ([ordinal, fee] as [number, number]);
    })
    .filter(Boolean) as Array<[number, number]>;
}

function getAirlineScenarioLinks(slug: string, airlineName: string): Array<{
  title: string;
  body: string;
  href: string;
  cta: string;
}> {
  const enc = encodeURIComponent(slug);

  if (slug === "zipair") {
    return [
      {
        title: "Cabin-only under 7 kg",
        body: "Start here if the cabin bag and personal item together stay under ZIPAIR's combined 7 kg cabin allowance.",
        href: "/sizer-rules?weight=7",
        cta: "Check cabin-bag fit",
      },
      {
        title: "One traveler, one checked bag",
        body: "Use this when ZIPAIR's base fare looks cheap but the trip probably needs a paid checked-bag weight allowance.",
        href: `/tools/checked-baggage-calculator?airline=${enc}&travelers=1&bags=1&directions=2&trips=1&pay=yes`,
        cta: "Price one bag",
      },
      {
        title: "Two travelers, leisure trip",
        body: "Best for Tokyo leisure trips where both travelers may need a checked-bag allowance instead of relying on cabin weight.",
        href: `/tools/checked-baggage-calculator?airline=${enc}&travelers=2&bags=1&directions=2&trips=1&pay=yes`,
        cta: "Estimate trip baggage",
      },
      {
        title: "Purchased allowance is not enough",
        body: "Use this when a normal checked piece may exceed ZIPAIR's 30 kg acceptance limit. Repack it into another paid piece before check-in.",
        href: `/tools/excess-baggage-calculator?airline=${enc}&bags=1&directions=2&weight=24&size=62`,
        cta: "Check excess risk",
      },
    ];
  }

  return [
    {
      title: "One traveler, one checked bag",
      body: `Price a basic roundtrip bag setup before you decide whether ${airlineName} is actually cheaper than a competing fare.`,
      href: `/tools/checked-baggage-calculator?airline=${enc}&travelers=1&bags=1&directions=2&trips=1&pay=yes`,
      cta: "Price one bag",
    },
    {
      title: "Two travelers, repeat trips",
      body: "Best when bag fees may repeat across the year and the annual total matters more than one ticket price.",
      href: `/tools/checked-baggage-calculator?airline=${enc}&travelers=2&bags=1&directions=2&trips=2&pay=yes`,
      cta: "Estimate annual bag cost",
    },
    {
      title: "Card break-even math",
      body: "Check whether first-bag savings alone can justify an eligible airline card before considering any other card benefit.",
      href: `/best-cards?airline=${enc}&travelers=2&bags=1&trips=2&pay=yes`,
      cta: "Run card math",
    },
    {
      title: "Heavy or oversized bag",
      body: "A normal checked-bag fee is not the whole bill once weight or size limits are crossed.",
      href: `/tools/excess-baggage-calculator?airline=${enc}&bags=1&directions=2&weight=51&size=63`,
      cta: "Check excess risk",
    },
  ];
}

function getPopularRouteLinks(slug: string): Array<{
  route: string;
  body: string;
  href: string;
}> {
  if (slug !== "zipair") return [];

  const enc = encodeURIComponent(slug);
  const routes = [
    {
      route: "Los Angeles (LAX) to Tokyo (NRT)",
      body: "A long-haul ZIPAIR preset for testing one paid checked-bag allowance before treating the base fare as the final trip price.",
      travelers: 1,
      bags: 1,
    },
    {
      route: "San Francisco (SFO) to Tokyo (NRT)",
      body: "Useful for comparing a low fare against a trip that still needs a paid checked-bag weight allowance.",
      travelers: 1,
      bags: 1,
    },
    {
      route: "Honolulu (HNL) to Tokyo (NRT)",
      body: "Good leisure-trip preset when two travelers may each need one checked-bag allowance.",
      travelers: 2,
      bags: 1,
    },
    {
      route: "Tokyo (NRT) to Seoul (ICN)",
      body: "Cabin-light preset for a shorter route where the combined 7 kg cabin limit may decide whether a bag is needed.",
      travelers: 1,
      bags: 0,
    },
    {
      route: "Tokyo (NRT) to Bangkok (BKK)",
      body: "International preset for checking whether a paid weight allowance should be priced before checkout.",
      travelers: 1,
      bags: 1,
    },
    {
      route: "Tokyo (NRT) to Singapore (SIN)",
      body: "Use this when the fare looks cheap but checked baggage or seat choice may change the real trip total.",
      travelers: 1,
      bags: 1,
    },
  ];

  return routes.map((item) => ({
    route: item.route,
    body: item.body,
    href: `/tools/checked-baggage-calculator?airline=${enc}&travelers=${item.travelers}&bags=${item.bags}&directions=2&trips=1&pay=yes&route=${encodeURIComponent(item.route)}`,
  }));
}

function AirlineScenarioLinks({ slug, airlineName }: { slug: string; airlineName: string }) {
  if (!DECISION_SCENARIO_SLUGS.has(slug)) return null;

  const scenarios = getAirlineScenarioLinks(slug, airlineName);
  const routeLinks = getPopularRouteLinks(slug);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Common trip setups
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Jump straight into the right calculator scenario
          </h2>
        </div>
        <Link href="/fees/checked_baggage" className="text-sm font-semibold text-blue-700 underline">
          Checked baggage reference
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <Link
            key={scenario.href}
            href={scenario.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50"
          >
            <h3 className="text-base font-bold text-slate-950">{scenario.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{scenario.body}</p>
            <div className="mt-4 text-sm font-bold text-blue-700 underline">{scenario.cta}</div>
          </Link>
        ))}
      </div>
      {routeLinks.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Popular ZIPAIR route starts
          </div>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            Start with a common ZIPAIR route, then confirm the baggage quote.
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
            These links do not invent route-specific baggage prices. They prefill the calculator with a ZIPAIR route and bag plan, then show whether a reliable estimate is possible or ZIPAIR checkout is still required.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {routeLinks.map((link) => (
              <Link
                key={link.route}
                href={link.href}
                className="rounded-xl border border-blue-100 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="text-sm font-extrabold text-blue-800 underline">{link.route}</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{link.body}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getRowsByCategory(fees: FeeItem[], category: FeeItem["category"]) {
  return fees.filter((row) => row.category === category);
}

function isReferenceSlug(slug: string): boolean {
  return TARGET_REFERENCE_SLUGS.has(slug);
}

function hasDotReference(slug: string): boolean {
  return DOT_REFERENCE_SLUGS.has(slug);
}

function hasEu261Reference(slug: string): boolean {
  return EU261_REFERENCE_SLUGS.has(slug);
}

function getCardBenefitReference(slug: string) {
  switch (slug) {
    case "american":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          This site currently includes American Airlines co-branded cards
          with a published first checked bag benefit on domestic American itineraries. For the
          card families, traveler counts, and booking limits, see the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="underline">
            airline credit card baggage benefit reference
          </Link>
          .
        </p>
      );
    case "united":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          This site currently includes United cards with published first-
          and, on some tiers, second-checked-bag benefits on eligible United-operated itineraries.
          For the card families, companion limits, and card-payment requirement, see the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="underline">
            airline credit card baggage benefit reference
          </Link>
          .
        </p>
      );
    case "delta":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          This site currently includes Delta SkyMiles cards with a
          published first checked bag benefit when the reservation includes the eligible SkyMiles
          number. For the card families, traveler counts, and route limits, see the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="underline">
            airline credit card baggage benefit reference
          </Link>
          .
        </p>
      );
    case "alaska":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          This site currently includes Alaska Atmos card entries with a published first checked bag
          benefit for eligible cardholders and companions on the same reservation. Run the{" "}
          <Link href="/best-cards?airline=alaska&travelers=2&bags=1&trips=2&pay=yes" className="underline">
            Alaska free checked bag card calculator
          </Link>{" "}
          before paying cash for repeat first-bag fees, and verify the route/payment rules in the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="underline">
            airline credit card baggage benefit reference
          </Link>
          .
        </p>
      );
    case "jetblue":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          Eligible JetBlue Plus and Premier cardmembers receive a published first checked bag
          benefit for themselves and up to three companions on the same reservation, but only on
          JetBlue-operated flights. The no-annual-fee JetBlue Card does not publish the same
          recurring waiver. Test repeat-trip value in the{" "}
          <Link href="/best-cards?airline=jetblue&travelers=2&bags=1&trips=2&pay=yes" className="underline">
            JetBlue card break-even calculator
          </Link>{" "}
          and verify the operating-carrier and eligibility limits in the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="underline">
            airline credit card baggage benefit reference
          </Link>
          .
        </p>
      );
    case "southwest":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          Eligible Rapid Rewards primary cardmembers can receive a first-standard-bag waiver for
          themselves and published same-reservation companions, but the second bag remains a
          separate charge unless another fare or status benefit covers it. Test the trip in the{" "}
          <Link href="/best-cards?airline=southwest&travelers=2&bags=1&trips=2&pay=yes" className="underline">
            Southwest card break-even calculator
          </Link>{" "}
          and verify eligibility in the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="underline">
            card baggage-benefit reference
          </Link>
          .
        </p>
      );
    default:
      return null;
  }
}

function InlineComparisonLinks({ links }: { links: ReferenceLink[] }) {
  return (
    <span>
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? ", " : ""}
          <Link href={link.href} className="underline">
            {link.label}
          </Link>
        </span>
      ))}
    </span>
  );
}

function VerificationTrustBar({
  airlineName,
  latestVerified,
  oldestCoreVerified,
  secondaryReviewCount,
}: {
  airlineName: string;
  latestVerified: string;
  oldestCoreVerified: string;
  secondaryReviewCount: number;
}) {
  const reportHref = `/contact?subject=${encodeURIComponent(`${airlineName} policy changed`)}`;
  const freshness = getVerificationFreshness(oldestCoreVerified);
  const statusClass = {
    green: "border-emerald-200 text-emerald-900",
    amber: "border-amber-300 text-amber-950",
    red: "border-rose-300 text-rose-950",
    slate: "border-slate-300 text-slate-800",
  }[freshness.tone];

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-200 bg-white px-3 py-1 font-bold text-blue-900">
            Last verified: {latestVerified}
          </span>
          <span className={`rounded-full border bg-white px-3 py-1 font-bold ${statusClass}`} title={freshness.detail}>
            Core baggage status: {freshness.label}
          </span>
          {secondaryReviewCount > 0 ? (
            <span className="rounded-full border border-amber-300 bg-white px-3 py-1 font-bold text-amber-950">
              {secondaryReviewCount} secondary {secondaryReviewCount === 1 ? "policy" : "policies"} due for review
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 text-slate-700 sm:flex-row sm:items-center">
          <span>Policy changed?</span>
          <Link href={reportHref} className="font-bold text-blue-700 underline">
            Report a correction
          </Link>
        </div>
      </div>
    </section>
  );
}

function checkedBagCalculatorUrl(slug: string) {
  return `/tools/checked-baggage-calculator?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&directions=2&trips=1&pay=yes`;
}

function formatUsdEstimate(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function BagCostTeaser({
  slug,
  airlineName,
  feeByBagOrdinal,
}: {
  slug: string;
  airlineName: string;
  feeByBagOrdinal: [number, number][];
}) {
  const firstBagFee = feeByBagOrdinal.find(([ordinal]) => ordinal === 1)?.[1];
  const estimatedRoundtrip = firstBagFee == null ? null : firstBagFee * 2 * 2;

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
        Bag-cost check
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">
        Price a common {airlineName} roundtrip before booking.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {estimatedRoundtrip == null
          ? `${airlineName} bag costs need a route, fare, or baggage-concept lookup before a useful total can be quoted.`
          : `For two travelers with one checked bag each, the published first-bag fee produces an estimated roundtrip total of ${formatUsdEstimate(estimatedRoundtrip)} before fare, status, card, and route exceptions.`}
      </p>
      <Link
        href={checkedBagCalculatorUrl(slug)}
        className="mt-4 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
      >
        Run the checked-bag calculator
      </Link>
    </section>
  );
}

function CardSavingsDecisionPanel({
  slug,
  airlineName,
}: {
  slug: string;
  airlineName: string;
}) {
  if (!CARD_DECISION_SLUGS.has(slug)) return null;

  const enc = encodeURIComponent(slug);
  const cardHref = `/best-cards?airline=${enc}&travelers=2&bags=1&trips=2&pay=yes`;
  const calculatorHref = `/tools/checked-baggage-calculator?airline=${enc}&travelers=2&bags=1&directions=2&trips=2&pay=yes`;
  const guideHref = "/guides/airline-credit-card-baggage-benefits";
  const isAirCanada = slug === "air-canada";

  const note = isAirCanada
    ? "Air Canada card benefit tracking is useful, but the current Air Canada bag rows are CAD-denominated. Treat the card path as a benefit-rule check until multi-currency break-even math is added."
    : "The card calculator uses the same airline and bag pattern, then tests whether calculated checked-bag savings beat the card annual fee before counting points, bonuses, lounge access, or unrelated perks.";

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Free checked bag card check
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            If you fly {airlineName} repeatedly with checked bags, run the card math before paying cash.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{note}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Start by pricing the bag bill for travelers and roundtrips. Then compare eligible card tiers only if the
            checked-bag cost is recurring enough to matter.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Default scenario</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            2 travelers, 1 checked bag each, 2 roundtrips per year.
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href={calculatorHref} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-blue-800 underline hover:border-blue-300">
              Price checked bags first
            </Link>
            <Link href={cardHref} className="rounded-xl bg-slate-900 px-4 py-3 font-bold text-white hover:bg-slate-700">
              Test card break-even
            </Link>
            <Link href={guideHref} className="font-semibold text-emerald-900 underline">
              Check benefit rules and exclusions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickSavePanel({ items }: { items: string[] }) {
  const topItems = items.slice(0, 4);

  if (topItems.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        Quick ways to avoid fees
      </div>
      <ul className="mt-3 space-y-3 text-sm leading-relaxed text-emerald-950">
        {topItems.map((item) => (
          <li key={item} className="border-l-4 border-emerald-300 pl-4">
            {readerCopy(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CompareNextPanel({ links }: { links: ReferenceLink[] }) {
  const topLinks = links.slice(0, 3);

  if (topLinks.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Compare next
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">
            Check nearby fee models before you decide.
          </h2>
        </div>
        <Link href="/airlines" className="text-sm font-bold text-blue-700 underline">
          All airlines
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {topLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-blue-700 underline transition hover:border-blue-400 hover:shadow-sm"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function AirFranceBaggagePriceChecklist() {
  const verification = buildProvenanceSummary(airFranceProvenance, provenanceReviewQueue);
  const statusLabel = verification.verificationStatus === "verified" ? "Verified" : "Needs recheck";

  return (
    <section className="space-y-6 rounded-3xl border border-blue-200 bg-blue-50 p-5 md:p-7">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Answer first
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          What will Air France charge me for baggage?
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">
          Air France does not publish one baggage price that works for every ticket. First check the
          included allowance on your booking; then price an additional bag for the exact itinerary.
          Extra bags can be bought online, but overweight and oversized bags are priced and paid for
          at the airport.
        </p>
        <div className="mt-4 rounded-2xl border border-blue-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
          <strong className="text-slate-950">Searching for a 23 kg extra-bag price?</strong>{" "}
          That is an additional-piece price, not a per-kilogram overweight rate. For Economy and
          Premium, an added standard bag can weigh up to 23 kg; Air France shows its price during
          booking or in My Bookings. An overweight fee applies only when one bag exceeds the weight
          allowed by the ticket, and that itinerary-based charge is paid at the airport.
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-blue-100 bg-white">
        <table className="min-w-[680px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3">Situation</th>
              <th className="px-4 py-3">What Air France publishes</th>
              <th className="px-4 py-3">Where the price comes from</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr>
              <td className="px-4 py-3 font-bold text-slate-950">Included checked baggage</td>
              <td className="px-4 py-3">Varies by ticket, fare, cabin, itinerary, and operating carrier.</td>
              <td className="px-4 py-3">Your booking confirmation or My Bookings.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold text-slate-950">Additional checked bag</td>
              <td className="px-4 py-3">Up to 23 kg in Economy/Premium or 32 kg in Business/La Première; maximum 158 cm total dimensions.</td>
              <td className="px-4 py-3">Displayed during booking or in My Bookings for the itinerary.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold text-slate-950">Overweight bag</td>
              <td className="px-4 py-3">Above the ticketed weight allowance, but no more than 32 kg.</td>
              <td className="px-4 py-3">Itinerary-based price, paid at the airport.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold text-slate-950">Oversized bag</td>
              <td className="px-4 py-3">Over 158 cm and no more than 300 cm total dimensions.</td>
              <td className="px-4 py-3">Itinerary-based price, paid at the airport.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-lg font-black text-slate-950">Published allowance by cabin</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          These are cabin limits Air France publishes, not a promise that every fare includes the
          maximum. The ticket remains controlling.
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-blue-100 bg-white">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3">Cabin / fare</th>
                <th className="px-4 py-3">Cabin baggage</th>
                <th className="px-4 py-3">Checked baggage evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3 font-bold text-slate-950">Economy</td>
                <td className="px-4 py-3">0–1 hand bag by fare + 1 small bag; 12 kg combined.</td>
                <td className="px-4 py-3">Ticket-specific. An additional standard bag may weigh up to 23 kg.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-slate-950">Economy Basic</td>
                <td className="px-4 py-3">Small bag included; eligible routes can require a paid Hand Baggage option for the overhead bag.</td>
                <td className="px-4 py-3">Ticket-specific; do not infer a checked bag from the cabin name.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-slate-950">Premium</td>
                <td className="px-4 py-3">2 hand bags + 1 small bag; 12 kg combined.</td>
                <td className="px-4 py-3">Up to 2 checked bags of 23 kg each, depending on ticket conditions.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-slate-950">Business</td>
                <td className="px-4 py-3">2 hand bags + 1 small bag; 18 kg combined.</td>
                <td className="px-4 py-3">Published short/medium-haul product: 2 checked bags of 32 kg each.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-slate-950">La Première</td>
                <td className="px-4 py-3">2 hand bags + 1 small bag; 18 kg combined.</td>
                <td className="px-4 py-3">Ticket-specific here; an additional bag may weigh up to 32 kg.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-bold text-slate-950">Buy early when the route qualifies</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Additional bags bought online by card at least 24 hours before departure may be cheaper.
            Flights to or from Canada and the United States use the same online and airport price.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-bold text-slate-950">Check the operating carrier</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            These allowances apply to Air France-operated flights. On a partner-operated or mixed
            itinerary, Air France says the allowance may differ and recommends following the strictest rule.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-bold text-slate-950">Additional-bag exclusions</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            The standard Additional Baggage option is not sold for lap infants, animals, or sports
            equipment. Separate conditions or rates apply.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-bold text-slate-950">Hard acceptance limits</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Bags above 32 kg or 300 cm total dimensions move outside ordinary checked baggage and
            require Air France Cargo handling.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/tools/checked-baggage-calculator?airline=air-france&travelers=1&bags=1&directions=2&trips=1&pay=yes"
          className="font-bold text-blue-800 underline"
        >
          Check Air France baggage price
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?airline=air-france&bags=1&directions=2&weight=51&size=63"
          className="font-bold text-blue-800 underline"
        >
          Check Air France excess baggage fees
        </Link>
        <Link href="/guides/international-baggage-allowance" className="font-bold text-blue-800 underline">
          Understand international baggage allowance
        </Link>
        <Link href="/fees/checked_baggage" className="font-bold text-blue-800 underline">
          Compare checked baggage fees
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              {statusLabel}
            </div>
            <h3 className="mt-1 font-black text-slate-950">Sources and verification</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">
              Last verified {verification.lastVerified}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
              {verification.verifiedClaimCount} verified claims
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Checked against Air France-published information. Coverage includes {verification.coverage.join(", ")}.
          Where Air France exposes a price only after route and fare selection, this page reports the
          lookup method instead of inventing a universal amount. The current sources do not publish
          one effective date for all of these rules.
        </p>
        {verification.reviewItems.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {verification.reviewItems.length} policy claim{verification.reviewItems.length === 1 ? " is" : "s are"} under review.
            Previously verified information remains visible until the review is complete.
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
          {verification.coverage.map((category) => (
            <span key={category} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {category}
            </span>
          ))}
        </div>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {verification.officialSources.map((source) => (
            <li key={source.sourceId} className="border-l-4 border-slate-200 pl-4">
              <a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-blue-800 underline">
                {source.title}
              </a>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {source.classification === "primary_policy_source" ? "Primary policy source" : "Supporting official source"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function UnitedFeeDecisionChecklist() {
  const checks = [
    {
      question: "Is the ticket Basic Economy?",
      answer:
        "Do not assume the cheapest fare includes a full-size overhead-bin bag. United publishes route, Premier-status, and eligible-card exceptions, so verify the exact itinerary before relying on cabin-only travel.",
    },
    {
      question: "Was the ticket bought before or after April 3, 2026?",
      answer:
        "The most-market Economy bag rows change at that ticket-date boundary. The newer published baseline is higher, so an older fee quote can understate the first, second, and third bag cost.",
    },
    {
      question: "Can the first two bags be prepaid online?",
      answer:
        "For the current most-market Economy rows stored here, United charges $5 more per bag at the airport than online. Two travelers checking one bag each roundtrip can therefore give up $20 by waiting.",
    },
    {
      question: "Are you relying on a United card or Premier benefit?",
      answer:
        "Verify the exact card, payment method, MileagePlus number, operating carrier, and same-reservation companion rules. The benefit is not a universal waiver attached to every United-branded booking.",
    },
    {
      question: "Is any segment operated by United Express?",
      answer:
        "A bag that fits United's published allowance can still be gate-checked when the regional aircraft has limited space. Keep medication, documents, batteries, and other essentials removable.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        United booking checklist
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Five checks determine whether the displayed fare is realistic.
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link
          href="/tools/checked-baggage-calculator?airline=united&travelers=2&bags=1&directions=2&trips=1&pay=yes"
          className="text-blue-800 underline"
        >
          Price the checked-bag pattern
        </Link>
        <Link href="/guides/basic-economy-traps" className="text-blue-800 underline">
          Compare Basic Economy restrictions
        </Link>
        <Link
          href="/guides/airline-credit-card-baggage-benefits"
          className="text-blue-800 underline"
        >
          Verify card-benefit conditions
        </Link>
      </div>
    </section>
  );
}

function DeltaFeeDecisionChecklist() {
  const checks = [
    {
      question: "Are you choosing Basic only to travel carry-on-only?",
      answer:
        "That is not a Delta savings tactic: Delta includes one carry-on and one personal item on Basic too. Compare Basic with Classic/Main for flexibility, seat choice, and cancellation value instead.",
    },
    {
      question: "Was the domestic ticket bought before April 8, 2026?",
      answer:
        "Delta ties the baggage fee to the ticket-purchase date. The current common domestic baseline is $45 for the first standard bag and $55 for the second; older tickets can retain the previous amount.",
    },
    {
      question: "Are you paying a third party for checked baggage?",
      answer:
        "Do not. Delta says third-party baggage sales are unauthorized. Add and pay for bags through Delta during check-in on delta.com, in the Fly Delta app, or at an airport kiosk.",
    },
    {
      question: "Does a Delta Amex benefit actually cover this traveler?",
      answer:
        "The first-bag waiver can extend across the same reservation, but the newer domestic second-bag benefit applies to eligible Basic Card Members themselves. Codeshares, oversized bags, and overweight bags are not automatically covered.",
    },
    {
      question: "Is the bag above 50 lb or 62 linear inches?",
      answer:
        "The normal $45 or $55 bag fee is no longer the whole calculation. Delta publishes separate overweight and oversize charges, and a card's standard-bag waiver does not erase those excess charges.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Delta booking checklist
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Check the fare restriction before chasing a baggage workaround.
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link
          href="/tools/checked-baggage-calculator?airline=delta&travelers=2&bags=1&directions=2&trips=1&pay=yes"
          className="text-blue-800 underline"
        >
          Price the domestic bag pattern
        </Link>
        <Link href="/guides/basic-economy-traps" className="text-blue-800 underline">
          Compare Basic fare restrictions
        </Link>
        <Link
          href="/guides/airline-credit-card-baggage-benefits"
          className="text-blue-800 underline"
        >
          Check card-benefit eligibility
        </Link>
      </div>
    </section>
  );
}

function AmericanFeeDecisionChecklist() {
  const checks = [
    {
      question: "Was the ticket issued on or after April 9, 2026?",
      answer:
        "That date starts the newer Main Cabin domestic and short-haul ladder: $45 online or $50 at the airport for bag one, and $55 online or $60 at the airport for bag two.",
    },
    {
      question: "Is it Basic Economy issued on or after May 18, 2026?",
      answer:
        "Basic costs another $5 for the first and second bag on the covered domestic and short-haul markets. Carry-on access is still included, so compare Basic against Main using checked bags, seat rules, boarding, and flexibility—not cabin baggage alone.",
    },
    {
      question: "Can you prepay the first two bags online?",
      answer:
        "American discounts each of the first two eligible bags by $5 when paid on aa.com or through its app. Two travelers checking one bag each roundtrip can save $20 versus airport payment.",
    },
    {
      question: "Are you counting on an AAdvantage card benefit?",
      answer:
        "Verify the specific card and add the eligible AAdvantage number to the reservation. The common waiver is limited to qualifying domestic American or American Eagle itineraries; partner-operated codeshares and excess-size charges can fall outside it.",
    },
    {
      question: "Is this international or operated on American Eagle?",
      answer:
        "International routes use separate allowance tables, so do not reuse the domestic ladder. On regional aircraft, limited overhead space can also force a gate check even when the carry-on meets the published size rule.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        American booking checklist
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        The ticket date and fare family decide the bag ladder.
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link
          href="/tools/checked-baggage-calculator?airline=american&travelers=2&bags=1&directions=2&trips=1&pay=yes"
          className="text-blue-800 underline"
        >
          Price the checked-bag pattern
        </Link>
        <Link href="/guides/basic-economy-traps" className="text-blue-800 underline">
          Compare Basic with Main
        </Link>
        <Link
          href="/guides/airline-credit-card-baggage-benefits"
          className="text-blue-800 underline"
        >
          Verify the card waiver
        </Link>
      </div>
    </section>
  );
}

function SouthwestFeeDecisionChecklist() {
  const checks = [
    {
      question: "Was the U.S. Mainland trip ticketed or changed on or after April 9, 2026?",
      answer:
        "Basic, Choice, and Choice Preferred then charge $45 for the first checked bag and $55 for the second, each way. Older bookings use the earlier $35 and $45 amounts.",
    },
    {
      question: "Would Choice Extra cost less than the bag bill?",
      answer:
        "Choice Extra includes the first two checked bags. Compare the fare upgrade against the entire party's roundtrip bag total instead of assuming the cheaper displayed fare stays cheaper.",
    },
    {
      question: "Are you relying on a Rapid Rewards credit card?",
      answer:
        "The primary cardmember and up to eight additional passengers on the same reservation can receive the first standard bag free when the Rapid Rewards number is included. The card benefit does not make the second bag free.",
    },
    {
      question: "Does A-List or A-List Preferred apply?",
      answer:
        "A-List covers the first bag, while A-List Preferred covers the first two bags, with published same-reservation extensions. Those are different benefits and should not be modeled as one generic status waiver.",
    },
    {
      question: "Is this interisland Hawaii or an overweight or oversized bag?",
      answer:
        "Interisland Hawaii has its own resident and nonresident table. Excess-size and excess-weight charges are added to the standard bag fee, so the $45 or $55 base amount may be only the first charge.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Southwest bag-benefit checklist
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Southwest bag pricing is now an eligibility decision.
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link
          href="/tools/checked-baggage-calculator?airline=southwest&travelers=2&bags=1&directions=2&trips=1&pay=yes"
          className="text-blue-800 underline"
        >
          Price the checked-bag pattern
        </Link>
        <Link
          href="/best-cards?airline=southwest&travelers=2&bags=1&trips=2&pay=yes"
          className="text-blue-800 underline"
        >
          Test the card break-even
        </Link>
        <Link href="/guides/airline-credit-card-baggage-benefits" className="text-blue-800 underline">
          Verify benefit conditions
        </Link>
      </div>
    </section>
  );
}

function JetBlueFeeDecisionChecklist() {
  const checks = [
    {
      question: "Is the fare Base, Standard, or Flex?",
      answer:
        "Main Base and EvenMore Base charge $150 per person to change or cancel. Standard removes that fee but charges $100 for eligible same-day changes or standby; Flex includes eligible same-day flexibility.",
    },
    {
      question: "Can you add bags at least 24 hours before departure?",
      answer:
        "JetBlue says adding either of the first two bags at least 24 hours before departure can save up to $10 per bag. Do not wait for check-in when the bag is already certain.",
    },
    {
      question: "Are the travel dates peak or off-peak?",
      answer:
        "On the U.S., Latin America, Caribbean, and Canada chart, the early first-bag price is $45 off-peak or $49 peak; the second is $59 or $69. The itinerary date changes the answer.",
    },
    {
      question: "Does Mosaic or an eligible card apply?",
      answer:
        "Mosaic 1 includes the first bag; Mosaic 2–4 include the first two. Eligible Plus and Premier cards include the first bag for the cardmember and up to three companions on JetBlue-operated flights.",
    },
    {
      question: "Is the itinerary transatlantic or the bag oversize?",
      answer:
        "Transatlantic Base fares pay for the first bag, while Main and EvenMore Standard or Flex include it. Overweight, oversize, and extra-piece charges are separate and can stack.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        JetBlue fare-and-bag checklist
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        The fare label alone does not decide the JetBlue trip cost.
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link
          href="/tools/checked-baggage-calculator?airline=jetblue&travelers=2&bags=1&directions=2&trips=1&pay=yes"
          className="text-blue-800 underline"
        >
          Price the checked-bag pattern
        </Link>
        <Link
          href="/best-cards?airline=jetblue&travelers=2&bags=1&trips=2&pay=yes"
          className="text-blue-800 underline"
        >
          Test the card break-even
        </Link>
        <Link href="/guides/basic-economy-traps" className="text-blue-800 underline">
          Compare restricted fares
        </Link>
      </div>
    </section>
  );
}

function AirCanadaCheckedBagFeeChecklist() {
  const tiers = [
    ["Short-haul Basic", "CAD/USD 45", "CAD/USD 60", "Purchased Apr. 13, 2026 or later"],
    ["Short-haul Standard", "CAD/USD 45", "CAD/USD 60", "Purchased Apr. 13, 2026 or later"],
    ["Short-haul Flex", "Included", "CAD/USD 60", "Purchased Apr. 13, 2026 or later"],
    ["Listed long-haul Basic", "CAD/USD 90", "CAD/USD 120", "Purchased May 14, 2026 or later"],
    ["Listed long-haul Standard / Flex", "Included", "CAD/USD 120", "Purchased May 14, 2026 or later"],
  ] as const;

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Air Canada checked bag fee model
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        What will Air Canada charge for checked baggage?
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
        Start with route group, fare, and purchase date. These are Air Canada&apos;s current published economy tiers; prices are per direction, shown in CAD or USD depending on departure market, and taxes may apply.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-black text-slate-950">First check the cabin-bag trap</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Economy Basic tickets purchased on or after January 3, 2025 include only one personal item on trips within Canada or between Canada and the U.S., Mexico, Central America, or the Caribbean. A qualifying onward international connection restores one standard carry-on. Air Canada says an unentitled bag handled at the gate can cost CA/US $65–$78 including tax.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-black text-slate-950">Then identify whose rules apply</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            For a trip starting or ending in Canada or the U.S., Air Canada says the airline operating the first segment determines the baggage rules. On other international trips, the first carrier operating a flight between travel zones can control instead. Do this check before using the fee table.
          </p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-blue-100 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Fare / route</th>
              <th className="px-4 py-3">First bag</th>
              <th className="px-4 py-3">Second bag</th>
              <th className="px-4 py-3">Applies to</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tiers.map(([fare, first, second, applies]) => (
              <tr key={fare}>
                <th className="px-4 py-3 font-bold text-slate-900">{fare}</th>
                <td className="px-4 py-3">{first}</td>
                <td className="px-4 py-3">{second}</td>
                <td className="px-4 py-3">{applies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        Short-haul means travel within Canada; between Canada and the U.S.; or from Canada/U.S. to Mexico, the Caribbean, or Central America. The listed long-haul group covers Canada/U.S. to Africa, Asia/South Pacific, Europe, the Middle East, or South America. Older tickets and other itineraries may use different rules.
      </p>
      <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
        <h3 className="font-black text-slate-950">Bringing a bag above the ticket allowance?</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Air Canada&apos;s current Canadian fee schedule lists an additional bag at CAD 100–120 for
          travel within Canada or between Canada and the U.S. The listed range is CAD 225–270 for
          the Caribbean, Mexico, Central America, and other international destinations. This is an
          extra bag above the ticket&apos;s allowance, not the same as the first- or second-bag rows above.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          The exact allowance, tax, currency, ticket date, and operating carrier still control. Air
          Canada directs travelers to its baggage calculator for the itinerary-specific answer.
        </p>
        <a
          href="https://www.aircanada.com/ca/en/aco/home/plan/baggage/checked.html"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-bold text-blue-800 underline"
        >
          Check Air Canada&apos;s baggage calculator
        </a>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href="/tools/checked-baggage-calculator?airline=air-canada&travelers=2&bags=1&directions=2&trips=2&pay=yes"
          className="font-bold text-blue-800 underline"
        >
          Run Air Canada checked-bag math
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?airline=air-canada&bags=1&directions=2&weight=51&size=63"
          className="font-bold text-blue-800 underline"
        >
          Check overweight or oversize risk
        </Link>
        <Link href="/guides/basic-economy-traps" className="font-bold text-blue-800 underline">
          Compare Basic fare traps
        </Link>
      </div>
    </section>
  );
}

function AirIndiaBaggageDecisionChecklist() {
  const domesticAllowances = [
    ["Economy Value", "15 kg", "One checked piece"],
    ["Economy Classic", "20 kg", "One checked piece"],
    ["Economy Flex", "25 kg", "Up to two checked pieces"],
  ] as const;

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Air India baggage decision path
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        Do not price Air India baggage until you know the baggage concept
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
        Domestic tickets use a fare-specific kilogram allowance. International tickets may use either a total weight allowance or a piece allowance, so there is no honest universal “extra bag fee.” Read the allowance printed on the ticket before applying any excess rate.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
          <div className="border-b border-blue-100 px-4 py-3">
            <h3 className="font-black text-slate-950">Domestic Economy baseline</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Fare</th>
                <th className="px-4 py-3">Included</th>
                <th className="px-4 py-3">Piece limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {domesticAllowances.map(([fare, allowance, pieces]) => (
                <tr key={fare}>
                  <th className="px-4 py-3 font-bold text-slate-950">{fare}</th>
                  <td className="whitespace-nowrap px-4 py-3">{allowance}</td>
                  <td className="px-4 py-3">{pieces}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-blue-100 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
            At the airport, Air India publishes INR 800 per excess kilogram for domestic travel, excluding applicable tax. A piece-count charge can still apply when the number of bags exceeds the allowance.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h3 className="font-black text-slate-950">If the ticket says weight concept</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Excess is charged per kilogram beyond the ticketed allowance. International per-kilogram prices vary by region; use Air India&apos;s current route matrix rather than applying the domestic INR rate.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h3 className="font-black text-slate-950">If the ticket says piece concept</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Extra pieces, pieces above 23 kg, and pieces above 158 cm can trigger distinct charges. One bag may therefore create more than one surcharge; no checked piece may exceed 32 kg.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h3 className="font-black text-slate-950">Prepay only when the ticket qualifies</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Air India advertises savings of up to 20% for eligible tickets beginning with 098. Extra weight or pieces can be bought up to two hours before departure; increasing one bag up to 32 kg has a six-hour cutoff. Interline and codeshare flights are excluded.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href="/tools/excess-baggage-calculator?airline=air-india&weight=33&size=63"
          className="font-bold text-blue-800 underline"
        >
          Check excess-baggage risk
        </Link>
        <Link href="/guides/international-baggage-allowance" className="font-bold text-blue-800 underline">
          Understand weight versus piece concept
        </Link>
      </div>
    </section>
  );
}

function LufthansaBaggageDecisionChecklist() {
  const cabinRules = [
    ["Short/medium-haul Economy Basic", "Personal item only", "40 × 30 × 15 cm"],
    ["Other short/medium-haul Economy fares", "1 carry-on + personal item", "8 kg; 55 × 40 × 23 cm"],
    ["Long-haul Economy / Premium Economy", "1 carry-on + personal item", "8 kg; 55 × 40 × 23 cm"],
    ["Business / First", "2 carry-ons + personal item", "8 kg per carry-on"],
  ] as const;

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Lufthansa fare check
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        Economy Basic and Economy Light no longer mean the same baggage allowance
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
        On selected European short- and medium-haul routes, Economy Basic is personal-item-only. Economy Light, Comfort, Comfort Green, and Flex include the overhead carry-on. For checked baggage, use the allowance printed on the ticket instead of applying a route example as a universal price.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-blue-100 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Trip / cabin</th>
              <th className="px-4 py-3">Included in cabin</th>
              <th className="px-4 py-3">Main bag limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {cabinRules.map(([trip, included, limit]) => (
              <tr key={trip}>
                <th className="px-4 py-3 font-bold text-slate-950">{trip}</th>
                <td className="px-4 py-3">{included}</td>
                <td className="px-4 py-3">{limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
          <strong className="block text-slate-950">Checked-bag decision</strong>
          Economy Basic includes no checked bag. Other allowances depend on route, fare, cabin, and status; the ticket or Lufthansa baggage calculator controls.
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
          <strong className="block text-slate-950">Status exception</strong>
          HON Circle, Senator, and Star Alliance Gold members can receive one carry-on with short/medium-haul Economy Basic, but ordinary customers should not assume that exception.
        </div>
      </div>
    </section>
  );
}

function SingaporeAirlinesBaggageDecisionChecklist() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Singapore Airlines baggage concept
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        Destination determines whether kilograms or pieces matter
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-black text-slate-950">Except Canada and the U.S.: weight concept</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Economy Lite and Value include 25 kg; Standard and Flexi include 30 kg. Premium Economy includes 35 kg, Business 40 kg, and Suites/First 50 kg. Multiple bags are allowed as long as their combined weight stays within the allowance and no individual bag exceeds 32 kg.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <h3 className="font-black text-slate-950">To or from Canada and the U.S.: piece concept</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Economy and Premium Economy include two pieces up to 23 kg each. Business, First, and Suites include two pieces up to 32 kg each. Each piece must remain within 158 cm total dimensions.
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-slate-700">
        <strong className="text-slate-950">The useful savings lever:</strong> eligible additional baggage purchased more than 48 hours before departure is discounted 25%. From 48 hours until six hours before departure, the discount is 10%. Mixed-carrier itineraries other than eligible Singapore Airlines/Scoot combinations may require airport purchase instead.
      </div>
    </section>
  );
}

function EvaAirBaggageDecisionChecklist() {
  const economyRules = [
    ["Long haul", "Up / Standard / Basic", "2 × 23 kg"],
    ["Long haul", "Discount", "1 × 23 kg"],
    ["Within Asia", "Up / Standard", "2 × 23 kg"],
    ["Within Asia", "Basic / Discount", "1 × 23 kg"],
  ] as const;

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        EVA Air Economy allowance
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        The cheapest fare does not carry the same checked allowance on every route
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
        Start with long haul versus travel within Asia, then read the fare family. This is the distinction that decides whether Economy includes one or two standard checked pieces.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-blue-100 bg-white">
        <table className="w-full min-w-[580px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Route group</th>
              <th className="px-4 py-3">Economy fare</th>
              <th className="px-4 py-3">Included checked baggage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {economyRules.map(([route, fare, included]) => (
              <tr key={`${route}-${fare}`}>
                <th className="px-4 py-3 font-bold text-slate-950">{route}</th>
                <td className="px-4 py-3">{fare}</td>
                <td className="px-4 py-3 font-bold">{included}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
          <strong className="block text-slate-950">Long haul means</strong>
          Travel to or from the U.S., Canada, Europe, Australia, or New Zealand. Every standard Economy piece is capped at 23 kg and 158 cm.
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
          <strong className="block text-slate-950">Extra baggage</strong>
          For travel on or after September 29, 2026, EVA prices excess baggage by zone and publishes a 10% discount when eligible baggage is prepaid at least four hours before departure. Mixed-carrier rules can change whose allowance applies.
        </div>
      </div>
    </section>
  );
}

function ZipairBaggageDecisionChecklist() {
  const checkedBagPrices = ZIPAIR_CHECKED_BAG_PRICES.filter((route) => route.origin === "NRT").map((outbound) => ({
    destination: outbound.label.replace("Tokyo (NRT) to ", ""),
    outbound,
    inbound: ZIPAIR_CHECKED_BAG_PRICES.find(
      (route) => route.origin === outbound.destination && route.destination === "NRT"
    ),
  }));

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        ZIPAIR baggage allowance and add-on prices
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        What ZIPAIR will charge for baggage
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
        The base fare includes two cabin items weighing 7 kg combined. Checked baggage starts with the first piece: each route price below covers one bag up to 30 kg and 203 cm total dimensions. You may buy up to five pieces. If you reach the airport with an unpurchased piece, ZIPAIR adds a processing fee to the applicable checked-bag price.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold">Destination</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">From Tokyo</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">To Tokyo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {checkedBagPrices.map(({ destination, outbound, inbound }) => (
                <tr key={outbound.destination}>
                  <td className="px-4 py-3">{destination}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">
                    <Link
                      href={`/tools/checked-baggage-calculator?airline=zipair&travelers=1&bags=1&directions=1&trips=1&pay=yes&route=${encodeURIComponent(outbound.label)}`}
                      className="text-blue-800 underline"
                    >
                      {formatZipairMoney(outbound.amount, outbound.currency)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">
                    {inbound ? (
                      <Link
                        href={`/tools/checked-baggage-calculator?airline=zipair&travelers=1&bags=1&directions=1&trips=1&pay=yes&route=${encodeURIComponent(inbound.label)}`}
                        className="text-blue-800 underline"
                      >
                        {formatZipairMoney(inbound.amount, inbound.currency)}
                      </Link>
                    ) : "Check ZIPAIR"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-blue-100 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          Prices are per piece and direction, verified {ZIPAIR_BAGGAGE_VERIFIED}. ZIPAIR may convert fees using its exchange rate for the selected payment currency. Confirm the current quote before paying. Source:{" "}
          <a
            href={ZIPAIR_BAGGAGE_SOURCE}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-blue-700 underline"
          >
            ZIPAIR official baggage fee table
          </a>
          .
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Included cabin allowance
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Two items are allowed: 40 × 25 × 55 cm and 35 × 25 × 45 cm. Their combined free weight is 7 kg, not 7 kg per item.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Checked bag fee
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Every piece is chargeable, including the first. Each purchased bag may weigh up to 30 kg; up to five pieces are allowed per passenger.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Extra or overweight bag
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            There is no published overweight band above 30 kg. Repack into another paid piece; airport purchases also incur a processing fee and require a credit card.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href="/tools/checked-baggage-calculator?airline=zipair&travelers=1&bags=1&directions=2&trips=1&pay=yes&route=Los+Angeles+%28LAX%29+to+Tokyo+%28NRT%29"
          className="font-bold text-blue-800 underline"
        >
          Try a ZIPAIR route preset
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?airline=zipair&weight=31&size=62"
          className="font-bold text-blue-800 underline"
        >
          Check ZIPAIR excess baggage risk
        </Link>
        <Link
          href="/tools/true-trip-cost?v=1&a1=zipair&a2="
          className="font-bold text-blue-800 underline"
        >
          Compare ZIPAIR&apos;s true trip cost
        </Link>
        <Link href="/sizer-rules?weight=7" className="font-bold text-blue-800 underline">
          Check 7 kg cabin-bag fit
        </Link>
      </div>
    </section>
  );
}

function AirlineFaqBlock({ slug }: { slug: string }) {
  const faqs = AIRLINE_FAQS[slug];
  if (!faqs?.length) return null;
  const heading =
    slug === "air-france"
      ? "Air France baggage charges, prices, and excess baggage fees"
      : "ZIPAIR baggage allowance, checked bags, and extra baggage fees";

  return (
    <section id="faq" className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Baggage FAQ
      </div>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
        {heading}
      </h2>
      <div className="mt-4 grid gap-3">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-bold text-slate-950">{faq.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{faq.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href={
            slug === "air-france"
              ? "/tools/checked-baggage-calculator?airline=air-france&travelers=1&bags=1&directions=2&trips=1&pay=yes"
              : "/tools/checked-baggage-calculator?airline=zipair&travelers=1&bags=1&directions=2&trips=1&pay=yes&route=Los+Angeles+%28LAX%29+to+Tokyo+%28NRT%29"
          }
          className="font-bold text-blue-800 underline"
        >
          {slug === "air-france" ? "Check Air France baggage price" : "Price a ZIPAIR checked bag"}
        </Link>
        <Link
          href={
            slug === "air-france"
              ? "/tools/excess-baggage-calculator?airline=air-france&bags=1&directions=2&weight=51&size=63"
              : "/tools/excess-baggage-calculator?airline=zipair&bags=1&directions=2&weight=24&size=63"
          }
          className="font-bold text-blue-800 underline"
        >
          {slug === "air-france" ? "Check Air France excess baggage" : "Check ZIPAIR extra baggage"}
        </Link>
        <Link href="/guides/international-baggage-allowance" className="font-bold text-blue-800 underline">
          International allowance guide
        </Link>
      </div>
    </section>
  );
}

function AlaskaCarryOnAndBagCheck() {
  const checks = [
    {
      question: "Was the North America ticket issued before April 10, 2026?",
      answer:
        "Earlier tickets retain the $40 first-bag, $45 second-bag, and $150 third-plus ladder. Most tickets issued on or after April 10 use $45, $55, and $200 instead, with no online prepay discount.",
    },
    {
      question: "Is the trip wholly within Hawaii or international?",
      answer:
        "Do not apply the North America ladder automatically. Wholly intra-Hawaii travel lists $30 and $40 for the first two bags, while Alaska publishes separate Main Cabin allowances for Asia, Europe, and Oceania.",
    },
    {
      question: "Does a fare, card, status, or resident benefit cover the bag?",
      answer:
        "First Class, eligible Atmos status, qualifying cards, military rules, Club 49, and Huaka‘i can override the cash fee. Confirm the operating carrier and same-reservation conditions before relying on a waiver.",
    },
    {
      question: "Is the bag sports equipment, overweight, or oversized?",
      answer:
        "Many approved sports items travel for the standard checked-bag fee with the oversize charge waived. Ordinary oversize and combined overweight-plus-oversize bags use much higher published charges.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Alaska booking checklist
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Start with the ticket date—then check whether the route or benefit changes the fee.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
        Saver still includes one 22 × 14 × 9 inch carry-on and one personal item. Its main tradeoff
        is flexibility, not an automatic overhead-bin fee. Checked baggage needs the sequence below.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link href="/sizer-rules?height=22&width=14&depth=9" className="font-bold text-blue-800 underline">
          Check Alaska carry-on fit
        </Link>
        <Link
          href="/tools/checked-baggage-calculator?airline=alaska&travelers=2&bags=1&directions=2&trips=2&pay=yes"
          className="font-bold text-blue-800 underline"
        >
          Price Alaska checked bags
        </Link>
        <Link
          href="/best-cards?airline=alaska&travelers=2&bags=1&trips=2&pay=yes"
          className="font-bold text-blue-800 underline"
        >
          Check Alaska card break-even
        </Link>
      </div>
    </section>
  );
}

function FrontierFeeDecisionChecklist() {
  const fareBagAnswer = [
    {
      fare: "Basic",
      included: "Personal item only",
      decision: "Price the carry-on in Frontier's booking flow or Bag Price Checker.",
    },
    {
      fare: "Economy",
      included: "Personal item + carry-on",
      decision: "Compare the bundle premium with Basic plus the same bag and seat.",
    },
    {
      fare: "Premium",
      included: "Personal item + carry-on",
      decision: "The added value is the premium seat and Board First—not another bag.",
    },
    {
      fare: "Business",
      included: "Personal item + carry-on + 2 checked bags",
      decision: "Each included checked bag can weigh up to 50 lb.",
    },
  ];

  const checks = [
    {
      question: "Can the trip stay personal-item-only?",
      answer:
        "That is Frontier's cleanest low-cost path: one item no larger than 14 × 18 × 8 inches. Frontier says it checks the included item's dimensions during boarding, so an overpacked bag is not a dependable workaround.",
    },
    {
      question: "Do you need a carry-on, checked bag, and seat together?",
      answer:
        "Price Basic with every needed add-on, then compare the itinerary's bundle offer. Frontier publishes bags through its Bag Price Checker rather than one universal price, so the checkout comparison is the decision—not a generic national average.",
    },
    {
      question: "Might the itinerary change inside 59 days?",
      answer:
        "For Basic or Standard bookings made on or after September 25, 2026, a change inside 59 days or a cancellation costs $149 per passenger, per direction. Economy Fare and Economy, Premium, or Business bundles list no change or cancellation fee.",
    },
    {
      question: "Will the checked bag stay at or below 40 lb?",
      answer:
        "Frontier's standard checked-bag limit is only 40 lb. A 41–50 lb bag adds $75; a 51–99.99 lb bag adds $129 on bookings made on or after April 4, 2026, before any separate oversize charge.",
    },
    {
      question: "Does a verified exception apply?",
      answer:
        "Eligible elite status, Frontier's qualifying card benefit, and active-duty military rules can change the bag total. Apply those benefits only when the traveler, booking, and operating-flight conditions match.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Frontier true-cost checklist
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        How much is a Frontier carry-on? The fare and purchase timing decide.
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">
        There is no honest nationwide dollar answer. Frontier prices a Basic-fare carry-on for the
        specific trip and says buying at booking costs less than waiting until the airport or gate.
        The useful comparison is Basic plus every needed add-on versus the offered bundle.
      </p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100 bg-white">
        <div className="hidden grid-cols-[0.65fr_1.1fr_1.6fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500 md:grid">
          <div>Fare</div>
          <div>Bag allowance</div>
          <div>What to compare</div>
        </div>
        {fareBagAnswer.map((row) => (
          <div
            key={row.fare}
            className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-b-0 md:grid-cols-[0.65fr_1.1fr_1.6fr] md:gap-4"
          >
            <div className="font-black text-slate-950">{row.fare}</div>
            <div className="text-sm font-semibold text-slate-800">{row.included}</div>
            <div className="text-sm leading-relaxed text-slate-600">{row.decision}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        Bundle inclusions can change. Confirm the itinerary before payment; status, card, and military
        benefits can also change the result.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <a
          href="https://www.flyfrontier.com/travel/travel-info/bag-options/"
          target="_blank"
          rel="noreferrer"
          className="text-blue-800 underline"
        >
          Check Frontier&apos;s current bag options
        </a>
        <Link href="/sizer-rules?height=14&width=18&depth=8" className="text-blue-800 underline">
          Check the free personal-item fit
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?airline=frontier&weight=51&size=62"
          className="text-blue-800 underline"
        >
          Check overweight exposure
        </Link>
        <Link href="/guides/basic-economy-traps" className="text-blue-800 underline">
          Compare restricted fares
        </Link>
      </div>
    </section>
  );
}

function RyanairBaggageDecisionChecklist() {
  const checks = [
    {
      question: "Does everything fit inside 40 × 30 × 20 cm?",
      answer:
        "If yes, the base fare can remain genuinely bag-fee-free. If the bag needs the overhead locker, it is not the included small-bag path, even if a retailer describes it as cabin luggage.",
    },
    {
      question: "Do you need the 10 kg bag in the cabin or only at arrival?",
      answer:
        "Priority & 2 Cabin Bags keeps a 55 × 40 × 20 cm, 10 kg bag onboard. The 10 kg Check-in Bag goes through bag drop and the hold. Compare price, availability, liquids, and carousel time before choosing.",
    },
    {
      question: "Would 20 kg or 23 kg prevent excess-weight charges?",
      answer:
        "Ryanair sells distinct 10 kg, 20 kg, and 23 kg checked products. Excess weight is €13/£13 per kilogram, so buying too little allowance can be worse than selecting the correct product initially.",
    },
    {
      question: "Are you leaving the bag decision until the airport?",
      answer:
        "That is the high-risk path. A non-Priority cabin-sized bag can be refused or placed in the hold for a gate fee, and airport checked-bag pricing is higher than the published online range.",
    },
    {
      question: "Could the itinerary itself change?",
      answer:
        "Ryanair charges per passenger, per flight, plus any fare difference. The published online change fee is lower than the airport or call-centre path, and ordinary voluntary refunds are not available.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Ryanair baggage decision
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Choose the bag product before the airport—not after the sizer check.
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link
          href="/sizer-rules?height=16&width=12&depth=8"
          className="text-blue-800 underline"
        >
          Check the small-bag fit
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?airline=ryanair&weight=22&size=62"
          className="text-blue-800 underline"
        >
          Check excess-weight exposure
        </Link>
        <Link href="/guides/carry-on-strictness-by-airline" className="text-blue-800 underline">
          Review carry-on enforcement
        </Link>
      </div>
    </section>
  );
}

function EasyJetBaggageDecisionChecklist() {
  const checks = [
    {
      question: "Does the bag fit 45 × 36 × 20 cm?",
      answer:
        "Every fare includes one small cabin bag up to 15 kg, but it must fit under the seat and the traveler must be able to lift it. A normal roller may exceed the free size even when it is light enough.",
    },
    {
      question: "Do you need a 56 × 45 × 25 cm overhead bag?",
      answer:
        "Add the large cabin bag to the booking, or confirm that Inclusive Plus or easyJet Plus supplies the entitlement. Prices and availability vary by flight; the airport path costs £60.",
    },
    {
      question: "Would a 15 kg hold bag be enough?",
      answer:
        "The 15 kg option is online-only. The standard 23 kg hold bag has a separate route- and timing-dependent price, and buying it at bag drop is a different airport-priced path.",
    },
    {
      question: "Could you exceed the purchased hold weight?",
      answer:
        "Extra weight can be bought online in 3 kg increments up to 32 kg per bag. At the airport, excess weight costs £12 per kilogram, so a realistic advance allowance usually beats improvising at bag drop.",
    },
    {
      question: "Are you relying on seat assignment for the bag?",
      answer:
        "Do not infer a large-bag entitlement from receiving an Up Front or Extra Legroom seat. The current policy ties the bag to an added product, Inclusive Plus, or eligible easyJet Plus treatment.",
    },
  ];

  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        easyJet baggage decision
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Solve cabin size first, then decide whether the extra weight belongs overhead or in the hold.
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.question} className="rounded-2xl border border-blue-100 bg-white p-5">
            <h3 className="font-bold text-slate-950">{check.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{check.answer}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
        <Link href="/sizer-rules?height=18&width=14&depth=8" className="text-blue-800 underline">
          Check the small-bag fit
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?airline=easyjet&weight=25&size=62"
          className="text-blue-800 underline"
        >
          Check excess-weight exposure
        </Link>
        <Link href="/guides/carry-on-strictness-by-airline" className="text-blue-800 underline">
          Review carry-on enforcement
        </Link>
      </div>
    </section>
  );
}

function airlineSlugsFromLinks(links: ReferenceLink[]) {
  return links
    .map((link) => /^\/airlines\/([^/?#]+)/.exec(link.href)?.[1])
    .filter((value): value is string => Boolean(value));
}

function getDefaultAvoidFeeAdvice(slug: string, airlineName: string): string[] {
  const advice = [
    "Start with the fare rules before you compare base fares. On this page, the biggest add-ons usually come from baggage allowance, seat selection, or flexibility rather than the ticket price alone.",
    "Keep cabin and checked bags inside the published size and weight limits. Once a bag becomes overweight, oversized, or excess, the fee logic can change by route, airport, or baggage concept.",
    "Buy bags and seats before the airport when the fee table shows a timing difference or route-based paid add-on; airport handling is usually the least forgiving place to discover a mismatch.",
  ];

  if (["american", "delta", "united", "alaska", "jetblue", "southwest"].includes(slug)) {
    advice.push(
      "Check whether a verified airline credit card baggage benefit beats the fee for your party before paying cash for a first checked bag."
    );
  }

  if (["american", "delta", "united", "air-canada", "jetblue", "southwest"].includes(slug)) {
    advice.push(
      `If you are considering a Basic-style fare on ${airlineName}, compare the bag, seat, and change restrictions against the next fare family before booking.`
    );
  }

  return advice;
}

function getAirlineMetadataCopy(slug: string, airlineName: string, fallback?: string): Metadata {
  switch (slug) {
    case "air-canada":
      return {
        title: "Air Canada Baggage Fees 2026: Checked Bag Costs by Fare",
        description:
          "Check Air Canada baggage fees by route and fare: current short-haul and long-haul first- and second-bag prices, Basic carry-on limits, and excess-bag rules.",
        alternates: {
          canonical: canonical("/airlines/air-canada"),
        },
      };
    case "frontier":
      return {
        title: "Frontier Baggage Fees 2026: Carry-On, Checked Bags & Bundles",
        description:
          "Check Frontier personal-item and carry-on rules, route-dependent checked-bag pricing, bundle inclusions, and current overweight and oversize charges.",
        alternates: { canonical: canonical("/airlines/frontier") },
      };
    case "southwest":
      return {
        title: "Southwest Baggage Fees 2026: Checked Bags & Carry-On Rules",
        description:
          "See current Southwest first- and second-bag prices by fare, free carry-on rules, Choice Extra allowance, and card, status, and military exceptions.",
        alternates: { canonical: canonical("/airlines/southwest") },
      };
    case "air-france":
      return {
        title: "Air France Baggage Fees 2026: Checked, Extra & Overweight Bags",
        description:
          "Check Air France baggage fees by fare and route, including checked bags, extra baggage, overweight charges, and when buying online can cost less.",
        alternates: {
          canonical: canonical("/airlines/air-france"),
        },
      };
    case "alaska":
      return {
        title: "Alaska Airlines Baggage Fees and Carry-On Rules (2026)",
        description:
          "Alaska baggage fees for 2026: $45 first bag and $55 second bag on most current North America tickets, plus Saver carry-on and route exceptions.",
        alternates: {
          canonical: canonical("/airlines/alaska"),
        },
      };
    case "lufthansa":
      return {
        title: "Lufthansa Baggage Fees, Carry-On Allowance, and EU261 Links (2026)",
        description:
          "Lufthansa baggage rules depend on fare, cabin, and route. The page explains included carry-on, checked-bag examples, excess baggage, seat selection, and change-fee conditions.",
        alternates: {
          canonical: canonical("/airlines/lufthansa"),
        },
      };
    case "zipair":
      return {
        title: "ZIPAIR Baggage Fees 2026: Bag Prices & 7 kg Carry-On",
        description:
          "See ZIPAIR checked bag prices by route, the 7 kg carry-on rule, 30 kg checked-bag limit, extra bag charges, dimensions, and airport purchase rules.",
        alternates: {
          canonical: canonical("/airlines/zipair"),
        },
      };
    case "eva-air":
      return {
        title: "EVA Air Baggage Fees: Allowance, Extra Bags & Carry-On (2026)",
        description:
          "Check EVA Air baggage allowances, the 7 kg Economy carry-on limit, prepaid excess-baggage discount, and route-dependent extra, overweight, and oversize rules.",
        alternates: {
          canonical: canonical("/airlines/eva-air"),
        },
      };
    case "cathay-pacific":
      return {
        title: "Cathay Pacific Baggage Allowance 2026: PC vs K Rules",
        description:
          "Decode Cathay Pacific's piece and weight baggage allowances, 7 kg carry-on rule, prepaid extra-piece discount, and 32 kg maximum per checked bag.",
        alternates: { canonical: canonical("/airlines/cathay-pacific") },
      };
    case "korean-air":
      return {
        title: "Korean Air Baggage Fees 2026: Extra and Overweight Bags",
        description:
          "Check Korean Air's route-based baggage allowance, advance excess purchase, Americas fee examples, stacked overweight and oversize charges, and Brazil exceptions.",
        alternates: { canonical: canonical("/airlines/korean-air") },
      };
    case "malaysia-airlines":
      return {
        title: "Malaysia Airlines Baggage Fees 2026: Weight vs Piece Rules",
        description:
          "Check Malaysia Airlines' weight and piece baggage systems, 20% advance extra-baggage discount, route examples, overweight charges, and cargo limits.",
        alternates: { canonical: canonical("/airlines/malaysia-airlines") },
      };
    case "vietnam-airlines":
      return {
        title: "Vietnam Airlines Baggage Fees 2026: Excess Bag Costs",
        description:
          "See Vietnam Airlines domestic and international excess-baggage examples, overweight and oversize tables, route-specific carry-on limits, and ATR72 rules.",
        alternates: { canonical: canonical("/airlines/vietnam-airlines") },
      };
    case "qatar-airways":
      return {
        title: "Qatar Airways Baggage Fees 2026: Weight vs Piece Routes",
        description:
          "Check Qatar Airways excess baggage by kilogram or piece, Africa and Americas rules, overweight and oversize combinations, and status allowances.",
        alternates: { canonical: canonical("/airlines/qatar-airways") },
      };
    case "turkish-airlines":
      return {
        title: "Turkish Airlines Baggage Fees 2026: Fare and Route Rules",
        description:
          "Compare Turkish Airlines EcoFly and higher fare baggage, piece and weight routes, connection caveats, Miles&Smiles allowances, and sports-equipment rules.",
        alternates: { canonical: canonical("/airlines/turkish-airlines") },
      };
    case "ana":
      return {
        title: "ANA Baggage Fees 2026: Prepaid Extra Bag Rules",
        description:
          "Check ANA's 10 kg combined carry-on limit, prepaid one-bag prices and exclusions, domestic versus international allowance, and sports-equipment exception.",
        alternates: { canonical: canonical("/airlines/ana") },
      };
    case "jal":
      return {
        title: "Japan Airlines Baggage Fees 2026: Extra and Heavy Bags",
        description:
          "See JAL international piece allowances, extra-piece and overweight examples, domestic per-kilogram excess, status benefits, and equipment limits.",
        alternates: { canonical: canonical("/airlines/jal") },
      };
    case "air-china":
      return {
        title: "Air China Baggage Fees 2026: Domestic and International Rules",
        description:
          "Understand Air China's domestic 1.5% excess-weight formula, international route tables, 8 kg Economy carry-on, status benefits, and transport limits.",
        alternates: { canonical: canonical("/airlines/air-china") },
      };
    case "china-eastern":
      return {
        title: "China Eastern Baggage Fees 2026: Excess and Heavy Bags",
        description:
          "Check China Eastern domestic per-kilogram baggage, international extra-piece tables, stacked overweight and oversize charges, and special-item rules.",
        alternates: { canonical: canonical("/airlines/china-eastern") },
      };
    case "china-southern":
      return {
        title: "China Southern Baggage Fees 2026: Domestic and International",
        description:
          "Check China Southern's domestic excess formula, international route-area tables, gate-checked carry-on risk, cumulative charges, and status allowance.",
        alternates: { canonical: canonical("/airlines/china-southern") },
      };
    case "xiamenair":
      return {
        title: "XiamenAir Baggage Fees 2026: Fare Brands and Extra Bags",
        description:
          "Compare XiamenAir Economy baggage by fare brand, domestic excess formula, international route groups, heavy-bag bands, and acceptance limits.",
        alternates: { canonical: canonical("/airlines/xiamenair") },
      };
    case "asiana":
      return {
        title: "Asiana Baggage Fees 2026: Extra, Heavy, and Prepaid Bags",
        description:
          "Check Asiana baggage for U.S., non-U.S., and Korean domestic routes, prepaid extra-piece savings, cumulative overweight charges, and status caveats.",
        alternates: { canonical: canonical("/airlines/asiana") },
      };
    case "garuda-indonesia":
      return {
        title: "Garuda Indonesia Baggage Fees 2026: New Piece Rules",
        description:
          "Understand Garuda's September 2026 switch from kilogram allowances and 5 kg excess blocks to piece rules, including status and codeshare caveats.",
        alternates: { canonical: canonical("/airlines/garuda-indonesia") },
      };
    case "srilankan":
      return {
        title: "SriLankan Airlines Baggage Fees 2026: Prepaid Excess",
        description:
          "Check SriLankan's weight and Americas piece rules, online 5 kg baggage blocks, three-hour cutoff, airport excess, and USD 50 oversize fee.",
        alternates: { canonical: canonical("/airlines/srilankan") },
      };
    case "hong-kong-airlines":
      return {
        title: "Hong Kong Airlines Baggage Fees 2026: Zones and Fare Rules",
        description:
          "Compare Hong Kong Airlines baggage by fare family and zone, prepaid eligibility and cutoff, cumulative heavy-bag charges, and codeshare exclusions.",
        alternates: { canonical: canonical("/airlines/hong-kong-airlines") },
      };
    case "china-airlines":
      return {
        title: "China Airlines Baggage Fees 2026: Fares, Zones, and Prepay",
        description:
          "Check China Airlines baggage by route and booking class, zero-piece fare cases, 5% prepaid excess savings, elite benefits, and special-bag rules.",
        alternates: { canonical: canonical("/airlines/china-airlines") },
      };
    case "hainan":
      return {
        title: "Hainan Airlines Baggage Fees 2026: Domestic and International",
        description:
          "Understand Hainan domestic 1.5% excess pricing, international piece tables, prepaid limits, 32 kg and 203 cm cutoffs, and status benefits.",
        alternates: { canonical: canonical("/airlines/hainan") },
      };
    case "egyptair":
      return {
        title: "EgyptAir Baggage Fees 2026: Prepay and Excess Rules",
        description:
          "Check EgyptAir route and channel baggage prices, the 24-hour prepay cutoff, Africa exceptions, Asmara limits, and combined heavy-oversize charges.",
        alternates: { canonical: canonical("/airlines/egyptair") },
      };
    case "royal-air-maroc":
      return {
        title: "Royal Air Maroc Baggage Fees 2026: Fares and Extra Bags",
        description:
          "Compare Royal Air Maroc fare-product allowances, route-table excess prices, non-pooled bag weight, Safar Flyer awards, and oversize limits.",
        alternates: { canonical: canonical("/airlines/royal-air-maroc") },
      };
    case "batik-air":
      return {
        title: "Batik Air Baggage Fees 2026: FBA and Prepaid Weight",
        description:
          "Check Batik Air ticketed FBA, same-booking weight pooling, 5–30 kg prepaid blocks, the six-hour purchase cutoff, and 32 kg piece limit.",
        alternates: { canonical: canonical("/airlines/batik-air") },
      };
    case "iberia":
      return {
        title: "Iberia Baggage Fees 2026: Basic, Bags, and Seats",
        description:
          "Compare Iberia Basic with included-bag fares, itinerary-priced extra bags, 23 kg overweight treatment, the 32 kg ceiling, and operator exceptions.",
        alternates: { canonical: canonical("/airlines/iberia") },
      };
    case "iberia-express":
      return {
        title: "Iberia Express Baggage Fees 2026: 15, 23, or 32 kg",
        description:
          "Compare the no-bag Express pack with included-bag fares, choose a 15, 23, or 32 kg add-on, and avoid the €60 excess-weight charge.",
        alternates: { canonical: canonical("/airlines/iberia-express") },
      };
    case "volaris":
      return {
        title: "Volaris Baggage Fees 2026: Zero vs Basic vs Plus",
        description:
          "Compare Volaris Zero, Basic, and Plus baggage: personal-item-only travel, 15 kg or 25 kg checked bags, carry-on access, and INVEX limits.",
        alternates: { canonical: canonical("/airlines/volaris") },
      };
    case "viva-aerobus":
      return {
        title: "Viva Aerobus Baggage Fees 2026: Zero to Smart",
        description:
          "Compare Viva Aerobus Zero, Light, Extra, and Smart: personal items, 10–15 kg cabin allowances, 15–25 kg checked bags, seats, and changes.",
        alternates: { canonical: canonical("/airlines/viva-aerobus") },
      };
    case "tap-air-portugal":
      return {
        title: "TAP Baggage Fees 2026: Discount and Extra Bags",
        description:
          "Compare TAP Discount with included-bag fares, extra bags from €30 online, route and seasonal pricing, heavy/large charges, and status rules.",
        alternates: { canonical: canonical("/airlines/tap-air-portugal") },
      };
    case "emirates":
      return {
        title: "Emirates Baggage Fees 2026: Weight vs Piece Rules",
        description:
          "Identify Emirates weight or piece rules, compare advance excess discounts with airport rates, and understand Skywards, 32 kg, and 203 cm limits.",
        alternates: { canonical: canonical("/airlines/emirates") },
      };
    case "kenya-airways":
      return {
        title: "Kenya Airways Baggage Fees 2026: Pieces and Pooling",
        description:
          "Read Kenya Airways ticketed pieces, interline rules, family bag-count pooling, per-piece weight limits, and Asante status or points benefits.",
        alternates: { canonical: canonical("/airlines/kenya-airways") },
      };
    case "south-african-airways":
      return {
        title: "South African Airways Baggage Fees 2026: Extra Bags",
        description:
          "Check SAA route-priced extra bags, date versus route changes, Voyager and partner limits, infant allowance, and cargo-only sports equipment.",
        alternates: { canonical: canonical("/airlines/south-african-airways") },
      };
    case "air-astana":
      return {
        title: "Air Astana Baggage Fees 2026: Basic and MyBAGGAGE",
        description:
          "Compare Air Astana Basic, Classic, and Plus baggage, the MyBAGGAGE 36-hour cutoff, operator exclusions, Nomad Club pieces, and cargo limits.",
        alternates: { canonical: canonical("/airlines/air-astana") },
      };
    default:
      return {
        title: `${airlineName} Fees, Traps, and Bag Math (2026)`,
        description:
          fallback ??
          `Published baggage, seat, and service fees for ${airlineName}, plus practical guidance on the biggest fee traps.`,
        alternates: {
          canonical: canonical(`/airlines/${slug}`),
        },
      };
  }
}

function FeeRowsTable({
  rows,
  emptyMessage,
}: {
  rows: FeeItem[];
  emptyMessage: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
          <tr>
            <th className="px-4 py-3">Applies to</th>
            <th className="px-4 py-3">Region / route</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Timing</th>
            <th className="px-4 py-3">Conditions</th>
            <th className="px-4 py-3">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={`${row.category}-${index}`} className="align-top">
              <td className="px-4 py-3 text-slate-700">{safeText(row.applies_to)}</td>
              <td className="px-4 py-3 text-slate-700">{safeText(row.region_or_route)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                {formatContextualAmount(row)}
              </td>
              <td className="px-4 py-3 text-slate-700">{safeText(row.timing)}</td>
              <td className="min-w-[260px] px-4 py-3 text-slate-700">{safeText(row.conditions)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                {safeUrl(row.source_url) ? (
                  <div className="grid gap-1.5">
                    <a
                      href={safeUrl(row.source_url)!}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-700 underline"
                    >
                      Official source
                    </a>
                    <span className="text-xs text-slate-500">Checked {row.last_verified}</span>
                    {(() => {
                      const freshness = getVerificationFreshness(row.last_verified);
                      if (freshness.label === "Recently checked") return null;
                      const className = freshness.tone === "red"
                        ? "border-rose-200 bg-rose-50 text-rose-900"
                        : freshness.tone === "amber"
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-slate-200 bg-slate-50 text-slate-700";
                      return <span title={freshness.detail} className={`w-fit rounded-full border px-2 py-0.5 text-[11px] font-bold ${className}`}>{freshness.label}</span>;
                    })()}
                  </div>
                ) : (
                  <span className="text-slate-500">Not published</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReferenceAirlinePage({
  slug,
  airline,
  fees,
}: {
  slug: string;
  airline: NonNullable<ReturnType<typeof getAirlineBySlug>>;
  fees: FeeItem[];
}) {
  const latestVerified = getLatestVerifiedDate(fees);
  const coreCategories = new Set<FeeItem["category"]>(["carry_on", "checked_baggage", "overweight_baggage", "oversize_baggage"]);
  const coreFees = fees.filter((fee) => coreCategories.has(fee.category));
  const oldestCoreVerified = getOldestVerifiedDate(coreFees.length ? coreFees : fees);
  const secondaryReviewCount = fees.filter((fee) =>
    !coreCategories.has(fee.category) && getVerificationFreshness(fee.last_verified).label !== "Recently checked"
  ).length;
  const content = REFERENCE_AIRLINE_CONTENT[slug];
  const travelerExceptions = content.exceptions.filter(
    (item) => !/co-branded card baggage waiver|card baggage waiver/i.test(item),
  );
  const carryOnRows = getRowsByCategory(fees, "carry_on");
  const checkedRows = getRowsByCategory(fees, "checked_baggage");
  const overweightRows = getRowsByCategory(fees, "overweight_baggage");
  const oversizeRows = getRowsByCategory(fees, "oversize_baggage");
  const seatRows = getRowsByCategory(fees, "seat_selection");
  const changeRows = getRowsByCategory(fees, "change_cancellation");
  const sameDayChangeRows = getRowsByCategory(fees, "same_day_change");
  const sameDayStandbyRows = getRowsByCategory(fees, "same_day_standby");
  const avoidFeeAdvice = content.avoidFees ?? [];
  const relatedGuides = content.relatedGuides ?? [];
  const numericCheckedBagFees = getNumericCheckedBagFees(fees);
  const changeAndSameDayRows = [...changeRows, ...sameDayChangeRows, ...sameDayStandbyRows];
  const comparisonPeerSlugs = airlineSlugsFromLinks(content.comparisonLinks);
  const hasCoreFeeData =
    carryOnRows.length > 0 ||
    checkedRows.length > 0 ||
    overweightRows.length > 0 ||
    oversizeRows.length > 0 ||
    seatRows.length > 0 ||
    changeAndSameDayRows.length > 0;
  const archetype = getAirlinePageArchetype(slug);
  const summaryLabels = getSummaryLabels(archetype);
  const isActiveAirline = airline.data_quality?.status !== "ceased_operations";
  const tripCostProfiles = isActiveAirline ? getTripCostPilotProfiles(airline) : [];
  const tripCostCurrencies = [...new Set(tripCostProfiles.map((profile) => profile.currency))];
  const tripCostMarkets = [...new Set(tripCostProfiles.flatMap((profile) => profile.marketContexts ?? []))];
  const tripCostParams = new URLSearchParams({ v: "1", a1: slug, a2: "" });
  if (tripCostCurrencies.length === 1) tripCostParams.set("c", tripCostCurrencies[0]);
  if (tripCostMarkets.length === 1) tripCostParams.set("m", tripCostMarkets[0]);
  const tripCostHref = `/tools/true-trip-cost?${tripCostParams.toString()}`;
  const showDeepAnalysis = isActiveAirline && DEEP_ANALYSIS_SLUGS.has(slug);
  const hasUsableBagEstimate = isActiveAirline && numericCheckedBagFees.length > 0;
  const faqJsonLd = airlineFaqJsonLd(slug);
  const searchEntryCopy = SEARCH_ENTRY_COPY[slug];

  return (
    <main className={`mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 ${slug === "air-france" ? "min-w-0 max-w-full overflow-x-hidden" : ""}`}>
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <header className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link href="/airlines" className="underline hover:text-blue-600">
                Airlines
              </Link>
              <span>/</span>
              <span className="text-slate-900">{airline.name}</span>
            </nav>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              {searchEntryCopy?.h1 ?? `${airline.name} baggage fees and fare rules`}
            </h1>
          </div>
          <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-100 p-3 text-xs font-mono">
            {airline.iata && (
              <div>
                <span className="text-slate-400">IATA:</span> {airline.iata}
              </div>
            )}
            {airline.icao && (
              <div>
                <span className="text-slate-400">ICAO:</span> {airline.icao}
              </div>
            )}
            <div>
              <span className="text-slate-400">Last verified:</span> {latestVerified}
            </div>
          </div>
        </div>

        <VerificationTrustBar
          airlineName={airline.name}
          latestVerified={latestVerified}
          oldestCoreVerified={oldestCoreVerified}
          secondaryReviewCount={secondaryReviewCount}
        />

        {searchEntryCopy ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              The verdict
            </div>
            <p className="mt-2 max-w-4xl text-base font-semibold leading-relaxed text-slate-900">
              {searchEntryCopy.verdict}
            </p>
          </section>
        ) : null}

        {slug === "zipair" ? <ZipairBaggageDecisionChecklist /> : null}

        {slug === "air-france" ? (
          <AirFranceBaggagePriceChecklist />
        ) : slug !== "zipair" ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              {summaryLabels.eyebrow}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {summaryLabels.carryOn}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.carryOn)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {summaryLabels.personalItem}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.personalItem)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {summaryLabels.checkedBag}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.checkedBag)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {summaryLabels.restrictions}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.restrictions)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {slug !== "zipair" && (hasUsableBagEstimate || avoidFeeAdvice.length > 0) ? (
          <div className={`grid gap-4 ${hasUsableBagEstimate && avoidFeeAdvice.length > 0 ? "lg:grid-cols-[1.05fr_0.95fr]" : ""}`}>
            {hasUsableBagEstimate ? (
              <BagCostTeaser
                slug={slug}
                airlineName={airline.name}
                feeByBagOrdinal={numericCheckedBagFees}
              />
            ) : null}
            {avoidFeeAdvice.length > 0 ? <QuickSavePanel items={avoidFeeAdvice} /> : null}
          </div>
        ) : null}
      </header>

      {slug !== "zipair" && content.verificationNote ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
          <span className="font-bold text-slate-900">Last verified note:</span>{" "}
          {readerCopy(content.verificationNote)}
        </section>
      ) : null}

      {content.statusUpdate ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-slate-700">
          <span className="font-bold text-slate-900">{content.statusUpdate.label}:</span>{" "}
          {readerCopy(content.statusUpdate.body)}
        </section>
      ) : null}

      {slug === "united" ? <UnitedFeeDecisionChecklist /> : null}
      {slug === "delta" ? <DeltaFeeDecisionChecklist /> : null}
      {slug === "american" ? <AmericanFeeDecisionChecklist /> : null}
      {slug === "southwest" ? <SouthwestFeeDecisionChecklist /> : null}
      {slug === "jetblue" ? <JetBlueFeeDecisionChecklist /> : null}
      {slug === "frontier" ? <FrontierFeeDecisionChecklist /> : null}
      {slug === "ryanair" ? <RyanairBaggageDecisionChecklist /> : null}
      {slug === "easyjet" ? <EasyJetBaggageDecisionChecklist /> : null}
      {slug === "air-canada" ? <AirCanadaCheckedBagFeeChecklist /> : null}
      {slug === "air-india" ? <AirIndiaBaggageDecisionChecklist /> : null}
      {slug === "lufthansa" ? <LufthansaBaggageDecisionChecklist /> : null}
      {slug === "singapore-airlines" ? <SingaporeAirlinesBaggageDecisionChecklist /> : null}
      {slug === "eva-air" ? <EvaAirBaggageDecisionChecklist /> : null}
      {slug === "alaska" ? <AlaskaCarryOnAndBagCheck /> : null}
      {slug === "air-france" || slug === "zipair" ? <AirlineFaqBlock slug={slug} /> : null}

      {hasUsableBagEstimate ? (
        <BaggageDecisionWidget
          airlineSlug={slug}
          airlineName={airline.name}
          feeByBagOrdinal={numericCheckedBagFees}
        />
      ) : null}

      {slug !== "zipair" ? <CardSavingsDecisionPanel slug={slug} airlineName={airline.name} /> : null}

      {slug !== "zipair" ? <AirlineScenarioLinks slug={slug} airlineName={airline.name} /> : null}

      {slug !== "zipair" && tripCostProfiles.length > 0 ? (
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Compare a fare you found</div>
          <h2 className="mt-2 text-xl font-black text-slate-950">Does {airline.name} still win after the fees?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
            Start with {airline.name} preselected, add the competing flight, and compare the whole party&apos;s fare, checked bags, overhead carry-ons, and seats. Choose the exact fare profile only when it matches the booking.
          </p>
          <Link href={tripCostHref} className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">
            Compare true trip cost
          </Link>
        </section>
      ) : null}

      {slug !== "zipair" && showDeepAnalysis && comparisonPeerSlugs.length > 0 ? (
        <UnifiedBaggageComparison
          focusSlug={slug}
          peerSlugs={comparisonPeerSlugs}
          compact
        />
      ) : null}

      {hasCoreFeeData ? <section className="space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">{slug === "zipair" ? "Detailed policy references" : "Core fee breakdown"}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
            {archetype === "ulcc"
              ? "Start with what the base fare excludes, then check how purchase timing, bag size, and weight change the price."
              : archetype === "us-network"
                ? "Published fees below preserve the fare, route, card, status, and timing conditions that can change the amount."
                : archetype === "inclusive"
                  ? "Start with the included allowance. The fee risk begins when the itinerary, cabin, weight, or piece limit is exceeded."
                  : "International allowances and charges often depend on route, cabin, fare family, and whether the itinerary uses a weight or piece concept."}
          </p>
        </div>

        {carryOnRows.length > 0 ? <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Carry-on rules</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            See also the broader <Link href="/fees/carry_on" className="underline">carry-on fee reference</Link>.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            When the issue is whether a bag will physically pass at the gate, compare the published rule with{" "}
            <Link href="/sizer-rules" className="underline">
              sizer enforcement reality
            </Link>
            .
          </p>
          <FeeRowsTable
            rows={carryOnRows}
            emptyMessage="No dedicated carry-on fee row is shown for this airline yet."
          />
          {isActiveAirline ? <CarryOnRecommendations airlineSlug={slug} airlineName={airline.name} /> : null}
        </section> : null}

        {checkedRows.length > 0 ? <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">
            {slug === "air-france"
              ? "Air France checked baggage fees"
              : slug === "air-canada"
                ? "Air Canada checked baggage fees"
                : slug === "zipair"
                  ? "ZIPAIR checked baggage fees"
                  : "Checked baggage fees"}
          </h3>
          <p className="text-sm leading-relaxed text-slate-600">
            See also the <Link href="/fees/checked_baggage" className="underline">checked baggage fee reference</Link>
            {content.comparisonLinks.length > 0 ? (
              <>. For a side-by-side baseline comparison, review <InlineComparisonLinks links={content.comparisonLinks} />.</>
            ) : "."}
          </p>
          {slug !== "zipair" ? getCardBenefitReference(slug) : null}
          <FeeRowsTable
            rows={checkedRows}
            emptyMessage="No checked-baggage row is shown for this airline yet."
          />
        </section> : null}

        {overweightRows.length > 0 || oversizeRows.length > 0 ? (
        <section className={`grid gap-6 ${overweightRows.length > 0 && oversizeRows.length > 0 ? "lg:grid-cols-2" : ""}`}>
          {overweightRows.length > 0 ? <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900">
              {slug === "air-france"
                ? "Air France extra and overweight baggage costs"
                : slug === "air-canada"
                  ? "Air Canada overweight baggage charges"
                  : slug === "zipair"
                    ? "ZIPAIR extra and overweight baggage fees"
                    : "Excess and overweight baggage"}
            </h3>
            <FeeRowsTable
              rows={overweightRows}
              emptyMessage="No dedicated overweight-baggage row is shown for this airline yet."
            />
          </div> : null}
          {oversizeRows.length > 0 ? <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900">Oversized baggage</h3>
            <FeeRowsTable
              rows={oversizeRows}
              emptyMessage="No dedicated oversized-baggage row is shown for this airline yet."
            />
          </div> : null}
        </section>
        ) : null}

        {seatRows.length > 0 ? <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Seat and fare-related fees</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            See also the <Link href="/fees/seat_selection" className="underline">seat selection fee reference</Link>.
          </p>
          <FeeRowsTable
            rows={seatRows}
            emptyMessage="No dedicated seat-selection row is shown for this airline yet."
          />
        </section> : null}

        {changeAndSameDayRows.length > 0 ? <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Change and cancellation references</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            See also the <Link href="/fees/change_cancellation" className="underline">change and cancellation fee reference</Link>.
          </p>
          {hasDotReference(slug) ? (
            <p className="text-sm leading-relaxed text-slate-600">
              For cancellation, significant schedule change, and refund timing rules in U.S.
              markets, see the{" "}
              <Link href="/passenger-rights/us-dot-refund" className="underline">
                U.S. DOT refund rules reference
              </Link>.
            </p>
          ) : null}
          <FeeRowsTable
            rows={changeAndSameDayRows}
            emptyMessage="No dedicated change, cancellation, or same-day service row is shown for this airline yet."
          />
        </section> : null}
      </section> : null}

      {slug !== "zipair" && showDeepAnalysis && content.fareClasses.length > 0 ? <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Fare-class behavior</h2>
        {slug === "jetblue" ? (
          <p className="text-sm leading-relaxed text-slate-600">
            For a broader comparison of Main Base and EvenMore Base against other stripped-down entry fares, see the{" "}
            <Link href="/guides/basic-economy-traps" className="underline">
              Basic Economy traps guide
            </Link>
            .
          </p>
        ) : slug === "air-canada" ? (
          <p className="text-sm leading-relaxed text-slate-600">
            For a broader comparison of Air Canada&apos;s Basic restrictions against other stripped-down
            entry fares, see the{" "}
            <Link href="/guides/basic-economy-traps" className="underline">
              Basic Economy traps guide
            </Link>
            .
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {content.fareClasses.map((item) => (
            <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(item.details)}</p>
            </div>
          ))}
        </div>
      </section> : null}

      {slug !== "zipair" && showDeepAnalysis && REAL_WORLD_SCENARIO_SLUGS.has(slug) && content.scenarios.length > 0 ? <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Real-world scenarios</h2>
        {hasEu261Reference(slug) ? (
          <p className="text-sm leading-relaxed text-slate-600">
            For international delay and cancellation coverage on itineraries that fall within EU261
            scope, see the{" "}
            <Link href="/passenger-rights/eu261" className="underline">
              EU261 passenger rights reference
            </Link>.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.scenarios.map((scenario) => (
            <div key={scenario.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-base font-bold text-slate-900">{scenario.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(scenario.details)}</p>
            </div>
          ))}
        </div>
      </section> : null}

      {travelerExceptions.length > 0 ? <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">When fees may not apply</h2>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            {travelerExceptions.map((item) => (
              <li key={item} className="border-l-4 border-slate-300 pl-4">
                {readerCopy(item)}
              </li>
            ))}
          </ul>
        </div>
      </section> : null}

      {content.comparisonLinks.length > 0 ? <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Compare with other airlines</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Comparison links below are limited to airlines with closely related fee structures or booking models.
        </p>
        <div className="flex flex-wrap gap-3">
          {content.comparisonLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section> : null}

      {relatedGuides.length > 0 ? <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Related guides</h2>
        <div className="flex flex-wrap gap-3">
          {relatedGuides.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section> : null}

      <div className="grid gap-8 border-t border-slate-100 pt-8 md:grid-cols-2">
        <Disclaimer />
        <div className="space-y-2 text-xs text-slate-400">
          <p>
            This reference reflects the published policy details and linked official sources available for this airline.
          </p>
        </div>
      </div>
    </main>
  );
}

function LegacyAirlinePage({
  slug,
  airline,
  fees,
}: {
  slug: string;
  airline: NonNullable<ReturnType<typeof getAirlineBySlug>>;
  fees: FeeItem[];
}) {
  const latestVerified = getLatestVerifiedDate(fees);
  const coreCategories = new Set<FeeItem["category"]>(["carry_on", "checked_baggage", "overweight_baggage", "oversize_baggage"]);
  const coreFees = fees.filter((fee) => coreCategories.has(fee.category));
  const oldestCoreVerified = getOldestVerifiedDate(coreFees.length ? coreFees : fees);
  const secondaryReviewCount = fees.filter((fee) =>
    !coreCategories.has(fee.category) && getVerificationFreshness(fee.last_verified).label !== "Recently checked"
  ).length;
  const strategy = AIRLINE_STRATEGY[slug];
  const insightTraps = airline.unique_insights?.traps ?? [];
  const insightHack = airline.unique_insights?.pro_hack;
  const summaryCards = summarizeRows(fees);
  const numericCheckedBagFees = getNumericCheckedBagFees(fees);
  const isActiveAirline = airline.data_quality?.status !== "ceased_operations";
  const authorityHighlights = strategy?.authorityHighlights ?? [];
  const peerLinks = (strategy?.relatedAirlines ?? [])
    .map((peerSlug) => getAirlineBySlug(peerSlug))
    .filter((peer): peer is NonNullable<ReturnType<typeof getAirlineBySlug>> => Boolean(peer));
  const avoidFeeAdvice = getDefaultAvoidFeeAdvice(slug, airline.name);
  const comparisonLinks = peerLinks.slice(0, 3).map((peer) => ({
    href: `/airlines/${peer.slug}`,
    label: peer.name,
  }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12">
      <header className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link href="/airlines" className="underline hover:text-blue-600">
                Airlines
              </Link>
              <span>/</span>
              <span className="text-slate-900">{airline.name}</span>
            </nav>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">{airline.name} fees and trap map</h1>
          </div>
          <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-100 p-3 text-xs font-mono">
            {airline.iata && (
              <div>
                <span className="text-slate-400">IATA:</span> {airline.iata}
              </div>
            )}
            {airline.icao && (
              <div>
                <span className="text-slate-400">ICAO:</span> {airline.icao}
              </div>
            )}
            <div>
              <span className="text-slate-400">Last verified:</span> {latestVerified}
            </div>
          </div>
        </div>

        <VerificationTrustBar
          airlineName={airline.name}
          latestVerified={latestVerified}
          oldestCoreVerified={oldestCoreVerified}
          secondaryReviewCount={secondaryReviewCount}
        />

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Quick summary</div>
          <p className="mt-3 max-w-4xl text-lg leading-relaxed text-slate-700">
            {strategy?.verdict ??
              `Start with the published ${airline.name} fees here, then compare the fee guide and related references before you book or add paid extras.`}
          </p>
          {insightHack ? (
            <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-900">Fast read:</span> {insightHack}
            </p>
          ) : null}
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">What drives the fees</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {strategy?.whyItWins ?? "Look for where the airline turns common travel behavior into paid add-ons."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Main add-ons to watch</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {strategy?.feeEngine ?? "Bag, seat, and flexibility costs are the first places the cheap fare breaks."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Best next tool</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {strategy?.toolReason ?? "Use the tools only after you understand which fee behavior matters for this airline."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <BagCostTeaser
            slug={slug}
            airlineName={airline.name}
            feeByBagOrdinal={numericCheckedBagFees}
          />
          <QuickSavePanel items={avoidFeeAdvice} />
        </div>

        <CompareNextPanel links={comparisonLinks} />
      </header>

      {authorityHighlights.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {authorityHighlights.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-lg"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600">What matters most here</div>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              <div className="mt-4 text-sm font-semibold text-blue-700 underline">{item.cta}</div>
            </Link>
          ))}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-lg"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{card.label}</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{card.value}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.detail}</p>
          </Link>
        ))}
      </section>

      {isActiveAirline && numericCheckedBagFees.length > 0 ? (
        <BaggageDecisionWidget
          airlineSlug={slug}
          airlineName={airline.name}
          feeByBagOrdinal={numericCheckedBagFees}
        />
      ) : null}

      <AirlineScenarioLinks slug={slug} airlineName={airline.name} />

      {isActiveAirline ? (
        <UnifiedBaggageComparison
          focusSlug={slug}
          peerSlugs={peerLinks.map((peer) => peer.slug)}
          compact
        />
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        {hasActiveStrategyPage(slug) ? (
          <Link
            href={`/airlines/${slug}/how-to-beat-fees`}
            className="group rounded-2xl border border-blue-100 bg-blue-50 p-6 transition hover:bg-blue-600"
          >
            <h2 className="text-lg font-bold text-blue-900 group-hover:text-white">How to beat {airline.name} fees</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-800 group-hover:text-blue-50">
              Go from the published policy to practical choices, bag math, and what to do before checkout.
            </p>
          </Link>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-300">Related references</div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href={`/tools/checked-baggage-calculator?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&directions=2&trips=2&pay=yes`} className="underline decoration-blue-300 underline-offset-4">
              Checked baggage calculator
            </Link>
            <Link href={`/best-cards?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&trips=2&pay=yes`} className="underline decoration-blue-300 underline-offset-4">
              Card break-even calculator
            </Link>
            <Link href="/sizer-rules" className="underline decoration-blue-300 underline-offset-4">
              Sizer enforcement
            </Link>
            <Link href="/guides/basic-economy-traps" className="underline decoration-blue-300 underline-offset-4">
              Basic Economy guide
            </Link>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Pair this page with the airline fee guide and related references when you need more than the published fee table alone.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {(strategy?.relatedGuides ?? []).map((guide) => (
              <Link key={guide.href} href={guide.href} className="underline decoration-blue-300 underline-offset-4">
                {guide.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(insightTraps.length > 0 || insightHack) && (
        <section className="grid gap-6 md:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-rose-700">Real traps to watch</div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-rose-950">
              {insightTraps.map((trap) => (
                <li key={trap} className="border-l-4 border-rose-300 pl-4">
                  {trap}
                </li>
              ))}
            </ul>
          </div>
          {insightHack ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-600 p-6 text-white">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-100">Expert move</div>
              <p className="mt-4 text-sm leading-relaxed text-blue-50">{insightHack}</p>
            </div>
          ) : null}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Published fees and policy details</h2>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-tighter text-slate-500">
              {fees.length} verified rows
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full border-collapse bg-white text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Conditions</th>
                  <th className="px-4 py-4">Pricing</th>
                  <th className="px-4 py-4">When</th>
                  <th className="px-4 py-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((item, idx) => {
                  const { pricingUnit, whenCharged, extraForConditions } = deriveTiming(item.timing);
                  const conditions = appendToConditions(item.conditions, extraForConditions);
                  const sourceUrl = safeUrl(item.source_url);

                  return (
                    <tr key={idx} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-4 font-bold text-blue-600">
                        {isFeeCategoryKey(item.category) ? (
                          <Link href={`/fees/${item.category}`} className="hover:underline">
                            {prettyCategoryLabel(item.category)}
                          </Link>
                        ) : (
                          <span className="text-slate-700">{prettyCategoryLabel(item.category)}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-mono font-bold text-slate-900">
                        {formatContextualAmount(item)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-slate-600">{conditions}</td>
                      <td className="px-4 py-4 italic text-slate-500">{pricingUnit}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                          {whenCharged}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {sourceUrl ? (
                          <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 underline">
                            Source
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">How to use this page</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              The fee table is most useful when you read it alongside the airline fee guide, fare rules, and related baggage references.
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              {hasActiveStrategyPage(slug) ? (
                <Link href={`/airlines/${slug}/how-to-beat-fees`} className="font-semibold text-blue-700 underline">
                  Go to the {airline.name} fee guide
                </Link>
              ) : null}
              <Link href={`/tools/checked-baggage-calculator?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&directions=2&trips=2&pay=yes`} className="font-semibold text-blue-700 underline">
                Estimate checked-bag cost
              </Link>
              <Link href={`/best-cards?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&trips=2&pay=yes`} className="font-semibold text-blue-700 underline">
                Run break-even card math
              </Link>
              <Link href="/sizer-rules" className="font-semibold text-blue-700 underline">
                Check carry-on enforcement reality
              </Link>
              <Link href="/fees/checked_baggage" className="font-semibold text-blue-700 underline">
                Compare fee-topic pages
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Related guides</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {(strategy?.relatedGuides ?? [
                { href: "/guides/basic-economy-traps", label: "Basic Economy traps" },
                { href: "/fees/checked_baggage", label: "Checked bag fee guide" },
              ]).map((guide) => (
                <Link key={guide.href} href={guide.href} className="font-semibold text-blue-700 underline">
                  {guide.label}
                </Link>
              ))}
            </div>
          </div>

          {peerLinks.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Compare against nearby alternatives</h2>
              <div className="mt-4 grid gap-3 text-sm">
                {peerLinks.map((peer) => (
                  <Link key={peer!.slug} href={`/airlines/${peer!.slug}`} className="font-semibold text-blue-700 underline">
                    {peer!.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isCoreAirline(slug) ? null : null}
        </div>
      </section>

      {isActiveAirline ? <SizerCheck /> : null}

      <div className="grid gap-8 border-t border-slate-100 pt-8 md:grid-cols-2">
        <Disclaimer />
        <div className="space-y-2 text-xs text-slate-400">
          <p>If a row is missing or unclear, the page should show that uncertainty rather than guess.</p>
        </div>
      </div>

      {isActiveAirline ? <RelatedTools slug={slug} /> : null}
    </main>
  );
}

export async function generateStaticParams() {
  return getAirlineSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) return { title: "Airline not found" };

  if (slug === "spirit") {
    return {
      title: "Spirit Airlines fee page archived",
      description: "Archived Spirit Airlines fee reference. Spirit's official site says the airline is winding down operations.",
      robots: { index: false, follow: true },
      alternates: { canonical: canonical("/airlines/spirit") },
    };
  }

  const strategy = AIRLINE_STRATEGY[slug];
  return getAirlineMetadataCopy(slug, airline.name, strategy?.verdict);
}

export default async function AirlinePage({ params }: PageProps) {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) notFound();

  if (slug === "spirit") {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-800">Archived airline page</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Spirit Airlines fee reference is no longer active</h1>
          <p className="mt-4 leading-relaxed text-slate-700">
            Spirit&apos;s official website states that the airline is winding down operations and that its flights are cancelled. We have removed Spirit from active comparisons, calculators, and strategy guides so historical fee information is not mistaken for a current booking option.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
            <a href="https://www.spirit.com/" target="_blank" rel="noreferrer" className="text-blue-800 underline">Check Spirit&apos;s official notice</a>
            <Link href="/airlines" className="text-blue-800 underline">Browse active airline pages</Link>
          </div>
        </div>
      </main>
    );
  }

  const fees = (airline.fees ?? []) as FeeItem[];

  if (isReferenceSlug(slug)) {
    return <ReferenceAirlinePage slug={slug} airline={airline} fees={fees} />;
  }

  return <LegacyAirlinePage slug={slug} airline={airline} fees={fees} />;
}
