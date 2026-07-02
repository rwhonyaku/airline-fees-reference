import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
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
  "spirit",
  "frontier",
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

const EU261_REFERENCE_SLUGS = new Set(["air-france", "american", "delta", "jetblue", "lufthansa", "united", "zipair"]);

const REFERENCE_AIRLINE_CONTENT: Record<string, ReferenceContent> = {
  "singapore-airlines": {
    intro: {
      carryOn:
        "Singapore Airlines includes cabin baggage, but the allowance changes by cabin: Economy and Premium Economy get one 7 kg cabin bag, while Business and First get two 7 kg cabin bags, with the published size limits still applying.",
      personalItem:
        "The current dataset does not publish a separate personal-item fee row for Singapore Airlines; the practical cabin-bag question is whether your booked cabin allows one or two main cabin pieces under the 7 kg-per-piece rule.",
      checkedBag:
        "Singapore Airlines does not publish one universal first-bag fee in this dataset. Checked baggage is included on eligible fares, but the allowance depends on route, cabin, fare family, and whether the itinerary uses the weight concept or piece concept.",
      restrictions:
        "The main fee risk is excess baggage, not a simple first-bag charge: once you exceed the allowance attached to your route and fare, pricing moves into a route- and concept-based excess-baggage schedule.",
    },
    verificationNote:
      "Last verified support on this page comes from row-level source checks. The published Singapore Airlines baggage, seat, change, and unaccompanied-minor rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Confirm whether your itinerary uses the weight concept or piece concept before packing; the excess charge is triggered by exceeding the allowance attached to that concept.",
      "Treat the 7 kg cabin-bag limit as real for Economy and Premium Economy. If your bag is close, moving weight into checked baggage before the airport is safer than discovering the issue at check-in.",
      "Do not assume a seat is free just because standard selection is often included. Preferred or extra-legroom seats may still price by route and fare family.",
      "Check fare conditions before buying a restrictive fare, because change and cancellation costs depend on the fare rule rather than one flat Singapore Airlines fee.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy / Premium Economy",
        details:
          "Published carry-on allowance is one cabin bag up to 7 kg. Checked baggage may be included, but the actual allowance is tied to route, cabin, fare family, and whether the itinerary uses piece or weight concept rules.",
      },
      {
        name: "Business / First",
        details:
          "Published carry-on allowance is two cabin bags up to 7 kg each. The dataset does not publish a separate premium-cabin excess-baggage price table, so extra-bag pricing remains route- and concept-based.",
      },
      {
        name: "Standard seat selection",
        details:
          "Standard seat selection is published as included for most fares, but timing and availability depend on fare family and cabin.",
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
          "The published cabin allowance is one cabin bag up to 7 kg. This is a weight-sensitive cabin policy, so the risk is less about a posted carry-on fee and more about being over the cabin limit.",
      },
      {
        title: "Checking one standard bag",
        details:
          "This page does not publish a fixed first-bag fee because Singapore Airlines usually starts from an included allowance on eligible fares. The useful question is how much your specific route and fare include.",
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
      "Checked baggage is published as included under either the weight or piece concept depending on route.",
      "Business and First Class show two cabin bags instead of the one-bag Economy and Premium Economy allowance.",
      "Bags above the published maximum accepted weight per checked bag are not handled as ordinary checked baggage.",
      "This dataset does not publish a co-branded credit-card baggage waiver for Singapore Airlines on this page.",
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
        "Lufthansa includes carry-on baggage, but the cabin matters: Economy and Premium Economy get one 7 kg item, while Business and First get two 7 kg items. A small personal item is also permitted under the published cabin rules.",
      personalItem:
        "Lufthansa's carry-on rows explicitly allow an additional small item, such as a slim laptop bag, alongside the main cabin baggage allowance.",
      checkedBag:
        "Lufthansa checked baggage is fare-, cabin-, and route-dependent rather than one global first-bag price. The dataset includes an example where Economy travel from the United States to Germany gets the first 23 kg bag free and the second bag costs USD 90.",
      restrictions:
        "Economy Light is the main restriction point in this dataset: it has paid/limited rebooking treatment, and advance seat reservation fees may apply depending on fare, route, and status.",
    },
    verificationNote:
      "Last verified support on this page comes from row-level source checks. The published Lufthansa baggage, seat, change, and refund rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "Price the exact origin, destination, and fare family before assuming the first checked bag is included; the dataset's free first-bag example is specifically United States to Germany in Economy.",
      "Avoid treating Economy Light like a normal flexible fare. The published example shows a USD 199 rebooking fee plus possible fare difference.",
      "Keep Economy and Premium Economy checked bags at or below 23 kg and 158 cm total dimensions to avoid excess-baggage treatment.",
      "Use included or status-eligible seat-selection options where available instead of buying advance seat reservation by default.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Economy Light",
        details:
          "The dataset publishes Economy Light as the restrictive change example, with a USD 199 rebooking fee plus possible fare difference in the international example context.",
      },
      {
        name: "Economy Classic and above",
        details:
          "These fares can be rebooked under the published rules, but the dataset keeps the fee variable because fare differences and fare conditions still apply.",
      },
      {
        name: "Economy / Premium Economy baggage",
        details:
          "Published carry-on is one 7 kg item plus a small item. Checked-bag allowance varies by fare, cabin, and route, with excess treatment above 23 kg or 158 cm total dimensions.",
      },
      {
        name: "Business / First",
        details:
          "Published carry-on is two 7 kg items plus the small item. This page does not publish a separate premium-cabin checked-bag fee ladder.",
      },
    ],
    scenarios: [
      {
        title: "Flying Economy from the U.S. to Germany",
        details:
          "The dataset's published example shows the first checked bag up to 23 kg free and the second checked bag at USD 90, but the page does not treat that as a universal Lufthansa rule for every route.",
      },
      {
        title: "Booking Economy Light",
        details:
          "Economy Light can look cheaper until you need flexibility. The published rebooking example is USD 199 plus any fare difference.",
      },
      {
        title: "Checking a 25 kg Economy bag",
        details:
          "For Economy and Premium Economy, the row treats bags above 23 kg and up to 32 kg as excess baggage, with fees varying by route.",
      },
      {
        title: "Selecting seats before check-in",
        details:
          "Advance seat reservation may cost extra depending on fare, route, and status, so the fee is variable rather than one flat seat-selection amount.",
      },
    ],
    exceptions: [
      "The United States to Germany checked-bag rows are examples, not a global Lufthansa checked-bag table.",
      "Bags above 32 kg are published as not accepted as ordinary travel baggage.",
      "Status can affect advance seat reservation treatment on eligible flights under the published rules.",
      "This dataset does not publish a Lufthansa co-branded credit-card baggage waiver on this page.",
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
        "Air France cabin baggage is fare-dependent in this dataset: Economy may include 0 to 1 hand baggage item plus one small bag, and the Basic fare can require a paid Hand Baggage option.",
      personalItem:
        "The published Air France cabin row includes one small bag with maximum dimensions of 40 x 30 x 15 cm, even where the larger hand-baggage allowance depends on fare.",
      checkedBag:
        "Air France checked-bag charges vary because additional baggage prices are shown during purchase or in My Bookings and depend on itinerary. The dataset also notes an online discount at least 24 hours before departure except on flights from or to Canada and the USA, where the online and airport prices are the same.",
      restrictions:
        "The fee traps are timing and fare-family based: Basic Economy can turn hand baggage into an add-on, Economy Light has seat-selection restrictions, and overweight or oversized baggage must be handled at the airport.",
    },
    verificationNote:
      "Last verified support on this page comes from row-level source checks. The published Air France baggage, seat, change, and Kids Solo rows shown here were last verified on 2025-12-24.",
    avoidFees: [
      "If booking Basic, confirm whether the larger hand-baggage item is included or whether the Hand Baggage option is required before comparing the fare against a higher bundle.",
      "Buy additional baggage online at least 24 hours before departure when the route allows the discount; the dataset notes that flights from or to Canada and the USA do not get a different online price.",
      "Keep checked bags within the ticketed allowance because overweight and oversized baggage are airport-paid options and vary by itinerary.",
      "Use free seat-assignment eligibility when it applies, such as Flex fares or listed Flying Blue status benefits, instead of paying for seat selection too early.",
    ],
    relatedGuides: [
      { href: "/fees/checked_baggage", label: "Checked baggage" },
      { href: "/fees/carry_on", label: "Carry-on" },
      { href: "/fees/seat_selection", label: "Seat selection" },
      { href: "/fees/change_cancellation", label: "Change and cancellation" },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights" },
      { href: "/sizer-rules", label: "Sizer rules" },
    ],
    fareClasses: [
      {
        name: "Basic fare",
        details:
          "The dataset publishes a Hand Baggage option for Basic Economy fares, with rates displayed during purchase and in My Bookings and purchase allowed up to 4 hours before departure.",
      },
      {
        name: "Economy Light",
        details:
          "Economy Light has the clearest seat-selection restriction in the dataset: paid seats are available until check-in closes, otherwise seats are auto-assigned at check-in.",
      },
      {
        name: "Flex fares and eligible passengers",
        details:
          "Standard seat selection is published as free for Flex fares and certain eligible passenger groups, including listed Flying Blue status members and companions on the same booking.",
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
          "The fare may not behave like a normal carry-on-inclusive ticket. The dataset publishes a paid Hand Baggage option for Basic, with the amount shown during purchase or in My Bookings.",
      },
      {
        title: "Adding a checked bag before travel",
        details:
          "Additional baggage pricing varies by itinerary and is surfaced during purchase or in My Bookings, so this page does not invent a universal Air France first-bag price.",
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
      "The additional-baggage online discount rule has an exception for flights from or to Canada and the USA, where the online price is the same as the airport price in the dataset.",
      "Passengers with reduced mobility, children traveling alone, listed Flying Blue status members, companions on the same booking, and Flex fares have published free standard seat-selection treatment.",
      "Bags over 32 kg must be handled via cargo under the published overweight row.",
      "This dataset does not publish an Air France co-branded credit-card baggage waiver on this page.",
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
        "Southwest's old bag simplicity is gone. For U.S. Mainland travel, Basic, Choice, and Choice Preferred show USD 45 for the first checked bag and USD 55 for the second on bookings ticketed or changed on or after April 9, 2026. Choice Extra remains the fare with the first two checked bags included.",
      restrictions:
        "Basic is now the clear restriction point: no seat selection, no included first bag, and no free same-day change unless the fare is upgraded.",
    },
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
          "Choice Preferred keeps the same checked-bag charges as Choice in the published later-booking U.S. Mainland rows, with same-day change listed at USD 0.",
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
          "Published overweight pricing is USD 100 one-way for 51-70 lbs and USD 200 one-way for 71-100 lbs, in addition to the standard checked bag fee.",
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
    ],
  },
  "air-india": {
    intro: {
      carryOn:
        "The current dataset publishes cabin baggage as included: Economy shows one cabin bag up to 7 kg plus one personal item, while premium cabins have higher allowances.",
      personalItem:
        "The published carry-on row explicitly includes one personal item alongside the cabin bag allowance on Air India-operated flights.",
      checkedBag:
        "The current dataset does not publish one fixed first-bag fee. It publishes checked baggage as included on most eligible fares, then treats additional baggage as a separately purchased route-based product under either the piece or weight concept.",
      restrictions:
        "Air India's main restrictions in this dataset are operational rather than one fixed fee ladder: cabin baggage is explicitly tied to Air India-operated flights, while extra baggage, seat selection, and changes all depend on route, fare family, or timing.",
    },
    verificationNote:
      "Last verified support on this page comes from row-level source checks. The published Air India baggage, seat, and change rows shown here were last verified on 2025-12-24.",
    fareClasses: [
      {
        name: "Economy",
        details:
          "The current dataset publishes Economy cabin baggage at one cabin bag up to 7 kg plus one personal item. Checked baggage is still included on most eligible fares, but the actual allowance depends on route and whether the itinerary uses the piece or weight concept.",
      },
      {
        name: "Premium cabins",
        details:
          "The carry-on row states that Business and First Class have higher cabin baggage allowances, but this page does not publish a separate premium-cabin checked-bag chart or a separate premium-cabin change-fee ladder.",
      },
      {
        name: "Allowance and purchase path",
        details:
          "The useful split on this page is between included allowance and purchased excess. Additional baggage can be bought in advance or at the airport, but pricing stays route-based rather than becoming one fixed amount.",
      },
      {
        name: "Partner or non-Air India operations",
        details:
          "The carry-on row is explicitly limited to Air India-operated flights. This dataset does not publish a partner-airline baggage table on this page.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin baggage",
        details:
          "The current dataset publishes Economy at one cabin bag up to 7 kg plus one personal item on Air India-operated flights.",
      },
      {
        title: "Checking one standard bag",
        details:
          "This page does not publish one fixed first-bag fee because the usual starting point is included allowance on eligible fares. The real question becomes how much baggage the route and baggage concept include before excess pricing begins.",
      },
      {
        title: "Buying extra baggage in advance",
        details:
          "Additional checked baggage is published as purchasable both before travel and at the airport, but this page keeps the amount route-based because the dataset does not publish one universal INR add-on figure.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight baggage is published as a variable airport fee that depends on route and excess weight, up to the published 32 kg acceptance limit.",
      },
      {
        title: "Flying on a partner-operated itinerary",
        details:
          "The carry-on row on this page is limited to Air India-operated flights, so a partner-operated segment may follow different baggage rules than the Air India baseline shown here.",
      },
    ],
    exceptions: [
      "Checked baggage is published as included on most eligible fares rather than as one fixed universal paid first-bag rule.",
      "Additional baggage may be purchased in advance or at the airport where the route permits it, but this page does not publish one fixed extra-bag number.",
      "The carry-on row explicitly shows higher allowances for Business and First Class.",
      "This dataset does not publish an elite-status or co-branded card baggage-waiver row for Air India on this page.",
    ],
    comparisonLinks: [
      { href: "/airlines/eva-air", label: "EVA Air" },
      { href: "/airlines/zipair", label: "ZIPAIR" },
      { href: "/airlines/united", label: "United Airlines" },
    ],
  },
  "air-canada": {
    intro: {
      carryOn:
        "The current dataset publishes one standard carry-on and one personal item as included on all fares, with size and weight limits and with enforcement varying by aircraft and airport.",
      personalItem:
        "The carry-on row explicitly includes one personal item, but this page does not publish a separate Air Canada personal-item-only row with its own fee or dimensions table.",
      checkedBag:
        "The current dataset publishes a split checked-bag picture rather than one single baseline: the first checked bag is included on Standard and higher fares across domestic, transborder, and international markets, while Basic fares show CAD 30 for the first checked bag on the domestic and transborder example published here and CAD 50 for the second bag where it is not included.",
      restrictions:
        "Basic fares are the main restriction point in this dataset: changes and refunds are not permitted after 24 hours except in qualifying circumstances, and advance seat selection starts as a paid product on Basic.",
    },
    verificationNote:
      "Last verified support on this page comes from row-level source checks. The published Air Canada baggage, seat, and change rows shown here were last verified on 2025-12-24.",
    fareClasses: [
      {
        name: "Basic",
        details:
          "Published rows show the first checked bag at CAD 30 on domestic and transborder routes, advance seat selection starting at CAD 10, and changes and refunds not permitted after 24 hours except in qualifying circumstances.",
      },
      {
        name: "Standard and higher",
        details:
          "Published rows show the first checked bag included on Standard, Flex, Comfort, Latitude, Premium Economy, and Business fares, with no change fee listed before departure for Standard and higher fares.",
      },
      {
        name: "Preferred and extra-legroom seating",
        details:
          "Preferred or extra-legroom seats are listed separately with a published range of CAD 25 to CAD 199 depending on route and timing.",
      },
      {
        name: "International route differences",
        details:
          "The checked-baggage allowance row applies across domestic, transborder, and international markets, but the paid Basic example published on this page is specifically domestic and transborder. This dataset does not publish one fixed international paid first-bag number outside that example.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin baggage",
        details:
          "The current dataset publishes one standard carry-on and one personal item included on all fares, with enforcement varying by aircraft and airport.",
      },
      {
        title: "Checking one standard bag on a Basic domestic or transborder trip",
        details:
          "Published pricing is CAD 30 each way for the first checked bag on Basic fares in the domestic and transborder example shown in this dataset.",
      },
      {
        title: "Checking two standard bags on a fare where the second bag is not included",
        details:
          "Published pricing is CAD 50 each way for the second checked bag on the domestic and transborder example where the second bag is not included.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "The current dataset publishes overweight baggage as a route-based range from CAD 100 to CAD 225, with bags over 32 kg not accepted.",
      },
      {
        title: "Changing a Basic fare after the 24-hour window",
        details:
          "The published row states that changes and refunds are not permitted on Basic fares after 24 hours except in qualifying circumstances.",
      },
    ],
    exceptions: [
      "The first checked bag is published as included on Standard and higher fares.",
      "The published paid Basic example on this page is domestic and transborder, not a single universal international paid-bag baseline.",
      "No change fee is published for Standard and higher fares before departure, though fare difference can still apply.",
      "This dataset does not publish an Aeroplan status or co-branded card baggage-waiver row on this page.",
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
        "The current dataset publishes cabin baggage as included: Economy shows one cabin bag up to 7 kg plus one personal item, while Premium Economy and Business have higher allowances.",
      personalItem:
        "The published carry-on row explicitly includes one personal item alongside the cabin bag allowance on EVA Air-operated flights.",
      checkedBag:
        "The current dataset does not publish one fixed first-bag fee. It publishes checked baggage as included on most eligible fares, then treats additional baggage as a separately purchased route-based product under either the piece or weight concept.",
      restrictions:
        "EVA Air's main restrictions in this dataset are operational rather than one fixed fee ladder: cabin baggage is explicitly tied to EVA Air-operated flights, while extra baggage, seat selection, and changes all depend on route, baggage concept, or fare rules.",
    },
    verificationNote:
      "Last verified support on this page comes from row-level source checks. The published EVA Air baggage, seat, and change rows shown here were last verified on 2025-12-24.",
    fareClasses: [
      {
        name: "Economy",
        details:
          "The current dataset publishes Economy cabin baggage at one cabin bag up to 7 kg plus one personal item. Checked baggage is still included on most eligible fares, but the actual allowance depends on route and whether the itinerary uses the piece or weight concept.",
      },
      {
        name: "Premium Economy / Business",
        details:
          "The carry-on row states that Premium Economy and Business have higher cabin baggage allowances, but this page does not publish a separate premium-cabin checked-bag chart or a separate premium-cabin change-fee ladder.",
      },
      {
        name: "Allowance and purchase path",
        details:
          "The useful split on this page is between included allowance and purchased excess. Additional baggage can be bought in advance or at the airport, but pricing stays route-based rather than becoming one fixed amount.",
      },
      {
        name: "Partner or non-EVA operations",
        details:
          "The carry-on row is explicitly limited to EVA Air-operated flights. This dataset does not publish a partner-airline baggage table on this page.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin baggage",
        details:
          "The current dataset publishes Economy at one cabin bag up to 7 kg plus one personal item on EVA Air-operated flights.",
      },
      {
        title: "Checking one standard bag",
        details:
          "This page does not publish one fixed first-bag fee because the usual starting point is included allowance on eligible fares. The real question becomes how much baggage the route and baggage concept include before excess pricing begins.",
      },
      {
        title: "Buying extra baggage in advance",
        details:
          "Additional checked baggage is published as purchasable both before travel and at the airport, but this page keeps the amount route-based because the dataset does not publish one universal TWD add-on figure.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Overweight baggage is published as a variable airport fee that depends on route and baggage concept, up to the published 32 kg acceptance limit.",
      },
      {
        title: "Flying on a partner-operated itinerary",
        details:
          "The carry-on row on this page is limited to EVA Air-operated flights, so a partner-operated segment may follow different baggage rules than the EVA Air baseline shown here.",
      },
    ],
    exceptions: [
      "Checked baggage is published as included on most eligible fares rather than as one fixed universal paid first-bag rule.",
      "Additional baggage may be purchased in advance or at the airport where the route permits it, but this page does not publish one fixed extra-bag number.",
      "The carry-on row explicitly shows higher allowances for Premium Economy and Business.",
      "This dataset does not publish an Infinity MileageLands status or co-branded card baggage-waiver row for EVA Air on this page.",
    ],
    comparisonLinks: [
      { href: "/airlines/air-india", label: "Air India" },
      { href: "/airlines/zipair", label: "ZIPAIR" },
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/air-canada", label: "Air Canada" },
    ],
  },
  jetblue: {
    intro: {
      carryOn:
        "JetBlue includes one carry-on bag and one personal item even on Blue Basic, so the cabin-bag trap is not the main issue anymore.",
      personalItem:
        "A personal item is included, but this page does not currently show a separate personal-item dimensions row for JetBlue.",
      checkedBag:
        "JetBlue checked-bag pricing is now date- and timing-sensitive. Within the U.S., Latin America, the Caribbean, and Canada, the first checked bag on Blue, Blue Basic, Blue Extra, and EvenMore is listed at USD 45 off-peak or USD 49 peak when added before check-in; the second bag is USD 59 off-peak or USD 69 peak. Blue Plus keeps the first bag included.",
      restrictions:
        "Blue Basic still includes a carry-on, but it gives up flexibility: changes are not allowed, and cancellations are listed at USD 100 per person on most North America, Central America, and Caribbean routes or USD 200 on other routes.",
    },
    verificationNote:
      "JetBlue checked-bag pricing was verified against JetBlue's optional-services fee page on 2026-07-01. Carry-on and change/cancellation rows were last verified on 2026-05-06, oversize and overweight rows on 2025-12-22, and seat rows on 2025-12-19.",
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
          "Published rows show one carry-on bag and one personal item included on all fares, including Blue Basic.",
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
          "Published rows list Blue Basic cancellations at USD 200 per person on transatlantic itineraries, while changes are not allowed.",
      },
    ],
      exceptions: [
      "Blue Plus includes the first checked bag on the U.S., Latin America, Caribbean, and Canada chart.",
      "Blue, Blue Plus, and Blue Extra show no published change or cancellation fee, with fare difference still applying where relevant.",
      "Mosaic and eligible JetBlue card benefits can change the bag math. Those benefits are referenced separately so the base fee rows stay readable.",
    ],
    comparisonLinks: [
      { href: "/airlines/alaska", label: "Alaska Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
    ],
  },
  american: {
    intro: {
      carryOn:
        "One carry-on bag and one personal item are published as included on all fares.",
      personalItem:
        "The published carry-on row states that size and placement requirements apply to the personal item.",
      checkedBag:
        "American's domestic and short-haul bag price now depends on both ticketing date and fare family. On the main U.S., Canada, Mexico, Caribbean, and Central America group, Main Cabin/Economy (non-Basic) tickets issued on or after April 9, 2026 show USD 45 online or USD 50 at the airport for the first bag and USD 55 online or USD 60 at the airport for the second bag. Basic Economy tickets issued on or after May 18, 2026 are USD 5 higher for those same bag positions.",
      restrictions:
        "American's fee traps are route, fare-family, and timing based: Basic Economy can now cost more for domestic and short-haul checked bags, same-day confirmed change starts at USD 60 on eligible domestic itineraries, and seat pricing varies by product.",
    },
    verificationNote:
      "The newest American domestic and short-haul checked-baggage rows shown here were last verified against American's checked bag policy on 2026-07-01. Carry-on, transatlantic baggage, seat, and same-day travel rows were last verified on 2025-12-22.",
    fareClasses: [
      {
        name: "Basic Economy",
        details:
          "Carry-on inclusion is published for all fares, but Basic Economy has its own checked-bag trap on many domestic and short-haul tickets issued on or after May 18, 2026: the first bag is USD 50 online or USD 55 at the airport, and the second bag is USD 60 online or USD 65 at the airport. Older ticketing windows and longer international routes can use different rules.",
      },
      {
        name: "Economy (non-Basic)",
        details:
          "Published checked-bag rows show the domestic and short-haul first bag at USD 45 online or USD 50 at the airport and the second bag at USD 55 online or USD 60 at the airport on tickets issued on or after April 9, 2026. Earlier published rows for pre-April 9, 2026 tickets remain at USD 35 prepaid or USD 40 at the airport for the first bag, and USD 45 prepaid or USD 50 at the airport for the second bag, with route-specific international pricing also listed.",
      },
      {
        name: "Main Cabin seat products",
        details:
          "Preferred seats and Main Cabin Extra are listed separately with variable per-segment pricing on top of the base fare.",
      },
      {
        name: "Premium cabins",
        details:
          "No separate premium-cabin baggage or cancellation row is published in this dataset.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "Published carry-on rows show one carry-on bag and one personal item included.",
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
          "Published overweight pricing is USD 100 each way for 51-70 lbs and USD 200 each way for 71-100 lbs.",
      },
      {
        title: "Checking one standard bag on a transatlantic trip",
        details:
          "The published first-bag amount is USD 75 each way for Economy (non-Basic) on U.S. to Europe itineraries.",
      },
    ],
    exceptions: [
      "Published same-day standby is USD 0 on eligible domestic fares.",
      "Published checked-bag rows are split by ticketing date and fare family: pre-April 9, 2026 domestic, Canada, and short-haul international rows remain at USD 35 prepaid or USD 40 at the airport for the first bag and USD 45 prepaid or USD 50 at the airport for the second bag; Main Cabin/Economy tickets issued on or after April 9, 2026 use the newer USD 45/50 and USD 55/60 online-versus-airport structure; Basic Economy tickets issued on or after May 18, 2026 are USD 5 higher for those same bag positions.",
      "No explicit elite-status or co-branded card bag waiver is included in the published fee rows shown on this page, even though the separate card-benefit reference tracks verified American card baggage benefits.",
    ],
    comparisonLinks: [
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/alaska", label: "Alaska Airlines" },
    ],
  },
  united: {
    intro: {
      carryOn:
        "United's main cabin-bag risk is fare-specific: Basic Economy is more restrictive than regular Economy, so do not assume every cheap United fare includes the same overhead-bin access.",
      personalItem:
        "A personal-item-only strategy is safest on Basic Economy. On small United Express aircraft, keep the item soft enough to fit into tighter under-seat spaces.",
      checkedBag:
        "United rewards early bag payment and penalizes airport payment. In most markets on Economy (non-Basic) tickets purchased on or after April 3, 2026, the first checked bag is USD 45 prepaid online or USD 50 at the airport, the second is USD 55 prepaid online or USD 60 at the airport, and the third is USD 200.",
      restrictions:
        "Basic Economy is the restriction product: changes and cancellations are listed as not permitted after 24 hours, advance seat assignment starts at USD 15, and preferred seating on Basic starts much higher than the regular Economy preferred-seat starting price.",
    },
    verificationNote:
      "The newest United checked-baggage rows on this page were last verified on 2026-04-27. The seat-selection and change/cancellation rows currently shown here were last verified on 2025-12-19.",
    fareClasses: [
      {
        name: "Basic Economy",
        details:
          "Basic Economy is where United's fee stack starts. The rows here show no changes or cancellations after 24 hours, advance seat assignment starting at USD 15, and Basic preferred seating starting at USD 136.",
      },
      {
        name: "Economy (non-Basic)",
        details:
          "Economy (non-Basic) is the cleaner product if you need normal flexibility. On newer tickets, the first and second checked bags are cheaper online than at the airport, preferred seating starts at USD 24, and no change fee is listed apart from any fare difference.",
      },
      {
        name: "Economy Plus",
        details:
          "Economy Plus is listed separately as a paid seat product with a published range of USD 29-299 per flight, per person.",
      },
      {
        name: "Premium cabins",
        details:
          "This page does not show a separate premium-cabin baggage or cancellation ladder, so use the rows here as an Economy-focused reference.",
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
          "Published pricing is USD 45 prepaid online or USD 50 at the airport for the first checked bag in Economy (non-Basic) on tickets purchased on or after April 3, 2026.",
      },
      {
        title: "Checking three bags on a newer ticket",
        details:
          "Published pricing is USD 200 each way for the third checked bag on tickets purchased on or after April 3, 2026, in most markets, with the row also noting that trip-specific pricing may vary in United's baggage fee calculator.",
      },
      {
        title: "Purchasing a seat on Basic Economy",
        details:
          "Published advance seat assignment starts at USD 15, while preferred seating starts at USD 136 on Basic Economy.",
      },
      {
        title: "Changing a non-Basic domestic itinerary",
        details:
          "Published change pricing is USD 0 for Economy (non-Basic), with fare difference applying.",
      },
    ],
    exceptions: [
      "Economy (non-Basic) shows no published change fee, with fare difference applying.",
      "Published checked-bag rows are split by ticket purchase date: pre-April 3, 2026 most-market rows remain at USD 35, USD 45, and USD 150, while later-ticket rows move to USD 45, USD 55, and USD 200 in most markets.",
      "United card benefits can offset checked-bag fees, but many United card baggage benefits require paying with the eligible card. Check the card-benefit guide before assuming the waiver applies.",
    ],
    comparisonLinks: [
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/alaska", label: "Alaska Airlines" },
    ],
  },
  delta: {
    intro: {
      carryOn:
        "One carry-on bag and one personal item are published as included on all fares.",
      personalItem:
        "The published carry-on row states that size and placement requirements apply to the personal item.",
      checkedBag:
        "Delta's domestic bag baseline is easy to price: USD 45 for the first standard checked bag and USD 55 for the second on domestic flights in the official common-fee chart, before card, status, military, or cabin exceptions.",
      restrictions:
        "Delta Basic Economy is not mainly a carry-on trap. The bigger risk is flexibility: Basic change or cancellation fees differ by region, and older Basic tickets can still have stricter no-change treatment.",
    },
    verificationNote:
      "The newest Delta checked-baggage rows on this page were last verified on 2026-05-06. The carry-on, oversize, overweight, same-day travel, and seat rows currently shown here were last verified on 2025-12-22, while the change/cancellation rows were last verified on 2025-12-19.",
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
          "Same-day confirmed change is USD 75 for eligible fares, but Diamond, Platinum, and Gold Medallion members have the fee waived in the row shown here.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only cabin items",
        details:
          "Published rows show one carry-on bag and one personal item included on all fares.",
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
          "Published overweight pricing is USD 100 each way for 51-70 lbs and USD 200 each way for 71-100 lbs.",
      },
      {
        title: "Changing a Basic Economy long-haul itinerary",
        details:
          "Published Basic Economy change or cancellation pricing is USD 199 each way on the long-haul regional group listed in the dataset.",
      },
    ],
    exceptions: [
      "Published same-day confirmed change is waived for Diamond, Platinum, and Gold Medallion members.",
      "Economy (non-Basic) rows show no change or cancellation fee in the listed regions, but fare difference can still apply.",
      "Basic Economy rows can differ by ticket era: the current regional groups show USD 99 or USD 199 change/cancellation pricing, while older Basic Economy tickets purchased before Nov. 6, 2025 can still be listed as not permitted.",
    ],
    comparisonLinks: [
      { href: "/airlines/united", label: "United Airlines" },
      { href: "/airlines/american", label: "American Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
    ],
  },
  alaska: {
    intro: {
      carryOn:
        "One carry-on bag up to the published 22 x 14 x 9 inch limit and one personal item are listed as included on all fares, including Saver.",
      personalItem:
        "The published carry-on row states that the smaller personal item is included with the cabin bag allowance.",
      checkedBag:
        "Alaska's standard North America bag price is now ticketing-date sensitive. On most North American routes ticketed on or after April 10, 2026, the first checked bag is USD 45 and the second is USD 55; earlier ticketed bookings retain the prior USD 40 and USD 45 amounts. The former online/mobile prepay discount is no longer part of the newer structure.",
      restrictions:
        "Saver is identified in the published change and cancellation rows as the most restrictive fare family after the 24-hour cancellation window, while preferred seats may cost extra in Main Cabin.",
    },
    verificationNote:
      "The newest Alaska checked-baggage and oversize rows on this page were verified against official Alaska sources on 2026-06-10. The carry-on row currently shown here was last verified on 2025-12-24, while seat, cancellation, and unaccompanied minor rows were last verified on 2025-12-19.",
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
          "Published rows show one carry-on bag and one personal item included on all fares, including Saver.",
      },
      {
        title: "Checking one standard bag",
        details:
          "The published first checked bag amount is USD 45 each way on most North American routes ticketed on or after April 10, 2026.",
      },
      {
        title: "Checking one standard bag wholly within Hawaii",
        details:
          "Wholly within Hawaii, the published non-resident interisland example shows the first checked bag at USD 30 and the second at USD 40 for Main Cabin and Saver guests.",
      },
      {
        title: "Checking multiple bags",
        details:
          "The published third-plus checked bag amount is USD 200 each way on flights ticketed on or after April 10, 2026, while earlier ticketed North American bookings remained at USD 150.",
      },
      {
        title: "Checking a Main Cabin bag on an international trip",
        details:
          "International Main Cabin examples are not all the same: Asia shows the first and second checked bags free, Europe shows the first bag free and the second at USD 100, and Oceania shows the first and second bags free.",
      },
    ],
    exceptions: [
      "All fares show a full refund when canceled within 24 hours of booking.",
      "Alaska's published baggage materials say Mileage Plan elite members, eligible co-branded cardholders, Atmos Rewards status holders, and eligible Alaska and Hawaii resident programs such as Club 49 and Huaka'i receive baggage benefits or exceptions in the published program terms.",
      "Strollers, car seats, mobility aids or medical assistive devices, qualifying pineapple from Hawaii, and qualifying wine shipments have special baggage treatment in Alaska's published exceptions.",
      "First Class includes two checked bags at 70 lbs each.",
      "Published pre-April 10, 2026 most-route baggage rows remain at USD 40 for the first bag and USD 45 for the second bag.",
    ],
    comparisonLinks: [
      { href: "/airlines/southwest", label: "Southwest Airlines" },
      { href: "/airlines/delta", label: "Delta Air Lines" },
      { href: "/airlines/american", label: "American Airlines" },
    ],
  },
  spirit: {
    intro: {
      carryOn:
        "The published cabin baseline is one personal item included at USD 0, while a full-size carry-on is chargeable and varies by route and purchase timing.",
      personalItem:
        "The personal item must fit completely under the seat in front of the passenger under the published row.",
      checkedBag:
        "Published checked-bag pricing varies by route and purchase timing and is not included by default.",
      restrictions:
        "The current published fee rows distinguish Spirit's Value, Premium Economy, and Spirit First travel options for carry-on, checked-bag, and change/cancellation treatment.",
    },
    statusUpdate: {
      label: "Status update",
      body:
        "Spirit Airlines ceased operations on May 2, 2026 and began an orderly wind-down of operations. This page is retained as a historical/reference archive of previously published fee structures and policies.",
    },
    fareClasses: [
      {
        name: "Value",
        details:
          "Published rows show Value as the product where carry-on and checked-bag pricing varies by route and purchase timing, and where change or cancellation fees can still apply.",
      },
      {
        name: "Personal-item-only travel",
        details:
          "The published carry-on row lists one personal item at USD 0.",
      },
        {
          name: "Premium Economy and Spirit First",
          details:
            "Published rows show Premium Economy including a carry-on bag with no change or cancellation fee, while Spirit First includes a carry-on bag, the first checked bag, and no change or cancellation fee.",
        },
        {
          name: "Change and cancellation policy",
          details:
            "Published rows show Value as fee-based for changes or cancellations, while Premium Economy and Spirit First show no change or cancellation fee, with fare difference still possibly applying.",
        },
    ],
    scenarios: [
      {
        title: "Traveling with only a personal item",
        details:
          "The published amount is USD 0 for one personal item carried under the seat.",
      },
      {
        title: "Adding a full-size carry-on",
        details:
          "The published row states that carry-on pricing varies by route and purchase timing.",
      },
        {
          title: "Checking one standard bag",
          details:
            "Published rows show checked-bag pricing varying by route and purchase timing for Value and Premium Economy, while Spirit First includes the first checked bag.",
        },
      {
        title: "Checking an overweight bag",
        details:
          "The published overweight row states that overweight pricing varies and that the maximum accepted weight is 100 lbs.",
      },
    ],
      exceptions: [
        "Premium Economy and Spirit First show no published change or cancellation fee, with fare difference still possibly applying.",
        "No explicit fare-bundle, elite-status, or co-branded card fee waiver is included in the published rows shown on this page.",
      ],
    comparisonLinks: [
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
    ],
  },
  frontier: {
    intro: {
      carryOn:
        "The published cabin baseline is one personal item included at USD 0, while a full-size carry-on is chargeable and varies by route and purchase timing.",
      personalItem:
        "The published personal-item row states that the item must fit under the seat in front of the passenger.",
      checkedBag:
        "Published checked-bag pricing varies by route and purchase timing and is not included by default.",
      restrictions:
        "Basic Fare and Standard rows show a timed change-fee ladder and a USD 99 cancellation fee, while Economy, Premium, and Business bundles are the published products with no change or cancellation fee.",
    },
    fareClasses: [
      {
        name: "Basic Fare / Standard",
        details:
          "Published change pricing is USD 0 at 60 or more days before departure, USD 49 from 59 to 7 days before departure, and USD 99 at 6 days or less before departure. The published cancellation fee is USD 99 per passenger, per direction.",
      },
      {
        name: "Economy / Premium / Business bundle",
        details:
          "The published change and cancellation rows list no fee at any time before departure.",
      },
      {
        name: "Personal-item-only travel",
        details:
          "The published cabin baseline includes one personal item at USD 0.",
      },
      {
        name: "Paid carry-on and checked-bag products",
        details:
          "The published bag rows state that carry-on and checked-bag pricing varies by route and purchase timing.",
      },
    ],
    scenarios: [
      {
        title: "Traveling with only a personal item",
        details:
          "The published amount is USD 0 for one personal item carried under the seat.",
      },
      {
        title: "Checking one standard bag",
        details:
          "The published checked-bag row states that pricing varies by route and purchase timing.",
      },
      {
        title: "Checking an overweight bag",
        details:
          "Published overweight pricing is USD 75 each way for 41-50 lbs and USD 100 each way for 51-100 lbs.",
      },
      {
        title: "Changing a Basic Fare itinerary close to departure",
        details:
          "Published change pricing is USD 99 at 6 days or less before departure, including same-day changes.",
      },
    ],
    exceptions: [
      "Economy, Premium, and Business bundles show no published change fee and no published cancellation fee.",
      "Basic Fare and Standard show a published USD 0 change amount when the request is made 60 or more days before departure.",
    ],
    comparisonLinks: [
      { href: "/airlines/spirit", label: "Spirit Airlines" },
      { href: "/airlines/southwest", label: "Southwest Airlines" },
    ],
  },
  zipair: {
    intro: {
      carryOn:
        "The published cabin allowance is one cabin bag plus one personal item, with a combined weight limit of 7 kg and size limits applying.",
      personalItem:
        "The personal item is part of the combined 7 kg cabin allowance under the published row.",
      checkedBag:
        "Published checked baggage is not included by default and is purchased by weight, with pricing varying by route and purchase timing.",
      restrictions:
        "The current published rows on this page do not break fees out by basic, standard, or premium fare family. Change pricing is fee-based, seat selection is optional and chargeable, and unaccompanied minor service is not offered.",
    },
    fareClasses: [
      {
        name: "All fares",
        details:
          "The current published rows treat ZIPAIR as an all-fares optional-service structure rather than a fare-family structure with separate baggage or change rows.",
      },
      {
        name: "Cabin-only travel",
        details:
          "The published cabin baseline includes one cabin bag and one personal item with a combined 7 kg weight limit.",
      },
      {
        name: "Checked-baggage add-on structure",
        details:
          "Published checked baggage is purchased by weight and is not included by default.",
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
          "The published cabin baseline allows one cabin bag and one personal item together up to 7 kg.",
      },
      {
        title: "Adding one checked bag",
        details:
          "The published checked-baggage row states that baggage is purchased by weight and varies by route and purchase timing.",
      },
      {
        title: "Arriving at the airport with excess checked-bag weight",
        details:
          "The published overweight row states that a single checked bag must not exceed 32 kg and that excess weight beyond the purchased allowance is charged at airport rates.",
      },
      {
        title: "Traveling as an unaccompanied minor",
        details:
          "The published unaccompanied minor row lists the service as not permitted.",
      },
    ],
    exceptions: [
      "No explicit fare-bundle, elite-status, or co-branded card fee waiver is included in the published rows shown on this page.",
    ],
    comparisonLinks: [
      { href: "/airlines/spirit", label: "Spirit Airlines" },
      { href: "/airlines/frontier", label: "Frontier Airlines" },
      { href: "/airlines/united", label: "United Airlines" },
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
    "Buy bags and seats before the airport when the dataset shows a timing difference or route-based paid add-on; airport handling is usually the least forgiving place to discover a mismatch.",
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
                {formatAmount(row.amount, row.currency)}
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
                        {formatAmount(item.amount, item.currency)}
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
  return {
    title: `${airline.name} Fees, Traps, and Bag Math (2026)`,
    description:
      strategy?.verdict ??
      `Published baggage, seat, and service fees for ${airline.name}, plus traveler-first guidance on the biggest fee traps.`,
  };
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
