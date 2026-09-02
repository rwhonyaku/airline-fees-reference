import Link from "next/link";
import type { Metadata } from "next";
import { getAirlineBySlug } from "@/lib/data";
import type { FeeItem } from "@/lib/types";
import { BasicEconomyDecisionTool } from "@/components/BasicEconomyDecisionTool";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";
import { JsonLd } from "@/components/JsonLd";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Basic Economy vs Bundles: Fees by Airline (2026)",
  description:
    "Compare Basic Economy and value bundles by carry-on, checked bags, seats, and change rules. Use the calculator to see which fare costs less for your trip.",
};

const LAST_VERIFIED = "2026-09-02";

const SOURCES = {
  unitedBasic: "https://www.united.com/en/us/fly/travel/inflight/basic-economy.html",
  unitedCarryOn: "https://www.united.com/en/us/fly/baggage/carry-on-bags.html",
  americanBasic: "https://www.aa.com/i18n/travel-info/experience/seats/basic-economy.jsp",
  deltaCarryOn: "https://www.delta.com/us/en/baggage/carry-on-baggage",
  deltaFees: "https://www.delta.com/us/en/baggage/overview#changecancelfees",
  airCanadaBags: "https://www.aircanada.com/ca/en/aco/home/plan/baggage/checked.html",
  airCanadaSeats: "https://www.aircanada.com/ca/en/aco/home/plan/seats/advance-seat-selection.html",
  jetblueBasic:
    "https://news.jetblue.com/latest-news/press-release-details/2024/JetBlue-Gives-Blue-Basic-a-Boost-with-Complimentary-Carry-On-Bag-Starting-September-6/default.aspx",
  alaskaChanges: "https://www.alaskaair.com/content/travel-info/fly-alaska/24-hour-cancellation",
  southwestFares: "https://www.southwest.com/fare-information/",
  southwestFees: "https://www.southwest.com/html/customer-service/travel-fees.html",
  frontierBags: "https://www.flyfrontier.com/travel/travel-info/bag-options/",
  frontierBundles: "https://www.flyfrontier.com/travel/travel-info/bundle-save/?mobile=true",
};

type GuideRow = {
  slug: string;
  airline: string;
  model: string;
  carryOn: string;
  seats: string;
  changes: string;
  whereItBreaks: string;
  sourceLabel: string;
  sourceHref: string;
};

type DecisionCard = {
  title: string;
  verdict: string;
  action: string;
  links: Array<{ href: string; label: string }>;
};

const BASIC_ECONOMY_FAQS = [
  {
    question: "Why are two similar flights priced differently?",
    answer:
      "The cheaper flight may be a more restrictive fare. Before booking, compare carry-on access, checked bag fees, seat selection, change and cancellation rules, refunds, boarding position, and whether the itinerary is operated by a partner airline.",
  },
  {
    question: "Is Basic Economy worth it?",
    answer:
      "Basic Economy can be worth it when you only need a personal item or included carry-on, do not care where you sit, and are confident your plans will not change. It is weaker when bags, seat control, or flexibility matter.",
  },
  {
    question: "Which Basic Economy fare is riskiest for carry-on bags?",
    answer:
      "United Basic Economy is the clearest major-airline example where the cheapest fare can limit you to a personal item. Frontier Basic is a different low-cost model where a full-size carry-on and seat assignment cost extra unless a bundle includes them.",
  },
  {
    question: "Is Basic Economy or a value bundle cheaper for a city break?",
    answer:
      "Add every required carry-on, checked-bag, and seat fee across all travelers and both directions. A bundle is cheaper when its total fare premium plus any excluded add-ons is lower than those separate Basic-fare charges.",
  },
  {
    question: "How do baggage policies differ among low-cost airlines?",
    answer:
      "The free allowance, purchase timing, weight limit, and bundle inclusions differ. Some low-cost fares include only a personal item, while a higher bundle may add a carry-on, checked bags, or both. Compare the exact itinerary instead of assuming every low-cost fare uses the same baggage model.",
  },
];

function basicEconomyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
          { "@type": "ListItem", position: 2, name: "Basic Economy fees and restrictions", item: canonical("/guides/basic-economy-traps") },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: BASIC_ECONOMY_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

