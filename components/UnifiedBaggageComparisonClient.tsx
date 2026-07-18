"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { calcCardBagOffset, usd, type Card } from "@/lib/bag-cost-calculator";

export type BaggageComparisonAirline = {
  slug: string;
  name: string;
  feeByBagOrdinal: Array<[number, number]>;
  variableReasons: string[];
  cards: Card[];
};

type Props = {
  airlines: BaggageComparisonAirline[];
  focusSlug?: string;
  compact?: boolean;
};

function comparisonHref(params: {
  airline: string;
  travelers: number;
  bags: number;
  directions: number;
  trips: number;
}) {
  const query = new URLSearchParams({
    airline: params.airline,
    travelers: String(params.travelers),
    bags: String(params.bags),
    directions: String(params.directions),
    trips: String(params.trips),
    pay: "yes",
  });

  return `/tools/checked-baggage-calculator?${query.toString()}`;
}

function cardHref(params: { airline: string; travelers: number; bags: number; trips: number }) {
  const query = new URLSearchParams({
    airline: params.airline,
    travelers: String(params.travelers),
    bags: String(params.bags),
    trips: String(params.trips),
    pay: "yes",
  });

  return `/best-cards?${query.toString()}`;
}

function excessHref(params: {
  airline: string;
  bags: number;
  directions: number;
  weight: number;
  size: number;
}) {
  const query = new URLSearchParams({
    airline: params.airline,
    bags: String(Math.max(1, params.bags)),
    directions: String(params.directions),
    weight: String(params.weight),
    size: String(params.size),
  });

  return `/tools/excess-baggage-calculator?${query.toString()}`;
}

function sumCheckedFees(feeByBagOrdinal: Map<number, number>, bags: number) {
  let total = 0;
  const missing: number[] = [];

  for (let ordinal = 1; ordinal <= bags; ordinal += 1) {
    const fee = feeByBagOrdinal.get(ordinal);
    if (fee == null) missing.push(ordinal);
    else total += fee;
  }

  return { total, missing };
}

function ordinalLabel(n: number) {
  if (n === 1) return "first";
  if (n === 2) return "second";
  return `${n}rd`;
}

