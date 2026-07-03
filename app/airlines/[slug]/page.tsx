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
import { AIRLINE_STRATEGY, isCoreAirline } from "@/lib/airline-strategy";

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
  "philippin-airlines",
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
      "Singapore Airlines baggage, seat, change, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your itinerary uses the weight concept or piece concept before packing; the excess charge is triggered by exceeding the allowance attached to that concept.",
      "Treat the 7 kg cabin-bag limit as real for Economy and Premium Economy. If your bag is close, moving weight into checked baggage before the airport is safer than discovering the issue at check-in.",
      "Do not assume a seat is free just because standard selection is often included. Preferred or extra-legroom seats may still price by route and fare family.",
      "Check fare conditions before buying a restrictive fare, because change and cancellation costs depend on the fare rule rather than one flat Singapore Airlines fee.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=singapore-airlines&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
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
    scenarios: [
      {
        title: "Flying Economy with cabin baggage only",
        details:
          "The cabin allowance is one cabin bag up to 7 kg. This is a weight-sensitive cabin policy, so the risk is less about a posted carry-on fee and more about being over the cabin limit.",
      },
      {
        title: "Checking one standard bag",
        details:
          "There is no fixed first-bag fee shown here because Singapore Airlines usually starts from an included allowance on eligible fares. The useful question is how much your specific route and fare include.",
      },
      {
        title: "Exceeding the included allowance",
        details:
          "Excess baggage pricing varies because Singapore Airlines may apply either weight-based or piece-based logic depending on the countries served and the ticket purchased.",
      },
      {
        title: "Choosing a better seat",
        details:
          "Standard seat selection may be included on many fares, but preferred or extra-legroom seats can become a paid add-on on some Economy fares.",
      },
    ],
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
        "Lufthansa includes carry-on baggage, but the cabin matters: Economy and Premium Economy get one 7 kg item, while Business and First get two 7 kg items. A small personal item is also permitted under the cabin rules.",
      personalItem:
        "Lufthansa allows an additional small item, such as a slim laptop bag, alongside the main cabin baggage allowance.",
      checkedBag:
        "Lufthansa checked baggage is fare-, cabin-, and route-dependent rather than one global first-bag price. In the U.S.-to-Germany Economy example shown here, the first 23 kg bag is free and the second bag costs USD 90.",
      restrictions:
        "Economy Light is the main restriction point: it has paid/limited rebooking treatment, and advance seat reservation fees may apply depending on fare, route, and status.",
    },
    verificationNote:
      "Lufthansa baggage, seat, change, and refund details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Price the exact origin, destination, and fare family before assuming the first checked bag is included; the free first-bag example here is specifically United States to Germany in Economy.",
      "Avoid treating Economy Light like a normal flexible fare. The example shown here has a USD 199 rebooking fee plus possible fare difference.",
      "Keep Economy and Premium Economy checked bags at or below 23 kg and 158 cm total dimensions to avoid excess-baggage treatment.",
      "Use included or status-eligible seat-selection options where available instead of buying advance seat reservation by default.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=lufthansa&weight=25&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy Light",
        details:
          "Economy Light is the restrictive change example, with a USD 199 rebooking fee plus possible fare difference in the international example context.",
      },
      {
        name: "Economy Classic and above",
        details:
          "These fares can be rebooked under Lufthansa's fare rules, but the amount stays fare-rule based because fare differences and fare conditions still apply.",
      },
      {
        name: "Economy / Premium Economy baggage",
        details:
          "Carry-on is one 7 kg item plus a small item. Checked-bag allowance varies by fare, cabin, and route, with excess treatment above 23 kg or 158 cm total dimensions.",
      },
      {
        name: "Business / First",
        details:
          "Carry-on is two 7 kg items plus the small item. Premium-cabin checked-bag fees are not reduced to one separate universal ladder here.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy from the U.S. to Germany",
        details:
          "The U.S.-to-Germany example shows the first checked bag up to 23 kg free and the second checked bag at USD 90, but that should not be treated as a universal Lufthansa rule for every route.",
      },
      {
        title: "Booking Economy Light",
        details:
          "Economy Light can look cheaper until you need flexibility. The rebooking example shown here is USD 199 plus any fare difference.",
      },
      {
        title: "Checking a 25 kg Economy bag",
        details:
          "For Economy and Premium Economy, bags above 23 kg and up to 32 kg move into excess-baggage treatment, with fees varying by route.",
      },
      {
        title: "Selecting seats before check-in",
        details:
          "Advance seat reservation may cost extra depending on fare, route, and status, so the fee is variable rather than one flat seat-selection amount.",
      },
    ],
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
        "Air France baggage charges depend on itinerary and fare path, so this page does not pretend there is one flat first-bag price. Additional baggage prices are shown during purchase or in My Bookings, with an online discount at least 24 hours before departure except on flights from or to Canada and the USA, where the online and airport prices are the same.",
      restrictions:
        "The fee traps are timing and fare-family based: Basic Economy can turn hand baggage into an add-on, Economy Light has seat-selection restrictions, and overweight or oversized baggage must be handled at the airport.",
    },
    verificationNote:
      "Air France baggage, seat, change, and Kids Solo details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "If booking Basic, confirm whether the larger hand-baggage item is included or whether the Hand Baggage option is required before comparing the fare against a higher bundle.",
      "Buy additional baggage online at least 24 hours before departure when the route allows the discount; flights from or to Canada and the USA do not get a different online price.",
      "Keep checked bags within the ticketed allowance because overweight and oversized baggage are airport-paid options and vary by itinerary.",
      "Use free seat-assignment eligibility when it applies, such as Flex fares or listed Flying Blue status benefits, instead of paying for seat selection too early.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
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
          "Additional baggage prices are itinerary-based and shown in booking or My Bookings, with the online timing rule depending on whether the itinerary touches Canada or the USA.",
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
          "Additional baggage pricing is itinerary-based and surfaced during purchase or in My Bookings. The practical move is to price the exact route before deciding whether Air France is cheaper than another carrier.",
      },
      {
        title: "Arriving with an oversized bag",
        details:
          "Oversized baggage over 158 cm and up to 300 cm total dimensions is an airport-paid option, with the price depending on itinerary.",
      },
      {
        title: "Skipping paid seat selection",
        details:
          "If you do not buy a seat, Air France can auto-assign a seat at check-in. That is a practical fallback, but Economy Light has less control before check-in closes.",
      },
    ],
    exceptions: [
      "The additional-baggage online discount rule has an exception for flights from or to Canada and the USA, where the online price is the same as the airport price.",
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
      "The newest Southwest checked-baggage details shown here were last verified on 2026-04-28. Carry-on, seat, change, and cancellation details were last verified on 2025-12-19.",
    avoidFees: [
      "Do not assume Southwest still means two checked bags for every fare. Compare Basic, Choice, and Choice Preferred against Choice Extra if anyone in the party is checking bags.",
      "For U.S. Mainland bookings, check the ticketing or change date before relying on a baggage amount; Southwest separates bookings before and after April 9, 2026.",
      "Keep the trip carry-on-only when possible. Southwest still includes one carry-on and one personal item, so the cleanest way to avoid the checked-bag fee is not checking a bag.",
      "If same-day flexibility matters, avoid Basic unless the lower fare still wins after bag, seat, and change restrictions are priced in.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=southwest&travelers=2&bags=1&directions=2&trips=1&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=southwest&travelers=2&bags=1&trips=2&pay=yes", label: "Card bag-benefit calculator" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Restricted fare guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
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
        "Air India is mainly an allowance airline, not a flat first-bag-fee airline. Checked baggage is included on most eligible fares, while additional baggage is purchased separately under route-based piece or weight concept rules.",
      restrictions:
        "Air India's main restrictions are operational rather than one fixed fee ladder: cabin baggage is explicitly tied to Air India-operated flights, while extra baggage, seat selection, and changes all depend on route, fare family, or timing.",
    },
    verificationNote:
      "Air India baggage, seat, and change details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the itinerary uses the piece concept or weight concept before buying extra baggage; the excess-baggage path depends on that structure.",
      "Treat the Economy 7 kg cabin-bag limit as a real packing constraint on Air India-operated flights. If the bag is close, solve the weight before the airport.",
      "Buy additional baggage before airport handling when the route permits it, but do not assume one universal add-on amount because pricing remains route-based.",
      "For partner-operated or mixed itineraries, check the operating carrier rules because this cabin-baggage guidance is for Air India-operated flights.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=air-india&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy cabin baggage is one cabin bag up to 7 kg plus one personal item on Air India-operated flights. Checked baggage is still included on most eligible fares, but the actual allowance depends on route and whether the itinerary uses the piece or weight concept.",
      },
      {
        name: "Premium cabins",
        details:
          "Business and First Class have higher cabin baggage allowances, but premium-cabin checked-bag and change-fee treatment is not reduced to one universal ladder here.",
      },
      {
        name: "Allowance and purchase path",
        details:
          "The useful split on this page is between included allowance and purchased excess. Additional baggage can be bought in advance or at the airport, but pricing stays route-based rather than becoming one fixed amount.",
      },
      {
        name: "Partner or non-Air India operations",
        details:
          "The carry-on guidance is limited to Air India-operated flights. Partner-operated segments may use the operating carrier's baggage rules.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin baggage",
        details:
          "Economy shows one cabin bag up to 7 kg plus one personal item on Air India-operated flights.",
      },
      {
        title: "Checking one standard bag",
        details:
          "There is no fixed first-bag fee shown here because the usual starting point is included allowance on eligible fares. The real question becomes how much baggage the route and baggage concept include before excess pricing begins.",
      },
      {
        title: "Buying extra baggage in advance",
        details:
          "Additional checked baggage is purchasable both before travel and at the airport, but the amount stays route-based because there is no one universal INR add-on figure.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight baggage is a variable airport fee that depends on route and excess weight, up to the 32 kg acceptance limit.",
      },
      {
        title: "Flying on a partner-operated itinerary",
        details:
          "The carry-on guidance here is limited to Air India-operated flights, so a partner-operated segment may follow different baggage rules than the Air India baseline.",
      },
    ],
    exceptions: [
      "Checked baggage is included on most eligible fares rather than handled as one fixed universal paid first-bag rule.",
      "Additional baggage may be purchased in advance or at the airport where the route permits it, but no fixed extra-bag number is shown here.",
      "Business and First Class have higher cabin-baggage allowances.",
      "No elite-status or co-branded-card baggage waiver is shown here for Air India.",
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
        "Air Canada includes one standard carry-on and one personal item on all fares. The real risk is not a carry-on fee; it is whether the bag fits the size limits on the aircraft and airport you are using.",
      personalItem:
        "One personal item is included alongside the standard carry-on. There is no separate personal-item-only fee shown here.",
      checkedBag:
        "Air Canada baggage fees depend first on fare family and route. Standard and higher fares show the first checked bag included across domestic, transborder, and international markets, while the Basic domestic/transborder example shown here lists CAD 30 for the first checked bag and CAD 50 for the second bag where it is not included.",
      restrictions:
        "Basic fares are the main restriction point: changes and refunds are not permitted after 24 hours except in qualifying circumstances, and advance seat selection starts as a paid product on Basic.",
    },
    verificationNote:
      "Air Canada baggage, seat, and change details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not compare Basic against Standard using base fare alone. On the domestic/transborder example, Basic has paid checked baggage while Standard and higher show the first bag included.",
      "Use the checked-bag calculator for parties with bags because the answer changes quickly when more than one traveler checks luggage.",
      "Keep bags under Air Canada's standard weight and size limits; overweight and oversize charges move into route-based ranges and bags over 32 kg are not accepted as ordinary checked baggage.",
      "Avoid Basic when you may need to change or refund after 24 hours, because Basic changes and refunds are not permitted except in qualifying circumstances.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=air-canada&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/tools/excess-baggage-calculator?airline=air-canada&bags=1&directions=2&weight=51&size=63", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
      { href: "/sizer-rules?height=22&width=14&depth=9", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic",
        details:
          "Basic shows the first checked bag at CAD 30 on domestic and transborder routes, advance seat selection starting at CAD 10, and changes and refunds not permitted after 24 hours except in qualifying circumstances.",
      },
      {
        name: "Standard and higher",
        details:
          "Standard, Flex, Comfort, Latitude, Premium Economy, and Business show the first checked bag included, with no change fee listed before departure for Standard and higher fares.",
      },
      {
        name: "Preferred and extra-legroom seating",
        details:
          "Preferred or extra-legroom seats are listed separately with a CAD 25 to CAD 199 range depending on route and timing.",
      },
      {
        name: "International route differences",
        details:
          "Checked-baggage allowance treatment applies across domestic, transborder, and international markets, but the paid Basic example shown here is specifically domestic and transborder. There is no fixed international paid first-bag number shown outside that example.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin baggage",
        details:
          "Air Canada includes one standard carry-on and one personal item, but aircraft size and airport enforcement still matter.",
      },
      {
        title: "Checking one standard bag on a Basic domestic or transborder trip",
        details:
          "The Basic domestic and transborder example shows CAD 30 each way for the first checked bag.",
      },
      {
        title: "Checking two standard bags on a fare where the second bag is not included",
        details:
          "The domestic and transborder example shows CAD 50 each way for the second checked bag where the second bag is not included.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight baggage is route-based, with a CAD 100 to CAD 225 range and bags over 32 kg not accepted.",
      },
      {
        title: "Changing a Basic fare after the 24-hour window",
        details:
          "Changes and refunds are not permitted on Basic fares after 24 hours except in qualifying circumstances.",
      },
    ],
    exceptions: [
      "The first checked bag is included on Standard and higher fares.",
      "The paid Basic example on this page is domestic and transborder, not a single universal international paid-bag baseline.",
      "No change fee is shown for Standard and higher fares before departure, though fare difference can still apply.",
      "No Aeroplan status or co-branded-card baggage waiver is shown here.",
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
        "EVA Air includes cabin baggage on EVA Air-operated flights: Economy shows one cabin bag up to 7 kg plus one personal item, while Premium Economy and Business have higher allowances.",
      personalItem:
        "EVA Air includes one personal item alongside the cabin bag allowance on EVA Air-operated flights.",
      checkedBag:
        "EVA Air is mainly an included-allowance airline, not a flat first-bag-fee airline. Checked baggage is included on most eligible fares, while extra baggage is purchased separately under route-based piece or weight concept rules.",
      restrictions:
        "EVA Air's main restrictions are operational rather than one fixed fee ladder: cabin baggage is explicitly tied to EVA Air-operated flights, while extra baggage, seat selection, and changes all depend on route, baggage concept, or fare rules.",
    },
    verificationNote:
      "EVA Air baggage, seat, and change details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your itinerary uses the piece concept or weight concept before buying extra baggage; that choice drives the excess-baggage math.",
      "Treat the Economy 7 kg cabin-bag limit as real on EVA Air-operated flights. If the bag is close, solve the weight before check-in.",
      "For additional baggage, price the exact route before travel rather than assuming one universal TWD add-on amount.",
      "For partner-operated segments, check the operating carrier rules because this cabin-baggage guidance is limited to EVA Air-operated flights.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=eva-air&weight=33&size=63", label: "Excess baggage calculator" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy",
        details:
          "Economy cabin baggage is one cabin bag up to 7 kg plus one personal item on EVA Air-operated flights. Checked baggage is still included on most eligible fares, but the actual allowance depends on route and whether the itinerary uses the piece or weight concept.",
      },
      {
        name: "Premium Economy / Business",
        details:
          "Premium Economy and Business have higher cabin baggage allowances, but premium-cabin checked-bag and change-fee treatment is not reduced to one universal ladder here.",
      },
      {
        name: "Allowance and purchase path",
        details:
          "The useful split on this page is between included allowance and purchased excess. Additional baggage can be bought in advance or at the airport, but pricing stays route-based rather than becoming one fixed amount.",
      },
      {
        name: "Partner or non-EVA operations",
        details:
          "The carry-on guidance is limited to EVA Air-operated flights. Partner-operated segments may use the operating carrier's baggage rules.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin baggage",
        details:
          "Economy shows one cabin bag up to 7 kg plus one personal item on EVA Air-operated flights.",
      },
      {
        title: "Checking one standard bag",
        details:
          "There is no fixed first-bag fee shown here because the usual starting point is included allowance on eligible fares. The real question becomes how much baggage the route and baggage concept include before excess pricing begins.",
      },
      {
        title: "Buying extra baggage in advance",
        details:
          "Additional checked baggage is purchasable before travel or at the airport, but the amount stays route-based because there is no one universal TWD add-on figure.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight baggage is a variable airport fee that depends on route and baggage concept, up to the 32 kg acceptance limit.",
      },
      {
        title: "Flying on a partner-operated itinerary",
        details:
          "The carry-on guidance here is limited to EVA Air-operated flights, so a partner-operated segment may follow different baggage rules than the EVA Air baseline.",
      },
    ],
    exceptions: [
      "Checked baggage is included on most eligible fares rather than handled as one fixed universal paid first-bag rule.",
      "Additional baggage may be purchased in advance or at the airport where the route permits it, but no fixed extra-bag number is shown here.",
      "Premium Economy and Business have higher cabin-baggage allowances.",
      "No Infinity MileageLands status or co-branded-card baggage waiver is shown here for EVA Air.",
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
        "Emirates is an included-allowance airline, not a flat paid-first-bag airline. Checked baggage is included under either the weight or piece concept depending on route, and excess baggage is priced separately when you exceed that allowance.",
      restrictions:
        "The main fee risk is excess baggage and restrictive Economy fare behavior: overweight, oversize, seat selection on Special or Saver-style fares, and change/cancellation fees all depend on route, fare family, or baggage concept.",
    },
    verificationNote:
      "The Emirates carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your route uses the weight concept or piece concept before packing; excess charges are triggered differently under each model.",
      "Keep each checked bag at or below 32 kg because that is the maximum accepted weight per bag.",
      "Check whether standard seat selection is included by cabin or fare before paying; Economy Special and Saver-style fares can behave differently from Flex or premium cabins.",
      "Read fare conditions before buying a restrictive ticket because change, cancellation, and refund treatment depends on fare family and route.",
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
        name: "Economy / Premium Economy",
        details:
          "Economy carry-on is one 7 kg piece, while Premium Economy shows one 10 kg piece. Checked baggage is included on eligible fares but depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Business and First show two cabin pieces up to 7 kg each. Premium-cabin seat selection is generally included.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage is triggered when the free allowance is exceeded, with pricing depending on route, cabin, and whether the itinerary uses piece or weight concept rules.",
      },
      {
        name: "Economy seat and fare conditions",
        details:
          "Seat selection may cost extra on some Economy fares, while change and cancellation fees depend on fare family and route.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with cabin baggage only",
        details:
          "The cabin baseline is one piece up to 7 kg. The risk is being over the cabin weight limit, not a simple carry-on fee.",
      },
      {
        title: "Checking within the included allowance",
        details:
          "Eligible fares include checked baggage, but the allowance depends on route, cabin, fare family, and whether the route uses the weight or piece concept.",
      },
      {
        title: "Exceeding the allowance",
        details:
          "Excess baggage charges apply when the free allowance is exceeded, and the amount depends on route, cabin, and baggage concept.",
      },
      {
        title: "Choosing an Economy seat",
        details:
          "Standard seat selection is included for some fare families and cabins, but some Economy fares can have paid seat selection depending on route, seat type, and timing.",
      },
    ],
    exceptions: [
      "Checked baggage is included under the weight or piece concept depending on route.",
      "Bags above 32 kg per bag are outside the ordinary accepted checked-baggage weight.",
      "No Emirates co-branded-card baggage waiver is shown here.",
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
        "Qatar Airways includes cabin baggage, but the allowance changes by cabin: Economy gets one 7 kg piece, while Business and First get two 7 kg pieces.",
      personalItem:
        "There is no separate Qatar Airways personal-item fee shown here; the practical cabin question is whether your cabin allows one or two main cabin pieces under the 7 kg-per-piece rule.",
      checkedBag:
        "Qatar Airways is an included-allowance airline, not a flat paid-first-bag airline. Checked baggage is included under the piece or weight concept depending on route, then excess baggage is charged when the allowance is exceeded.",
      restrictions:
        "The main fee risk is exceeding the included allowance or buying a restrictive fare. Excess baggage, preferred seats, changes, cancellations, and unaccompanied-minor service all depend on route, cabin, fare family, or eligibility.",
    },
    verificationNote:
      "The Qatar Airways carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the route uses the piece concept or weight concept before buying extra baggage; the allowance and excess logic change by route.",
      "Keep each checked bag at or below 32 kg because that is the maximum accepted weight per bag.",
      "Do not pay for preferred or extra-legroom seating until you know whether standard seat selection is included for your fare and cabin.",
      "Check fare rules before booking if you may change or cancel because fees depend on fare family and route, with fare differences possibly applying.",
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
        name: "Economy",
        details:
          "Economy carry-on is one cabin bag up to 7 kg. Checked baggage is included on eligible fares, with allowance depending on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Business and First show two cabin pieces up to 7 kg each. Premium-cabin excess-baggage pricing is still route- and concept-based rather than one universal amount.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage charges apply when the free allowance is exceeded, with pricing based on route, cabin, and number of pieces or weight.",
      },
      {
        name: "Seats and fare rules",
        details:
          "Standard seat selection is included for most fares, while preferred or extra-legroom seats and change/cancellation rules depend on fare family and route.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with cabin baggage only",
        details:
          "The cabin baseline is one piece up to 7 kg. The risk is being over the cabin allowance, not a separate carry-on fee.",
      },
      {
        title: "Checking within the included allowance",
        details:
          "Eligible fares include checked baggage, but the allowance depends on route and whether the itinerary uses the piece or weight concept.",
      },
      {
        title: "Buying excess baggage",
        details:
          "Excess baggage pricing depends on route, cabin, and number of pieces or weight, so this page should not be read as one universal add-on fee.",
      },
      {
        title: "Choosing an extra-legroom seat",
        details:
          "Preferred or extra-legroom seats may incur a fee on some Economy fares depending on route and fare family.",
      },
    ],
    exceptions: [
      "Checked baggage is included under either the piece or weight concept depending on route.",
      "Bags above 32 kg per bag exceed the accepted checked-baggage weight limit.",
      "No Qatar Airways co-branded-card baggage waiver is shown here.",
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
        "Turkish Airlines includes cabin baggage, but the allowance changes by cabin: Economy gets one 8 kg piece, while Business gets two 8 kg pieces.",
      personalItem:
        "This fee table does not show a separate Turkish Airlines personal-item fee row; the key cabin question is whether your cabin allows one or two main cabin pieces under the 8 kg-per-piece rule.",
      checkedBag:
        "Turkish Airlines is an included-allowance airline, not a flat paid-first-bag airline. Checked baggage is included under either the piece or weight concept depending on route, then excess baggage is charged when the allowance is exceeded.",
      restrictions:
        "The main fee risks are excess baggage, paid Economy seat selection on some fares, and promotional or restrictive fare rules for changes and cancellations.",
    },
    verificationNote:
      "The Turkish Airlines carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your route uses piece or weight concept baggage before packing; the excess-baggage charge depends on that structure.",
      "Keep each checked bag at or below 32 kg because the published row treats that as the maximum accepted weight per bag.",
      "Check whether standard seat selection is included for your fare before paying for an Economy seat.",
      "Avoid promotional fares if flexibility matters because the fee table identifies promotional fares as generally the most restrictive.",
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
        name: "Economy",
        details:
          "Economy cabin baggage is one piece up to 8 kg. Checked baggage is included on eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business",
        details:
          "Business cabin baggage is two pieces up to 8 kg each. This page does not show a separate premium-cabin excess-baggage price table.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage applies when the free allowance is exceeded, with pricing based on route, cabin, and whether piece or weight concept applies.",
      },
      {
        name: "Seats and fare rules",
        details:
          "Standard seat selection is included for most fares, while some Economy seats and change/cancellation treatment depend on route, fare family, and timing.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with cabin baggage only",
        details:
          "The cabin baseline is one piece up to 8 kg. The risk is being over the cabin weight limit, not a separate carry-on fee.",
      },
      {
        title: "Checking within the included allowance",
        details:
          "Eligible fares include checked baggage, but the allowance depends on route and whether the itinerary uses the piece or weight concept.",
      },
      {
        title: "Buying excess baggage",
        details:
          "Excess baggage pricing depends on route, cabin, and baggage concept, so this page should not be read as one universal extra-bag fee.",
      },
      {
        title: "Changing a promotional fare",
        details:
          "The published change row says change and cancellation fees depend on fare family and route, with promotional fares generally the most restrictive.",
      },
    ],
    exceptions: [
      "Checked baggage is included under either the piece or weight concept depending on route.",
      "Bags above 32 kg per bag exceed the published accepted weight limit.",
      "This fee table does not show a Turkish Airlines co-branded card baggage waiver.",
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
        "Cathay Pacific includes cabin baggage, but the allowance changes by cabin: Economy and Premium Economy get one 7 kg piece, while Business and First get two 7 kg pieces.",
      personalItem:
        "This fee table does not show a separate Cathay Pacific personal-item fee row; the practical cabin question is whether your cabin allows one or two main cabin pieces.",
      checkedBag:
        "Cathay Pacific is an included-allowance airline, not a flat paid-first-bag airline. Checked baggage is included under piece or weight concept rules depending on route, and excess baggage is charged when the allowance is exceeded.",
      restrictions:
        "The main fee risks are excess baggage, preferred or extra-legroom seat charges on some Economy fares, fare-rule-based changes, and route-specific unaccompanied-minor rules.",
    },
    verificationNote:
      "The Cathay Pacific carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your itinerary uses piece or weight concept baggage before buying extra allowance.",
      "Keep each checked bag at or below 32 kg because the published row treats that as the maximum accepted weight per bag.",
      "Check standard seat eligibility before buying preferred or extra-legroom seats on Economy fares.",
      "Read the fare rules before booking if you may change or cancel because fees depend on fare family and route.",
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
        name: "Economy / Premium Economy",
        details:
          "Cabin baggage is one piece up to 7 kg. Checked baggage is included on eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Business and First show two cabin pieces up to 7 kg each. This page does not show a separate premium-cabin excess-baggage price table.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage is charged when the free allowance is exceeded, with pricing based on route, cabin, and number of pieces or weight.",
      },
      {
        name: "Seats and fare rules",
        details:
          "Standard seat selection is included for most fares, while preferred seats, changes, cancellations, and refunds depend on fare family and route.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with cabin baggage only",
        details:
          "The cabin baseline is one piece up to 7 kg. The risk is being over the cabin allowance, not a separate carry-on fee.",
      },
      {
        title: "Checking within the included allowance",
        details:
          "Eligible fares include checked baggage, but the allowance depends on route and whether the itinerary uses piece or weight concept rules.",
      },
      {
        title: "Exceeding the allowance",
        details:
          "Excess baggage charges vary by route, cabin, and number of pieces or weight, so the amount must be priced for the itinerary.",
      },
      {
        title: "Choosing extra-legroom seats",
        details:
          "Preferred or extra-legroom seats may incur a fee on some Economy fares depending on route and fare family.",
      },
    ],
    exceptions: [
      "Checked baggage is included under piece or weight concept rules depending on route.",
      "Bags above 32 kg per bag exceed the published accepted weight limit.",
      "This fee table does not show a Cathay Pacific co-branded card baggage waiver.",
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
        "ANA includes carry-on baggage up to 10 kg total including the personal item, with standard size limits applying.",
      personalItem:
        "ANA's carry-on row treats the personal item as part of the total 10 kg cabin allowance, so weight matters even when the bag fits physically.",
      checkedBag:
        "ANA checked baggage is included on eligible fares, but the allowance depends on route, cabin, and domestic versus international rules. Additional bags are charged only after the free allowance is exceeded.",
      restrictions:
        "The main risks are excess baggage above the free allowance, airport overweight or oversize charges, preferred-seat charges on some international Economy fares, and fare-rule-based changes or refunds.",
    },
    verificationNote:
      "The ANA carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the trip is domestic or international before assuming the checked-bag allowance; ANA's allowance changes by route and cabin.",
      "Keep checked bags at or below 23 kg and 158 cm when possible because overweight and oversize fees begin above those thresholds in the published rows.",
      "Avoid bags over 32 kg because ANA does not accept them as checked baggage in the row shown here.",
      "Use included advance seat selection where available, and check whether a preferred-seat fee applies before paying for international Economy seating.",
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
        name: "All fares / cabin baggage",
        details:
          "Carry-on baggage is included up to 10 kg total including the personal item, with size limits applying.",
      },
      {
        name: "Checked-bag allowance",
        details:
          "Checked baggage is included, but the allowance depends on route, cabin, and domestic versus international rules.",
      },
      {
        name: "Additional and excess baggage",
        details:
          "Additional checked-bag, overweight, and oversize fees apply after the free allowance or standard thresholds are exceeded.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat selection is included for most fares, while preferred seats and change/cancellation rules depend on fare brand, route, and ticket type.",
      },
    ],
    scenarios: [
      {
        title: "Flying with carry-on only",
        details:
          "ANA's carry-on limit is up to 10 kg total including the personal item, so a heavy personal item can still create a cabin-bag issue.",
      },
      {
        title: "Checking within the free allowance",
        details:
          "Eligible fares include checked baggage, but the allowance depends on route, cabin, and domestic versus international rules.",
      },
      {
        title: "Checking a 24 kg bag",
        details:
          "The published overweight row applies above 23 kg and up to 32 kg; bags over 32 kg are not accepted as checked baggage.",
      },
      {
        title: "Selecting an international Economy preferred seat",
        details:
          "Preferred seat fees may apply on some international Economy fares depending on fare brand and route.",
      },
    ],
    exceptions: [
      "ANA provides unaccompanied-minor assistance free of charge on ANA-operated flights, with age restrictions and conditions.",
      "Bags above 32 kg are not accepted as checked baggage in the published row.",
      "This fee table does not show an ANA co-branded card baggage waiver.",
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
        "Japan Airlines includes carry-on baggage up to 10 kg total including the personal item, with size limits applying.",
      personalItem:
        "JAL's carry-on row treats the personal item as part of the 10 kg total cabin allowance, so the combined weight is the practical constraint.",
      checkedBag:
        "Japan Airlines checked baggage is included on eligible fares, but the allowance depends on route and cabin. Additional bags are charged only after the free allowance is exceeded.",
      restrictions:
        "The main risks are excess baggage above the included allowance, airport overweight or oversize charges, preferred-seat charges on some international Economy fares, and fare-rule-based changes or refunds.",
    },
    verificationNote:
      "The Japan Airlines carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm the route and cabin allowance before packing; JAL's included checked-bag allowance changes by route and cabin.",
      "Keep Economy checked bags at or below 23 kg and 158 cm when possible because overweight and oversize fees begin above those thresholds in the published rows.",
      "Avoid bags over 32 kg because JAL does not accept them as checked baggage in the row shown here.",
      "Check whether preferred or extra-legroom seats cost extra on the specific international Economy fare before paying for seat selection.",
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
        name: "All fares / cabin baggage",
        details:
          "Carry-on baggage is included up to 10 kg total including the personal item, with size limits applying.",
      },
      {
        name: "Economy checked baggage",
        details:
          "The fee table notes Economy is typically up to 23 kg per piece, while premium cabins have higher allowances.",
      },
      {
        name: "Additional and excess baggage",
        details:
          "Additional checked-bag, overweight, and oversize fees apply after the free allowance or standard thresholds are exceeded.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat selection is included for most fares, while preferred or extra-legroom seats and fare changes depend on fare brand and route.",
      },
    ],
    scenarios: [
      {
        title: "Flying with carry-on only",
        details:
          "The cabin baseline is up to 10 kg total including the personal item, so combined cabin weight matters.",
      },
      {
        title: "Checking within the included allowance",
        details:
          "Eligible fares include checked baggage, but the allowance depends on route and cabin.",
      },
      {
        title: "Checking a 24 kg Economy bag",
        details:
          "The published overweight row applies above 23 kg and up to 32 kg; bags over 32 kg are not accepted as checked baggage.",
      },
      {
        title: "Choosing an international Economy preferred seat",
        details:
          "Preferred or extra-legroom seat fees may apply on some international Economy fares depending on fare brand and route.",
      },
    ],
    exceptions: [
      "JAL provides unaccompanied-minor assistance free of charge on JAL-operated flights, with age restrictions and conditions.",
      "Bags above 32 kg are not accepted as checked baggage in the published row.",
      "This fee table does not show a JAL co-branded card baggage waiver.",
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
        "Korean Air includes cabin baggage, but the allowance changes by cabin: Economy gets one 10 kg piece, while Prestige and First get two 10 kg pieces.",
      personalItem:
        "This fee table does not show a separate Korean Air personal-item fee row; the practical cabin-bag question is how many 10 kg cabin pieces your cabin allows.",
      checkedBag:
        "Korean Air is an included-allowance airline, not a flat paid-first-bag airline. Checked baggage is included under piece or weight concept rules depending on route, and excess baggage is charged when the allowance is exceeded.",
      restrictions:
        "The main risks are excess baggage, preferred or extra-legroom seat charges on some Economy fares, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The Korean Air carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your itinerary uses piece or weight concept baggage before buying extra allowance.",
      "Keep each checked bag at or below 32 kg because the published row treats that as the maximum accepted weight per bag.",
      "Check whether standard seat selection is included for your fare before paying for preferred or extra-legroom seats.",
      "Read fare rules before booking if you may change or cancel because fees depend on fare family and route.",
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
        name: "Economy",
        details:
          "Economy cabin baggage is one piece up to 10 kg. Checked baggage is included on eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Prestige / First",
        details:
          "Prestige and First show two cabin pieces up to 10 kg each. This page does not show a separate premium-cabin excess-baggage price table.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage applies when the free allowance is exceeded, with pricing based on route, cabin, and number of pieces or weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seat selection is included for most fares, while preferred seats and change/cancellation treatment depend on route and fare family.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy with cabin baggage only",
        details:
          "The cabin baseline is one piece up to 10 kg. The risk is exceeding the cabin allowance, not a separate carry-on fee.",
      },
      {
        title: "Checking within the included allowance",
        details:
          "Eligible fares include checked baggage, but the allowance depends on route and whether the itinerary uses piece or weight concept rules.",
      },
      {
        title: "Exceeding the allowance",
        details:
          "Excess baggage charges vary by route, cabin, and number of pieces or weight, so the amount must be priced for the itinerary.",
      },
      {
        title: "Choosing an extra-legroom seat",
        details:
          "Preferred or extra-legroom seats may incur a fee on some Economy fares depending on route and fare family.",
      },
    ],
    exceptions: [
      "Checked baggage is included under piece or weight concept rules depending on route.",
      "Bags above 32 kg per bag exceed the published accepted weight limit.",
      "This fee table does not show a Korean Air co-branded card baggage waiver.",
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
        "Aer Lingus checked baggage is an add-on model on the rows shown here. The 20 kg and 25 kg checked-bag options have published ranges that vary by route, season, and purchase timing, while airport excess weight is charged per additional kg.",
      restrictions:
        "The main Aer Lingus fee traps are Saver baggage, paid seat selection, and Saver fare flexibility. The fare can stay cheap only if the bag and change needs are solved before booking.",
    },
    verificationNote:
      "The Aer Lingus carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Measure the under-seat bag before booking Saver; if you need a 10 kg cabin bag, compare the add-on against Plus, Advantage, or AerSpace.",
      "Buy checked baggage before the airport when possible. The 20 kg and 25 kg bag ranges depend on route, season, and purchase timing.",
      "Do not assume paid seat selection is necessary if a random check-in seat is acceptable.",
      "Avoid Saver if you may need changes or refunds; the rows shown here make Saver the restrictive fare.",
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
          "The 10 kg cabin bag is included with these fare paths in the published carry-on row, so compare the bundle against separate add-ons.",
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
          "The 10 kg cabin bag has a published EUR 6.99 to EUR 35.99 range and can also be bundled with higher fares.",
      },
      {
        title: "Checking a 20 kg bag",
        details:
          "The 20 kg checked bag has a EUR 14.99 to EUR 59.99 range that varies by route, season, and purchase timing.",
      },
      {
        title: "Going over purchased weight",
        details:
          "Excess baggage is charged at EUR 12 per additional kg at the airport in the published row.",
      },
    ],
    exceptions: [
      "Saver refunds are not permitted except for flight cancellation or qualifying circumstances in the row shown here.",
      "Unaccompanied-minor service depends on route and age, so this page does not show one universal service fee.",
      "This fee table does not show an Aer Lingus co-branded card baggage waiver.",
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
        "The carry-on row includes the personal item alongside the main cabin bag; this page does not show a separate personal-item fee.",
      checkedBag:
        "Aeromexico checked baggage is fare- and route-based. Classic, AM Plus, Premier, and some international fares include baggage, while Basic fares or excess allowance trigger paid checked-bag pricing by route and purchase timing.",
      restrictions:
        "The main pressure points are Basic checked baggage, airport excess baggage, seat-selection rules by fare family, and Basic fare change/cancellation restrictions.",
    },
    verificationNote:
      "The Aeromexico carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
      "Unaccompanied-minor service is available only on select routes and ages in the row shown here.",
      "Some international fares include checked baggage even where Basic-style fares may not.",
      "This fee table does not show an Aeromexico co-branded card baggage waiver.",
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
        "The personal item is included alongside the Economy carry-on allowance in the published row.",
      checkedBag:
        "Air New Zealand checked baggage is usually an included allowance on eligible fares, then paid additional baggage is priced by route and timing when you need more than the allowance.",
      restrictions:
        "The main risks are additional checked bags, airport overweight/oversize handling, seat options by fare family, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The Air New Zealand carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Treat the Economy 7 kg cabin-bag allowance as a real packing limit on Air New Zealand-operated flights.",
      "Buy additional baggage before the airport when needed because pricing depends on route and timing.",
      "Keep checked bags at or below 32 kg because bags over 32 kg must be shipped as cargo in the published row.",
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
          "Premium cabins have higher cabin baggage allowances in the row shown here, but this page does not show a separate premium-cabin excess-baggage ladder.",
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
          "Bags over 32 kg must be shipped as cargo under the published overweight row.",
      },
      {
        title: "Choosing extra legroom",
        details:
          "Preferred or extra-legroom seats are paid products whose prices vary by route and timing.",
      },
    ],
    exceptions: [
      "The carry-on row is limited to Air New Zealand-operated flights.",
      "Bags over 32 kg must be shipped as cargo.",
      "This fee table does not show an Air New Zealand co-branded card baggage waiver.",
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
        "Qantas includes carry-on baggage, with size and weight limits applying under the published baggage policy.",
      personalItem:
        "This fee table does not show a separate personal-item fee row for Qantas; the practical question is whether the cabin baggage stays inside the published size and weight limits.",
      checkedBag:
        "Qantas checked baggage depends on itinerary, cabin class, and frequent-flyer status. Domestic airport extra-bag and heavy-bag charges are published separately, while pre-purchased additional baggage is sold by route and weight increment.",
      restrictions:
        "The main risks are exceeding the included allowance, buying extra baggage at the airport, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The Qantas baggage and change/cancellation rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the itinerary, cabin, and frequent-flyer allowance before assuming how much checked baggage is included.",
      "Pre-purchase additional baggage where possible; Qantas publishes a separate airport charge for each extra domestic bag.",
      "Keep domestic bags at or below 23 kg to avoid the published heavy-bag charge.",
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
          "The table shows an AUD 150 airport excess-baggage charge for each extra checked bag beyond the published allowance on Australian domestic flights.",
      },
      {
        name: "Heavy bags",
        details:
          "The published domestic heavy-bag charge is AUD 60 for each piece weighing over 23 kg.",
      },
      {
        name: "Changes and cancellations",
        details:
          "The table includes an AUD 100 domestic example, while broader change and cancellation rules depend on fare rules and route.",
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
          "The published Australian domestic airport charge is AUD 150 for each extra checked bag beyond the allowance.",
      },
      {
        title: "Checking a heavy domestic bag",
        details:
          "The published Australian domestic heavy-bag charge is AUD 60 for each piece over 23 kg.",
      },
      {
        title: "Changing a domestic Economy ticket",
        details:
          "Many domestic Economy and Premium Economy fares issued on or after July 30, 2025 show an AUD 100 change or cancellation fee, excluding fare difference.",
      },
    ],
    exceptions: [
      "Checked-baggage allowance varies by itinerary, cabin class, and frequent-flyer status.",
      "Some premium cabins may have no change fees or different change conditions under the published row.",
      "This fee table does not show a Qantas co-branded card baggage waiver.",
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
        "TAP Air Portugal includes carry-on baggage, but the allowance depends on fare and cabin. Economy generally includes one cabin bag plus a personal item, with weight limits applying.",
      personalItem:
        "The published carry-on row includes a personal item alongside the main cabin bag; this page does not show a separate personal-item charge.",
      checkedBag:
        "TAP checked baggage depends on fare family and route. Economy Classic, Plus, and premium cabins include checked baggage, while Discount fares or additional bags use paid checked-bag pricing that varies by route and purchase timing.",
      restrictions:
        "The main TAP fee traps are Discount fare baggage, airport overweight or oversize charges, paid Discount seat selection, and restrictive Discount refund rules.",
    },
    verificationNote:
      "The TAP Air Portugal carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Compare Discount against Classic or Plus when you need a checked bag; the checked-bag add-on can change the fare math quickly.",
      "Buy checked baggage before the airport when needed because the published range depends on route and purchase timing.",
      "Keep checked bags at or below 23 kg and 158 cm where possible to avoid airport overweight or oversize treatment.",
      "Avoid Discount fares if refunds or flexibility matter because the refund row says refunds are not permitted except for flight cancellation or qualifying circumstances.",
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
        name: "Discount",
        details:
          "Discount is the baggage and flexibility pressure point: checked bags and seat selection can cost extra, and refunds are not permitted except for qualifying circumstances.",
      },
      {
        name: "Classic / Plus / premium cabins",
        details:
          "These fare paths include checked baggage in the published row, but the allowance still varies by route and fare family.",
      },
      {
        name: "Additional baggage",
        details:
          "Discount checked bags or additional bags have a published EUR 20 to EUR 85 range that varies by route and purchase timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Standard seat selection is included on Classic, Plus, and premium fares, while Discount seat selection and changes depend on route, seat type, and fare rules.",
      },
    ],
    scenarios: [
      {
        title: "Booking Discount with a checked bag",
        details:
          "Checked baggage on Discount or additional bags has a EUR 20 to EUR 85 range, so price the bag before assuming Discount is cheaper.",
      },
      {
        title: "Flying carry-on only",
        details:
          "Economy generally includes one cabin bag plus a personal item, but fare, cabin, and weight limits still apply.",
      },
      {
        title: "Checking a 24 kg bag",
        details:
          "The overweight row applies above 23 kg and up to 32 kg, with bags over 32 kg not accepted.",
      },
      {
        title: "Refunding a Discount fare",
        details:
          "Refunds are not permitted on Discount fares except for flight cancellation or qualifying circumstances in the published row.",
      },
    ],
    exceptions: [
      "Checked baggage is included on Economy Classic, Plus, and premium cabins in the published row.",
      "Bags over 32 kg are not accepted under the overweight row.",
      "This fee table does not show a TAP Air Portugal co-branded card baggage waiver.",
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
        "Avianca's cheapest baggage trap is Basic fare cabin baggage. The data shows Basic includes a personal item only, while a full carry-on bag is purchased separately and priced by route and timing.",
      personalItem:
        "Basic still has a personal-item path, but that is not the same as a normal overhead carry-on. If the bag needs the bin, price the carry-on add-on before booking.",
      checkedBag:
        "Avianca checked baggage is fare- and route-based. Classic and Flex fares include checked baggage in the rows shown here, while Basic checked baggage is paid and varies by route, bag weight, and timing.",
      restrictions:
        "The main risk is stacking Basic add-ons: carry-on, checked baggage, seat selection, and change/cancellation rules can all move the final price away from the headline fare.",
    },
    verificationNote:
      "The Avianca carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not book Basic unless a personal item is enough or the carry-on add-on still leaves Basic cheaper than the next fare.",
      "Compare Basic against Classic or Flex when checking a bag; the checked-bag row depends on route, bag weight, and purchase timing.",
      "Keep checked bags within the published allowance because overweight and oversize charges are airport-handled and route-based.",
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
          "Basic is the personal-item-only path in the published carry-on row. Carry-on and checked baggage are paid decisions whose prices depend on route and timing.",
      },
      {
        name: "Classic / Flex",
        details:
          "These fare families include checked baggage in the rows shown here, but the allowance still varies by route and cabin.",
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
          "Basic includes a personal item only in the row shown here, so the overhead carry-on must be priced as an add-on.",
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
      "The carry-on row is for Avianca-operated flights.",
      "Oversize acceptance depends on route and aircraft, so oversized items should be checked against the operating flight.",
      "This fee table does not show an Avianca co-branded card baggage waiver.",
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
        "The personal item is included alongside the carry-on in the published row; this page does not show a separate personal-item fee.",
      checkedBag:
        "Copa checked baggage depends on fare family and route. Classic and Full fares include checked baggage, while Basic checked baggage is paid and varies by route, bag weight, and purchase timing.",
      restrictions:
        "The main Copa fee risk is booking Basic for a trip that really needs a checked bag, preferred seat, or flexible change rules.",
    },
    verificationNote:
      "The Copa carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "These fare families include checked baggage in the rows shown here, though the allowance varies by route and fare family.",
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
      "The carry-on row applies to Copa-operated flights.",
      "Oversize acceptance depends on route and aircraft.",
      "This fee table does not show a Copa co-branded card baggage waiver.",
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
        "Iberia includes one cabin bag plus one personal item, but checked baggage and seat selection depend heavily on whether the fare is Basic, Standard/Flex, or premium.",
      personalItem:
        "The personal item is included with the cabin bag in the published carry-on row, so the first cabin-bag question is size and weight rather than a separate personal-item fee.",
      checkedBag:
        "Iberia checked baggage separates included allowance from paid add-ons. Standard, Flex, and premium fares include baggage in the rows shown here, while Basic fares or extra bags use a EUR 15 to EUR 70 range based on route and purchase timing.",
      restrictions:
        "Basic is the main restriction point: checked baggage, seat selection, and refund flexibility can all change the final trip cost.",
    },
    verificationNote:
      "The Iberia carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Compare Basic against Standard before booking when a checked bag is likely; the checked-bag add-on can erase the fare gap.",
      "Buy checked baggage before the airport when possible because Basic and additional-bag pricing varies by route and purchase timing.",
      "Keep checked bags at or below 23 kg and 158 cm to avoid airport overweight or oversize treatment.",
      "Avoid Basic if refunds matter; the refund row says Basic refunds are not permitted except for flight cancellation or qualifying circumstances.",
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
        name: "Basic",
        details:
          "Basic can require paid checked baggage and paid seat selection. Refunds are not permitted except for flight cancellation or qualifying circumstances in the row shown here.",
      },
      {
        name: "Standard / Flex",
        details:
          "These fare brands include checked baggage and standard seat selection in the published rows, with allowance still dependent on route and fare brand.",
      },
      {
        name: "Premium cabins",
        details:
          "Premium cabins are included-allowance paths in the data, but this page does not show one universal excess-baggage schedule for every premium itinerary.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Fees depend on fare brand and route, and fare difference may apply.",
      },
    ],
    scenarios: [
      {
        title: "Booking Basic with a checked bag",
        details:
          "The checked-bag row shows a EUR 15 to EUR 70 range for Basic fares or additional bags, varying by route and purchase timing.",
      },
      {
        title: "Flying with cabin baggage only",
        details:
          "One cabin bag and one personal item are included, with Economy generally capped at 10 kg and premium cabins allowing more.",
      },
      {
        title: "Checking a 24 kg bag",
        details:
          "The overweight row applies above 23 kg and up to 32 kg; bags over 32 kg are not accepted.",
      },
      {
        title: "Choosing a Basic seat",
        details:
          "Basic seat selection uses a EUR 6 to EUR 45 range based on route, seat type, and timing.",
      },
    ],
    exceptions: [
      "Bags over 32 kg are not accepted under the overweight row.",
      "Unaccompanied-minor fees and conditions vary by route and age.",
      "This fee table does not show an Iberia co-branded card baggage waiver.",
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
        "LATAM's cheapest fare trap is Light: the carry-on row says Light includes a personal item, while other fares include a carry-on bag up to 12 kg.",
      personalItem:
        "Light can work for a very small-bag trip, but it is not the same as having a normal carry-on allowance.",
      checkedBag:
        "LATAM checked baggage is fare- and route-based. Plus, Top, and Premium cabins include checked baggage, while Light fares or excess allowance trigger paid checked-bag pricing by route, fare family, and timing.",
      restrictions:
        "The main risks are Light fare baggage, Light seat selection, airport overweight/oversize handling, and restrictive change/cancellation treatment.",
    },
    verificationNote:
      "The LATAM carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Light includes a personal item in the published carry-on row. Checked bags and seat selection can become paid decisions based on route, fare family, and timing.",
      },
      {
        name: "Plus / Top",
        details:
          "These fare families include checked baggage and standard seat selection in the rows shown here, though allowance varies by route and fare family.",
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
          "Other fares include one carry-on bag up to 12 kg, while Light is described as personal-item-only in the row shown here.",
      },
      {
        title: "Checking a bag over 23 kg",
        details:
          "The overweight row applies above 23 kg and up to 32 kg; bags over 32 kg are not accepted.",
      },
    ],
    exceptions: [
      "Unaccompanied-minor service is available only on select routes and ages and varies by country and route.",
      "Bags over 32 kg are not accepted under the overweight row.",
      "This fee table does not show a LATAM co-branded card baggage waiver.",
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
        "The personal item is included with the carry-on in the published row; aircraft can affect enforcement, so soft bags are safer on smaller planes.",
      checkedBag:
        "WestJet separates included checked baggage from paid Econo baggage. EconoFlex, Premium, and Business include the first checked bag, while Econo shows CAD 35 for the first bag and CAD 50 for the second on domestic and transborder routes in the rows shown here.",
      restrictions:
        "The main WestJet fee trap is Econo: first checked bag, second checked bag, advance seat selection, and change fees can all matter.",
    },
    verificationNote:
      "The WestJet carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Compare Econo against EconoFlex when checking a bag; EconoFlex includes the first checked bag in the published row.",
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
          "Econo is the paid-bag and paid-seat path in the rows shown here: CAD 35 first bag, CAD 50 second bag, and paid advance seat selection on applicable routes.",
      },
      {
        name: "EconoFlex",
        details:
          "EconoFlex includes the first checked bag and standard seat selection in the published rows and has no change fee, though fare difference applies.",
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
      "This fee table does not show a WestJet co-branded card baggage waiver.",
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
        "This page does not show a separate personal-item fee row for Virgin Australia; the practical cabin-bag question is whether the full carry-on allowance fits the fare and aircraft.",
      checkedBag:
        "Virgin Australia separates Lite from the higher fare families. Choice, Flex, and Business include checked baggage in the rows shown here, while Lite fares or extra bags use route- and timing-based paid baggage.",
      restrictions:
        "Lite is the fare to scrutinize: checked baggage, seat selection, and change/cancellation rules are the places where the cheap fare can become less useful.",
    },
    verificationNote:
      "The Virgin Australia carry-on, checked-bag, excess-baggage, seat, and change/cancellation rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Compare Lite against Choice before booking if you need a checked bag; Choice includes baggage in the row shown here.",
      "Buy checked baggage before the airport when possible because Lite and extra-bag pricing depends on route and timing.",
      "Keep checked bags within the standard allowance to avoid airport overweight or oversize handling.",
      "Avoid Lite when plans may change or seat choice matters, because Lite is the restrictive fare family in the rows shown here.",
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
          "Lite is the paid checked-bag and paid seat-selection path in the rows shown here. It can work for light travel, but the bag and seat costs should be priced first.",
      },
      {
        name: "Choice / Flex",
        details:
          "Choice and Flex include checked baggage and standard seat selection in the published rows, with allowance still affected by fare type and status.",
      },
      {
        name: "Business",
        details:
          "Business is an included-allowance path in the rows shown here, but aircraft and fare rules still matter for carry-on and flexibility.",
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
          "Choice includes checked baggage in the row shown here, so it is the natural comparison against Lite when a bag is needed.",
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
      "This fee table does not show a Virgin Australia co-branded card baggage waiver.",
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
        "Iberia Express includes one cabin bag plus one personal item, with Economy generally capped at 10 kg. The bigger decision is checked baggage and seat selection on Basic fares.",
      personalItem:
        "The personal item is included with the cabin bag in the carry-on row, so the first test is whether your bag stays inside the published size and weight limits.",
      checkedBag:
        "Iberia Express checked baggage separates included allowance from paid add-ons. Comfort and Business include checked baggage, while Basic fares or extra bags use a EUR 15 to EUR 70 range based on route and purchase timing.",
      restrictions:
        "Basic is the main restriction point: checked baggage, seat selection, and refunds can all make the cheapest fare less attractive.",
    },
    verificationNote:
      "The Iberia Express carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Compare Basic against Comfort when a checked bag is likely; Comfort includes checked baggage in the row shown here.",
      "Buy checked baggage before travel when needed because Basic and additional-bag pricing varies by route and purchase timing.",
      "Keep checked bags at or below 23 kg and 158 cm to avoid airport overweight or oversize handling.",
      "Do not book Basic if refunds matter; the refund row says Basic refunds are not permitted except for flight cancellation or qualifying circumstances.",
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
        name: "Basic",
        details:
          "Basic can require paid checked baggage and paid seat selection. Refunds are not permitted except for flight cancellation or qualifying circumstances in the row shown here.",
      },
      {
        name: "Comfort",
        details:
          "Comfort includes checked baggage and standard seat selection in the published rows, with allowance still varying by route and fare.",
      },
      {
        name: "Business",
        details:
          "Business is an included-allowance path in the rows shown here, but excess baggage remains separate if a bag exceeds limits.",
      },
      {
        name: "Changes and cancellations",
        details:
          "Change and cancellation fees depend on fare and route, and fare difference may apply.",
      },
    ],
    scenarios: [
      {
        title: "Booking Basic with a checked bag",
        details:
          "The Basic or additional-bag row shows a EUR 15 to EUR 70 range that varies by route and purchase timing.",
      },
      {
        title: "Flying cabin-bag only",
        details:
          "One cabin bag and one personal item are included, with Economy generally capped at 10 kg.",
      },
      {
        title: "Checking a 24 kg bag",
        details:
          "The overweight row applies above 23 kg and up to 32 kg; bags over 32 kg are not accepted.",
      },
      {
        title: "Choosing a Basic seat",
        details:
          "Basic seat selection uses a EUR 6 to EUR 35 range based on route, seat type, and timing.",
      },
    ],
    exceptions: [
      "Iberia Express does not offer an unaccompanied-minor service in the row shown here.",
      "Bags over 32 kg are not accepted under the overweight row.",
      "This fee table does not show an Iberia Express co-branded card baggage waiver.",
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
        "Norwegian checked baggage is bought as an add-on. The 20 kg and 23 kg bag products have published ranges that vary by route, season, and purchase timing, while airport excess baggage is charged per additional kg.",
      restrictions:
        "The main Norwegian fee traps are LowFare cabin baggage, paid checked bags, seat selection, and LowFare refund limits.",
    },
    verificationNote:
      "The Norwegian carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not book LowFare unless the 30 x 20 x 38 cm under-seat item is enough or the fare still wins after adding a bag.",
      "Compare LowFare+ or Flex when you need a 10 kg cabin bag, because those fare paths include it in the row shown here.",
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
          "LowFare+ includes a 10 kg cabin bag in the row shown here and allows changes with fewer restrictions than LowFare.",
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
          "LowFare+ and Flex include a 10 kg cabin bag up to 55 x 40 x 23 cm in the row shown here.",
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
      "Norwegian does not offer an unaccompanied-minor service in the row shown here.",
      "Ticket refunds are not permitted on LowFare except for flight cancellation or qualifying circumstances.",
      "This fee table does not show a Norwegian co-branded card baggage waiver.",
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
        "The personal item is included alongside the Economy cabin bag in the carry-on row for Saudia-operated flights.",
      checkedBag:
        "Saudia is mainly an included-allowance airline, not a flat first-bag-fee airline. Checked baggage is included on most eligible fares, while additional baggage depends on route, baggage concept, and timing.",
      restrictions:
        "The key is the baggage concept: some itineraries price baggage by piece, while others use weight. Excess, overweight, and oversized baggage depend on that route-specific structure.",
    },
    verificationNote:
      "The Saudia carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Premium cabins have higher cabin baggage allowances in the row shown here, but excess baggage still depends on route and baggage concept.",
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
      "The carry-on row applies to Saudia-operated flights.",
      "Checked-baggage allowance varies by route, cabin, fare family, and piece versus weight concept.",
      "This fee table does not show a Saudia co-branded card baggage waiver.",
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
      "The Vueling carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "These fare paths can include the large 10 kg cabin bag in the row shown here, so compare the bundle against buying the add-on separately.",
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
      "Ticket refunds are not permitted except for flight cancellation or qualifying circumstances in the row shown here.",
      "This fee table does not show a Vueling co-branded card baggage waiver.",
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
        "Jetstar checked baggage is an add-on model. The published 15 kg to 40 kg checked-bag options vary by weight selection, route, season, and purchase timing, while airport baggage is the expensive fallback.",
      restrictions:
        "The main Jetstar risk is solving bags too late: Starter fares, cabin-bag weight, checked-bag pre-purchase, seat selection, and Starter change rules all affect the final cost.",
    },
    verificationNote:
      "The Jetstar carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "These fares allow changes with fewer restrictions in the row shown here and may allow higher carry-on weight.",
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
      "Jetstar does not offer an unaccompanied-minor service in the row shown here.",
      "Refunds are not permitted on Starter fares except for flight cancellation or qualifying circumstances.",
      "This fee table does not show a Jetstar co-branded card baggage waiver.",
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
        "This page does not show a separate personal-item fee row for Scoot; the practical limit is the total carry-on allowance and published size rules.",
      checkedBag:
        "Scoot checked baggage is usually bought in weight bundles. Pricing varies by route and timing, and airport handling is the fallback if the purchased allowance is not enough.",
      restrictions:
        "The main Scoot fee risks are checked-bag bundles, airport excess weight, sports equipment, paid seat selection, and limited cancellation flexibility.",
    },
    verificationNote:
      "The Scoot carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Decide the checked-bag weight before booking or manage booking; fees vary by route and timing.",
      "Keep each checked bag at or below 32 kg, because the row shows that a single checked bag must not exceed 32 kg.",
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
          "Carry-on is included up to the published total allowance, while checked baggage may need to be bought as a weight bundle.",
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
          "Economy and ScootPlus show up to 10 kg total carry-on in the row shown here.",
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
      "Scoot does not offer an unaccompanied-minor service in the row shown here.",
      "Cancellations are generally not permitted except where explicitly allowed.",
      "This fee table does not show a Scoot co-branded card baggage waiver.",
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
      "The AirAsia carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Weigh carry-on bags together; the cabin bag and personal item share a 7 kg combined limit.",
      "Pre-book checked baggage when needed because airport purchase is not the cheap path in the row shown here.",
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
          "Flight changes are permitted with a fee plus fare difference in the row shown here.",
      },
    ],
    exceptions: [
      "AirAsia does not offer an unaccompanied-minor service in the row shown here.",
      "Cancellations are generally not permitted except for specific fare products or add-ons.",
      "This fee table does not show an AirAsia co-branded card baggage waiver.",
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
        "The personal item is included with the cabin bag on domestic flights in the row shown here, but international routes can use different allowances.",
      checkedBag:
        "IndiGo includes checked baggage on most eligible fares, but the allowance varies by route and fare type. Additional baggage can be bought before travel or at the airport, with pricing based on route and timing.",
      restrictions:
        "The main IndiGo fee risks are route-specific baggage allowance, added baggage, airport overweight charges, paid seat selection, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The IndiGo carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
      "IndiGo does not offer an unaccompanied-minor service in the row shown here.",
      "International carry-on and checked-bag allowances vary by route.",
      "This fee table does not show an IndiGo co-branded card baggage waiver.",
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
        "This page does not show a separate personal-item fee row for Cebu Pacific; the practical issue is staying within the total cabin-baggage allowance.",
      checkedBag:
        "Cebu Pacific checked baggage is not included by default. It is bought by weight tier, with pricing based on 20 kg, 32 kg, or 40 kg options and route.",
      restrictions:
        "The main Cebu Pacific fee risks are cabin-bag weight, checked-bag weight tier, airport per-kilo excess charges, sports equipment, paid seats, and limited cancellation flexibility.",
    },
    verificationNote:
      "The Cebu Pacific carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Weigh cabin baggage before travel; the carry-on row shows up to 7 kg total.",
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
      "Cebu Pacific does not offer an unaccompanied-minor service in the row shown here.",
      "Cancellations are generally not permitted except where explicitly allowed.",
      "This fee table does not show a Cebu Pacific co-branded card baggage waiver.",
    ],
    comparisonLinks: [
      { href: "/airlines/airasia", label: "AirAsia" },
      { href: "/airlines/scoot", label: "Scoot" },
      { href: "/airlines/philippin-airlines", label: "Philippine Airlines" },
      { href: "/airlines/jetstar", label: "Jetstar" },
    ],
  },
  spicejet: {
    intro: {
      carryOn:
        "SpiceJet includes one carry-on piece up to 7 kg. The checked-bag question depends on route because domestic and international allowances are not the same.",
      personalItem:
        "This page does not show a separate personal-item fee row for SpiceJet; the practical cabin-bag limit is the one-piece, 7 kg carry-on allowance shown here.",
      checkedBag:
        "SpiceJet includes checked baggage on eligible fares, but allowance varies between domestic India and international routes. Excess baggage is charged when the free allowance is exceeded and depends on route and weight.",
      restrictions:
        "The main SpiceJet fee risks are excess baggage, airport overweight charges, sports equipment, paid seats, and fare-rule-based changes or cancellations.",
    },
    verificationNote:
      "The SpiceJet carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
      "Unaccompanied-minor service is available only on select domestic routes and ages in the row shown here.",
      "Checked-baggage allowance varies by domestic and international route.",
      "This fee table does not show a SpiceJet co-branded card baggage waiver.",
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
      "The VietJet Air carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
      "VietJet does not offer an unaccompanied-minor service in the row shown here.",
      "A single checked bag must not exceed 32 kg in the checked-bag row.",
      "This fee table does not show a VietJet co-branded card baggage waiver.",
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
        "Volaris carry-on access depends on fare bundle. Zero and Basic include only a personal item, while Plus and Premium include one carry-on bag.",
      personalItem:
        "Zero and Basic can work for a very small-bag trip, but they are not the same as a normal overhead carry-on fare.",
      checkedBag:
        "Volaris checked baggage is not included on Zero and Basic fares. Fees depend on fare bundle, route, and purchase timing.",
      restrictions:
        "The main Volaris risks are personal-item-only fares, checked-bag add-ons, airport overweight/oversize fees, paid seats, and change restrictions.",
    },
    verificationNote:
      "The Volaris carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not book Zero or Basic unless a personal item is enough or the bag add-on still leaves the fare cheaper.",
      "Compare Plus or Premium when you need a carry-on bag.",
      "Buy checked baggage before the airport when needed because pricing depends on fare bundle, route, and timing.",
      "Keep checked bags within weight and size limits to avoid airport overweight or oversize treatment.",
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
        name: "Zero / Basic",
        details:
          "These fares include only a personal item in the carry-on row and do not include checked baggage.",
      },
      {
        name: "Plus / Premium",
        details:
          "Plus and Premium include one carry-on bag in the row shown here, making them the better comparison when overhead-bin access matters.",
      },
      {
        name: "Checked baggage",
        details:
          "Checked-bag fees depend on fare bundle, route, and purchase timing rather than one flat first-bag amount.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and chargeable. Flight changes can require a fee plus fare difference.",
      },
    ],
    scenarios: [
      {
        title: "Flying Zero with only a personal item",
        details:
          "This is the lowest-bag path, but it only works if the personal item is enough.",
      },
      {
        title: "Needing an overhead carry-on",
        details:
          "Plus and Premium include one carry-on bag, while Zero and Basic do not in the row shown here.",
      },
      {
        title: "Adding checked baggage",
        details:
          "Checked baggage is not included on Zero and Basic, and the fee depends on fare bundle, route, and timing.",
      },
      {
        title: "Checking a large or heavy bag",
        details:
          "Overweight and oversize charges apply at the airport when limits are exceeded.",
      },
    ],
    exceptions: [
      "Volaris does not offer an unaccompanied-minor service in the row shown here.",
      "Oversize acceptance depends on aircraft and handling capabilities.",
      "This fee table does not show a Volaris co-branded card baggage waiver.",
    ],
    comparisonLinks: [
      { href: "/airlines/viva-aerobus", label: "Viva Aerobus" },
      { href: "/airlines/aeromexico", label: "Aeromexico" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/spirit", label: "Spirit Airlines" },
    ],
  },
  "viva-aerobus": {
    intro: {
      carryOn:
        "Viva Aerobus carry-on access depends on fare bundle. Zero includes only a personal item, while Light, Smart, and Extra include one carry-on bag.",
      personalItem:
        "Zero is the personal-item-only path. If the bag needs the overhead bin, compare the next fare bundle or the bag add-on before booking.",
      checkedBag:
        "Viva Aerobus checked baggage is not included on Zero. Fees depend on fare bundle, route, and purchase timing.",
      restrictions:
        "The main Viva Aerobus risks are Zero fare baggage limits, checked-bag add-ons, airport overweight/oversize treatment, paid seats, and change rules.",
    },
    verificationNote:
      "The Viva Aerobus carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Do not book Zero unless a personal item is enough.",
      "Compare Light, Smart, or Extra when you need a carry-on bag.",
      "Buy checked baggage before the airport when needed because pricing depends on fare bundle, route, and timing.",
      "Keep checked bags within weight and size limits to avoid airport overweight or oversize fees.",
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
          "Zero includes only a personal item and does not include checked baggage in the rows shown here.",
      },
      {
        name: "Light / Smart / Extra",
        details:
          "These fare bundles include one carry-on bag in the carry-on row, with checked-bag treatment depending on bundle and route.",
      },
      {
        name: "Checked baggage",
        details:
          "Checked-bag pricing depends on fare bundle, route, and purchase timing.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection is optional and chargeable. Flight changes can require a fee plus fare difference, and cancellation rules depend on fare rules.",
      },
    ],
    scenarios: [
      {
        title: "Flying Zero with a personal item",
        details:
          "This is the cheapest clean path only if the personal item allowance is enough.",
      },
      {
        title: "Needing a carry-on bag",
        details:
          "Light, Smart, and Extra include one carry-on bag, while Zero does not in the row shown here.",
      },
      {
        title: "Adding checked baggage",
        details:
          "Checked baggage is not included on Zero, and fees depend on fare bundle, route, and purchase timing.",
      },
      {
        title: "Changing a flight",
        details:
          "Flight changes are permitted with an applicable fee plus fare difference.",
      },
    ],
    exceptions: [
      "Viva Aerobus does not offer an unaccompanied-minor service in the row shown here.",
      "Oversize acceptance depends on aircraft and airport handling limits.",
      "This fee table does not show a Viva Aerobus co-branded card baggage waiver.",
    ],
    comparisonLinks: [
      { href: "/airlines/volaris", label: "Volaris" },
      { href: "/airlines/aeromexico", label: "Aeromexico" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/spirit", label: "Spirit Airlines" },
    ],
  },
  jet2: {
    intro: {
      carryOn:
        "Jet2 includes both a small under-seat bag and a 10 kg cabin bag in the rows shown here. The bigger fee decision is checked baggage, which is sold as 22 kg or 26 kg add-ons.",
      personalItem:
        "The small under-seat bag is included up to 40 x 30 x 15 cm. A separate 10 kg cabin bag is also included in the carry-on rows shown here.",
      checkedBag:
        "Jet2 checked baggage is bought as a 22 kg or 26 kg allowance. Prices vary by route, season, and purchase timing, and excess baggage is charged per additional kg at the airport.",
      restrictions:
        "The main Jet2 fee risks are choosing the wrong checked-bag weight, paying excess weight at the airport, seat selection, and fee-based changes.",
    },
    verificationNote:
      "The Jet2 carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Jet2 includes one small under-seat bag plus one cabin bag up to 10 kg in the carry-on rows shown here.",
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
          "The carry-on rows include a small under-seat bag plus one 10 kg cabin bag.",
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
      "Jet2 does not offer an unaccompanied-minor service in the row shown here.",
      "Ticket refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "This fee table does not show a Jet2 co-branded card baggage waiver.",
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
        "Thai Airways includes a cabin bag on the rows shown here. Economy is listed as one cabin bag up to 7 kg, while premium cabins have higher allowances.",
      personalItem:
        "The practical cabin-bag issue is weight and size compliance, not buying a basic fare add-on. Keep the cabin bag within the published allowance, especially on international connections.",
      checkedBag:
        "Thai Airways usually works from an included checked-bag allowance, but the allowance is not one universal number. It depends on route, cabin, fare family, and whether the itinerary uses the piece concept or weight concept.",
      restrictions:
        "The main Thai Airways fee risks are buying the wrong fare for your baggage needs, crossing into excess baggage, overweight or oversize airport handling, paid seat selection, and fare-rule change penalties.",
    },
    verificationNote:
      "The Thai Airways carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Economy includes a carry-on bag up to 7 kg in the row shown here. Checked-bag allowance depends on the ticketed route, fare family, and baggage concept.",
      },
      {
        name: "Premium cabins",
        details:
          "Business and First Class have higher cabin allowances in the data, and checked-bag treatment generally depends on cabin and route.",
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
          "Overweight charges are route- and baggage-concept based, so the safer move is keeping each bag within the published limit before airport check-in.",
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
      "This fee table does not show a Thai Airways co-branded card baggage waiver.",
    ],
    comparisonLinks: [
      { href: "/airlines/singapore-airlines", label: "Singapore Airlines" },
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/cathay-pacific", label: "Cathay Pacific" },
      { href: "/airlines/eva-air", label: "EVA Air" },
    ],
  },
  "philippin-airlines": {
    intro: {
      carryOn:
        "Philippine Airlines includes a cabin bag on the rows shown here. Economy is listed as one cabin bag up to 7 kg plus one personal item.",
      personalItem:
        "A personal item is included with the Economy carry-on row. The risk is usually an overweight or oversize cabin bag rather than a paid carry-on add-on.",
      checkedBag:
        "Philippine Airlines generally starts from an included checked-bag allowance, but the allowance depends on route, cabin, fare family, and whether the itinerary uses piece or weight concept.",
      restrictions:
        "The main Philippine Airlines fee risks are exceeding the included allowance, buying extra baggage too late, airport overweight or oversize handling, paid seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Philippine Airlines carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
      { href: "/tools/excess-baggage-calculator?airline=philippin-airlines&weight=28&size=64", label: "Excess baggage calculator" },
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
      "This fee table does not show a Philippine Airlines co-branded card baggage waiver.",
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
        "Vistara includes cabin baggage on the rows shown here: Economy and Premium Economy up to 7 kg, and Business Class up to 10 kg.",
      personalItem:
        "The carry-on issue is staying within the cabin weight and size limits. This is not a personal-item-only fare model in the data.",
      checkedBag:
        "Vistara checked baggage is included on eligible fares, but the allowance changes by cabin, fare family, and route. Excess baggage is charged separately when the free allowance is exceeded.",
      restrictions:
        "The main Vistara fee risks are exceeding the included checked allowance, airport overweight handling, paid preferred or extra-legroom seats, and restrictive fare-family change rules.",
    },
    verificationNote:
      "The Vistara carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Standard seats are included on most fares in the data, while preferred or extra-legroom seats are charged separately. Change and cancellation costs depend on fare family and route.",
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
      "Unaccompanied-minor service is limited to selected routes and age groups in the data.",
      "This fee table does not show a Vistara co-branded card baggage waiver.",
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
        "Checked baggage is optional on Jetstar Asia. The published range depends on selected weight, route, season, and purchase timing; airport baggage is a separate, higher-risk category.",
      restrictions:
        "The main Jetstar Asia fee risks are underbuying bag weight, adding baggage at the airport, paid seat selection, Starter fare change fees, and no normal refunds on Starter fares.",
    },
    verificationNote:
      "The Jetstar Asia carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Starter includes 7 kg of carry-on allowance and no included checked baggage in the rows shown here.",
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
          "Starter changes are fee-plus-fare-difference in the data, while higher fares have fewer restrictions.",
      },
    ],
    exceptions: [
      "Jetstar Asia does not offer an unaccompanied-minor service in the row shown here.",
      "Refunds are not permitted on Starter fares except for flight cancellation or qualifying circumstances.",
      "This fee table does not show a Jetstar Asia co-branded card baggage waiver.",
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
      "The Jetstar Japan carry-on, checked-bag, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Starter includes up to 7 kg total carry-on weight and no included checked baggage in the rows shown here.",
      },
      {
        name: "Starter Plus / Flex",
        details:
          "Higher fares can reduce change restrictions, so compare the bundle when flexibility is important.",
      },
      {
        name: "Checked baggage add-ons",
        details:
          "Checked baggage is bought by weight band. The data shows a JPY range that changes by weight selection, route, and timing.",
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
          "Starter changes are fee-plus-fare-difference in the data, while higher fares have fewer restrictions.",
      },
    ],
    exceptions: [
      "Jetstar Japan does not offer an unaccompanied-minor service in the row shown here.",
      "Refunds are not permitted on Starter fares except for flight cancellation or qualifying circumstances.",
      "This fee table does not show a Jetstar Japan co-branded card baggage waiver.",
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
        "Etihad includes cabin baggage on the rows shown here. Economy is listed with one cabin bag up to 7 kg plus one personal item, while Business and First have higher allowances.",
      personalItem:
        "The personal item is included with the Economy carry-on row, so the practical issue is keeping the main cabin bag within Etihad's weight and size limits.",
      checkedBag:
        "Etihad is mostly an included-allowance airline, but the allowance changes by route, cabin, fare family, and baggage concept. Extra baggage is a separate route- and timing-sensitive purchase.",
      restrictions:
        "The main Etihad fee risks are exceeding the included allowance, waiting until the airport to handle extra baggage, paid seat selection on Value fares, and fare-family change or cancellation rules.",
    },
    verificationNote:
      "The Etihad carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the itinerary uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where possible; the data says online rates are lower than airport rates.",
      "Keep each checked bag at or below 32 kg because heavier bags are not treated as ordinary checked baggage.",
      "Compare Value against Comfort or Deluxe when seat selection matters, because standard seat selection is included on Comfort and Deluxe fares in the rows shown here.",
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
          "Standard seat selection is included on Comfort and Deluxe fares in the rows shown here.",
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
        "This page does not show a separate paid personal-item fee. The main cabin-bag issue is matching the cabin-class allowance.",
      checkedBag:
        "Gulf Air includes checked baggage on eligible fares, but the allowance depends on cabin class, fare family, and route. Excess baggage is charged separately by route and weight.",
      restrictions:
        "The main Gulf Air fee risks are exceeding the free checked allowance, overweight airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Gulf Air carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Cabin class affects both carry-on allowance and checked-bag allowance in the rows shown here.",
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
          "Unaccompanied-minor service is limited by route and age in the data, so it needs to be confirmed before booking.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage policy.",
      "The data does not publish a separate oversize-baggage row for Gulf Air on this page.",
      "This fee table does not show a Gulf Air co-branded card baggage waiver.",
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
        "The page does not show a separate personal-item charge. The practical cabin-bag question is whether the bag fits the cabin-class allowance.",
      checkedBag:
        "Oman Air includes checked baggage, but the allowance changes by fare family, cabin class, route, and frequent flyer status. Excess baggage is charged separately by route and weight.",
      restrictions:
        "The main Oman Air fee risks are exceeding the included allowance, overweight airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Oman Air carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the allowance attached to the exact fare family, cabin, route, and loyalty status before packing.",
      "Pre-purchase excess baggage where available if the bag will exceed the free allowance.",
      "Keep each checked bag at or below 32 kg because the data lists a single-bag maximum.",
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
          "The data lists a 32 kg single-bag maximum, making overweight planning an airport-risk issue.",
      },
      {
        title: "Changing the ticket",
        details:
          "The fee is fare-rule based, so the lowest fare may not be the cheapest option if plans are uncertain.",
      },
    ],
    exceptions: [
      "Partner-operated or codeshare flights can use the operating carrier's baggage rules.",
      "The data does not publish a separate oversize-baggage row for Oman Air on this page.",
      "This fee table does not show an Oman Air co-branded card baggage waiver.",
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
        "flydubai includes one cabin bag up to 7 kg on the rows shown here, with Business Class including an additional allowance.",
      personalItem:
        "The cabin-bag issue is the 7 kg Economy allowance. If the bag is heavier, the trip can shift into checked or excess baggage.",
      checkedBag:
        "flydubai is not a simple always-included checked-bag airline. Checked baggage is included only with certain fare types, and baggage can also be bought by weight option.",
      restrictions:
        "The main flydubai fee risks are buying a fare without the baggage you need, underbuying checked-bag weight, airport excess-weight charges, paid Economy seat selection, and fare-type change rules.",
    },
    verificationNote:
      "The flydubai carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
        "EgyptAir includes carry-on baggage, with allowance depending on cabin class and published size and weight limits.",
      personalItem:
        "This page does not show a separate paid personal-item fee. The practical question is whether your cabin bag fits the cabin-class allowance.",
      checkedBag:
        "EgyptAir includes checked baggage on eligible fares, but the allowance changes by cabin class, fare type, route, and frequent flyer status. Excess baggage is charged separately.",
      restrictions:
        "The main EgyptAir fee risks are exceeding the included allowance, overweight or oversize airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The EgyptAir carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the allowance attached to the exact route, cabin, fare type, and frequent flyer status.",
      "Pre-purchase excess baggage where available if you know the free allowance will not be enough.",
      "Keep checked bags within both weight and size limits because EgyptAir has separate overweight and oversize rows.",
      "Avoid paying for seat selection unless seat location matters; some fares include standard seat selection.",
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
        name: "Economy",
        details:
          "Carry-on is included, while checked allowance depends on fare type, cabin, route, and status.",
      },
      {
        name: "Premium cabins",
        details:
          "Cabin class affects the carry-on and checked-bag allowance in the rows shown here.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage begins when the free allowance is exceeded. Charges depend on route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on fare type, cabin, seat location, and timing. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "International trip with one checked bag",
        details:
          "Confirm the free allowance for the exact route and fare type before deciding whether extra baggage is needed.",
      },
      {
        title: "Status traveler",
        details:
          "Frequent flyer status can affect allowance, so status should be part of the baggage check.",
      },
      {
        title: "Large suitcase",
        details:
          "EgyptAir has separate overweight and oversize rows, so a bag can trigger a charge by weight, size, or both depending on the rules.",
      },
      {
        title: "Booking a restrictive fare",
        details:
          "Change and cancellation costs depend on fare rules and ticket type, so the lowest fare may not be best if plans can move.",
      },
    ],
    exceptions: [
      "Partner-operated flights can use the operating carrier's baggage policy.",
      "Oversize acceptance depends on aircraft and airport handling constraints.",
      "This fee table does not show an EgyptAir co-branded card baggage waiver.",
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
        "Ethiopian includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg plus one personal item, while Business Class has a higher allowance.",
      personalItem:
        "The personal item is included in the Economy carry-on row, so the practical issue is keeping the main cabin bag within the published 7 kg limit.",
      checkedBag:
        "Ethiopian usually starts from an included checked-bag allowance, but that allowance depends on route, cabin, fare family, and whether the itinerary uses piece concept or weight concept.",
      restrictions:
        "The main Ethiopian fee risks are exceeding the included allowance, extra baggage purchased too late, overweight or oversize airport handling, paid seats on lower fare families, and fare-family change rules.",
    },
    verificationNote:
      "The Ethiopian carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Economy includes one 7 kg cabin bag plus one personal item in the row shown here. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business Class",
        details:
          "Business Class has a higher cabin allowance in the data and can have different checked-bag treatment.",
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
      "This fee table does not show an Ethiopian co-branded card baggage waiver.",
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
        "Royal Air Maroc includes carry-on baggage, with allowance depending on cabin class and published size and weight limits.",
      personalItem:
        "This page does not show a separate paid personal-item row. The main cabin-bag question is whether the bag fits the cabin-class allowance.",
      checkedBag:
        "Royal Air Maroc includes checked baggage on most eligible fares, but the allowance changes by cabin class, fare family, route, and frequent flyer status.",
      restrictions:
        "The main Royal Air Maroc fee risks are exceeding the free allowance, overweight or oversize airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Royal Air Maroc carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the included checked allowance for the exact fare, route, cabin, and status before packing.",
      "Pre-purchase excess baggage where available if the free allowance will not be enough.",
      "Keep checked bags within both weight and size limits because overweight and oversize can be separate airport problems.",
      "Skip paid seat selection when a standard included seat or check-in assignment is acceptable.",
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
        name: "Economy",
        details:
          "Carry-on is included, while checked allowance depends on fare family, route, cabin, and status.",
      },
      {
        name: "Premium cabins",
        details:
          "Cabin class affects baggage allowance and can change the checked-bag baseline.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage is charged when the free allowance is exceeded, with pricing driven by route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on fare family, seat type, and timing. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Morocco-Europe trip with one checked bag",
        details:
          "Confirm the fare's included allowance first; extra cost begins when the bag exceeds the free allowance.",
      },
      {
        title: "Status traveler",
        details:
          "Frequent flyer status can affect the allowance, so status should be checked before buying extra baggage.",
      },
      {
        title: "Large or heavy suitcase",
        details:
          "A bag can trigger overweight, oversize, or both depending on the airport assessment.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service depends on selected routes and age groups, so confirm it before buying the ticket.",
      },
    ],
    exceptions: [
      "Partner-operated flights can use the operating carrier's baggage policy.",
      "Oversize acceptance depends on aircraft and airport handling limits.",
      "This fee table does not show a Royal Air Maroc co-branded card baggage waiver.",
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
        "Kenya Airways includes carry-on baggage, with allowance depending on cabin class and published size and weight limits.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is keeping the bag inside the cabin-class limit.",
      checkedBag:
        "Kenya Airways includes checked baggage on eligible fares, but the allowance varies by cabin class, route, fare family, and frequent flyer status.",
      restrictions:
        "The main Kenya Airways fee risks are exceeding the free allowance, overweight or oversize airport handling, paid seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Kenya Airways carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm the allowance for the exact cabin, route, fare family, and status before packing.",
      "Pre-purchase excess baggage where available if the bag will exceed the free allowance.",
      "Keep bags within both weight and size limits to avoid airport excess-baggage treatment.",
      "Avoid paid seat selection unless the seat type or location is worth the extra cost.",
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
        name: "Economy",
        details:
          "Carry-on is included. Checked baggage depends on cabin, route, fare family, and frequent flyer status.",
      },
      {
        name: "Premium cabins",
        details:
          "Cabin class changes the allowance baseline, so premium-cabin baggage should be checked against the exact ticket.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage applies when the free allowance is exceeded, with charges driven by route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on fare family, cabin, seat type, and timing. Change and cancellation costs depend on fare rules and route.",
      },
    ],
    scenarios: [
      {
        title: "Africa-Europe trip with one checked bag",
        details:
          "Use the exact route and fare family to confirm whether the bag is included before buying extra allowance.",
      },
      {
        title: "Connecting itinerary",
        details:
          "Partner-operated segments can change baggage rules, so check the operating carrier when the trip is not all Kenya Airways.",
      },
      {
        title: "Heavy bag",
        details:
          "Overweight charges are airport-facing, so weighing before travel is the cleanest way to avoid a surprise fee.",
      },
      {
        title: "Buying the cheapest fare",
        details:
          "Seat selection and change rules can make the cheapest fare less useful if you need a specific seat or flexibility.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on aircraft and airport handling limits.",
      "This fee table does not show a Kenya Airways co-branded card baggage waiver.",
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
        "South African Airways includes carry-on baggage, with allowance depending on cabin class and published size and weight limits.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag question is whether the bag fits the cabin-class allowance.",
      checkedBag:
        "South African Airways includes checked baggage on eligible fares, but the allowance varies by cabin class, route, fare family, and Voyager status.",
      restrictions:
        "The main South African Airways fee risks are exceeding the free allowance, overweight or oversize airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The South African Airways carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the allowance for the exact route, fare family, cabin, and Voyager status before packing.",
      "Pre-purchase excess baggage where available when the free allowance will not be enough.",
      "Keep bags within both size and weight limits to avoid airport excess-baggage treatment.",
      "Use included or assigned standard seats when seat location does not matter.",
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
        name: "Economy",
        details:
          "Carry-on is included. Checked allowance depends on route, fare family, cabin, and Voyager status.",
      },
      {
        name: "Premium cabins",
        details:
          "Cabin class changes both the cabin-bag and checked-bag baseline.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage applies when the free allowance is exceeded, with fees driven by route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on fare family, cabin, seat type, and timing. Change and cancellation fees depend on fare rules and route.",
      },
    ],
    scenarios: [
      {
        title: "Domestic or regional trip with one checked bag",
        details:
          "Check the route-specific allowance first, especially if status or fare family changes the baseline.",
      },
      {
        title: "Voyager status traveler",
        details:
          "Voyager status can affect checked allowance, so factor status into the baggage decision before buying extra allowance.",
      },
      {
        title: "Oversize bag",
        details:
          "Oversize acceptance depends on aircraft and airport handling limits, so do not treat it as guaranteed ordinary baggage.",
      },
      {
        title: "Plans may change",
        details:
          "Change and cancellation fees are fare-rule based, so a restrictive fare can be costly if the trip is uncertain.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on aircraft and airport handling limits.",
      "This fee table does not show a South African Airways co-branded card baggage waiver.",
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
        "SriLankan includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg, while Business Class has a higher allowance.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical issue is keeping the Economy cabin bag within 7 kg.",
      checkedBag:
        "SriLankan includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and whether the itinerary uses piece or weight concept.",
      restrictions:
        "The main SriLankan fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The SriLankan carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your route uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 7 kg and checked bags within the route's weight and size limits.",
      "Use free check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 7 kg. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business Class",
        details:
          "Business Class has a higher cabin allowance and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "SriLankan baggage can be calculated by pieces or by total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Long-haul trip with one checked bag",
        details:
          "Start with the included allowance for the exact route and fare; extra baggage is priced separately when you exceed it.",
      },
      {
        title: "Route using weight concept",
        details:
          "If the itinerary uses weight concept, the allowance is not the same as a piece-count route.",
      },
      {
        title: "Large checked item",
        details:
          "Oversize acceptance depends on route and aircraft, so confirm handling before treating it as normal checked baggage.",
      },
      {
        title: "Need a specific seat",
        details:
          "Advance seat selection can be chargeable by route, fare family, and seat type; check-in assignment may be enough if location does not matter.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a SriLankan co-branded card baggage waiver.",
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
        "Air China includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 8 kg, while Business and First have higher allowances.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is staying within the Economy 8 kg limit or the allowance for your booked cabin.",
      checkedBag:
        "Air China includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and whether the itinerary uses piece concept or weight concept.",
      restrictions:
        "The main Air China fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Air China carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the route uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 8 kg and checked bags within the route's weight and size limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 8 kg. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Premium cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Air China baggage can be calculated by pieces or by total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat selection fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "China-international trip with one checked bag",
        details:
          "Start with the included allowance for the exact route and fare; excess baggage only starts after that allowance is exceeded.",
      },
      {
        title: "Route using weight concept",
        details:
          "Do not apply piece-count assumptions if the itinerary uses a total-weight allowance.",
      },
      {
        title: "Oversize checked item",
        details:
          "Oversize acceptance and fees depend on route and aircraft, so confirm before treating it as ordinary baggage.",
      },
      {
        title: "Need a specific seat",
        details:
          "Seat fees vary by route, fare family, and seat type; check-in assignment may be enough if seat location does not matter.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show an Air China co-branded card baggage waiver.",
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
        "China Southern includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 8 kg, while Business and First have higher allowances.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is whether the bag fits the booked cabin's weight and size limits.",
      checkedBag:
        "China Southern includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      restrictions:
        "The main China Southern fee risks are exceeding the included allowance, airport overweight or oversize treatment, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The China Southern carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the route uses piece concept or weight concept before packing.",
      "Buy additional baggage before the airport where available if the free allowance will not cover the trip.",
      "Keep Economy cabin baggage at or below 8 kg and checked bags within the route's limits.",
      "Use free check-in assignment when a specific seat is not worth paying for.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 8 kg. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Premium cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "China Southern baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on route, fare family, and seat type. Change and cancellation costs follow fare rules.",
      },
    ],
    scenarios: [
      {
        title: "Long-haul itinerary with one checked bag",
        details:
          "Confirm the allowance for the route and fare before buying extra baggage.",
      },
      {
        title: "Connecting to a domestic segment",
        details:
          "Baggage concept and allowance can depend on the full itinerary, so check the exact ticket rather than assuming one rule across all flights.",
      },
      {
        title: "Heavy checked bag",
        details:
          "Overweight charges are route- and baggage-concept based, so keeping the bag under the limit avoids airport repricing.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service depends on eligible ages and routing restrictions, so confirm before booking.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a China Southern co-branded card baggage waiver.",
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
        "Hainan Airlines includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 10 kg, while Business Class has a higher allowance.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is staying within the Economy 10 kg limit or the allowance for your cabin.",
      checkedBag:
        "Hainan includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      restrictions:
        "The main Hainan fee risks are exceeding the included allowance, airport overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Hainan carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the route uses piece concept or weight concept before packing.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Use Hainan's higher Economy cabin-bag limit carefully; the checked-bag rules still depend on route and fare.",
      "Skip paid advance seat selection when check-in assignment is acceptable.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 10 kg. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business Class",
        details:
          "Business Class has a higher cabin allowance and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Hainan baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Economy trip with a heavier cabin bag",
        details:
          "Hainan's Economy row allows up to 10 kg, but the bag still needs to meet the published size limits.",
      },
      {
        title: "Adding a checked bag",
        details:
          "Additional baggage is priced by route and baggage concept, not one universal first-bag charge.",
      },
      {
        title: "Oversize item",
        details:
          "Oversize acceptance and fees depend on route and aircraft, so check before travel.",
      },
      {
        title: "Changing plans",
        details:
          "Change and cancellation costs are fare-rule based and may include a fare difference.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a Hainan co-branded card baggage waiver.",
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
        "XiamenAir includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg, while Business Class has a higher allowance.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is keeping Economy carry-on at or below 7 kg.",
      checkedBag:
        "XiamenAir includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      restrictions:
        "The main XiamenAir fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The XiamenAir carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the route uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the free allowance is not enough.",
      "Keep Economy cabin baggage at or below 7 kg and checked bags within the route's excess-baggage limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 7 kg. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business Class",
        details:
          "Business Class has a higher cabin allowance and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "XiamenAir baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Economy carry-on trip",
        details:
          "The Economy cabin bag is listed up to 7 kg, so weigh the bag before relying on carry-on-only travel.",
      },
      {
        title: "Additional checked bag",
        details:
          "Additional baggage pricing depends on route and baggage concept rather than one flat extra-bag amount.",
      },
      {
        title: "Overweight bag",
        details:
          "The overweight row depends on route and excess weight, so airport repricing can be route-specific.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service depends on eligible ages and routing restrictions.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a XiamenAir co-branded card baggage waiver.",
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
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is matching the Economy or Business cabin allowance.",
      checkedBag:
        "Air Astana includes checked baggage on most eligible fares, but the allowance depends on fare family, cabin class, route, and Nomad Club status.",
      restrictions:
        "The main Air Astana fee risks are exceeding the free allowance, overweight or oversize airport handling, paid seat selection, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Air Astana carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the included allowance for the exact fare family, cabin, route, and Nomad Club status.",
      "Pre-purchase excess baggage where available if the free allowance will not be enough.",
      "Keep checked bags within both weight and size limits to avoid airport excess-baggage treatment.",
      "Skip paid seat selection when standard seating is included or seat location does not matter.",
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
        name: "Economy",
        details:
          "Economy includes carry-on up to 8 kg. Checked allowance depends on fare family, cabin, route, and Nomad Club status.",
      },
      {
        name: "Business Class",
        details:
          "Business Class includes carry-on up to 12 kg and can have a different checked-bag allowance.",
      },
      {
        name: "Excess baggage",
        details:
          "Excess baggage applies when the free allowance is exceeded, with fees driven by route and weight.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat selection fees depend on fare family, seat type, and timing. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Central Asia-Europe trip with one checked bag",
        details:
          "Confirm the included allowance for the exact fare and route before buying excess baggage.",
      },
      {
        title: "Nomad Club status traveler",
        details:
          "Status can affect checked allowance, so include it before deciding whether extra baggage is needed.",
      },
      {
        title: "Large suitcase",
        details:
          "Overweight and oversize treatment are separate airport risks when the bag exceeds published limits.",
      },
      {
        title: "Need to change flights",
        details:
          "Change cost depends on fare rules, ticket type, and route, plus any fare difference.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on aircraft and airport handling limits.",
      "This fee table does not show an Air Astana co-branded card baggage waiver.",
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
        "Asiana includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 10 kg, while Business and First have higher allowances.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is staying within the Economy 10 kg limit or the allowance for your booked cabin.",
      checkedBag:
        "Asiana includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and whether the itinerary uses piece concept or weight concept.",
      restrictions:
        "The main Asiana fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Asiana carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the itinerary uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 10 kg and checked bags within the route's weight and size limits.",
      "Use check-in seat assignment when a specific seat is not worth paying for.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 10 kg. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Premium cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Asiana baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Korea-international trip with one checked bag",
        details:
          "Start with the included allowance for the exact route and fare; extra baggage begins only after that allowance is exceeded.",
      },
      {
        title: "Route using piece concept",
        details:
          "Do not use weight-concept math on a piece-concept itinerary. The route determines which model applies.",
      },
      {
        title: "Large checked item",
        details:
          "Oversize acceptance and fees depend on route and aircraft, so confirm handling before treating it as ordinary baggage.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service depends on eligible ages and routing restrictions, so it should be checked before booking.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show an Asiana co-branded card baggage waiver.",
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
        "China Airlines includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg plus one personal item, while Premium Economy and Business have higher allowances.",
      personalItem:
        "The personal item is included with the Economy cabin-bag row, so the practical issue is keeping the main cabin bag within 7 kg.",
      checkedBag:
        "China Airlines includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and whether the itinerary uses piece concept or weight concept.",
      restrictions:
        "The main China Airlines fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The China Airlines carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm the baggage concept for the exact route before packing or buying extra baggage.",
      "Buy additional baggage before the airport where available if the included allowance will not be enough.",
      "Keep Economy cabin baggage at or below 7 kg and checked bags within the route's weight and size limits.",
      "Use check-in seat assignment when seat location does not matter.",
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
        name: "Economy",
        details:
          "Economy includes one 7 kg cabin bag plus one personal item. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Premium Economy / Business",
        details:
          "Higher cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "China Airlines baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Taiwan-international trip with one checked bag",
        details:
          "Check the included allowance for the exact route and fare before buying extra baggage.",
      },
      {
        title: "Extra checked bag",
        details:
          "Additional baggage depends on route and baggage concept rather than one universal extra-bag price.",
      },
      {
        title: "Economy cabin bag near the limit",
        details:
          "The Economy cabin bag is listed at 7 kg, so a heavy cabin bag can become an airport problem even when carry-on is included.",
      },
      {
        title: "Need a specific seat",
        details:
          "Advance seat selection can be chargeable by route, fare family, and seat type; check-in assignment may be enough.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a China Airlines co-branded card baggage waiver.",
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
        "China Eastern includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 8 kg, while Business and First have higher allowances.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is keeping the bag within the booked cabin's weight and size limits.",
      checkedBag:
        "China Eastern includes checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      restrictions:
        "The main China Eastern fee risks are exceeding the included allowance, airport overweight or oversize treatment, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The China Eastern carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the route uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 8 kg and checked bags within the route's limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 8 kg. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Premium cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "China Eastern baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs follow fare rules.",
      },
    ],
    scenarios: [
      {
        title: "China-international trip with one checked bag",
        details:
          "Start with the included allowance for the exact route and fare; excess baggage only starts after that allowance is exceeded.",
      },
      {
        title: "Domestic connection on the same ticket",
        details:
          "Baggage allowance can depend on the full itinerary, so check the ticketed route rather than assuming one rule across all flights.",
      },
      {
        title: "Heavy checked bag",
        details:
          "Overweight charges depend on route and excess weight, so keeping the bag under the limit avoids airport repricing.",
      },
      {
        title: "Changing plans",
        details:
          "Change and cancellation costs are fare-rule based and may include fare difference.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a China Eastern co-branded card baggage waiver.",
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
        "Hong Kong Airlines includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg, while Business Class has a higher allowance.",
      personalItem:
        "This page does not show a separate paid personal-item row. The practical cabin-bag issue is keeping the Economy cabin bag within 7 kg.",
      checkedBag:
        "Hong Kong Airlines includes checked baggage on most eligible fares, but the allowance depends on route and fare family. Extra baggage is priced separately by route and timing.",
      restrictions:
        "The main Hong Kong Airlines fee risks are exceeding the included allowance, airport overweight or oversize treatment, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Hong Kong Airlines carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the checked-bag allowance for the exact route and fare family before buying extras.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 7 kg and checked bags within the route's limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one cabin bag up to 7 kg. Checked allowance depends on route and fare family.",
      },
      {
        name: "Business Class",
        details:
          "Business Class has a higher cabin allowance and can have different checked-bag treatment.",
      },
      {
        name: "Additional baggage",
        details:
          "Additional baggage is priced by route and purchase timing rather than one universal extra-bag amount.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on route and seat type. Change and cancellation costs depend on fare rules and timing.",
      },
    ],
    scenarios: [
      {
        title: "Hong Kong regional trip with one checked bag",
        details:
          "Confirm the route and fare-family allowance first; extra baggage begins after the included allowance is exceeded.",
      },
      {
        title: "Adding baggage after booking",
        details:
          "The additional-baggage amount depends on route and timing, so airport handling can be less predictable.",
      },
      {
        title: "Oversize checked item",
        details:
          "Oversize acceptance and fees depend on aircraft and route.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service depends on eligible ages and routing restrictions.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a Hong Kong Airlines co-branded card baggage waiver.",
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
        "Malaysia Airlines includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg plus one personal item, while Business and Business Suite have higher allowances.",
      personalItem:
        "The personal item is included with the Economy cabin-bag row. The practical issue is keeping the main cabin bag within 7 kg.",
      checkedBag:
        "Malaysia Airlines includes checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      restrictions:
        "The main Malaysia Airlines fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Malaysia Airlines carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the route uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 7 kg and checked bags within the route's weight and size limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one 7 kg cabin bag plus one personal item. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / Business Suite",
        details:
          "Premium cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Malaysia Airlines baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Southeast Asia trip with one checked bag",
        details:
          "Check the included allowance for the route and fare before buying extra baggage.",
      },
      {
        title: "Route using piece concept",
        details:
          "Do not assume a weight allowance if the itinerary uses piece concept. The route determines the model.",
      },
      {
        title: "Adding baggage late",
        details:
          "Additional baggage depends on route, timing, and baggage concept, so airport handling can change the trip cost.",
      },
      {
        title: "Need flexibility",
        details:
          "Change and cancellation costs depend on fare rules and route, and fare difference may apply.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a Malaysia Airlines co-branded card baggage waiver.",
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
        "Garuda Indonesia includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg plus one personal item, while Business and First have higher allowances.",
      personalItem:
        "The personal item is included with the Economy cabin-bag row. The practical issue is keeping the main cabin bag within 7 kg.",
      checkedBag:
        "Garuda Indonesia includes free checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      restrictions:
        "The main Garuda fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Garuda Indonesia carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the itinerary uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 7 kg and checked bags within the route's weight and size limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one 7 kg cabin bag plus one personal item. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Business / First",
        details:
          "Premium cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Garuda baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Indonesia-international trip with one checked bag",
        details:
          "Start with the included allowance for the exact route and fare; excess baggage only starts after that allowance is exceeded.",
      },
      {
        title: "Route using weight concept",
        details:
          "Do not assume a piece allowance if the trip is priced by total checked-bag weight.",
      },
      {
        title: "Adding baggage late",
        details:
          "Additional baggage depends on route and baggage concept, so airport handling can change the final cost.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service depends on eligible ages and routing restrictions.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a Garuda Indonesia co-branded card baggage waiver.",
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
        "Vietnam Airlines includes cabin baggage on the rows shown here. Economy is listed as one carry-on bag up to 10 kg plus one personal item, while Premium Economy and Business have higher allowances.",
      personalItem:
        "The personal item is included with the Economy cabin-bag row, so the practical issue is keeping the main carry-on within 10 kg.",
      checkedBag:
        "Vietnam Airlines includes checked baggage on most eligible fares, but the allowance depends on route, cabin, fare family, and baggage concept.",
      restrictions:
        "The main Vietnam Airlines fee risks are exceeding the included allowance, route-based overweight or oversize handling, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Vietnam Airlines carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether the itinerary uses piece concept or weight concept before assuming the checked-bag allowance.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep Economy cabin baggage at or below 10 kg and checked bags within the route's weight and size limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one 10 kg carry-on bag plus one personal item. Checked allowance depends on route, cabin, fare family, and baggage concept.",
      },
      {
        name: "Premium Economy / Business",
        details:
          "Higher cabins have higher cabin allowances and can have different checked-bag treatment.",
      },
      {
        name: "Piece vs weight concept",
        details:
          "Vietnam Airlines baggage can be calculated by pieces or total weight depending on route.",
      },
      {
        name: "Seats and changes",
        details:
          "Advance seat fees depend on route, fare family, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Vietnam-international trip with one checked bag",
        details:
          "Check the included allowance for the route and fare first; extra baggage is a separate purchase only when the allowance is not enough.",
      },
      {
        title: "Carry-on-only trip",
        details:
          "Economy includes one 10 kg carry-on plus one personal item, but size limits still apply.",
      },
      {
        title: "Adding baggage after booking",
        details:
          "Additional baggage depends on route, timing, and baggage concept, so buying late can change the trip math.",
      },
      {
        title: "Need flexibility",
        details:
          "Change and cancellation costs depend on fare rules and route, and fare difference may apply.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a Vietnam Airlines co-branded card baggage waiver.",
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
        "Batik Air includes cabin baggage on the rows shown here. Economy is listed as one cabin bag up to 7 kg plus one personal item.",
      personalItem:
        "The personal item is included with the Economy cabin-bag row. The practical issue is staying within the one-bag, 7 kg cabin limit.",
      checkedBag:
        "Batik Air includes checked baggage on most eligible fares, but the allowance depends on route and fare family. Additional baggage is priced separately by route and timing.",
      restrictions:
        "The main Batik Air fee risks are exceeding the included allowance, airport overweight or oversize treatment, paid advance seats, and fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The Batik Air carry-on, checked-bag, overweight, oversize, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check the included checked allowance for the exact route and fare family before buying extras.",
      "Buy additional baggage before the airport where available if the included allowance is not enough.",
      "Keep the cabin bag at or below 7 kg and checked bags within the route's weight and size limits.",
      "Use check-in seat assignment when a specific seat is not important.",
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
        name: "Economy",
        details:
          "Economy includes one 7 kg cabin bag plus one personal item. Checked allowance depends on route and fare family.",
      },
      {
        name: "Included checked allowance",
        details:
          "Checked baggage is included on most eligible fares, but the amount depends on the route and fare family.",
      },
      {
        name: "Additional baggage",
        details:
          "Additional baggage is priced by route and purchase timing rather than one universal extra-bag amount.",
      },
      {
        name: "Seats and changes",
        details:
          "Seat fees depend on route, fare, and seat type. Change and cancellation costs are fare-rule based.",
      },
    ],
    scenarios: [
      {
        title: "Indonesia domestic trip with one checked bag",
        details:
          "Confirm the included allowance for the route and fare family before buying additional baggage.",
      },
      {
        title: "Adding baggage after booking",
        details:
          "Additional baggage depends on route and timing, so airport handling can be less predictable.",
      },
      {
        title: "Carry-on-only trip",
        details:
          "The cabin-bag row is one bag up to 7 kg plus one personal item; a heavy cabin bag can break the plan.",
      },
      {
        title: "Oversize item",
        details:
          "Oversize acceptance and fees depend on aircraft and route.",
      },
    ],
    exceptions: [
      "Partner-operated flights can follow the operating carrier's baggage rules.",
      "Oversize acceptance depends on route, aircraft, and airport handling limits.",
      "This fee table does not show a Batik Air co-branded card baggage waiver.",
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
      "The Wizz Air carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
      "This fee table does not show a Wizz Air co-branded card baggage waiver.",
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
        "JetBlue includes one carry-on bag and one personal item even on Blue Basic, so the cabin-bag trap is not the main issue anymore.",
      personalItem:
        "A personal item is included; the practical question is whether the item fits JetBlue's under-seat expectations for the aircraft and seat area.",
      checkedBag:
        "JetBlue checked-bag pricing is fare-, date-, and timing-sensitive. Blue Plus includes the first checked bag on the regional chart, while Blue, Blue Basic, Blue Extra, and EvenMore use paid first- and second-bag pricing that changes by peak versus off-peak travel dates and by whether the bag is added before check-in.",
      restrictions:
        "Blue Basic still includes a carry-on, but it gives up flexibility: changes are not allowed, and cancellations are listed at USD 100 per person on most North America, Central America, and Caribbean routes or USD 200 on other routes.",
    },
    verificationNote:
      "JetBlue checked-bag pricing was verified against JetBlue's optional-services fee page on 2026-07-01. Carry-on and change/cancellation details were last verified on 2026-05-06, oversize and overweight details on 2025-12-22, and seat details on 2025-12-19.",
    avoidFees: [
      "Add checked bags before check-in when the itinerary fits JetBlue's early-purchase chart; the page separates that timing from later airport or check-in pricing.",
      "Compare Blue Plus against Blue or Blue Basic when one traveler is checking exactly one bag. Blue Plus can be cleaner because the first checked bag is included on the regional chart.",
      "Do not buy Blue Basic just because the carry-on is included. If you may change or cancel, the restriction can cost more than the fare savings.",
      "Use the peak/off-peak pricing as a real planning input. JetBlue's bag price can change because of travel dates, not only because of route or fare.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=jetblue&travelers=2&bags=1&directions=2&trips=1&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=jetblue&travelers=2&bags=1&trips=2&pay=yes", label: "Card bag-benefit calculator" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
    ],
    fareClasses: [
      {
        name: "Blue Basic",
        details:
          "Blue Basic includes one carry-on bag and one personal item, but changes are not allowed. Cancellation fees are the bigger trap: USD 100 on North America, Central America, and Caribbean routes, and USD 200 on other routes.",
      },
      {
        name: "Blue",
        details:
          "Blue has no change or cancellation fee listed, but checked bags are dynamic: the first two checked bags vary by peak versus off-peak travel dates and by whether you add them before check-in.",
      },
      {
        name: "Blue Plus / Blue Extra",
        details:
          "Blue Plus includes the first checked bag and then follows JetBlue's dynamic second-bag pricing. Blue Extra is grouped with the other paid-seat-included fares for standard seat selection and no change or cancellation fee.",
      },
      {
        name: "Premium seating and higher-end products",
        details:
          "EvenMore seats are a variable paid seat product. Mint has separate baggage treatment on JetBlue's fee page, so do not apply the Blue checked-bag ladder to Mint without checking the itinerary.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "JetBlue includes one carry-on bag and one personal item on all fares, including Blue Basic.",
      },
      {
        title: "Checking one standard bag on Blue",
        details:
          "The first checked bag on Blue is USD 45 off-peak or USD 49 peak when added before check-in on the U.S., Latin America, Caribbean, and Canada chart.",
      },
      {
        title: "Checking one standard bag on Blue Plus",
        details:
          "Blue Plus includes the first checked bag. The second checked bag follows the dynamic chart: USD 59 off-peak or USD 69 peak when added before check-in on the listed regional chart.",
      },
      {
        title: "Checking three bags on most routes",
        details:
          "Within the U.S., Latin America, the Caribbean, and Canada, JetBlue lists the third checked bag at USD 200. Transatlantic third-bag pricing has its own off-peak and peak amounts.",
      },
      {
        title: "Canceling a Blue Basic transatlantic itinerary",
        details:
          "JetBlue lists Blue Basic cancellations at USD 200 per person on transatlantic itineraries, while changes are not allowed.",
      },
    ],
      exceptions: [
      "Blue Plus includes the first checked bag on the U.S., Latin America, Caribbean, and Canada chart.",
      "Blue, Blue Plus, and Blue Extra show no change or cancellation fee here, with fare difference still applying where relevant.",
      "Mosaic and eligible JetBlue card benefits can change the bag math. Those benefits are referenced separately so the base fees stay readable.",
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
      "The newest American domestic and short-haul checked-baggage facts shown here were last verified against American's checked bag policy on 2026-07-01. Carry-on, transatlantic baggage, seat, and same-day travel facts were last verified on 2025-12-22.",
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
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=american&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=american&travelers=2&bags=1&trips=2&pay=yes", label: "American card bag math" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
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
          "Preferred seats and Main Cabin Extra are listed separately with variable per-segment pricing on top of the base fare.",
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
        "Basic Economy is the restriction product: changes and cancellations are listed as not permitted after 24 hours, advance seat assignment starts at USD 15, and preferred seating on Basic starts much higher than the regular Economy preferred-seat starting price.",
    },
    verificationNote:
      "The newest United checked-baggage facts on this page were last verified on 2026-04-27. The seat-selection and change/cancellation facts currently shown here were last verified on 2025-12-19.",
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
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=united&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=united&travelers=2&bags=1&trips=2&pay=yes", label: "United card bag math" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
    ],
    fareClasses: [
      {
        name: "Basic Economy",
        details:
          "Basic Economy is where United's fee stack starts. It allows no changes or cancellations after 24 hours, advance seat assignment starts at USD 15, and Basic preferred seating starts at USD 136.",
      },
      {
        name: "Economy (non-Basic)",
        details:
          "Economy (non-Basic) is the cleaner product if you need normal flexibility. On newer tickets, the first and second checked bags are cheaper online than at the airport, preferred seating starts at USD 24, and no change fee is listed apart from any fare difference.",
      },
      {
        name: "Economy Plus",
        details:
          "Economy Plus is listed separately as a paid seat product with a range of USD 29-299 per flight, per person.",
      },
      {
        name: "Premium cabins",
        details:
          "Use this as an Economy-focused reference; premium-cabin baggage and cancellation rules can follow separate allowance and fare-rule tables.",
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
          "Advance seat assignment starts at USD 15, while preferred seating starts at USD 136 on Basic Economy.",
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
      "The newest Delta checked-baggage facts on this page were last verified on 2026-05-06. The carry-on, oversize, overweight, same-day travel, and seat facts currently shown here were last verified on 2025-12-22, while the change/cancellation facts were last verified on 2025-12-19.",
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
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=delta&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=delta&travelers=2&bags=1&trips=2&pay=yes", label: "Delta card bag math" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
    ],
    fareClasses: [
      {
        name: "Basic Economy",
        details:
          "Basic Economy keeps the same domestic checked-bag baseline shown for non-Basic Economy, but flexibility is the catch. U.S./Canada-origin Basic fees depend on destination group, and tickets purchased before Nov. 6, 2025 can still be handled under older no-change rules.",
      },
        {
          name: "Economy (non-Basic)",
          details:
          "Economy (non-Basic) keeps the USD 45 and USD 55 domestic bag baseline, but the practical advantage over Basic is flexibility: the listed U.S./Canada-origin regions show no change or cancellation fee for Classic/Main-style tickets.",
        },
      {
        name: "Main Cabin seat products",
        details:
          "Preferred seats are listed separately with variable per-segment pricing.",
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
      "The newest Alaska checked-baggage and oversize details on this page were verified against official Alaska sources on 2026-06-10. Carry-on details were last verified on 2025-12-24, while seat, cancellation, and unaccompanied minor details were last verified on 2025-12-19.",
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
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/checked-baggage-calculator?airline=alaska&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked bag calculator" },
      { href: "/best-cards?airline=alaska&travelers=2&bags=1&trips=2&pay=yes", label: "Alaska card bag math" },
      { href: "/sizer-rules?height=22&width=14&depth=9", label: "Sizer rules" },
      { href: "/guides/airline-credit-card-baggage-benefits", label: "Credit card baggage benefits" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
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
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "For the query 'does Alaska Airlines charge for carry on,' the practical answer is no: one carry-on and one personal item are included, including on Saver.",
      },
      {
        title: "Checking one standard bag",
        details:
          "The first checked bag amount shown here is USD 45 each way on most North American routes ticketed on or after April 10, 2026.",
      },
      {
        title: "Checking one standard bag wholly within Hawaii",
        details:
          "Wholly within Hawaii, the non-resident interisland example shows the first checked bag at USD 30 and the second at USD 40 for Main Cabin and Saver guests.",
      },
      {
        title: "Checking multiple bags",
        details:
          "The third-plus checked bag amount shown here is USD 200 each way on flights ticketed on or after April 10, 2026, while earlier ticketed North American bookings remained at USD 150.",
      },
      {
        title: "Checking a Main Cabin bag on an international trip",
        details:
          "International Main Cabin examples are not all the same: Asia shows the first and second checked bags free, Europe shows the first bag free and the second at USD 100, and Oceania shows the first and second bags free.",
      },
    ],
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
    avoidFees: [
      "Do not use old Spirit fee math to plan a new trip. Since Spirit is no longer operating, compare replacement carriers instead.",
      "For an old disrupted Spirit booking, focus first on refund rights and the payment channel used to buy the ticket.",
      "For historical comparisons, Spirit's cheapest legitimate path was personal-item-only travel; the moment a full-size carry-on or checked bag was needed, the fare stopped being a simple base-price comparison.",
      "When comparing replacement low-cost carriers, check whether the new airline prices bags by route, timing, bundle, or airport purchase.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=spirit&weight=51&size=62", label: "Overweight and oversize calculator" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Restricted fare guide" },
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
    scenarios: [
      {
        title: "Traveling with only a personal item",
        details:
          "Historically, the cleanest Spirit trip was one personal item under the seat and no paid carry-on or checked bag.",
      },
      {
        title: "Adding a full-size carry-on",
        details:
          "On Value, the carry-on amount depended on purchase timing: online booking, online check-in, airport counter, or gate. Premium Economy and Spirit First included the carry-on.",
      },
      {
        title: "Checking one standard bag",
        details:
          "Value and Premium Economy use route- and timing-based checked-bag pricing, while Spirit First includes the first checked bag.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight pricing depends on how far over the limit the bag is, and the maximum accepted weight is 100 lbs.",
      },
    ],
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
        "Frontier's cabin baseline is one personal item at USD 0. A full-size carry-on is a paid add-on whose amount depends on purchase timing, so the bag decision belongs at booking, not at the gate.",
      personalItem:
        "The free item must fit under the seat in front of you. A roller bag or overhead-bin bag is a separate paid decision.",
      checkedBag:
        "Checked baggage is not included by default in the base model. The checked-bag amount depends on route and purchase timing, while overweight and oversize fees have separate dollar amounts.",
      restrictions:
        "Basic Fare and Standard use a timed change-fee ladder and a USD 99 cancellation fee, while Economy, Premium, and Business bundles show no change or cancellation fee.",
    },
    verificationNote:
      "Frontier change and cancellation details shown here were last verified on 2025-12-19. Carry-on, checked-bag, overweight, and oversize details were last verified on 2025-12-22.",
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
      { href: "/fees/oversize_baggage", label: "Oversized baggage" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=frontier&weight=51&size=62", label: "Overweight and oversize calculator" },
      { href: "/sizer-rules", label: "Sizer rules" },
      { href: "/guides/basic-economy-traps", label: "Restricted fare guide" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
    ],
    fareClasses: [
      {
        name: "Basic Fare / Standard",
        details:
          "Change pricing is USD 0 at 60 or more days before departure, USD 49 from 59 to 7 days before departure, and USD 99 at 6 days or less before departure. The cancellation fee is USD 99 per passenger, per direction.",
      },
      {
        name: "Economy / Premium / Business bundle",
        details:
          "These bundles show no change or cancellation fee before departure.",
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
    scenarios: [
      {
        title: "Traveling with only a personal item",
        details:
          "The cleanest Frontier trip is one under-seat personal item and no paid carry-on or checked bag.",
      },
      {
        title: "Checking one standard bag",
        details:
          "The checked-bag amount depends on route and purchase timing, so the price shown during booking or online check-in can be the useful number, not a universal first-bag fee.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight pricing is USD 75 each way for 41-50 lbs and USD 100 each way for 51-100 lbs.",
      },
      {
        title: "Changing a Basic Fare itinerary close to departure",
        details:
          "Change pricing is USD 99 at 6 days or less before departure, including same-day changes.",
      },
    ],
    exceptions: [
      "Economy, Premium, and Business bundles show no change fee and no cancellation fee.",
      "Basic Fare and Standard show a USD 0 change amount when the request is made 60 or more days before departure.",
    ],
    comparisonLinks: [
      { href: "/airlines/spirit", label: "Spirit Airlines" },
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
      "The Ryanair carry-on, checked-bag, excess-baggage, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
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
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=ryanair&weight=22&size=62", label: "Excess baggage calculator" },
      { href: "/sizer-rules?height=16&width=12&depth=8", label: "Sizer rules" },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
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
    scenarios: [
      {
        title: "Flying with the free bag only",
        details:
          "The free path is one small 40 x 30 x 20 cm under-seat bag. If the bag needs the overhead bin, it is no longer the free cabin-bag path.",
      },
      {
        title: "Adding an overhead cabin bag",
        details:
          "Priority & 2 Cabin Bags is the add-on for a 10 kg cabin bag, with pricing shown as a route- and timing-based range.",
      },
      {
        title: "Checking a 20 kg bag",
        details:
          "The 20 kg checked-bag add-on shows a EUR 18.99 to EUR 59.99 range that varies by route, season, and purchase timing.",
      },
      {
        title: "Going over the purchased allowance",
        details:
          "Excess baggage is charged at EUR 12 per additional kg at the airport.",
      },
      {
        title: "Changing a flight",
        details:
          "The flight-change fee is EUR 45 online or EUR 60 at the airport or call center, per passenger, per flight.",
      },
    ],
    exceptions: [
      "Refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "Ryanair does not offer an unaccompanied-minor service; passengers under 16 must travel with an adult aged 18 or over.",
      "This fee table does not show a co-branded credit-card baggage waiver for Ryanair.",
    ],
    comparisonLinks: [
      { href: "/airlines/easyjet", label: "easyJet" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/spirit", label: "Spirit Airlines" },
      { href: "/airlines/jetblue", label: "JetBlue" },
    ],
  },
  easyjet: {
    intro: {
      carryOn:
        "easyJet includes one small under-seat cabin bag by default. The larger cabin bag is a paid add-on or comes through an eligible seat, fare, or membership path, so the cheapest fare is not automatically overhead-bin friendly.",
      personalItem:
        "The included small cabin bag is 45 x 36 x 20 cm and must fit under the seat in front. That is the baseline personal-item-style allowance.",
      checkedBag:
        "easyJet checked baggage is purchased as a hold-bag allowance rather than treated as one flat first-bag fee. The 15 kg and 23 kg hold-bag ranges vary by route, season, and purchase timing; excess weight is charged per additional kg at the airport.",
      restrictions:
        "The practical easyJet decision is whether to buy a larger cabin bag directly, get it through an eligible seat or fare path, or move the weight into a hold bag before airport pricing applies.",
    },
    verificationNote:
      "The easyJet carry-on, hold-bag, seat, change/cancellation, and unaccompanied-minor details shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Start with bag size. If the trip fits inside the included 45 x 36 x 20 cm small cabin bag, the base fare can stay clean.",
      "If you need the larger cabin bag, compare the bag add-on against Up Front or Extra Legroom seating because the seat path can include the large cabin-bag entitlement.",
      "Buy hold baggage before the airport when you need it. The 15 kg and 23 kg ranges vary by route, season, and purchase timing, and excess weight is a separate per-kg airport charge.",
      "Do not rely on refunds for ordinary plan changes. Tickets are not refundable except for flight cancellation or qualifying circumstances.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/tools/excess-baggage-calculator?airline=easyjet&weight=51&size=62", label: "Excess baggage calculator" },
      { href: "/sizer-rules?height=18&width=14&depth=8", label: "Sizer rules" },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
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
          "The larger cabin bag is either purchased as an add-on or included through an eligible seat, fare, or membership path. The add-on range varies by route and timing.",
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
    scenarios: [
      {
        title: "Flying with the included small bag",
        details:
          "The cleanest easyJet path is one 45 x 36 x 20 cm under-seat bag and no larger cabin or hold bag.",
      },
      {
        title: "Needing a larger cabin bag",
        details:
          "Compare the large cabin-bag add-on against Up Front or Extra Legroom seating, because eligible seat paths can include the larger cabin-bag entitlement.",
      },
      {
        title: "Checking a 23 kg hold bag",
        details:
          "The 23 kg hold-bag add-on has a EUR 9.49 to EUR 59.99 range that varies by route, season, and purchase timing.",
      },
      {
        title: "Exceeding purchased hold-bag weight",
        details:
          "Excess baggage is charged at EUR 12 per additional kg at the airport.",
      },
      {
        title: "Changing a flight",
        details:
          "Flight changes are permitted for a fee plus fare difference, with the amount depending on route and timing.",
      },
    ],
    exceptions: [
      "Ticket refunds are not permitted except for flight cancellation or qualifying circumstances.",
      "easyJet does not offer an unaccompanied-minor service; passengers under 16 must travel with an adult.",
      "This fee table does not show a co-branded credit-card baggage waiver for easyJet.",
    ],
    comparisonLinks: [
      { href: "/airlines/ryanair", label: "Ryanair" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/spirit", label: "Spirit Airlines" },
      { href: "/airlines/jetblue", label: "JetBlue" },
    ],
  },
  "aix-connect": {
    intro: {
      carryOn:
        "AIX Connect follows the Air India Express-aligned baggage rules in the rows shown here. Carry-on is limited to one piece up to 7 kg.",
      personalItem:
        "This page does not show a separate paid personal-item row. The cabin-bag issue is the 7 kg one-piece limit.",
      checkedBag:
        "AIX Connect includes checked baggage on most eligible fares, but the allowance differs between domestic India and international routes. Excess baggage is charged separately by route and weight.",
      restrictions:
        "The main AIX Connect fee risks are exceeding the included allowance, airport overweight handling, paid seat selection, and restrictive fare-rule change or cancellation costs.",
    },
    verificationNote:
      "The AIX Connect carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Check whether the trip is domestic India or international before assuming the checked-bag allowance.",
      "Pre-purchase excess baggage where available if the free allowance will not be enough.",
      "Keep the cabin bag at or below 7 kg and checked bags within the published per-bag limits.",
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
          "The carry-on row is one piece up to 7 kg, so a heavy cabin bag can break the plan.",
      },
      {
        title: "Child traveling alone",
        details:
          "Unaccompanied-minor service is generally not offered in the row shown here.",
      },
    ],
    exceptions: [
      "AIX Connect policy is aligned with Air India Express rules in the data shown here.",
      "Unaccompanied-minor service is generally not offered in the row shown here.",
      "This fee table does not show an AIX Connect co-branded card baggage waiver.",
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
      "The Spring Airlines carry-on, checked-bag, overweight, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
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
          "Checked baggage is included only on select fare products in the rows shown here.",
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
          "Unaccompanied-minor service is generally not offered in the row shown here.",
      },
    ],
    exceptions: [
      "Unaccompanied-minor service is generally not offered in the row shown here.",
      "Some basic fares may restrict cabin baggage; verify the fare type before booking.",
      "This fee table does not show a Spring Airlines co-branded card baggage waiver.",
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
        "ZIPAIR includes one cabin bag plus one personal item, but the two items share a combined 7 kg weight limit.",
      personalItem:
        "The personal item is not extra weight; it counts toward the same combined 7 kg cabin allowance.",
      checkedBag:
        "Checked baggage is not included by default and is purchased by weight, with pricing driven by route and purchase timing.",
      restrictions:
        "ZIPAIR is an optional-service model: checked bags, seats, sports equipment, and changes are separate decisions, and unaccompanied-minor service is not offered.",
    },
    verificationNote:
      "The ZIPAIR carry-on, checked-bag, overweight, sports-equipment, seat, change/cancellation, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Weigh cabin items together because the carry-on row uses a combined 7 kg limit across the cabin bag and personal item.",
      "Buy checked baggage by weight before travel when needed; checked baggage is not included by default.",
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
      { href: "/tools/excess-baggage-calculator?airline=zipair&weight=24&size=62", label: "Excess baggage calculator" },
      { href: "/guides/basic-economy-traps", label: "Basic fare guide" },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance" },
      { href: "/sizer-rules?weight=7", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "All fares",
        details:
          "The fee table treats ZIPAIR as an optional-service structure rather than a fare-family ladder with included baggage tiers.",
      },
      {
        name: "Cabin-only travel",
        details:
          "Cabin-only travel means one cabin bag and one personal item together up to 7 kg.",
      },
      {
        name: "Checked-baggage add-on structure",
        details:
          "Checked baggage is purchased by weight and is not included by default.",
      },
      {
        name: "Seat and change products",
        details:
          "Seat selection is listed as an optional paid product, and flight changes are listed as fee-based with fare difference possibly applying.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "The cabin-only path allows one cabin bag and one personal item together up to 7 kg.",
      },
      {
        title: "Adding one checked bag",
        details:
          "Checked baggage is purchased by weight, with price depending on route and purchase timing.",
      },
      {
        title: "Arriving at the airport with excess checked-bag weight",
        details:
          "A single checked bag must not exceed 32 kg, and excess weight beyond the purchased allowance is charged at airport rates.",
      },
      {
        title: "Traveling as an unaccompanied minor",
        details:
          "ZIPAIR does not offer unaccompanied-minor service in the fee row shown here.",
      },
    ],
    exceptions: [
      "This fee table does not show a fare-bundle, elite-status, or co-branded card checked-bag waiver for ZIPAIR.",
    ],
    comparisonLinks: [
      { href: "/airlines/jetstar-japan", label: "Jetstar Japan" },
      { href: "/airlines/jetstar-asia", label: "Jetstar Asia" },
      { href: "/airlines/ana", label: "ANA" },
      { href: "/airlines/jal", label: "Japan Airlines" },
    ],
  },
};

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
    .replaceAll("The current dataset does not publish", "The current fee table does not show")
    .replaceAll("This dataset does not publish", "This fee table does not show")
    .replaceAll("The dataset does not publish", "The fee table does not show")
    .replaceAll("this dataset", "the current fee table")
    .replaceAll("This dataset", "This fee table")
    .replaceAll("the dataset", "the current fee table")
    .replaceAll("The dataset", "The current fee table")
    .replaceAll("current dataset", "current fee table")
    .replaceAll("published rows shown on this page", "published fee rows shown here")
    .replaceAll("published rows included in the current fee table", "published fee rows included here")
    .replaceAll("published rows below", "published fee rows below")
    .replaceAll("Published rows below", "Published fee rows below")
    .replaceAll("row-level source checks", "source checks for the fee rows")
    .replaceAll("Last verified support on this page comes from", "Last verified dates come from")
    .replaceAll("does not publish", "does not show");
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
    case "southwest":
    case "jetblue":
      return (
        <p className="text-sm leading-relaxed text-slate-600">
          For a broader comparison of published airline card checked bag benefits, see the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="underline">
            airline credit card baggage benefit reference
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

function getDefaultRelatedGuides(slug: string): ReferenceLink[] {
  const guides: ReferenceLink[] = [
    { href: "/fees/checked_baggage", label: "Checked baggage" },
    { href: "/fees/carry_on", label: "Carry-on" },
    { href: "/fees/seat_selection", label: "Seat selection" },
    { href: "/fees/change_cancellation", label: "Change and cancellation" },
    { href: "/sizer-rules", label: "Sizer rules" },
  ];

  if (["american", "delta", "united", "air-canada", "jetblue", "southwest"].includes(slug)) {
    guides.push({ href: "/guides/basic-economy-traps", label: "Basic Economy guide" });
  }

  if (["american", "delta", "united", "alaska", "jetblue", "southwest"].includes(slug)) {
    guides.push({
      href: "/guides/airline-credit-card-baggage-benefits",
      label: "Credit card baggage benefits",
    });
  }

  if (hasDotReference(slug)) {
    guides.push({ href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" });
  }

  if (hasEu261Reference(slug)) {
    guides.push({ href: "/passenger-rights/eu261", label: "EU261 passenger rights" });
  }

  return guides;
}

function getAirlineMetadataCopy(slug: string, airlineName: string, fallback?: string): Metadata {
  switch (slug) {
    case "air-canada":
      return {
        title: "Air Canada Baggage Fees, Carry-On Rules, and Basic Fare Traps (2026)",
        description:
          "Air Canada baggage fees depend on fare family and route. Standard and higher fares include the first checked bag in the current fee table, while Basic domestic/transborder examples show paid checked bags.",
      };
    case "air-france":
      return {
        title: "Air France Baggage Charges, Carry-On Rules, and Seat Fees (2026)",
        description:
          "Air France baggage charges depend on itinerary, fare, and purchase path. Additional baggage is priced during booking or My Bookings rather than one universal first-bag fee.",
      };
    case "alaska":
      return {
        title: "Alaska Airlines Baggage Fees and Carry-On Rules (2026)",
        description:
          "Alaska does not charge a carry-on fee in the current fee table: one carry-on and one personal item are included, including Saver. Checked-bag fees depend on ticket date and route.",
      };
    case "lufthansa":
      return {
        title: "Lufthansa Baggage Fees, Carry-On Allowance, and EU261 Links (2026)",
        description:
          "Lufthansa baggage rules depend on fare, cabin, and route. The page explains included carry-on, checked-bag examples, excess baggage, seat selection, and change-fee conditions.",
      };
    default:
      return {
        title: `${airlineName} Fees, Traps, and Bag Math (2026)`,
        description:
          fallback ??
          `Published baggage, seat, and service fees for ${airlineName}, plus traveler-first guidance on the biggest fee traps.`,
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
                  <a
                    href={safeUrl(row.source_url)!}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-700 underline"
                  >
                    Source
                  </a>
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
  const content = REFERENCE_AIRLINE_CONTENT[slug];
  const carryOnRows = getRowsByCategory(fees, "carry_on");
  const checkedRows = getRowsByCategory(fees, "checked_baggage");
  const overweightRows = getRowsByCategory(fees, "overweight_baggage");
  const oversizeRows = getRowsByCategory(fees, "oversize_baggage");
  const seatRows = getRowsByCategory(fees, "seat_selection");
  const changeRows = getRowsByCategory(fees, "change_cancellation");
  const sameDayChangeRows = getRowsByCategory(fees, "same_day_change");
  const sameDayStandbyRows = getRowsByCategory(fees, "same_day_standby");
  const avoidFeeAdvice = content.avoidFees ?? getDefaultAvoidFeeAdvice(slug, airline.name);
  const relatedGuides = content.relatedGuides ?? getDefaultRelatedGuides(slug);
  const numericCheckedBagFees = getNumericCheckedBagFees(fees);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
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
              {airline.name} baggage fees and fare rules
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

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Answer-first summary
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Carry-on allowance
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.carryOn)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Personal item rules
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.personalItem)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Checked bag baseline
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.checkedBag)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Notable restrictions
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{readerCopy(content.intro.restrictions)}</p>
            </div>
          </div>
        </div>
      </header>

      {content.verificationNote ? (
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

      <BaggageDecisionWidget
        airlineSlug={slug}
        airlineName={airline.name}
        feeByBagOrdinal={numericCheckedBagFees}
      />

      <section className="space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Core fee breakdown</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
            Published fee rows below are grouped by fee type and retain the route, fare, and timing limits that matter for booking.
          </p>
        </div>

        <section className="space-y-3">
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
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Personal item rules</h3>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
            {readerCopy(content.intro.personalItem)}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Checked baggage fees</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            See also the <Link href="/fees/checked_baggage" className="underline">checked baggage fee reference</Link>. For a side-by-side baseline comparison, review{" "}
            <InlineComparisonLinks links={content.comparisonLinks} />.
          </p>
          {getCardBenefitReference(slug)}
          <FeeRowsTable
            rows={checkedRows}
            emptyMessage="No checked-baggage row is shown for this airline yet."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900">Excess and overweight baggage</h3>
            <FeeRowsTable
              rows={overweightRows}
              emptyMessage="No dedicated overweight-baggage row is shown for this airline yet."
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900">Oversized baggage</h3>
            <FeeRowsTable
              rows={oversizeRows}
              emptyMessage="No dedicated oversized-baggage row is shown for this airline yet."
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Seat and fare-related fees</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            See also the <Link href="/fees/seat_selection" className="underline">seat selection fee reference</Link>.
          </p>
          <FeeRowsTable
            rows={seatRows}
            emptyMessage="No dedicated seat-selection row is shown for this airline yet."
          />
        </section>

        <section className="space-y-3">
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
            rows={[...changeRows, ...sameDayChangeRows, ...sameDayStandbyRows]}
            emptyMessage="No dedicated change, cancellation, or same-day service row is shown for this airline yet."
          />
        </section>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">How to avoid paying this fee</h2>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-blue-950">
            {avoidFeeAdvice.map((item) => (
              <li key={item} className="border-l-4 border-blue-300 pl-4">
                {readerCopy(item)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Fare-class behavior</h2>
        {slug === "jetblue" ? (
          <p className="text-sm leading-relaxed text-slate-600">
            For a broader comparison of Blue Basic against other stripped-down entry fares, see the{" "}
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
      </section>

      <section className="space-y-4">
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
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">When fees may not apply</h2>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          {content.exceptions.length > 0 ? (
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
              {content.exceptions.map((item) => (
                <li key={item} className="border-l-4 border-slate-300 pl-4">
                  {readerCopy(item)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-slate-700">
              No explicit fee-waiver exception is identified in the published rows shown on this page.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
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
      </section>

      <section className="space-y-4">
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
      </section>

      <div className="grid gap-8 border-t border-slate-100 pt-8 md:grid-cols-2">
        <Disclaimer />
        <div className="space-y-2 text-xs text-slate-400">
          <p>
            This reference reflects the published fee rows and linked source documents available for this airline.
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
  const strategy = AIRLINE_STRATEGY[slug];
  const insightTraps = airline.unique_insights?.traps ?? [];
  const insightHack = airline.unique_insights?.pro_hack;
  const summaryCards = summarizeRows(fees);
  const numericCheckedBagFees = getNumericCheckedBagFees(fees);
  const authorityHighlights = strategy?.authorityHighlights ?? [];
  const peerLinks = (strategy?.relatedAirlines ?? [])
    .map((peerSlug) => getAirlineBySlug(peerSlug))
    .filter(Boolean);

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

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Quick summary</div>
          <p className="mt-3 max-w-4xl text-lg leading-relaxed text-slate-700">
            {strategy?.verdict ??
              `Use this page as the factual starting point for ${airline.name}, then compare the fee guide and related references before you book or add paid extras.`}
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
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Main stack to watch</div>
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

      <BaggageDecisionWidget
        airlineSlug={slug}
        airlineName={airline.name}
        feeByBagOrdinal={numericCheckedBagFees}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <Link
          href={`/airlines/${slug}/how-to-beat-fees`}
          className="group rounded-2xl border border-blue-100 bg-blue-50 p-6 transition hover:bg-blue-600"
        >
          <h2 className="text-lg font-bold text-blue-900 group-hover:text-white">How to beat {airline.name} fees</h2>
          <p className="mt-2 text-sm leading-relaxed text-blue-800 group-hover:text-blue-50">
            Go from fee table to traveler strategy: traps, workarounds, fee-stack math, and what to do before checkout.
          </p>
        </Link>

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
            Use this page with the airline fee guide and related references when you need more than the published fee table alone.
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
            <h2 className="text-2xl font-bold text-slate-900">Published fee rows</h2>
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
                        <Link href={`/fees/${item.category}`} className="hover:underline">
                          {prettyCategoryLabel(item.category)}
                        </Link>
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
              <Link href={`/airlines/${slug}/how-to-beat-fees`} className="font-semibold text-blue-700 underline">
                Go to the {airline.name} fee guide
              </Link>
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

      <SizerCheck />

      <div className="grid gap-8 border-t border-slate-100 pt-8 md:grid-cols-2">
        <Disclaimer />
        <div className="space-y-2 text-xs text-slate-400">
          <p>If a row is missing or unclear, the page should show that uncertainty rather than guess.</p>
        </div>
      </div>

      <RelatedTools slug={slug} />
    </main>
  );
}

export async function generateStaticParams() {
  return getAirlineSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) return { title: "Airline not found" };

  const strategy = AIRLINE_STRATEGY[slug];
  return getAirlineMetadataCopy(slug, airline.name, strategy?.verdict);
}

export default async function AirlinePage({ params }: PageProps) {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) notFound();

  const fees = (airline.fees ?? []) as FeeItem[];

  if (isReferenceSlug(slug)) {
    return <ReferenceAirlinePage slug={slug} airline={airline} fees={fees} />;
  }

  return <LegacyAirlinePage slug={slug} airline={airline} fees={fees} />;
}