function safeText(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

function formatAmount(amount: unknown, currency: unknown): string {
  const cur = typeof currency === "string" ? currency.trim() : "";
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return cur ? `${amount.toFixed(0)} ${cur}` : `${amount.toFixed(0)}`;
  }
  if (typeof amount === "string" && amount.trim()) {
    return cur ? `${amount.trim()} ${cur}` : amount.trim();
  }
  return "Not published";
}

function getFees(slug: string): FeeItem[] {
  return (getAirlineBySlug(slug)?.fees ?? []) as FeeItem[];
}

function findFee(
  fees: FeeItem[],
  category: string,
  predicate?: (row: FeeItem) => boolean
): FeeItem | null {
  const rows = fees.filter((row) => safeText(row.category) === category);
  if (!rows.length) return null;
  if (!predicate) return rows[0];
  return rows.find(predicate) ?? null;
}

function usdRangeText(row: FeeItem | null, prefix = "From"): string {
  if (!row) return "Not shown here";
  return `${prefix} ${formatAmount(row.amount, row.currency)}`;
}

function buildGuideRows(): GuideRow[] {
  const unitedFees = getFees("united");
  const airCanadaFees = getFees("air-canada");
  const deltaFees = getFees("delta");
  const jetblueFees = getFees("jetblue");
  const alaskaFees = getFees("alaska");
  const southwestFees = getFees("southwest");
  const frontierFees = getFees("frontier");

  const unitedBasicSeat = findFee(
    unitedFees,
    "seat_selection",
    (row) => safeText(row.applies_to).toLowerCase().includes("basic") && safeText(row.conditions).toLowerCase().includes("advance seat")
  );
  const unitedPreferredBasic = findFee(
    unitedFees,
    "seat_selection",
    (row) => safeText(row.applies_to).toLowerCase().includes("basic") && safeText(row.conditions).toLowerCase().includes("preferred")
  );

  const deltaBasicChangeShort = findFee(
    deltaFees,
    "change_cancellation",
    (row) =>
      safeText(row.applies_to).toLowerCase().includes("basic") &&
      !safeText(row.applies_to).toLowerCase().includes("non-basic") &&
      safeText(row.region_or_route).includes("US/Canada/Mexico/Caribbean/Central America")
  );
  const deltaBasicChangeLong = findFee(
    deltaFees,
    "change_cancellation",
    (row) =>
      safeText(row.applies_to).toLowerCase().includes("basic") &&
      !safeText(row.applies_to).toLowerCase().includes("non-basic") &&
      safeText(row.region_or_route).includes("South America/Europe/UK/Africa/Middle East/India/Asia/Pacific")
  );

  const airCanadaBasicFirstBag = findFee(
    airCanadaFees,
    "checked_baggage",
    (row) =>
      safeText(row.applies_to).toLowerCase().includes("basic") &&
      safeText(row.conditions).toLowerCase().includes("first checked bag")
  );
  const airCanadaBasicSeat = findFee(
    airCanadaFees,
    "seat_selection",
    (row) =>
      safeText(row.applies_to).toLowerCase().includes("basic") &&
      safeText(row.conditions).toLowerCase().includes("advance seat")
  );
  const airCanadaBasicChange = findFee(
    airCanadaFees,
    "change_cancellation",
    (row) => safeText(row.applies_to).toLowerCase().includes("basic")
  );

  const jetblueBasicChange = findFee(
    jetblueFees,
    "change_cancellation",
    (row) => safeText(row.applies_to).toLowerCase().includes("blue basic")
  );

  const alaskaChange = findFee(
    alaskaFees,
    "change_cancellation",
    (row) => safeText(row.conditions).toLowerCase().includes("saver fares most restrictive")
  );

  const southwestBasicSeat = findFee(
    southwestFees,
    "seat_selection",
    (row) => safeText(row.applies_to).toLowerCase().includes("basic fare")
  );
  const southwestBasicBag = findFee(
    southwestFees,
    "checked_baggage",
    (row) =>
      safeText(row.applies_to).toLowerCase().includes("basic fare") &&
      safeText(row.conditions).toLowerCase().includes("on or after april 9, 2026") &&
      safeText(row.conditions).toLowerCase().includes("1st checked bag")
  );

  const frontierCarryOn = findFee(
    frontierFees,
    "carry_on",
    (row) => safeText(row.conditions).toLowerCase().includes("carry-on bag fee varies")
  );
  const frontierLateChange = findFee(
    frontierFees,
    "change_cancellation",
    (row) => safeText(row.timing).toLowerCase().includes("6 days or less")
  );

  return [
    {
      slug: "united",
      airline: "United",
      model: "Basic Economy with a carry-on limit",
      carryOn: "Basic Economy is generally personal-item only under United's published Basic Economy rule.",
      seats: `${usdRangeText(unitedBasicSeat)} for advance seat assignment; preferred seating starts at ${formatAmount(unitedPreferredBasic?.amount, unitedPreferredBasic?.currency)}.`,
      changes: "Changes and cancellations are listed as not permitted after 24 hours on Basic Economy.",
      whereItBreaks:
        "If your bag will not fit under the seat, the fare may need a checked bag or a different fare before it is actually cheaper.",
      sourceLabel: "United Basic Economy",
      sourceHref: SOURCES.unitedBasic,
    },
    {
      slug: "american",
      airline: "American",
      model: "Basic Economy with carry-on included",
      carryOn: "One carry-on bag and one personal item remain allowed on Basic Economy.",
      seats: "American lists seat prices by seat product rather than one separate Basic Economy seat fee here.",
      changes:
        "After 24 hours, changes and refunds to the original payment method are generally not allowed; qualifying AAdvantage members may cancel eligible U.S.-origin trips for a fee and receive credit.",
      whereItBreaks:
        "Basic fares bought from May 18, 2026 have higher domestic and short-haul checked-bag prices, and advance seat selection costs extra.",
      sourceLabel: "American Basic Economy",
      sourceHref: SOURCES.americanBasic,
    },
    {
      slug: "delta",
      airline: "Delta",
      model: "Basic Economy with carry-on included",
      carryOn: "One carry-on bag and one personal item remain allowed.",
      seats: "Preferred-seat pricing is published separately, but the main Basic difference here is not cabin access.",
      changes: `Basic Economy is listed at ${formatAmount(deltaBasicChangeShort?.amount, deltaBasicChangeShort?.currency)} on short-haul regional groups and ${formatAmount(deltaBasicChangeLong?.amount, deltaBasicChangeLong?.currency)} on long-haul regional groups.`,
      whereItBreaks:
        "Delta Basic is mainly a problem when your dates are not firm, because the carry-on looks normal but the change and cancel rules are tighter.",
      sourceLabel: "Delta baggage and change rules",
      sourceHref: SOURCES.deltaFees,
    },
    {
      slug: "air-canada",
      airline: "Air Canada",
      model: "Basic fare with paid checked-bag pressure",
      carryOn: "One standard carry-on and one personal item are included, so the carry-on rule is not the main problem.",
      seats: airCanadaBasicSeat
        ? `${formatAmount(airCanadaBasicSeat.amount, airCanadaBasicSeat.currency)} for Basic advance seat selection, with price varying by route and seat type.`
        : "Basic advance seat selection is a paid product where shown by route and seat type.",
      changes: airCanadaBasicChange
        ? `${safeText(airCanadaBasicChange.conditions)}.`
        : "Basic changes and refunds are more restrictive than Standard and higher fares.",
      whereItBreaks: airCanadaBasicFirstBag
        ? `The Basic domestic/transborder example shows ${formatAmount(airCanadaBasicFirstBag.amount, airCanadaBasicFirstBag.currency)} each way for the first checked bag, while Standard and higher show the first bag included.`
        : "Air Canada Basic can lose the fare comparison when a checked bag is not included.",
      sourceLabel: "Air Canada checked baggage",
      sourceHref: SOURCES.airCanadaBags,
    },
    {
      slug: "jetblue",
      airline: "JetBlue",
      model: "Blue Basic with carry-on included",
      carryOn: "Blue Basic includes one carry-on bag and one personal item under JetBlue's current policy.",
      seats: "Standard-seat inclusion is shown for Blue, Blue Plus, and Blue Extra; this guide does not show a separate Blue Basic standard-seat fee.",
      changes:
        jetblueBasicChange
          ? `${safeText(jetblueBasicChange.conditions)}.`
          : "Blue Basic is the fare family with the change/cancel penalty shown here.",
      whereItBreaks:
        "JetBlue Blue Basic can look fine for bags, then become the wrong fare if you need to change or cancel.",
      sourceLabel: "JetBlue Blue Basic update",
      sourceHref: SOURCES.jetblueBasic,
    },
    {
      slug: "alaska",
      airline: "Alaska",
      model: "Saver fare",
      carryOn: "Saver still includes one carry-on bag and one personal item in the rows shown here.",
      seats: "Standard seat selection is published at USD 0 in Main Cabin, with preferred seats separately variable.",
      changes:
        alaskaChange
          ? `${safeText(alaskaChange.conditions)}.`
          : "Saver is the most restrictive fare family after the 24-hour window.",
      whereItBreaks:
        "Alaska Saver is usually easier to understand, but it is still not the fare to buy when flexibility matters.",
      sourceLabel: "Alaska fare changes",
      sourceHref: SOURCES.alaskaChanges,
    },
    {
      slug: "southwest",
      airline: "Southwest",
      model: "Basic Fare",
      carryOn: "Carry-on and personal item access remain included.",
      seats:
        southwestBasicSeat
          ? `${safeText(southwestBasicSeat.conditions)}.`
          : "Seat treatment changes by fare family rather than through a classic Basic Economy seat fee.",
      changes: "The current fee rows show no cancellation fee across fares, with same-day rules varying by fare family.",
      whereItBreaks:
        southwestBasicBag
          ? `Southwest Basic is no longer automatically a free-checked-bag fare. The current Basic Fare first checked bag row is ${formatAmount(southwestBasicBag.amount, southwestBasicBag.currency)} one-way on later bookings.`
          : "Southwest Basic is mainly about checked bags and seat choice, not carry-on access.",
      sourceLabel: "Southwest fare information",
      sourceHref: SOURCES.southwestFares,
    },
    {
      slug: "frontier",
      airline: "Frontier",
      model: "Low-cost fare with paid add-ons",
      carryOn:
        frontierCarryOn
          ? `${safeText(frontierCarryOn.conditions)}.`
          : "A full-size carry-on usually has to be priced separately instead of treated as included.",
      seats: "Frontier seats matter, but bags, bundles, and late changes usually drive the bigger cost swing.",
      changes:
        frontierLateChange
          ? `${safeText(frontierLateChange.conditions)}.`
          : "Basic Fare / Standard is the more restrictive Frontier fare shown here.",
      whereItBreaks:
        "Frontier's cheap fare usually gets expensive when you add a cabin bag, checked bag, or change close to departure.",
      sourceLabel: "Frontier bundles",
      sourceHref: SOURCES.frontierBundles,
    },
  ];
}