export function UnifiedBaggageComparisonClient({ airlines, focusSlug, compact = false }: Props) {
  const [travelers, setTravelers] = useState(2);
  const [bags, setBags] = useState(1);
  const [directions, setDirections] = useState(2);
  const [trips, setTrips] = useState(1);
  const [weight, setWeight] = useState(50);
  const [size, setSize] = useState(62);
  const [route, setRoute] = useState("north-america");

  const routeLabel = {
    "north-america": "North America / domestic-style",
    transatlantic: "Transatlantic",
    transpacific: "Transpacific",
    europe: "Europe short-haul",
    asia: "Asia-Pacific",
    japan: "Japan / Tokyo routes",
  }[route];

  const rows = useMemo(
    () =>
      airlines.map((airline) => {
        const feeByBagOrdinal = new Map(airline.feeByBagOrdinal);
        const checked = sumCheckedFees(feeByBagOrdinal, bags);
        const canEstimate = bags === 0 || checked.missing.length === 0;
        const tripCost = canEstimate ? checked.total * travelers * directions : null;
        const annualCost = tripCost == null ? null : tripCost * trips;
        const bestCard = airline.cards
          .map((card) => ({
            card,
            result: calcCardBagOffset({
              feeByBagOrdinal,
              directions,
              roundtripsPerYear: trips,
              travelers,
              bagsPerTravelerPerDirection: bags,
              card,
              userWillPayWithCard: true,
            }),
          }))
          .filter((item) => item.result.eligible && item.result.annualSavingsUsd > 0)
          .sort(
            (a, b) =>
              b.result.annualSavingsUsd - a.result.annualSavingsUsd ||
              a.card.annual_fee_usd - b.card.annual_fee_usd
          )[0];

        return {
          ...airline,
          canEstimate,
          tripCost,
          annualCost,
          missing: checked.missing,
          bestCard,
          needsExcessCheck: weight > 50 || size > 62,
        };
      }),
    [airlines, bags, directions, travelers, trips, weight, size]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Baggage comparison tool
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Compare the bag bill before the fare wins.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Pick travelers, bags, route context, and bag size. The table estimates only when the stored fee data has a usable fixed amount; route-priced airlines stay flagged for lookup.
          </p>
        </div>
        <Link
          href="/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=1&pay=yes"
          className="text-sm font-bold text-blue-700 underline"
        >
          Open full calculator
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Travelers
          <input
            value={travelers}
            onChange={(event) => setTravelers(Math.min(9, Math.max(1, Number(event.target.value) || 1)))}
            inputMode="numeric"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Bags / traveler
          <select
            value={bags}
            onChange={(event) => setBags(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Trip type
          <select
            value={directions}
            onChange={(event) => setDirections(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value={2}>Roundtrip</option>
            <option value={1}>One-way</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Trips / year
          <input
            value={trips}
            onChange={(event) => setTrips(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
            inputMode="numeric"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Bag weight
          <select
            value={weight}
            onChange={(event) => setWeight(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value={50}>50 lb</option>
            <option value={51}>51 lb</option>
            <option value={70}>70 lb</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Route context
          <select
            value={route}
            onChange={(event) => setRoute(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="north-america">North America</option>
            <option value="transatlantic">Transatlantic</option>
            <option value="transpacific">Transpacific</option>
            <option value="europe">Europe short-haul</option>
            <option value="asia">Asia-Pacific</option>
            <option value="japan">Japan / Tokyo routes</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs leading-relaxed text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Context: {routeLabel}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Linear size: {size} in</span>
        <button
          type="button"
          onClick={() => setSize(size === 62 ? 63 : 62)}
          className="rounded-full border border-slate-200 px-3 py-1 font-bold text-blue-700"
        >
          {size === 62 ? "Test 63 in oversize" : "Reset to 62 in"}
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[860px] border-collapse bg-white text-left text-sm">
          <caption className="bg-slate-50 px-4 py-3 text-left text-xs leading-relaxed text-slate-500">
            Side-by-side checked-bag estimates for the selected setup. Card savings are modeled only from checked-bag waiver data already in this site.
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Airline</th>
              <th scope="col" className="px-4 py-3">Trip bag cost</th>
              <th scope="col" className="px-4 py-3">Annual exposure</th>
              <th scope="col" className="px-4 py-3">Best card waiver</th>
              <th scope="col" className="px-4 py-3">Overweight / oversize</th>
              <th scope="col" className="px-4 py-3">Next step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.slug} className={row.slug === focusSlug ? "bg-blue-50/70" : undefined}>
                <td className="px-4 py-4 align-top">
                  <Link href={`/airlines/${row.slug}`} className="font-extrabold text-slate-950 underline">
                    {row.name}
                  </Link>
                  {row.slug === focusSlug ? (
                    <div className="mt-1 text-xs font-bold text-blue-700">Current page</div>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top">
                  {row.canEstimate ? (
                    <span className="text-lg font-black text-slate-950">{usd(row.tripCost ?? 0)}</span>
                  ) : (
                    <div>
                      <div className="font-bold text-amber-800">Needs lookup</div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-500">
                        Missing {row.missing.map(ordinalLabel).join(", ")} bag fee.
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  {row.annualCost == null ? (
                    <span className="text-slate-500">Route-priced</span>
                  ) : (
                    <span className="font-bold text-slate-900">{usd(row.annualCost)}</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  {row.bestCard ? (
                    <div>
                      <div className="font-bold text-emerald-800">
                        {usd(row.bestCard.result.annualSavingsUsd)} / year
                      </div>
                      <Link
                        href={cardHref({ airline: row.slug, travelers, bags, trips })}
                        className="mt-1 block text-xs font-bold text-blue-700 underline"
                      >
                        {row.bestCard.card.name}
                      </Link>
                    </div>
                  ) : row.cards.length ? (
                    <Link
                      href={cardHref({ airline: row.slug, travelers, bags, trips })}
                      className="font-bold text-blue-700 underline"
                    >
                      Check card rules
                    </Link>
                  ) : (
                    <span className="text-slate-500">No modeled card</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  {row.needsExcessCheck ? (
                    <Link
                      href={excessHref({ airline: row.slug, bags, directions, weight, size })}
                      className="font-bold text-blue-700 underline"
                    >
                      Check excess risk
                    </Link>
                  ) : (
                    <span className="text-slate-500">Standard-size input</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <Link
                    href={comparisonHref({ airline: row.slug, travelers, bags, directions, trips })}
                    className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    Price this airline
                  </Link>
                  {!row.canEstimate ? (
                    <div className="mt-2 text-xs leading-relaxed text-slate-500">
                      Depends on {row.variableReasons.slice(0, 2).join(" and ")}.
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!compact ? (
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          This comparison is intentionally conservative. It compares broad published checked-bag rows and modeled card baggage waivers; exact route, date, fare family, partner operation, and airport purchase rules still need final confirmation before payment.
        </p>
      ) : null}
    </section>
  );
}
