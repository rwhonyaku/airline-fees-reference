"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AirlineOption = {
  slug: string;
  name: string;
  firstBagUsd: number | null;
  secondBagUsd: number | null;
};

type FlightInput = {
  airline: string;
  fare: number;
  bagsIncluded: boolean;
  manualBagFee: number | null;
  carryOnFee: number;
  seatFee: number;
  otherTripFees: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function optionalNumberValue(value: string) {
  if (value.trim() === "") return null;
  return numberValue(value);
}

export function TrueTripCostCalculator({ airlines }: { airlines: AirlineOption[] }) {
  const initialA = airlines.find((airline) => airline.slug === "alaska")?.slug ?? airlines[0]?.slug ?? "";
  const initialB = airlines.find((airline) => airline.slug === "southwest")?.slug ?? airlines[1]?.slug ?? initialA;
  const [travelers, setTravelers] = useState(2);
  const [directions, setDirections] = useState(2);
  const [bags, setBags] = useState(1);
  const [flights, setFlights] = useState<FlightInput[]>([
    { airline: initialA, fare: 189, bagsIncluded: false, manualBagFee: null, carryOnFee: 0, seatFee: 0, otherTripFees: 0 },
    { airline: initialB, fare: 247, bagsIncluded: false, manualBagFee: null, carryOnFee: 0, seatFee: 0, otherTripFees: 0 },
  ]);

  const results = useMemo(() => flights.map((flight) => {
    const airline = airlines.find((item) => item.slug === flight.airline);
    const bagRates = [airline?.firstBagUsd ?? null, airline?.secondBagUsd ?? null].slice(0, bags);
    const canCalculateBags = bags === 0 || bagRates.every((rate) => rate != null);
    const automaticBagTotal = flight.bagsIncluded ? 0 : canCalculateBags
      ? bagRates.reduce<number>((sum, rate) => sum + (rate ?? 0), 0) * travelers * directions
      : null;
    const bagTotal = automaticBagTotal ?? flight.manualBagFee;
    const fareTotal = flight.fare * travelers;
    const carryTotal = flight.carryOnFee * travelers * directions;
    const seatTotal = flight.seatFee * travelers * directions;
    const total = bagTotal == null ? null : fareTotal + bagTotal + carryTotal + seatTotal + flight.otherTripFees;
    return { airline, automaticBagTotal, bagTotal, carryTotal, fareTotal, seatTotal, total };
  }), [airlines, bags, directions, flights, travelers]);

  const totalsComplete = results.every((result) => result.total != null);
  const winner = !totalsComplete || results[0].total === results[1].total ? null : results[0].total! < results[1].total! ? 0 : 1;
  const difference = totalsComplete ? Math.abs(results[0].total! - results[1].total!) : null;

  function updateFlight(index: number, patch: Partial<FlightInput>) {
    setFlights((current) => current.map((flight, flightIndex) => flightIndex === index ? { ...flight, ...patch } : flight));
  }

  return (
    <section className="grid gap-6" aria-labelledby="trip-cost-calculator">
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
                  {airlines.map((airline) => <option key={airline.slug} value={airline.slug}>{airline.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold">Advertised fare per traveler
                <input type="number" min={0} value={flight.fare} onChange={(event) => updateFlight(index, { fare: numberValue(event.target.value) })} className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
              {bags > 0 ? <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold">
                <input type="checkbox" checked={flight.bagsIncluded} onChange={(event) => updateFlight(index, { bagsIncluded: event.target.checked })} className="mt-0.5 rounded border-slate-300" />
                <span>These checked bags are included or waived<span className="mt-1 block font-normal text-slate-600">Use this only when the selected fare, cabin, status, or card benefit covers them.</span></span>
              </label> : null}
              {bags > 0 && !flight.bagsIncluded && result.automaticBagTotal == null ? <label className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold">Checked-bag total for the whole trip
                <input type="number" min={0} required value={flight.manualBagFee ?? ""} onChange={(event) => updateFlight(index, { manualBagFee: optionalNumberValue(event.target.value) })} placeholder="Enter checkout total" className="mt-2 w-full rounded-xl border-amber-300 bg-white" />
                <span className="mt-2 block font-normal text-amber-900">Route, fare, or timing prevents a reliable automatic quote. Enter the airline checkout total.</span>
              </label> : null}
              <label className="text-sm font-bold">Carry-on fee per traveler, each way
                <input type="number" min={0} value={flight.carryOnFee} onChange={(event) => updateFlight(index, { carryOnFee: numberValue(event.target.value) })} className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
              <label className="text-sm font-bold">Seat fee per traveler, each way
                <input type="number" min={0} value={flight.seatFee} onChange={(event) => updateFlight(index, { seatFee: numberValue(event.target.value) })} className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
              <label className="text-sm font-bold">Other fees for the whole trip
                <input type="number" min={0} value={flight.otherTripFees} onChange={(event) => updateFlight(index, { otherTripFees: numberValue(event.target.value) })} className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
            </div>
            <dl className="mt-5 grid gap-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between"><dt>Fare</dt><dd>{money(result.fareTotal)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Checked bags {flight.bagsIncluded ? "(included/waived)" : result.automaticBagTotal != null ? "(database estimate)" : "(entered)"}</dt><dd>{result.bagTotal == null ? "Enter amount" : money(result.bagTotal)}</dd></div>
              <div className="flex justify-between"><dt>Carry-ons</dt><dd>{money(result.carryTotal)}</dd></div>
              <div className="flex justify-between"><dt>Seats</dt><dd>{money(result.seatTotal)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-black"><dt>True trip cost</dt><dd>{result.total == null ? "Incomplete" : money(result.total)}</dd></div>
            </dl>
            <Link href={`/airlines/${flight.airline}`} className="mt-4 inline-block text-sm font-bold text-blue-700 underline">Check the airline rules and sources</Link>
          </article>;
        })}
      </div>

      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <h2 id="trip-cost-calculator" className="text-2xl font-black">{!totalsComplete ? "Enter the missing fee to compare these flights." : winner == null ? "These options currently tie." : `Flight ${winner === 0 ? "A" : "B"} is ${money(difference!)} cheaper.`}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">The result uses the advertised fares and ancillary choices above. Published checked-bag fees are calculated only when the database has a usable USD amount; variable prices remain visibly traveler-entered.</p>
      </div>
    </section>
  );
}
