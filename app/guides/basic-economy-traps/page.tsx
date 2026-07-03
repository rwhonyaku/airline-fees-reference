import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAirlineBySlug } from "@/lib/data";
import type { FeeItem } from "@/lib/types";
import { BasicEconomyDecisionTool } from "@/components/BasicEconomyDecisionTool";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";

export const metadata: Metadata = {
  title: "Basic Economy traps by airline: carry-on, seats, changes (2026) | Airline Fees Reference",
  description:
    "Compare Basic Economy and low-cost entry fares by carry-on access, checked bags, seat limits, and change rules before the cheap fare gets expensive.",
};

const LAST_VERIFIED = "2026-05-23";

const SOURCES = {
  unitedBasic: "https://www.united.com/en/us/fly/travel/inflight/basic-economy.html",
  unitedCarryOn: "https://www.united.com/en/us/fly/baggage/carry-on-bags.html",
  americanBasic: "https://www.aa.com/i18n/travel-info/experience/seats/basic-economy.jsp",
  deltaCarryOn: "https://www.delta.com/us/en/baggage/carry-on-baggage",
  deltaFees: "https://www.delta.com/us/en/baggage/overview#changecancelfees",
  jetblueBasic:
    "https://news.jetblue.com/latest-news/press-release-details/2024/JetBlue-Gives-Blue-Basic-a-Boost-with-Complimentary-Carry-On-Bag-Starting-September-6/default.aspx",
  alaskaChanges: "https://www.alaskaair.com/content/travel-info/fly-alaska/24-hour-cancellation",
  southwestFares: "https://www.southwest.com/fare-information/",
  southwestFees: "https://www.southwest.com/html/customer-service/travel-fees.html",
  spiritOptions: "https://customersupport.spirit.com/en-US/category/article/KA-01534",
  frontierBags: "https://www.flyfrontier.com/travel/travel-info/bag-options/",
  frontierChanges: "https://www.flyfrontier.com/travel/travel-info/change-policy/?mobile=true",
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

type ScopeCard = {
  title: string;
  body: string;
};

type DecisionCard = {
  title: string;
  verdict: string;
  action: string;
  links: Array<{ href: string; label: string }>;
};

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
  const deltaFees = getFees("delta");
  const jetblueFees = getFees("jetblue");
  const alaskaFees = getFees("alaska");
  const southwestFees = getFees("southwest");
  const spiritFees = getFees("spirit");
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
      safeText(row.region_or_route).includes("US/Canada/Mexico/Caribbean/Central America")
  );
  const deltaBasicChangeLong = findFee(
    deltaFees,
    "change_cancellation",
    (row) =>
      safeText(row.applies_to).toLowerCase().includes("basic") &&
      safeText(row.region_or_route).includes("South America/Europe/UK/Africa/Middle East/India/Asia/Pacific")
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

  const spiritValueCarryOn = findFee(
    spiritFees,
    "carry_on",
    (row) => safeText(row.applies_to).toLowerCase() === "value"
  );
  const spiritValueChange = findFee(
    spiritFees,
    "change_cancellation",
    (row) => safeText(row.applies_to).toLowerCase() === "value"
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
        "This guide does not show a separate Basic Economy change fee for American, so the main things to price are bags, seats, and fare-family limits.",
      whereItBreaks:
        "American Basic Economy usually gets less attractive when route-specific bag prices or paid seats are added.",
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
      changes: "Current dataset publishes no cancellation fee across fares, with same-day rules varying by fare family.",
      whereItBreaks:
        southwestBasicBag
          ? `Southwest Basic is no longer automatically a free-checked-bag fare. The current Basic Fare first checked bag row is ${formatAmount(southwestBasicBag.amount, southwestBasicBag.currency)} one-way on later bookings.`
          : "Southwest Basic is mainly about checked bags and seat choice, not carry-on access.",
      sourceLabel: "Southwest fare information",
      sourceHref: SOURCES.southwestFares,
    },
    {
      slug: "spirit",
      airline: "Spirit",
      model: "Low-cost fare with paid add-ons",
      carryOn:
        spiritValueCarryOn
          ? `${safeText(spiritValueCarryOn.conditions)}.`
          : "The cheap Spirit path is personal-item-first, not full cabin-bag access by default.",
      seats: "For Spirit, the bigger question is usually whether you need to buy bags or a bundle, not just whether a seat costs extra.",
      changes:
        spiritValueChange
          ? `${safeText(spiritValueChange.conditions)}.`
          : "Value is the Spirit fare shown here with more paid add-ons.",
      whereItBreaks:
        "Spirit gets expensive quickly when the trip needs a carry-on, a checked bag, or flexibility after booking.",
      sourceLabel: "Spirit travel options",
      sourceHref: SOURCES.spiritOptions,
    },
    {
      slug: "frontier",
      airline: "Frontier",
      model: "Low-cost fare with paid add-ons",
      carryOn:
        frontierCarryOn
          ? `${safeText(frontierCarryOn.conditions)}.`
          : "Carry-on access is a paid decision path rather than a standard entitlement.",
      seats: "Frontier seats matter, but bags, bundles, and late changes usually drive the bigger cost swing.",
      changes:
        frontierLateChange
          ? `${safeText(frontierLateChange.conditions)}.`
          : "Basic Fare / Standard is the more restrictive Frontier fare shown here.",
      whereItBreaks:
        "Frontier's cheap fare usually gets expensive when you add a cabin bag, checked bag, or change close to departure.",
      sourceLabel: "Frontier change policy",
      sourceHref: SOURCES.frontierChanges,
    },
  ];
}

