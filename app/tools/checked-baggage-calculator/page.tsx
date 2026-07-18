import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import {
  calcCardBagOffset,
  calcCheckedBagTripCost,
  clampInt,
  explainVariableCheckedBagPricing,
  firstString,
  safeExternalUrl,
  usd,
  type AirlineOverrides,
  type CardsJson,
} from "@/lib/bag-cost-calculator";
import { JsonLd } from "@/components/JsonLd";
import { canonical } from "@/lib/seo";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Checked Baggage Cost Calculator and Free Bag Card Check | Airline Fees Reference",
  description:
    "Estimate checked baggage fees from published airline fee details, then check whether an eligible airline credit card with a free checked bag benefit could offset the cost.",
};

async function readJsonFile<T>(relPathFromRepoRoot: string): Promise<T> {
  const full = path.join(process.cwd(), relPathFromRepoRoot);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
}

function AirlineSelect({ value }: { value: string }) {
  const slugs = getAirlineSlugs();
  return (
    <select
      name="airline"
      defaultValue={value}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
    >
      {slugs.map((slug) => {
        const airline = getAirlineBySlug(slug);
        return (
          <option key={slug} value={slug}>
            {airline?.name ?? slug}
          </option>
        );
      })}
    </select>
  );
}

function missingBagLabel(ordinals: number[]): string {
  return ordinals.map((n) => (n === 1 ? "first" : n === 2 ? "second" : `${n}rd`)).join(", ");
}

type RoutePreset = {
  label: string;
  body: string;
  travelers: number;
  bags: number;
  trips: number;
};

const ROUTE_PRESETS_BY_AIRLINE: Record<string, RoutePreset[]> = {
  zipair: [
    {
      label: "Los Angeles (LAX) to Tokyo (NRT)",
      body: "Long-haul ZIPAIR setup where checked baggage is usually a separate route-priced decision.",
      travelers: 1,
      bags: 1,
      trips: 1,
    },
    {
      label: "San Francisco (SFO) to Tokyo (NRT)",
      body: "Useful when comparing a low base fare against a trip that needs one checked bag.",
      travelers: 1,
      bags: 1,
      trips: 1,
    },
    {
      label: "Honolulu (HNL) to Tokyo (NRT)",
      body: "Good for testing a leisure trip where baggage, seats, and add-ons can change the final total.",
      travelers: 2,
      bags: 1,
      trips: 1,
    },
    {
      label: "Tokyo (NRT) to Seoul (ICN)",
      body: "Shorter ZIPAIR route context where the cabin weight limit may matter more than checked-bag math.",
      travelers: 1,
      bags: 0,
      trips: 1,
    },
    {
      label: "Tokyo (NRT) to Bangkok (BKK)",
      body: "International route context for checking whether a paid weight allowance is needed before checkout.",
      travelers: 1,
      bags: 1,
      trips: 1,
    },
    {
      label: "Tokyo (NRT) to Singapore (SIN)",
      body: "Use this when the fare looks cheap but checked baggage or seat choice may be part of the real price.",
      travelers: 1,
      bags: 1,
      trips: 1,
    },
  ],
};

function scenarioHref(
  airlineSlug: string,
  travelers: number,
  bags: number,
  trips: number,
  route?: string
): string {
  const params = new URLSearchParams({
    airline: airlineSlug,
    travelers: String(travelers),
    bags: String(bags),
    directions: "2",
    trips: String(trips),
    pay: "yes",
  });

  if (route) params.set("route", route);

  return `/tools/checked-baggage-calculator?${params.toString()}`;
}

function cleanRouteLabel(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  return value.slice(0, 90);
}

