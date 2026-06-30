import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAirlineBySlug } from "@/lib/data";
import type { FeeItem } from "@/lib/types";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";

export const metadata: Metadata = {
  title: "Basic Economy traps by airline: carry-on, seats, changes (2026) | Airline Fees Reference",
  description:
    "A neutral operational comparison of Basic Economy and stripped-down entry fares: carry-on access, seat limits, change rules, and the airline-by-airline differences that usually change the real trip price.",
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
  if (!row) return "Not published in current dataset";
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
      model: "Classic Basic Economy with direct carry-on restriction",
      carryOn: "Basic Economy is generally personal-item only under United's published Basic Economy rule.",
      seats: `${usdRangeText(unitedBasicSeat)} for advance seat assignment; preferred seating starts at ${formatAmount(unitedPreferredBasic?.amount, unitedPreferredBasic?.currency)}.`,
      changes: "Changes and cancellations are listed as not permitted after 24 hours on Basic Economy.",
      whereItBreaks:
        "A short trip can stop being cheap immediately because the carry-on restriction can force checked-bag pricing.",
      sourceLabel: "United Basic Economy",
      sourceHref: SOURCES.unitedBasic,
    },
    {
      slug: "american",
      airline: "American",
      model: "Legacy Basic Economy with full carry-on access",
      carryOn: "One carry-on bag and one personal item remain allowed on Basic Economy.",
      seats: "Current dataset publishes variable seat products rather than a separate Basic Economy seat row.",
      changes:
        "Current dataset does not publish a separate Basic Economy change row, so the operational risk is more about bags, seats, and fare-family limits than a single posted fee line here.",
      whereItBreaks:
        "American usually stops looking cheap when route-specific bag pricing or paid seat selection gets layered onto a fare that still looked manageable in search.",
      sourceLabel: "American Basic Economy",
      sourceHref: SOURCES.americanBasic,
    },
    {
      slug: "delta",
      airline: "Delta",
      model: "Legacy Basic Economy with carry-on access but harsher flexibility rules",
      carryOn: "One carry-on bag and one personal item remain allowed.",
      seats: "The current dataset publishes preferred-seat pricing separately, but the main Basic difference here is not cabin access.",
      changes: `Basic Economy is listed at ${formatAmount(deltaBasicChangeShort?.amount, deltaBasicChangeShort?.currency)} on short-haul regional groups and ${formatAmount(deltaBasicChangeLong?.amount, deltaBasicChangeLong?.currency)} on long-haul regional groups.`,
      whereItBreaks:
        "Delta Basic usually stops being cheap when the trip is uncertain, because the bag baseline looks normal but the change/cancel penalty does not.",
      sourceLabel: "Delta baggage and change rules",
      sourceHref: SOURCES.deltaFees,
    },
    {
      slug: "jetblue",
      airline: "JetBlue",
      model: "Blue Basic: entry fare with carry-on restored but flexibility stripped back",
      carryOn: "Blue Basic includes one carry-on bag and one personal item under the current published update.",
      seats: "Standard-seat inclusion is published for Blue, Blue Plus, and Blue Extra; current dataset does not publish a separate Blue Basic standard-seat line.",
      changes:
        jetblueBasicChange
          ? `${safeText(jetblueBasicChange.conditions)}.`
          : "Blue Basic is the fare family with the published change/cancel penalty in the current dataset.",
      whereItBreaks:
        "JetBlue's cheap fare usually stops being cheap when the traveler assumed carry-on access solved the problem and missed the stricter cancellation rule.",
      sourceLabel: "JetBlue Blue Basic update",
      sourceHref: SOURCES.jetblueBasic,
    },
    {
      slug: "alaska",
      airline: "Alaska",
      model: "Saver-style entry fare rather than classic Basic Economy",
      carryOn: "Saver still includes one carry-on bag and one personal item in the current dataset.",
      seats: "Standard seat selection is published at USD 0 in Main Cabin, with preferred seats separately variable.",
      changes:
        alaskaChange
          ? `${safeText(alaskaChange.conditions)}.`
          : "Saver is the most restrictive fare family after the 24-hour window.",
      whereItBreaks:
        "Alaska usually stays clearer than classic Basic Economy products, so the real risk is assuming the lowest fare is fully flexible after the 24-hour window.",
      sourceLabel: "Alaska fare changes",
      sourceHref: SOURCES.alaskaChanges,
    },
    {
      slug: "southwest",
      airline: "Southwest",
      model: "Basic Fare in a newly segmented Southwest product",
      carryOn: "Carry-on and personal item access remain included.",
      seats:
        southwestBasicSeat
          ? `${safeText(southwestBasicSeat.conditions)}.`
          : "Seat treatment changes by fare family rather than through a classic Basic Economy seat fee.",
      changes: "Current dataset publishes no cancellation fee across fares, with same-day rules varying by fare family.",
      whereItBreaks:
        southwestBasicBag
          ? `Southwest's low fare now breaks more through checked-bag and seat certainty math than through carry-on access; the current Basic Fare first checked bag row is ${formatAmount(southwestBasicBag.amount, southwestBasicBag.currency)} one-way on later bookings.`
          : "Southwest's low fare now breaks more through checked-bag and seat certainty math than through carry-on access.",
      sourceLabel: "Southwest fare information",
      sourceHref: SOURCES.southwestFares,
    },
    {
      slug: "spirit",
      airline: "Spirit",
      model: "Stripped-fare ULCC model rather than classic Basic Economy",
      carryOn:
        spiritValueCarryOn
          ? `${safeText(spiritValueCarryOn.conditions)}.`
          : "The cheap Spirit path is personal-item-first, not full cabin-bag access by default.",
      seats: "The real Spirit pressure point is cabin access and bundle design, not a classic Basic-versus-Main-Cabin seat ladder.",
      changes:
        spiritValueChange
          ? `${safeText(spiritValueChange.conditions)}.`
          : "Value is the fee-based product in the current dataset.",
      whereItBreaks:
        "Spirit stops being cheap when the trip needs a carry-on, a checked bag, or flexibility after booking. That is the stripped-fare version of the Basic Economy trap.",
      sourceLabel: "Spirit travel options",
      sourceHref: SOURCES.spiritOptions,
    },
    {
      slug: "frontier",
      airline: "Frontier",
      model: "Stripped-fare ULCC model with timed change-fee ladder",
      carryOn:
        frontierCarryOn
          ? `${safeText(frontierCarryOn.conditions)}.`
          : "Carry-on access is a paid decision path rather than a standard entitlement.",
      seats: "Frontier's seat story matters, but the fee engine is more directly tied to bags, bundles, and late fixes than to a classic Basic seat restriction.",
      changes:
        frontierLateChange
          ? `${safeText(frontierLateChange.conditions)}.`
          : "Basic Fare / Standard is the more restrictive product path in the current dataset.",
      whereItBreaks:
        "Frontier's cheap fare usually breaks when the traveler buys back normal behavior late: cabin bag, checked bag, or a change close to departure.",
      sourceLabel: "Frontier change policy",
      sourceHref: SOURCES.frontierChanges,
    },
  ];
}