const SCOPE_CARDS: ScopeCard[] = [
  {
    title: "Carry-on access",
    body:
      "Some airlines still allow a full carry-on on the cheapest fare. Others allow only a small personal item, which can force you to pay for a checked bag or a carry-on add-on.",
  },
  {
    title: "Seat limitations",
    body:
      "Seat fees matter most when you need to sit with someone, avoid a middle seat, or control a tight connection.",
  },
  {
    title: "Change and cancellation limits",
    body:
      "A cheap fare is risky when your dates are not firm. Change and cancellation rules can matter more than the bag policy.",
  },
  {
    title: "Route and long-haul differences",
    body:
      "International trips can use different bag prices, cancellation rules, and route exceptions. Check the exact route before assuming the domestic rule applies.",
  },
];

const CLASS_MODEL_CARDS: ScopeCard[] = [
  {
    title: "Basic Economy with a carry-on limit",
    body:
      "United is the clearest example: the cheapest fare can limit you to a personal item, then add seat and flexibility limits on top.",
  },
  {
    title: "Basic Economy with carry-on included",
    body:
      "American, Delta, and JetBlue still allow a normal carry-on, so the bigger questions are seats, checked bags, and change or cancellation rules.",
  },
  {
    title: "Lowest fare under another name",
    body:
      "Alaska Saver and Southwest Basic Fare are not identical to United Basic Economy, but they can still change what is included.",
  },
  {
    title: "Low-cost fare with paid add-ons",
    body:
      "Spirit and Frontier do not work like legacy-airline Basic Economy. The low fare often assumes you will buy only the add-ons you need.",
  },
];

