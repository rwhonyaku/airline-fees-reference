"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  airlineSlug: string;
  airlineName: string;
  feeByBagOrdinal: Array<[number, number]>;
};

function usd(n: number): string {
  return `$${Math.round(n)}`;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function buildHref(base: string, params: Record<string, string | number>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => sp.set(key, String(value)));
  return `${base}?${sp.toString()}`;
}

export function BaggageDecisionWidget({ airlineSlug, airlineName, feeByBagOrdinal }: Props) {
  const [travelers, setTravelers] = useState(2);
  const [bags, setBags] = useState(1);
  const [directions, setDirections] = useState(2);
  const [trips, setTrips] = useState(2);

  const feeMap = useMemo(() => new Map(feeByBagOrdinal), [feeByBagOrdinal]);
  const result = useMemo(() => {
    let knownPerTravelerPerTrip = 0;
    const missing: number[] = [];
    const known: number[] = [];

    for (let ordinal = 1; ordinal <= bags; ordinal += 1) {
      const fee = feeMap.get(ordinal);
      if (fee == null) missing.push(ordinal);
      else {
        known.push(ordinal);
        knownPerTravelerPerTrip += fee * directions;
      }
    }

    const tripCost = knownPerTravelerPerTrip * travelers;
    const annualCost = tripCost * trips;
    const firstBagFee = feeMap.get(1);
    const possibleCardOffset =
      firstBagFee != null && bags > 0 ? firstBagFee * directions * travelers * trips : null;
    const canFullyEstimate = missing.length === 0;

    return { annualCost, canFullyEstimate, known, missing, possibleCardOffset, tripCost };
  }, [bags, directions, feeMap, travelers, trips]);

  const sharedParams = {
    airline: airlineSlug,
    travelers,
    bags,
    directions,
    trips,
    pay: "yes",
  };
  const calculatorHref = buildHref("/tools/checked-baggage-calculator", sharedParams);
  const cardHref = buildHref("/best-cards", {
    airline: airlineSlug,
    travelers,
    bags,
    trips,
    pay: "yes",
  });

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Bag-fee decision engine
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Estimate the bag-fee hit before you book.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Use the current published fee rows for {airlineName} to test a simple scenario. If the
            price depends on route, fare, or purchase timing, this module will send you to the full
            calculator instead of pretending there is one universal fee.
          </p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-blue-100 bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="text-sm font-bold text-slate-800">
              Travelers
              <input
                value={travelers}
                onChange={(event) => setTravelers(clamp(Number(event.target.value), 1, 9))}
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Bags each
              <select
                value={bags}
                onChange={(event) => setBags(clamp(Number(event.target.value), 0, 3))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-800">
              Trip type
              <select
                value={directions}
                onChange={(event) => setDirections(clamp(Number(event.target.value), 1, 2))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
              >
                <option value={2}>Roundtrip</option>
                <option value={1}>One-way</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-800">
              Trips / year
              <input
                value={trips}
                onChange={(event) => setTrips(clamp(Number(event.target.value), 1, 30))}
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {bags === 0 ? (
              <>
                <div className="text-xl font-black text-slate-950">
                  Estimated checked-bag fees: $0.
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  No checked bags selected. Your main fee exposure is more likely to be carry-on
                  enforcement, seat selection, or fare flexibility.
                </p>
              </>
            ) : result.canFullyEstimate ? (
              <>
                <div className="text-xl font-black text-slate-950">
                  Estimated bag fees: {usd(result.tripCost)} per {directions === 2 ? "roundtrip" : "one-way trip"}.
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Across {trips} trip{trips === 1 ? "" : "s"}, that is about{" "}
                  <span className="font-bold">{usd(result.annualCost)}</span> before elite status,
                  fare bundles, waived bags, or route-specific exceptions.
                </p>
                {result.possibleCardOffset != null ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    If an eligible card covers the first checked bag for this party, the modeled
                    first-bag exposure is about <span className="font-bold">{usd(result.possibleCardOffset)}</span>{" "}
                    per year before annual fees.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <div className="text-xl font-black text-slate-950">
                  Partial estimate: {usd(result.tripCost)} from the known bag rows.
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  The current fee rows include numeric pricing for{" "}
                  {result.known.length
                    ? result.known.map((ordinal) => (ordinal === 1 ? "the first bag" : ordinal === 2 ? "the second bag" : "the third bag")).join(", ")
                    : "none of the requested bag positions"}
                  , but the requested{" "}
                  {result.missing.map((ordinal) => (ordinal === 1 ? "first" : ordinal === 2 ? "second" : "third")).join(" and ")}{" "}
                  bag price still needs a route, fare, or timing lookup.
                </p>
                {result.possibleCardOffset != null ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    The known first-bag exposure is still useful for card math: an eligible card could
                    target about <span className="font-bold">{usd(result.possibleCardOffset)}</span>{" "}
                    per year before annual fees.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    The full calculator is the safer next step because this airline does not publish
                    a broad numeric first checked bag fee in this dataset.
                  </p>
                )}
              </>
            )}
          </div>

          {result.canFullyEstimate || bags === 0 ? null : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
              <span className="font-bold">Why no single total?</span> Missing bag positions usually
              mean the airline prices baggage by route, fare family, advance purchase, airport
              purchase, or piece-versus-weight concept.
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={calculatorHref} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700">
              Open full bag calculator
            </Link>
            <Link href={cardHref} className="rounded-xl border border-blue-200 bg-white px-4 py-2 font-bold text-blue-800 hover:border-blue-400">
              Compare eligible cards
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