const SCOPE_CARDS: ScopeCard[] = [
  {
    title: "Carry-on access",
    body:
      "Some airlines still allow a full carry-on on their cheapest fare. Others make the cabin-bag rule the trap itself. That is the fastest way a low fare turns into checked-bag math.",
  },
  {
    title: "Seat limitations",
    body:
      "Seat restrictions matter less as an isolated fee than as a signal that the airline is selling normal travel behavior back to you after checkout.",
  },
  {
    title: "Change and cancellation limits",
    body:
      "The biggest operational difference is often flexibility. A fare can look manageable until the trip moves and the cheap path becomes the most expensive path.",
  },
  {
    title: "Route and long-haul differences",
    body:
      "Long-haul and international itineraries are where Basic-style products diverge most. Bag pricing, cancellation rules, and route carve-outs become more important there than on a short domestic comparison.",
  },
];

const CLASS_MODEL_CARDS: ScopeCard[] = [
  {
    title: "Classic Basic Economy",
    body:
      "United is the clearest example in this repo: the entry fare changes cabin access directly and then layers seat and flexibility restrictions on top.",
  },
  {
    title: "Legacy Basic with full carry-on",
    body:
      "American, Delta, and JetBlue still allow a normal carry-on path, so the trap shifts toward seats, route-specific baggage, and change/cancel rules rather than the overhead bin itself.",
  },
  {
    title: "Entry fare without classic Basic branding",
    body:
      "Alaska Saver and Southwest Basic Fare are still relevant here because they change the normal trip calculation even without copying United's personal-item-only model.",
  },
  {
    title: "ULCC stripped-fare model",
    body:
      "Spirit and Frontier are not Basic Economy in the legacy-carrier sense. They are the same comparison problem pushed further: the base fare excludes more normal travel behavior from the start.",
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
                Basic Economy is not one product. The high-value comparison is not just{" "}
                <em>cheap fare versus regular fare</em>. It is which part of normal travel the
                airline removes first: full carry-on access, seat choice, flexibility, or a
                combination of all three.
              </p>
              <p>
                In this repo, United is the clearest example of a Basic Economy fare that can force
                checked-bag math. American, Delta, and JetBlue keep normal carry-on access but use
                other restrictions to change the trip economics. Spirit and Frontier are the same
                decision problem pushed further through stripped fares and paid cabin access.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
              <div className="font-bold text-slate-900">Use this page when the question is:</div>
              <ul className="mt-3 space-y-2">
                <li>Does the cheapest fare still work for a normal carry-on trip?</li>
                <li>Will seat or change limits erase the fare gap later?</li>
                <li>Is this airline using Basic branding or a stripped-fare model?</li>
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
            Basic Economy only works when the fare still survives check-in, baggage drop, and the
            gate. The cheapest search result is not always the cheapest airport outcome.
          </figcaption>
        </figure>
      </header>

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
          This guide treats Basic Economy as a comparison problem, not just a brand label. That
          matters because the carry-on rule, seat rule, and change rule are distributed very
          differently across airlines.
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
          Carry-on access is still the fastest way a cheap fare breaks
        </h2>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          The single biggest operational split is whether the cheapest fare still allows a normal
          carry-on. When it does not, the fare comparison changes before seat fees or boarding
          friction even enter the picture.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Airline</th>
                <th className="px-4 py-3 font-semibold">Cheapest-fare carry-on path</th>
                <th className="px-4 py-3 font-semibold">What usually happens next</th>
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
                  This is the cleanest example of a fare that can turn a short trip into checked-bag
                  math immediately. See also the{" "}
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
                  The carry-on issue is less severe, so the trap shifts toward route-specific bag
                  pricing and paid seating.
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
                  The bag baseline stays normal; the main pressure point is flexibility when the trip changes.
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
                  The comparison still matters because carry-on access was restored, but changes are
                  still not allowed on Blue Basic.
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
                  This is the ULCC version of the Basic Economy problem: the cabin-bag path is part
                  of the business model, not a side detail.
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
          Seat limits and change rules are where the fare gap gets rebuilt
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Seat selection</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Seat pricing matters most when it is not really selling extra comfort. It is selling
              back normal trip control after the cheapest fare removed it.
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
                <strong>Southwest:</strong> current Basic Fare seat treatment is operational rather
                than a classic fee line: a standard seat assignment at check-in for later departures,
                with paid seat upgrades published separately.
              </li>
              <li>
                <strong>American / Delta / JetBlue:</strong> the better comparison is often not the
                lowest seat fee. It is whether the fare family is already forcing a seat decision
                that the next fare would have simplified.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Change and cancellation</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              This is where “looks cheap in search” most often fails in practice.
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
                <strong>Spirit / Frontier:</strong> the stripped fare is the restrictive product.
                The difference is not the branding. It is how much normal flexibility you have to
                buy back later.
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
        <h2 className="text-2xl font-bold text-slate-900">International differences matter more than they look</h2>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li>
              <strong>American:</strong> the current dataset&apos;s transatlantic example starts at USD
              75 for the first checked bag on Economy (non-Basic), with published exceptions for
              Basic Economy and certain fare products.
            </li>
            <li>
              <strong>Delta:</strong> the Basic Economy change/cancel penalty in the current dataset
              is explicitly split between shorter-haul regional groups and long-haul regional
              groups, which is a bigger practical difference than the simple “Basic vs Main Cabin”
              label suggests.
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
        <h2 className="text-2xl font-bold text-slate-900">Airline-by-airline operational comparison</h2>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          This table is the reference core of the guide. It is not a brand ranking. It is a summary
          of where the cheapest fare most often stops being cheap.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Airline</th>
                <th className="px-4 py-3 font-semibold">Model</th>
                <th className="px-4 py-3 font-semibold">Carry-on path</th>
                <th className="px-4 py-3 font-semibold">Seat treatment</th>
                <th className="px-4 py-3 font-semibold">Change / cancel baseline</th>
                <th className="px-4 py-3 font-semibold">Where it usually breaks</th>
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
              Use this when the fare is selling back normal trip control through seat pricing.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/tools/checked-baggage-calculator" className="underline">
                Checked baggage cost calculator
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Use this to price the bag penalty before deciding whether a fare upgrade or card benefit is rational.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">
              <Link href="/sizer-rules" className="underline">
                Sizer enforcement reality
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Use this when the real Basic-versus-regular comparison hinges on whether the cabin bag will actually survive the trip.
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