const DECISION_CARDS: DecisionCard[] = [
  {
    title: "You need a normal carry-on",
    verdict:
      "Be most careful with United Basic Economy, Spirit, and Frontier. American, Delta, JetBlue, Alaska, and Southwest are less likely to fail on carry-on access alone.",
    action:
      "If the cheapest fare restricts the overhead bin, price the checked bag or cabin-bag add-on before treating it as cheaper.",
    links: [
      { href: "/airlines/united", label: "United fee page" },
      { href: "/airlines/spirit", label: "Spirit fee page" },
      { href: "/airlines/frontier", label: "Frontier fee page" },
      { href: "/fees/carry_on", label: "Carry-on reference" },
    ],
  },
  {
    title: "You will check a bag",
    verdict:
      "A fare that saves $30 can lose quickly if it adds a paid first checked bag or pushes you toward airport bag pricing.",
    action:
      "Run the bag-cost calculator before booking, then compare whether a fare upgrade or free checked bag card would cost less.",
    links: [
      { href: "/tools/checked-baggage-calculator?airline=united&travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked-bag calculator" },
      { href: "/best-cards?airline=united&travelers=2&bags=1&trips=2&pay=yes", label: "Card break-even math" },
      { href: "/fees/checked_baggage", label: "Checked baggage reference" },
    ],
  },
  {
    title: "Your plans might change",
    verdict:
      "Delta, United, JetBlue, Spirit, and Frontier can all become expensive when the trip changes. Carry-on access does not solve a restrictive fare.",
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

export default function BasicEconomyTrapsGuide() {
  const rows = buildGuideRows();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="space-y-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Basic Economy traps by airline
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
          <Link href="/methodology" className="font-medium text-blue-700 underline">
            Methodology
          </Link>
        </nav>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                Basic Economy is not one simple thing. Before you book the cheapest fare, check
                what it leaves out: a full carry-on, a checked bag, seat choice, changes, refunds,
                or some mix of all of them.
              </p>
              <p>
                United is the clearest case where Basic Economy can force a bag decision right
                away. American, Delta, and JetBlue usually keep normal carry-on access, but the
                restrictions move to seats, bags, or flexibility. Spirit and Frontier start from a
                lower base fare and charge separately for more of the trip.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
              <div className="font-bold text-slate-900">Use this page when the question is:</div>
              <ul className="mt-3 space-y-2">
                <li>Does the cheapest fare still work for a normal carry-on trip?</li>
                <li>Will seat or change limits erase the fare gap later?</li>
                <li>Is this a legacy-airline Basic fare or a low-cost fare with paid add-ons?</li>
              </ul>
            </div>
          </div>
        </section>

        <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/images/basic-economy-airport-departures.png"
              alt="Airport departures monitor above baggage drop and check-in signs"
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">
            Basic Economy only works when the fare still makes sense after bags, seats, and airport
            rules are included.
          </figcaption>
        </figure>
      </header>

      <BasicEconomyDecisionTool />

      <section id="decision-matrix" className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Decision matrix
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Which Basic Economy trap matters for your trip?
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

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">What Basic Economy usually changes</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SCOPE_CARDS.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">These fares are not all the same product</h2>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          Airlines use similar-looking cheap fares in very different ways. One airline may limit
          your carry-on, another may allow the bag but make changes expensive, and another may push
          more costs into paid add-ons.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CLASS_MODEL_CARDS.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{card.body}</p>
            </div>
          ))}
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
                  <Link href="/airlines/spirit" className="text-blue-700 underline">
                    Spirit
                  </Link>{" "}
                  /{" "}
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
                <strong>Spirit / Frontier:</strong> the low fare is the restrictive product. The
                important question is how much flexibility you would have to buy later.
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

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Airline-by-airline comparison</h2>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          Use this table to see what each airline&apos;s cheapest fare is most likely to leave out.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Airline</th>
                <th className="px-4 py-3 font-semibold">Fare type</th>
                <th className="px-4 py-3 font-semibold">Carry-on path</th>
                <th className="px-4 py-3 font-semibold">Seat treatment</th>
                <th className="px-4 py-3 font-semibold">Change / cancel baseline</th>
                <th className="px-4 py-3 font-semibold">What can make it more expensive</th>
                <th className="px-4 py-3 font-semibold">Related pages</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    <Link href={`/airlines/${row.slug}`} className="text-blue-700 underline">
                      {row.airline}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{row.model}</td>
                  <td className="px-4 py-4 text-slate-700">{row.carryOn}</td>
                  <td className="px-4 py-4 text-slate-700">{row.seats}</td>
                  <td className="px-4 py-4 text-slate-700">{row.changes}</td>
                  <td className="px-4 py-4 text-slate-700">{row.whereItBreaks}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <div className="flex flex-col gap-2">
                      <Link href={`/airlines/${row.slug}`} className="text-blue-700 underline">
                        Fee page
                      </Link>
                      <Link
                        href={`/airlines/${row.slug}/how-to-beat-fees`}
                        className="text-blue-700 underline"
                      >
                        Fee guide
                      </Link>
                      <a
                        href={row.sourceHref}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        {row.sourceLabel}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              Use this after the guide if the cheapest fare is only cheap until the first checked
              bag enters the trip.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/fees/seat_selection" className="underline">
                Seat selection fee reference
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Use this when seat choice could add enough cost to change the fare comparison.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/tools/checked-baggage-calculator" className="underline">
                Checked baggage cost calculator
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Use this to price checked bags before deciding whether a fare upgrade or card benefit makes sense.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/sizer-rules" className="underline">
                Sizer enforcement reality
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Use this when the Basic-versus-regular fare decision depends on whether your cabin
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
            <a href={SOURCES.spiritOptions} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Spirit travel options
            </a>
          </li>
          <li>
            <a href={SOURCES.frontierChanges} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Frontier change policy
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