const DECISION_CARDS: DecisionCard[] = [
  {
    title: "You need a normal carry-on",
    verdict:
      "Be most careful with United Basic Economy and Frontier Basic. American, Delta, JetBlue, Alaska, and Southwest are less likely to become a problem because of carry-on access alone.",
    action:
      "If the cheapest fare restricts the overhead bin, price the checked bag or cabin-bag add-on before treating it as cheaper.",
    links: [
      { href: "/airlines/united", label: "United fee page" },
      { href: "/airlines/frontier", label: "Frontier fee page" },
      { href: "/fees/carry_on", label: "Carry-on reference" },
    ],
  },
  {
    title: "You will check a bag",
    verdict:
      "A fare that saves $30 can lose quickly if it adds a paid first checked bag or pushes you toward airport bag pricing.",
    action:
      "Price the bags before booking, then compare whether a fare upgrade or card bag benefit would cost less.",
    links: [
      { href: "/tools/checked-baggage-calculator?airline=united&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked-bag calculator" },
      { href: "/best-cards?airline=united&travelers=2&bags=1&trips=2&pay=yes", label: "Card break-even math" },
      { href: "/fees/checked_baggage", label: "Checked baggage reference" },
    ],
  },
  {
    title: "Your plans might change",
    verdict:
      "Delta, United, JetBlue, and Frontier can all become expensive when the trip changes. Carry-on access does not solve a restrictive fare.",
    action:
      "If your dates are uncertain, compare the next fare family before buying the cheapest result.",
    links: [
      { href: "/fees/change_cancellation", label: "Change/cancel reference" },
      { href: "/airlines/delta", label: "Delta fee page" },
      { href: "/airlines/jetblue", label: "JetBlue fee page" },
      { href: "/passenger-rights/us-dot-refund", label: "U.S. DOT refund rights" },
    ],
  },
  {
    title: "You care where you sit",
    verdict:
      "Seat fees can look small until you multiply them across travelers or flight segments.",
    action:
      "Compare the total seat-control cost against the next fare family, especially for families, couples, or tight connections.",
    links: [
      { href: "/fees/seat_selection", label: "Seat selection reference" },
      { href: "/airlines/united", label: "United seat fees" },
      { href: "/airlines/southwest", label: "Southwest fare page" },
    ],
  },
];

