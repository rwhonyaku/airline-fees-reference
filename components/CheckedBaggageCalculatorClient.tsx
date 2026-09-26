"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { ToolAirline } from "@/lib/tool-airline";
import { CHECKED_BAG_FAQS } from "@/lib/checked-bag-calculator-content";
import {
  calcCardBagOffset,
  calcCheckedBagTripCost,
  clampInt,
  explainVariableCheckedBagPricing,
  safeExternalUrl,
  usd,
  type AirlineOverrides,
  type Card,
} from "@/lib/bag-cost-calculator";

type CheckedBaggageCalculatorClientProps = {
  airlines: ToolAirline[];
  cards: Card[];
  overrides: AirlineOverrides;
};

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getLocationSearch() {
  return window.location.search;
}

function getServerLocationSearch() {
  return "";
}

function AirlineSelect({ airlines, value }: { airlines: ToolAirline[]; value: string }) {
  return (
    <select
      name="airline"
      defaultValue={value}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
    >
      {airlines.map((airline) => {
        return (
          <option key={airline.slug} value={airline.slug}>
            {airline.name}
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

const FEATURED_CHECKED_BAG_PATHS = [
  {
    href: "/tools/checked-baggage-calculator?airline=united&travelers=2&bags=1&directions=2&trips=1&pay=yes",
    title: "United baggage fee calculator",
    body:
      "Useful when Basic Economy or a regular United fare looks cheap but checked bags may change the trip total.",
  },
  {
    href: "/tools/checked-baggage-calculator?airline=air-france&travelers=1&bags=1&directions=2&trips=1&pay=yes",
    title: "Air France baggage fee lookup",
    body:
      "Air France baggage charges are itinerary-based, so use this path to see when a route lookup is still required.",
  },
  {
    href: "/tools/checked-baggage-calculator?airline=air-canada&travelers=2&bags=1&directions=2&trips=1&pay=yes",
    title: "Air Canada checked bag fee",
    body:
      "Good for comparing Basic against Standard when travelers need checked bags.",
  },
  {
    href: "/tools/checked-baggage-calculator?airline=zipair&travelers=1&bags=1&directions=2&trips=1&pay=yes&route=Los+Angeles+%28LAX%29+to+Tokyo+%28NRT%29",
    title: "ZIPAIR checked bag fee",
    body:
      "ZIPAIR checked baggage is bought by route, weight, and timing, so route context matters before the base fare wins.",
  },
];

const POPULAR_CALCULATOR_STARTS = [
  {
    href: "/tools/checked-baggage-calculator?airline=united&travelers=1&bags=1&directions=2&trips=1&pay=yes",
    title: "United, one traveler, one checked bag",
    body: "A clean starting point for a United roundtrip when one traveler needs one checked bag each way.",
  },
  {
    href: "/tools/checked-baggage-calculator?airline=united&travelers=4&bags=1&directions=2&trips=1&pay=yes",
    title: "United family roundtrip baggage fees",
    body: "Shows how one checked bag per traveler can multiply across a roundtrip before waivers or included allowances.",
  },
  {
    href: "/tools/checked-baggage-calculator?airline=alaska&travelers=2&bags=1&directions=2&trips=2&pay=yes",
    title: "Repeat Alaska checked-bag trips",
    body: "Useful when deciding whether recurring first-bag fees are large enough to compare card baggage benefits.",
  },
  {
    href: "/tools/checked-baggage-calculator?airline=air-canada&travelers=2&bags=1&directions=2&trips=1&pay=yes",
    title: "Air Canada Basic vs Standard bag math",
    body: "Use this when the checked-bag question is tied to fare family rather than one universal first-bag price.",
  },
];

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

function feePressureLabel(annualBagCost: number | null): {
  label: string;
  className: string;
  explanation: string;
} {
  if (annualBagCost == null) {
    return {
      label: "Lookup required",
      className: "border-amber-200 bg-amber-50 text-amber-900",
      explanation: "The airline prices this baggage setup by route, fare, timing, or allowance rules.",
    };
  }

  if (annualBagCost >= 250) {
    return {
      label: "High bag-fee exposure",
      className: "border-rose-200 bg-rose-50 text-rose-900",
      explanation: "This is large enough to compare fare bundles, status/card waivers, or a different packing plan.",
    };
  }

  if (annualBagCost >= 100) {
    return {
      label: "Meaningful bag-fee exposure",
      className: "border-amber-200 bg-amber-50 text-amber-900",
      explanation: "This is worth checking against a bag-inclusive fare or eligible free checked bag benefit.",
    };
  }

  if (annualBagCost > 0) {
    return {
      label: "Low bag-fee exposure",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      explanation: "The cash fee may be simpler than changing fares or products unless you repeat this trip often.",
    };
  }

  return {
    label: "No checked-bag exposure",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    explanation: "With zero checked bags selected, this setup has no checked-bag cost.",
  };
}

export function CheckedBaggageCalculatorClient({
  airlines,
  cards,
  overrides,
}: CheckedBaggageCalculatorClientProps) {
  const queryString = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerLocationSearch
  );
  const sp = new URLSearchParams(queryString);
  const requestedAirlineSlug = sp.get("airline") || "alaska";
  const airline = airlines.find((item) => item.slug === requestedAirlineSlug) ?? airlines[0];
  const airlineSlug = airline.slug;

  const travelers = clampInt(sp.get("travelers") ?? undefined, 1, 9, 2);
  const bags = clampInt(sp.get("bags") ?? undefined, 0, 3, 1);
  const directions = clampInt(sp.get("directions") ?? undefined, 1, 2, 2);
  const roundtrips = clampInt(sp.get("trips") ?? undefined, 1, 30, 1);
  const payWithCard = (sp.get("pay") ?? "yes") !== "no";
  const routeLabel = cleanRouteLabel(sp.get("route") ?? undefined);
  const routePresets = ROUTE_PRESETS_BY_AIRLINE[airlineSlug] ?? [];

  const trip = calcCheckedBagTripCost({
    fees: airline.fees,
    travelers,
    bagsPerTravelerPerDirection: bags,
    directions,
  });
  const variablePricing = explainVariableCheckedBagPricing(airline.fees);

  const airlineOverrides = overrides[airlineSlug];
  const airlineCards = cards.filter((card) => card.airline_slug === airlineSlug);
  const cardResults = airlineCards
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
  const pressure = feePressureLabel(annualBagCost);
  const bagMathLine = `${plural(travelers, "traveler")} x ${plural(bags, "bag")} each way x ${directions === 2 ? "roundtrip" : "one-way"} x ${plural(roundtrips, "annual trip")}`;
  const shouldCompareCards = Boolean(best && best.result.annualSavingsUsd > 0);
  const cardBridgeLabel =
    best && best.result.netAnnualUsd >= 0
      ? "Card comparison is worth your time"
      : best
        ? "Card benefit helps, but does not fully justify the annual fee"
        : "Card calculator has no positive match for this setup";
  const cardHref = `/best-cards?airline=${encodeURIComponent(airlineSlug)}&travelers=${travelers}&bags=${bags}&trips=${roundtrips}&pay=${payWithCard ? "yes" : "no"}`;

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10">
      <header className="grid gap-3">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Checked bag fee tool
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Checked bag fee calculator</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
          Use this baggage calculator for checked bags before booking: choose an airline, enter the
          number of travelers and bags, then see the trip total and yearly bag-fee exposure when the
          published data supports a fixed estimate. If the checked-bag price depends on route, fare
          family, allowance, currency, or booking timing, the tool explains the lookup instead of
          inventing a number.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/tools/checked-baggage-calculator?airline=united&travelers=2&bags=1&directions=2&trips=1&pay=yes" className="font-semibold text-blue-700 underline">
            United baggage fee calculator
          </Link>
          <Link href="/tools/checked-baggage-calculator?airline=air-france&travelers=1&bags=1&directions=2&trips=1&pay=yes" className="font-semibold text-blue-700 underline">
            Air France baggage fees
          </Link>
          <Link href="/tools/checked-baggage-calculator?airline=air-canada&travelers=2&bags=1&directions=2&trips=1&pay=yes" className="font-semibold text-blue-700 underline">
            Air Canada checked bag fee
          </Link>
          <Link href="/tools/checked-baggage-calculator?airline=zipair&travelers=1&bags=1&directions=2&trips=1&pay=yes&route=Los+Angeles+%28LAX%29+to+Tokyo+%28NRT%29" className="font-semibold text-blue-700 underline">
            ZIPAIR checked bag fee
          </Link>
        </div>
      </header>

      <section className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Fast answer
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h2 className="text-base font-extrabold text-slate-950">Calculate a checked-bag total</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Enter airline, travelers, bags per traveler, trip type, and roundtrips. The tool turns
              usable fixed bag fees into trip and annual estimates.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h2 className="text-base font-extrabold text-slate-950">When it says lookup required</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Route-priced airlines stay unquoted when the bag fee depends on itinerary, fare
              family, allowance concept, timing, currency, or operating carrier.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h2 className="text-base font-extrabold text-slate-950">When card math matters</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              If checked-bag fees repeat across travelers or trips, the tool sends you to the
              free-checked-bag card comparison only when a verified benefit can apply.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            High-intent checked-bag paths
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-slate-950">
            Start with the checked bag fee search travelers are already making.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {FEATURED_CHECKED_BAG_PATHS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-400 hover:bg-blue-50"
            >
              <div className="text-sm font-extrabold text-blue-800 underline">{item.title}</div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Popular calculator starts
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-slate-950">
            Start with a real bag-fee scenario.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {POPULAR_CALCULATOR_STARTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-400 hover:bg-blue-50"
            >
              <div className="text-sm font-extrabold text-blue-800 underline">{item.title}</div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

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

      <form
        key={`${airlineSlug}-${travelers}-${bags}-${directions}-${roundtrips}-${payWithCard}-${routeLabel ?? ""}`}
        method="get"
        className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Airline</label>
            <AirlineSelect airlines={airlines} value={airlineSlug} />
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

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Route or fare context <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            name="route"
            defaultValue={routeLabel ?? ""}
            placeholder="Example: LAX to Tokyo, Basic fare, buying bag online"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            This does not force a price. It keeps the route or fare context visible when the airline needs a route-specific lookup.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 md:w-fit"
        >
          Calculate checked bag fees
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
              For {airline.name}, the published policy points to{" "}
              <span className="font-semibold">{variablePricing.reasons.join(", ")}</span> as the likely
              drivers of the final baggage price.
            </p>
            {routeLabel ? (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                For {routeLabel}, use the airline checkout or manage-booking baggage screen to price the checked-bag allowance before assuming the base fare is cheaper.
              </p>
            ) : null}
          </>
        )}
        <p className="text-sm leading-relaxed text-slate-600">{trip.explanation}</p>

        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${pressure.className}`}>
          {pressure.label}: {pressure.explanation}
        </div>

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

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Decision engine
        </div>
        <h2 className="text-2xl font-extrabold text-slate-950">
          What this baggage setup means
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Bag math</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{bagMathLine}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Cost confidence</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {trip.canEstimate
                ? "The calculator found usable fixed checked-bag amounts for the selected bag count."
                : `The ${missingBagLabel(trip.missingBagOrdinals)} bag needs airline checkout or route-table pricing.`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Best next move</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {trip.canEstimate && shouldCompareCards
                ? "Compare eligible free checked bag cards only after checking the bag-only savings against the annual fee."
                : trip.canEstimate
                  ? "Compare the cash fee against a bag-inclusive fare before changing products."
                  : "Price the exact itinerary in the airline checkout flow before trusting the base fare."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 hover:border-blue-300">
            Open {airline.name} fee page
          </Link>
          <Link href="/tools/excess-baggage-calculator" className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 hover:border-blue-300">
            Check overweight or oversize fees
          </Link>
          <Link href={cardHref} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 hover:border-blue-300">
            Test card break-even
          </Link>
        </div>
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
            Checked bag savings next step
          </div>
          {best ? (
            <>
              <h2 className="text-2xl font-extrabold text-slate-950">
                {cardBridgeLabel}: test whether a free checked bag card beats paying cash.
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                For this setup, the strongest eligible bag-fee match is <span className="font-bold">{best.card.name}</span>.
                It could remove about <span className="font-bold">{usd(best.result.annualSavingsUsd)}</span> in annual
                checked-bag fees before the card annual fee. After the annual fee, the bag-only value is{" "}
                <span className={best.result.netAnnualUsd >= 0 ? "font-bold text-emerald-800" : "font-bold text-rose-700"}>
                  {best.result.netAnnualUsd >= 0 ? "+" : "-"}
                  {usd(Math.abs(best.result.netAnnualUsd))}
                </span>
                . The card page shows the same inputs, compares eligible card tiers, and excludes points, sign-up bonuses,
                lounge access, and unrelated perks.
              </p>
              {remainingAnnualBagCost != null ? (
                <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                  With this input, the calculated cash bag bill is {annualBagCost != null ? usd(annualBagCost) : "-"} per
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
                  Compare cards for this bag bill
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
                You can still open the card page to see why the model did not produce a positive match. The next best
                move is usually to reduce the cash bag bill directly: compare a bag-inclusive fare, check status or
                military exceptions, or reduce the number of checked bags.
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
                <th scope="col" className="py-2 pr-4">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(1, bags) }, (_, index) => index + 1).map((ordinal) => {
                const estimate = trip.feeEstimateByBagOrdinal.get(ordinal);
                return (
                  <tr key={ordinal} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {ordinal === 1 ? "First" : ordinal === 2 ? "Second" : "Third"} checked bag
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {estimate ? usd(estimate.amountUsd) : "Needs route lookup"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {estimate ? (
                        <span
                          className={
                            estimate.confidence === "exact_published_fee"
                              ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800"
                              : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800"
                          }
                        >
                          {estimate.label}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
                          Route or fare lookup
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          The calculator prefers current, broad-market USD fees and avoids special-case prices such
          as intra-island or long-haul routes when broader domestic or North America pricing exists.
          If the airline publishes a USD range, the estimate uses the lower end and labels it as a
          conservative lower-bound estimate.
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