function plural(n: number, singular: string, pluralLabel = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralLabel}`;
}

const CHECKED_BAG_FAQS = [
  {
    question: "How does the checked baggage calculator estimate cost?",
    answer:
      "It multiplies the selected airline's usable published checked-bag fee by travelers, bags, flight directions, and annual roundtrips. If a bag price depends on route, fare, or booking timing, the tool explains the lookup instead of inventing a number.",
  },
  {
    question: "Why does the calculator sometimes refuse to quote a checked bag total?",
    answer:
      "Some airlines publish checked-bag prices by route, fare family, domestic versus international market, or booking channel. When the current data does not contain a usable fixed fee for the requested bag position, the tool asks for an airline-specific lookup.",
  },
  {
    question: "Can an airline credit card reduce the checked bag total?",
    answer:
      "Some airline cards publish a first checked bag waiver for the cardholder and eligible companions. The card comparison only counts modeled bag savings and excludes points, bonuses, lounge access, and unrelated perks.",
  },
];

function checkedBagCalculatorJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
          { "@type": "ListItem", position: 2, name: "Checked baggage cost calculator", item: canonical("/tools/checked-baggage-calculator") },
        ],
      },
      {
        "@type": "WebApplication",
        "@id": canonical("/tools/checked-baggage-calculator"),
        name: "Checked baggage cost calculator",
        url: canonical("/tools/checked-baggage-calculator"),
        applicationCategory: "TravelApplication",
        operatingSystem: "Any",
        description:
          "Estimate checked baggage fees from published airline fee details and test whether a free checked bag card benefit could offset the cost.",
      },
      {
        "@type": "FAQPage",
        mainEntity: CHECKED_BAG_FAQS.map((faq) => ({
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

export default async function CheckedBaggageCalculatorPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const airlineSlug = firstString(sp.airline) || "alaska";
  const airline = getAirlineBySlug(airlineSlug);
  if (!airline) notFound();

  const travelers = clampInt(firstString(sp.travelers), 1, 9, 2);
  const bags = clampInt(firstString(sp.bags), 0, 3, 1);
  const directions = clampInt(firstString(sp.directions), 1, 2, 2);
  const roundtrips = clampInt(firstString(sp.trips), 1, 30, 1);
  const payWithCard = (firstString(sp.pay) ?? "yes") !== "no";
  const routeLabel = cleanRouteLabel(firstString(sp.route));
  const routePresets = ROUTE_PRESETS_BY_AIRLINE[airlineSlug] ?? [];

  const trip = calcCheckedBagTripCost({
    fees: airline.fees,
    travelers,
    bagsPerTravelerPerDirection: bags,
    directions,
  });
  const variablePricing = explainVariableCheckedBagPricing(airline.fees);

  const cardsJson = await readJsonFile<CardsJson>("data/cards/cards.json");
  const overridesJson = await readJsonFile<AirlineOverrides>("data/cards/airline_overrides.json");
  const airlineOverrides = overridesJson[airlineSlug];
  const cards = cardsJson.cards.filter((card) => card.airline_slug === airlineSlug);
  const cardResults = cards
    .map((card) => ({
      card,
      result: calcCardBagOffset({
        feeByBagOrdinal: trip.feeByBagOrdinal,
        directions,
        roundtripsPerYear: roundtrips,
        travelers,
        bagsPerTravelerPerDirection: bags,
        card,
        userWillPayWithCard: payWithCard,
        airlineOverrides,
      }),
    }))
    .sort((a, b) => b.result.annualSavingsUsd - a.result.annualSavingsUsd || a.card.annual_fee_usd - b.card.annual_fee_usd);

  const best = cardResults.find((item) => item.result.eligible && item.result.annualSavingsUsd > 0);
  const annualBagCost = trip.canEstimate ? trip.tripCostUsd * roundtrips : null;
  const totalBagsPerTrip = travelers * bags * directions;
  const annualCheckedBags = totalBagsPerTrip * roundtrips;
  const bestAnnualSavings = best?.result.annualSavingsUsd ?? 0;
  const remainingAnnualBagCost =
    annualBagCost != null && best ? Math.max(0, annualBagCost - bestAnnualSavings) : null;
  const cardBridgeLabel =
    best && best.result.netAnnualUsd >= 0
      ? "Card comparison is worth your time"
      : best
        ? "Card benefit helps, but does not fully justify the annual fee"
        : "Card calculator has no positive match for this setup";
  const cardHref = `/best-cards?airline=${encodeURIComponent(airlineSlug)}&travelers=${travelers}&bags=${bags}&trips=${roundtrips}&pay=${payWithCard ? "yes" : "no"}`;

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10">
      <JsonLd data={checkedBagCalculatorJsonLd()} />
      <header className="grid gap-3">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Baggage cost tool
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Checked baggage cost calculator</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
          Estimate the checked-bag bill before booking, then see whether a free checked bag card
          could offset it. The calculator uses published airline fee details and leaves the total
          unquoted when the price depends on route, fare, or booking timing.
        </p>
      </header>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-600">Common scenarios</div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={scenarioHref(airlineSlug, 1, 1, 1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700 hover:border-blue-300"
          >
            Solo traveler, one bag
          </Link>
          <Link
            href={scenarioHref(airlineSlug, 2, 1, 2)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700 hover:border-blue-300"
          >
            Couple, two trips a year
          </Link>
          <Link
            href={scenarioHref(airlineSlug, 4, 1, 1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700 hover:border-blue-300"
          >
            Family of four
          </Link>
          <Link
            href={scenarioHref(airlineSlug, 2, 2, 2)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700 hover:border-blue-300"
          >
            Two bags each
          </Link>
        </div>
      </section>

      {routePresets.length > 0 ? (
        <section className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Popular route presets
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-slate-950">
              Start with a ZIPAIR route context, then verify the baggage quote at checkout.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
              These presets do not assign route-specific bag prices. They set the airline, party size, and bag pattern so you can see whether the calculator can quote a total or whether ZIPAIR&apos;s route-and-timing lookup is still required.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {routePresets.map((preset) => (
              <Link
                key={preset.label}
                href={scenarioHref(airlineSlug, preset.travelers, preset.bags, preset.trips, preset.label)}
                className="rounded-xl border border-blue-100 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="text-sm font-extrabold text-blue-800 underline">{preset.label}</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{preset.body}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <form method="get" className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Airline</label>
            <AirlineSelect value={airlineSlug} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Trip type</label>
            <select
              name="directions"
              defaultValue={String(directions)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="2">Roundtrip</option>
              <option value="1">One-way</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Travelers</label>
            <input
              name="travelers"
              defaultValue={String(travelers)}
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Bags / traveler</label>
            <select
              name="bags"
              defaultValue={String(bags)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Roundtrips / year</label>
            <input
              name="trips"
              defaultValue={String(roundtrips)}
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Pay with card?</label>
            <select
              name="pay"
              defaultValue={payWithCard ? "yes" : "no"}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 md:w-fit"
        >
          Estimate baggage cost
        </button>
      </form>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-600">Answer first</div>
        {routeLabel ? (
          <div className="w-fit rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-900">
            Route context: {routeLabel}
          </div>
        ) : null}
        {trip.canEstimate ? (
          <>
            <h2 className="text-3xl font-extrabold text-slate-950">
              You will probably pay about {usd(trip.tripCostUsd)} in checked baggage fees for this trip.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
              Annualized across {roundtrips} roundtrip{roundtrips === 1 ? "" : "s"}, that is about{" "}
              <span className="font-bold">{annualBagCost != null ? usd(annualBagCost) : "-"}</span> in
              estimated checked-bag fees before elite status, fare bundles, included allowances, or
              route-specific exceptions.
            </p>
            {routeLabel ? (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                The route label helps you frame the decision, but this calculator only quotes a total when the stored fee data has a usable fixed amount for the selected airline and bag position.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-slate-950">
              This airline needs a route- or fare-specific baggage lookup before the tool can quote a total.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
              The missing piece is the {missingBagLabel(trip.missingBagOrdinals)} checked-bag amount.
              For {airline.name}, the published rows point to{" "}
              <span className="font-semibold">{variablePricing.reasons.join(", ")}</span> as the likely
              drivers of the final baggage price.
            </p>
            {routeLabel ? (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                For {routeLabel}, use ZIPAIR&apos;s checkout or manage-booking baggage screen to price the checked-bag weight allowance before assuming the base fare is cheaper.
              </p>
            ) : null}
          </>
        )}
        <p className="text-sm leading-relaxed text-slate-600">{trip.explanation}</p>

        {trip.canEstimate ? (
          <div className="grid gap-3 pt-2 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Trip exposure</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">{usd(trip.tripCostUsd)}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                For {plural(totalBagsPerTrip, "checked bag")} across this {directions === 2 ? "roundtrip" : "one-way"}.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Annual exposure</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">
                {annualBagCost != null ? usd(annualBagCost) : "-"}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                For {plural(annualCheckedBags, "checked bag")} across {plural(roundtrips, "roundtrip")}.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Best card offset</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">
                {best ? usd(bestAnnualSavings) : "$0"}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {best
                  ? "Estimated annual checked-bag savings before subtracting the card annual fee."
                  : "No eligible checked-bag card benefit matched these inputs."}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {!trip.canEstimate ? (
        <section className="grid gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-800">
            What to check before you pay
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">
            Do the lookup at checkout before treating the fare as cheaper.
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
            A variable checked-bag row is not useless, but it is not a price quote. Use the airline
            checkout flow or baggage calculator to confirm:
          </p>
          <ul className="grid gap-2 text-sm leading-relaxed text-slate-700 md:grid-cols-2">
            {variablePricing.lookupFields.map((field) => (
              <li key={field} className="rounded-xl border border-amber-200 bg-white px-4 py-3">
                {field}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="font-bold text-blue-800 underline">
              Review {airline.name} fee page
            </Link>
            <Link href="/fees/checked_baggage" className="font-bold text-blue-800 underline">
              Compare checked-bag rules
            </Link>
          </div>
        </section>
      ) : null}

      {trip.canEstimate ? (
        <section className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Card savings bridge
          </div>
          {best ? (
            <>
              <h2 className="text-2xl font-extrabold text-slate-950">
                {cardBridgeLabel}: about {usd(best.result.annualSavingsUsd)} in annual bag savings.
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                Best bag-fee match: <span className="font-bold">{best.card.name}</span>. After its annual
                fee, the bag-only value is{" "}
                <span className={best.result.netAnnualUsd >= 0 ? "font-bold text-emerald-800" : "font-bold text-rose-700"}>
                  {best.result.netAnnualUsd >= 0 ? "+" : "-"}
                  {usd(Math.abs(best.result.netAnnualUsd))}
                </span>
                . This excludes points, sign-up bonuses, lounge access, and unrelated perks.
              </p>
              {remainingAnnualBagCost != null ? (
                <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                  With this input, the modeled cash bag bill is {annualBagCost != null ? usd(annualBagCost) : "-"} per
                  year. The card benefit would leave about{" "}
                  <span className="font-bold">{usd(remainingAnnualBagCost)}</span> in annual checked-bag fees
                  before considering the card&apos;s annual fee.
                </p>
              ) : null}
              {best.result.breakEvenRoundtrips != null ? (
                <p className="text-sm leading-relaxed text-slate-700">
                  Break-even point:{" "}
                  <span className="font-bold">{plural(best.result.breakEvenRoundtrips, "roundtrip")}</span> per year
                  on checked-bag savings alone.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={cardHref} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700">
                  Compare eligible cards
                </Link>
                {safeExternalUrl(best.card.offer_url) ? (
                  <a
                    href={safeExternalUrl(best.card.offer_url) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-emerald-300 bg-white px-4 py-2 font-bold text-emerald-900 hover:bg-emerald-100"
                  >
                    {best.card.offer_label || "Check issuer terms"}
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-slate-950">
                No card in this calculator offsets checked-bag fees for these inputs.
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                That can happen when this airline has no eligible card in the calculator, when the benefit requires
                card payment and you selected no, or when the card benefit does not cover the requested bag pattern.
                The next best move is to reduce the cash bag bill directly: compare a bag-inclusive fare, check status
                or military exceptions, or reduce the number of checked bags.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={cardHref} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700">
                  Open card calculator
                </Link>
                <Link href="/guides/airline-credit-card-baggage-benefits" className="rounded-xl border border-emerald-300 bg-white px-4 py-2 font-bold text-emerald-900 hover:bg-emerald-100">
                  Check benefit rules
                </Link>
              </div>
            </>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Fees used for this estimate</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="pb-3 text-left text-xs leading-relaxed text-slate-500">
              Checked-bag fee inputs used by this calculator for the selected airline and bag count.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th scope="col" className="py-2 pr-4">Bag</th>
                <th scope="col" className="py-2 pr-4">Estimated fee</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(1, bags) }, (_, index) => index + 1).map((ordinal) => (
                <tr key={ordinal} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {ordinal === 1 ? "First" : ordinal === 2 ? "Second" : "Third"} checked bag
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {trip.feeByBagOrdinal.has(ordinal) ? usd(trip.feeByBagOrdinal.get(ordinal) ?? 0) : "Needs route lookup"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          The calculator prefers current, broad-market USD fees and avoids special-case prices such
          as intra-island or long-haul routes when broader domestic or North America pricing exists.
        </p>
      </section>

      <section className="grid gap-3 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-bold text-slate-950">Related guides</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="text-blue-700 underline">
            {airline.name} fees
          </Link>
          <Link href="/fees/checked_baggage" className="text-blue-700 underline">
            Checked baggage guide
          </Link>
          <Link href={cardHref} className="text-blue-700 underline">
            Free checked bag card calculator
          </Link>
          <Link href="/guides/airline-credit-card-baggage-benefits" className="text-blue-700 underline">
            Card baggage benefit rules
          </Link>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Checked baggage calculator FAQ</h2>
        <div className="grid gap-3">
          {CHECKED_BAG_FAQS.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-bold text-slate-900">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