function AirlineComparisonTable({ rows }: { rows: GuideRow[] }) {
  return (
    <section className="space-y-4">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Compare first</div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Basic Economy restrictions by airline</h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
          The lowest fare is not the same product across airlines. Start with the restriction most likely to create an extra cost, then use the calculator with prices from your itinerary.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Airline / lowest fare</th>
              <th className="px-4 py-3 font-semibold">Carry-on</th>
              <th className="px-4 py-3 font-semibold">Change / cancel</th>
              <th className="px-4 py-3 font-semibold">Main cost trap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug} className="border-t border-slate-100 align-top">
                <td className="px-4 py-4">
                  <Link href={`/airlines/${row.slug}`} className="font-bold text-blue-700 underline">{row.airline}</Link>
                  <div className="mt-1 text-xs text-slate-500">{row.model}</div>
                </td>
                <td className="px-4 py-4 text-slate-700">{row.carryOn}</td>
                <td className="px-4 py-4 text-slate-700">{row.changes}</td>
                <td className="px-4 py-4 text-slate-700">
                  {row.whereItBreaks}
                  <div className="mt-2"><a href={row.sourceHref} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">Official source</a></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function BasicEconomyTrapsGuide() {
  const rows = buildGuideRows();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <JsonLd data={basicEconomyJsonLd()} />
      <header className="space-y-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Basic Economy fees and restrictions by airline
          </h1>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Last verified {LAST_VERIFIED}
          </span>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm">
          <a href="#basic-economy-tool" className="font-medium text-blue-700 underline">
            Decision tool
          </a>
          <a href="#decision-matrix" className="font-medium text-blue-700 underline">
            Decision matrix
          </a>
          <Link href="/airlines" className="font-medium text-blue-700 underline">
            All airlines
          </Link>
          <Link href="/fees/carry_on" className="font-medium text-blue-700 underline">
            Carry-on fee reference
          </Link>
          <Link href="/fees/change_cancellation" className="font-medium text-blue-700 underline">
            Change and cancellation reference
          </Link>
          <Link href="/fees/seat_selection" className="font-medium text-blue-700 underline">
            Seat selection fee reference
          </Link>
          <Link href="/tools/checked-baggage-calculator" className="font-medium text-blue-700 underline">
            Checked-bag calculator
          </Link>
          <Link href="/best-cards" className="font-medium text-blue-700 underline">
            Card break-even calculator
          </Link>
          <Link href="/methodology" className="font-medium text-blue-700 underline">
            Methodology
          </Link>
        </nav>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                Basic Economy is not one simple thing. The cheapest fare is only a good deal if it
                still works after carry-on access, checked bag fees, seat choice, changes, and
                refunds are included.
              </p>
              <p>
                United is the clearest case where Basic Economy can force a bag decision right
                away. Air Canada Basic keeps carry-on access but can change checked-bag and seat
                math. JetBlue Blue Basic includes a carry-on now, but flexibility remains the
                thing to check before booking.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
              <div className="font-bold text-slate-900">This page answers:</div>
              <ul className="mt-3 space-y-2">
                <li>Does the cheapest fare still work for a normal carry-on trip?</li>
                <li>Will seat or change limits erase the fare gap later?</li>
                <li>Is this a legacy-airline Basic fare or a low-cost fare with paid add-ons?</li>
              </ul>
            </div>
          </div>
        </section>

      </header>

      <AirlineComparisonTable rows={rows} />

      <BasicEconomyDecisionTool />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Low-cost bundle example</div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Frontier Basic vs Economy, Premium, and Business</h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">
          Frontier is the cleanest current example of the decision. Basic includes a personal item; a carry-on and seat assignment cost extra. Economy adds a carry-on, standard seat, and no change/cancel fee. Premium substitutes a premium seat and priority boarding. Business also adds two 50 lb checked bags and an UpFront Plus seat.
        </p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Frontier option</th>
                <th className="px-4 py-3 font-semibold">Carry-on</th>
                <th className="px-4 py-3 font-semibold">Seat</th>
                <th className="px-4 py-3 font-semibold">Checked bags</th>
                <th className="px-4 py-3 font-semibold">Change/cancel fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr><td className="px-4 py-3 font-bold text-slate-950">Basic</td><td className="px-4 py-3">Paid</td><td className="px-4 py-3">Paid</td><td className="px-4 py-3">Paid</td><td className="px-4 py-3">Applies</td></tr>
              <tr><td className="px-4 py-3 font-bold text-slate-950">Economy</td><td className="px-4 py-3">Included</td><td className="px-4 py-3">Standard included</td><td className="px-4 py-3">Paid</td><td className="px-4 py-3">None</td></tr>
              <tr><td className="px-4 py-3 font-bold text-slate-950">Premium</td><td className="px-4 py-3">Included</td><td className="px-4 py-3">Premium included</td><td className="px-4 py-3">Paid</td><td className="px-4 py-3">None</td></tr>
              <tr><td className="px-4 py-3 font-bold text-slate-950">Business</td><td className="px-4 py-3">Included</td><td className="px-4 py-3">UpFront Plus</td><td className="px-4 py-3">Two at 50 lb</td><td className="px-4 py-3">None</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          <strong>City-break rule:</strong> multiply every separate bag and seat fee by travelers and flight directions. Buy the bundle when that total exceeds the bundle fare difference—provided you actually need what it includes.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Verified against <a href={SOURCES.frontierBundles} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">Frontier&apos;s official bundle comparison</a>. Fare differences and optional-service prices vary by itinerary.
        </p>
      </section>

      <section id="decision-matrix" className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Decision matrix
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Which Basic Economy restriction matters for your trip?
            </h2>
          </div>
          <Link href="/tools/checked-baggage-calculator" className="text-sm font-bold text-blue-700 underline">
            Calculate checked bags
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {DECISION_CARDS.map((card) => (
            <div key={card.title} className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="text-lg font-black text-slate-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{card.verdict}</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">{card.action}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {card.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-800 underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
          Two similar flights
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          If one flight is cheaper, check what the fare leaves out.
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">
          Two flights can look almost identical in search results but behave differently after you
          choose a fare. The lower price may remove or limit a carry-on bag, charge for checked
          bags, delay seat selection, block changes, reduce refund options, or apply different
          rules because a partner airline operates part of the trip.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-bold text-slate-950">Bags</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Check whether the fare includes a normal carry-on and whether the first checked bag is
              included, paid, or route-priced.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-bold text-slate-950">Seats</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              If sitting together matters, compare the seat-selection cost before assuming the
              cheaper fare is actually cheaper.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-bold text-slate-950">Changes and refunds</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              If the trip might move, a restrictive fare can cost more later even when bags are not
              the problem.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/tools/checked-baggage-calculator" className="font-bold text-blue-700 underline">
            Calculate checked bags
          </Link>
          <Link href="/fees/seat_selection" className="font-bold text-blue-700 underline">
            Compare seat fees
          </Link>
          <Link href="/fees/change_cancellation" className="font-bold text-blue-700 underline">
            Compare change rules
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">
          Check the carry-on rule first
        </h2>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          If the cheapest fare does not include a normal carry-on, compare the next fare before
          booking. A paid carry-on or checked bag can erase the savings immediately.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Airline</th>
                <th className="px-4 py-3 font-semibold">Cheapest-fare carry-on path</th>
                <th className="px-4 py-3 font-semibold">What to check before booking</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-slate-900">
                  <Link href="/airlines/united" className="text-blue-700 underline">
                    United
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  Basic Economy is generally personal-item only.
                </td>
                <td className="px-4 py-4 text-slate-700">
                  If your bag will not fit under the seat, price a checked bag or a different fare
                  before booking. See also the{" "}
                  <a href={SOURCES.unitedCarryOn} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                    official United carry-on page
                  </a>.
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-slate-900">
                  <Link href="/airlines/american" className="text-blue-700 underline">
                    American
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  Basic Economy still allows one carry-on bag and one personal item.
                </td>
                <td className="px-4 py-4 text-slate-700">
                  The carry-on is less of a problem, so check route-specific bag prices and paid
                  seats instead.
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-slate-900">
                  <Link href="/airlines/delta" className="text-blue-700 underline">
                    Delta
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  Basic Economy still allows one carry-on bag and one personal item.
                </td>
                <td className="px-4 py-4 text-slate-700">
                  The bag rule is easier. The bigger question is whether your plans might change.
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-slate-900">
                  <Link href="/airlines/air-canada" className="text-blue-700 underline">
                    Air Canada
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  Basic still includes one standard carry-on and one personal item.
                </td>
                <td className="px-4 py-4 text-slate-700">
                  The carry-on is not the main problem. Compare Basic against Standard when a checked
                  bag, seat choice, or flexibility matters.
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-slate-900">
                  <Link href="/airlines/jetblue" className="text-blue-700 underline">
                    JetBlue
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  Blue Basic now includes a carry-on bag and a personal item.
                </td>
                <td className="px-4 py-4 text-slate-700">
                  Carry-on access is included now, but Blue Basic still has stricter change rules.
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-slate-900">
                  <Link href="/airlines/frontier" className="text-blue-700 underline">
                    Frontier
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  Personal-item-first. A full-size carry-on becomes a paid decision.
                </td>
                <td className="px-4 py-4 text-slate-700">
                  A larger cabin bag is part of the paid add-on decision, so price it before
                  assuming the base fare wins.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Related references: <Link href="/fees/carry_on" className="underline">carry-on fee reference</Link>,{" "}
          <Link href="/guides/carry-on-strictness-by-airline" className="underline">
            carry-on strictness by airline
          </Link>
          , and <Link href="/sizer-rules" className="underline">sizer enforcement reality</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">
          Seats and changes can erase the savings
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Seat selection</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Seat pricing matters most when you need control: sitting with someone, avoiding a
              middle seat, or choosing a seat before check-in.
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
              <li>
                <strong>United:</strong> Basic Economy advance seat assignment starts at{" "}
                {usdRangeText(
                  findFee(getFees("united"), "seat_selection", (row) =>
                    safeText(row.applies_to).toLowerCase().includes("basic") &&
                    safeText(row.conditions).toLowerCase().includes("advance seat")
                  )
                )}
                .
              </li>
              <li>
                <strong>Southwest:</strong> current Basic Fare seat treatment is handled through the
                fare rules rather than a simple fee line: a standard seat assignment at check-in for later departures,
                with paid seat upgrades published separately.
              </li>
              <li>
                <strong>American / Delta / JetBlue:</strong> the better comparison is often not the
                lowest seat fee. It is whether the cheapest fare is forcing you to pay for seat
                control that the next fare would have made easier.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Change and cancellation</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              This is where a cheap fare can become expensive later.
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
              <li>
                <strong>United:</strong> Basic Economy changes and cancellations are listed as not
                permitted after 24 hours.
              </li>
              <li>
                <strong>Delta:</strong> Basic Economy is published at{" "}
                {formatAmount(
                  findFee(
                    getFees("delta"),
                    "change_cancellation",
                    (row) =>
                      safeText(row.applies_to).toLowerCase().includes("basic") &&
                      safeText(row.region_or_route).includes("US/Canada/Mexico/Caribbean/Central America")
                  )?.amount,
                  findFee(
                    getFees("delta"),
                    "change_cancellation",
                    (row) =>
                      safeText(row.applies_to).toLowerCase().includes("basic") &&
                      safeText(row.region_or_route).includes("US/Canada/Mexico/Caribbean/Central America")
                  )?.currency
                )}{" "}
                on shorter-haul regional groups and{" "}
                {formatAmount(
                  findFee(
                    getFees("delta"),
                    "change_cancellation",
                    (row) =>
                      safeText(row.applies_to).toLowerCase().includes("basic") &&
                      safeText(row.region_or_route).includes("South America/Europe/UK/Africa/Middle East/India/Asia/Pacific")
                  )?.amount,
                  findFee(
                    getFees("delta"),
                    "change_cancellation",
                    (row) =>
                      safeText(row.applies_to).toLowerCase().includes("basic") &&
                      safeText(row.region_or_route).includes("South America/Europe/UK/Africa/Middle East/India/Asia/Pacific")
                  )?.currency
                )}{" "}
                on long-haul regional groups.
              </li>
              <li>
                <strong>JetBlue:</strong> Blue Basic cancellations are published at USD 100 on most
                routes and USD 200 on transatlantic itineraries; changes are not allowed.
              </li>
              <li>
                <strong>Frontier:</strong> Basic is the restrictive product. Economy, Premium, and
                Business bundles remove change/cancel fees, though fare differences can still apply.
              </li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Related references:{" "}
              <Link href="/fees/change_cancellation" className="underline">
                change and cancellation fee reference
              </Link>
              ,{" "}
              <Link href="/passenger-rights/us-dot-refund" className="underline">
                U.S. DOT refund rules reference
              </Link>
              , and{" "}
              <Link href="/passenger-rights/eu261" className="underline">
                EU261 passenger rights reference
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">International trips need a separate check</h2>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li>
              <strong>American:</strong> the transatlantic example shown here starts at USD 75 for
              the first checked bag on Economy (non-Basic), while domestic and short-haul Basic
              Economy tickets can price differently by ticketing date.
            </li>
            <li>
              <strong>Delta:</strong> the Basic Economy change/cancel penalty shown here is split
              between shorter-haul regional groups and long-haul regional groups, so the route can
              matter as much as the fare name.
            </li>
            <li>
              <strong>JetBlue:</strong> Blue Basic uses a different published cancellation number on
              transatlantic itineraries than on most other routes.
            </li>
            <li>
              <strong>United:</strong> current checked-bag rows are published for “most markets,” so
              the airport-versus-prepaid bag penalty remains relevant even when the fare comparison
              is not purely domestic.
            </li>
          </ul>
        </div>
      </section>

      <CheckedBagCardMathCallout />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Related references</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/fees/checked_baggage" className="underline">
                Checked baggage reference
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Check this when the cheapest fare only works until the first checked bag enters the trip.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/fees/seat_selection" className="underline">
                Seat selection fee reference
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Check this when seat choice could add enough cost to change the fare comparison.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/tools/checked-baggage-calculator" className="underline">
                Checked baggage cost calculator
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Price checked bags before deciding whether a fare upgrade or card benefit makes sense.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/sizer-rules" className="underline">
                Sizer enforcement reality
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Check this when the Basic-versus-regular fare decision depends on whether your cabin
              bag will actually fit.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-8">
        <h2 className="text-xl font-bold text-slate-900">Primary sources used for this guide</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
          <li>
            <a href={SOURCES.unitedBasic} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              United Basic Economy
            </a>
          </li>
          <li>
            <a href={SOURCES.americanBasic} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              American Basic Economy
            </a>
          </li>
          <li>
            <a href={SOURCES.deltaFees} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Delta baggage and change/cancel overview
            </a>
          </li>
          <li>
            <a href={SOURCES.airCanadaBags} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Air Canada checked baggage
            </a>
          </li>
          <li>
            <a href={SOURCES.airCanadaSeats} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Air Canada advance seat selection
            </a>
          </li>
          <li>
            <a href={SOURCES.jetblueBasic} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              JetBlue Blue Basic update
            </a>
          </li>
          <li>
            <a href={SOURCES.alaskaChanges} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Alaska 24-hour cancellation and fare-type rules
            </a>
          </li>
          <li>
            <a href={SOURCES.southwestFares} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Southwest fare information
            </a>
          </li>
          <li>
            <a href={SOURCES.frontierBundles} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Frontier bundle comparison
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
