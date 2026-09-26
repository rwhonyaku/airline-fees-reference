"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AirlineOption = {
  slug: string;
  name: string;
  firstBagUsd: number | null;
  secondBagUsd: number | null;
};

type ComparisonPreset = {
  label: string;
  detail: string;
  route: string;
  airlineA: string;
  airlineB: string;
};

type FlightInput = {
  airline: string;
  fare: number | null;
  bagsIncluded: boolean;
  manualBagFee: number | null;
  carryOnFee: number | null;
  seatFee: number | null;
  otherTripFees: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function optionalNumberValue(value: string) {
  if (value.trim() === "") return null;
  return numberValue(value);
}

export function TrueTripCostCalculator({ airlines, comparisonPresets }: { airlines: AirlineOption[]; comparisonPresets: ComparisonPreset[] }) {
  const [travelers, setTravelers] = useState(2);
  const [directions, setDirections] = useState(2);
  const [bags, setBags] = useState(1);
  const [route, setRoute] = useState("");
  const [flights, setFlights] = useState<FlightInput[]>([
    { airline: "", fare: null, bagsIncluded: false, manualBagFee: null, carryOnFee: null, seatFee: null, otherTripFees: 0 },
    { airline: "", fare: null, bagsIncluded: false, manualBagFee: null, carryOnFee: null, seatFee: null, otherTripFees: 0 },
  ]);

  const results = useMemo(() => flights.map((flight) => {
    const airline = airlines.find((item) => item.slug === flight.airline);
    const bagRates = [airline?.firstBagUsd ?? null, airline?.secondBagUsd ?? null].slice(0, bags);
    const canCalculateBags = bags === 0 || bagRates.every((rate) => rate != null);
    const automaticBagTotal = flight.bagsIncluded ? 0 : canCalculateBags
      ? bagRates.reduce<number>((sum, rate) => sum + (rate ?? 0), 0) * travelers * directions
      : null;
    const bagTotal = automaticBagTotal ?? flight.manualBagFee;
    const fareTotal = flight.fare == null ? null : flight.fare * travelers;
    const carryTotal = flight.carryOnFee == null ? null : flight.carryOnFee * travelers * directions;
    const seatTotal = flight.seatFee == null ? null : flight.seatFee * travelers * directions;
    const total = fareTotal == null || bagTotal == null || carryTotal == null || seatTotal == null
      ? null
      : fareTotal + bagTotal + carryTotal + seatTotal + flight.otherTripFees;
    return { airline, automaticBagTotal, bagTotal, carryTotal, fareTotal, seatTotal, total };
  }), [airlines, bags, directions, flights, travelers]);

  const totalsComplete = results.every((result) => result.total != null);
  const winner = !totalsComplete || results[0].total === results[1].total ? null : results[0].total! < results[1].total! ? 0 : 1;
  const difference = totalsComplete ? Math.abs(results[0].total! - results[1].total!) : null;

  function updateFlight(index: number, patch: Partial<FlightInput>) {
    setFlights((current) => current.map((flight, flightIndex) => flightIndex === index ? { ...flight, ...patch } : flight));
  }

  function applyPreset(preset: ComparisonPreset) {
    setRoute(preset.route);
    setFlights((current) => current.map((flight, index) => ({
      ...flight,
      airline: index === 0 ? preset.airlineA : preset.airlineB,
    })));
  }

  return (
    <section className="grid gap-6" aria-label="True trip cost calculator">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-black text-slate-950">Start with flights that actually compete</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">Choose two flights you found for the same route and dates. The examples below are overlapping markets, not recommendations or live fare quotes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {comparisonPresets.map((preset) => (
            <button key={preset.route} type="button" onClick={() => applyPreset(preset)} className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm hover:border-blue-400 hover:bg-blue-50">
              <span className="block font-black text-slate-950">{preset.label}</span>
              <span className="mt-1 block text-slate-600">{preset.detail}</span>
            </button>
          ))}
        </div>
        <label className="text-sm font-bold text-slate-800">Route being compared
          <input value={route} onChange={(event) => setRoute(event.target.value)} placeholder="Example: Los Angeles (LAX)–Tokyo (NRT)" className="mt-2 w-full rounded-xl border-slate-300" />
        </label>
      </div>

      <div className="grid gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:grid-cols-3">
        <label className="text-sm font-bold text-slate-800">Travelers
          <input type="number" min={1} max={9} step={1} value={travelers} onChange={(event) => setTravelers(Math.min(9, Math.max(1, Math.round(numberValue(event.target.value)))))} className="mt-2 w-full rounded-xl border-slate-300" />
        </label>
        <label className="text-sm font-bold text-slate-800">Trip type
          <select value={directions} onChange={(event) => setDirections(Number(event.target.value))} className="mt-2 w-full rounded-xl border-slate-300">
            <option value={2}>Roundtrip</option><option value={1}>One-way</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-800">Checked bags per traveler
          <select value={bags} onChange={(event) => setBags(Number(event.target.value))} className="mt-2 w-full rounded-xl border-slate-300">
            <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option>
          </select>
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {flights.map((flight, index) => {
          const result = results[index];
          return <article key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-blue-700">Flight {index === 0 ? "A" : "B"}</div>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-bold">Airline
                <select value={flight.airline} onChange={(event) => updateFlight(index, { airline: event.target.value })} className="mt-2 w-full rounded-xl border-slate-300">
                  <option value="">Choose an airline</option>
                  {airlines.map((airline) => <option key={airline.slug} value={airline.slug}>{airline.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold">Advertised fare per traveler
                <input type="number" min={0} step="0.01" required value={flight.fare ?? ""} onChange={(event) => updateFlight(index, { fare: optionalNumberValue(event.target.value) })} placeholder="Enter the fare you found" className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
              {bags > 0 ? <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold">
                <input type="checkbox" checked={flight.bagsIncluded} onChange={(event) => updateFlight(index, { bagsIncluded: event.target.checked })} className="mt-0.5 rounded border-slate-300" />
                <span>These checked bags are included or waived<span className="mt-1 block font-normal text-slate-600">Use this only when the selected fare, cabin, status, or card benefit covers them.</span></span>
              </label> : null}
              {bags > 0 && !flight.bagsIncluded && result.automaticBagTotal == null ? <label className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold">Checked-bag total for the whole trip
                <input type="number" min={0} step="0.01" required value={flight.manualBagFee ?? ""} onChange={(event) => updateFlight(index, { manualBagFee: optionalNumberValue(event.target.value) })} placeholder="Enter checkout total" className="mt-2 w-full rounded-xl border-amber-300 bg-white" />
                <span className="mt-2 block font-normal text-amber-900">Enter the bag total shown by the airline for this route, fare, and purchase time. The calculator will not substitute a fee from a different market or fare family.</span>
              </label> : null}
              <label className="text-sm font-bold">Carry-on fee per traveler, each way
                <input type="number" min={0} step="0.01" required value={flight.carryOnFee ?? ""} onChange={(event) => updateFlight(index, { carryOnFee: optionalNumberValue(event.target.value) })} placeholder="Enter 0 if none" className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
              <label className="text-sm font-bold">Seat fee per traveler, each way
                <input type="number" min={0} step="0.01" required value={flight.seatFee ?? ""} onChange={(event) => updateFlight(index, { seatFee: optionalNumberValue(event.target.value) })} placeholder="Enter 0 if none" className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
              <label className="text-sm font-bold">Other fees for the whole trip
                <input type="number" min={0} step="0.01" value={flight.otherTripFees} onChange={(event) => updateFlight(index, { otherTripFees: numberValue(event.target.value) })} className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
            </div>
            <dl className="mt-5 grid gap-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between gap-4"><dt>Fare</dt><dd>{result.fareTotal == null ? "Enter fare" : money(result.fareTotal)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Checked bags {flight.bagsIncluded ? "(included)" : result.automaticBagTotal != null ? "(published universal fee)" : ""}</dt><dd>{result.bagTotal == null ? "Enter amount" : money(result.bagTotal)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Carry-ons</dt><dd>{result.carryTotal == null ? "Enter amount" : money(result.carryTotal)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Seats</dt><dd>{result.seatTotal == null ? "Enter amount" : money(result.seatTotal)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-black"><dt>True trip cost</dt><dd>{result.total == null ? "Incomplete" : money(result.total)}</dd></div>
            </dl>
            {flight.airline ? <Link href={`/airlines/${flight.airline}`} className="mt-4 inline-block text-sm font-bold text-blue-700 underline">Check the airline rules and sources</Link> : null}
          </article>;
        })}
      </div>

      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <h2 className="text-2xl font-black text-white">{!totalsComplete ? "Complete the missing prices to compare these flights." : winner == null ? "These options currently tie." : `Flight ${winner === 0 ? "A" : "B"} is ${money(difference!)} cheaper.`}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Compare the completed totals, then confirm any price that can change by route, fare, or purchase timing during checkout.</p>
      </div>
    </section>
  );
}
