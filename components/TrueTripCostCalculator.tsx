"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TripCostPilotProfile } from "@/lib/trip-cost-pilot";

type AirlineOption = {
  slug: string;
  name: string;
  checkedBagCoverage: boolean;
  carryOnCoverage: boolean;
  seatCoverage: boolean;
  lastVerified: string | null;
  pilotProfiles: TripCostPilotProfile[];
  bagBenefits: { id: string; name: string; freeCheckedBags: number; coveredTravelers: number; requiresCardPayment: boolean; verified: string }[];
};

type ComparisonPreset = {
  label: string;
  detail: string;
  route: string;
  airlineA: string;
  airlineB: string;
  currency: ComparisonCurrency;
  marketContext: string;
};

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "NOK", "DKK", "NZD", "CNY", "HKD", "SGD"] as const;
type ComparisonCurrency = typeof CURRENCIES[number];
const MARKET_CONTEXTS = [
  { value: "", label: "Choose market context" },
  { value: "us-domestic", label: "Within the United States" },
  { value: "us-short-haul", label: "U.S./Canada/Mexico/Caribbean or short haul" },
  { value: "transatlantic", label: "Transatlantic" },
  { value: "transpacific", label: "Transpacific / Asia" },
  { value: "other", label: "Other or mixed itinerary" },
] as const;

type FlightInput = {
  airline: string;
  profileId: string;
  fare: number | null;
  bagsIncluded: boolean;
  checkedBagTripTotal: number | null;
  paidCarryOns: number;
  carryOnFee: number | null;
  paidSeats: number;
  seatFee: number | null;
  otherTripFees: number;
  bagBenefitId: string;
  paymentChannel: "online" | "airport";
};

const EMPTY_FLIGHT: FlightInput = {
  airline: "",
  profileId: "",
  fare: null,
  bagsIncluded: false,
  checkedBagTripTotal: null,
  paidCarryOns: 0,
  carryOnFee: null,
  paidSeats: 0,
  seatFee: null,
  otherTripFees: 0,
  bagBenefitId: "",
  paymentChannel: "online",
};

type BagAssignment = "spread" | "single" | "custom";

function flightLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function money(value: number, currency: ComparisonCurrency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(value);
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function optionalNumberValue(value: string) {
  if (value.trim() === "") return null;
  return numberValue(value);
}

function boundedNumber(value: string | null, min: number, max: number, fallback: number) {
  if (value == null || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function restoredAmount(params: URLSearchParams, key: string): number | null {
  if (!params.has(key)) return null;
  const value = Number(params.get(key));
  return Number.isFinite(value) && value >= 0 && value <= 1_000_000 ? value : null;
}

function profileBagTotal(
  profile: TripCostPilotProfile,
  bags: number,
  travelers: number,
  directions: number,
  currency: ComparisonCurrency,
  assignment: BagAssignment,
  customBagCounts: number[],
  paymentChannel: "online" | "airport",
  benefit?: AirlineOption["bagBenefits"][number],
): number | null {
  if (bags === 0) return 0;

  let oneDirection = 0;
  const bagOwners = assignment === "single"
    ? Array.from({ length: bags }, () => 0)
    : assignment === "custom"
      ? customBagCounts.flatMap((count, travelerIndex) => Array.from({ length: count }, () => travelerIndex))
      : Array.from({ length: bags }, (_, bagIndex) => bagIndex % travelers);
  if (bagOwners.length !== bags) return null;
  const ordinalByTraveler = new Map<number, number>();
  for (const owner of bagOwners) {
    const travelerBagOrdinal = (ordinalByTraveler.get(owner) ?? 0) + 1;
    ordinalByTraveler.set(owner, travelerBagOrdinal);
    if (travelerBagOrdinal <= profile.checkedBaggage.includedPerTraveler) continue;

    if (benefit && owner < benefit.coveredTravelers && travelerBagOrdinal <= benefit.freeCheckedBags) continue;

    const paidOrdinal = travelerBagOrdinal - profile.checkedBaggage.includedPerTraveler;
    const channelFees = paymentChannel === "airport" ? profile.checkedBaggage.airportFeeByOrdinal : profile.checkedBaggage.feeByOrdinal;
    const fee = channelFees?.[paidOrdinal - 1]
      ?? profile.checkedBaggage.feeByOrdinal?.[paidOrdinal - 1]
      ?? profile.checkedBaggage.thirdPlusFee;
    if (fee == null || (fee > 0 && profile.currency !== currency)) return null;
    oneDirection += fee;
  }

  return oneDirection * directions;
}

export function TrueTripCostCalculator({ airlines, comparisonPresets }: { airlines: AirlineOption[]; comparisonPresets: ComparisonPreset[] }) {
  const [travelers, setTravelers] = useState(2);
  const [directions, setDirections] = useState(2);
  const [bags, setBags] = useState(1);
  const [currency, setCurrency] = useState<ComparisonCurrency>("USD");
  const [route, setRoute] = useState("");
  const [marketContext, setMarketContext] = useState("");
  const [bagAssignment, setBagAssignment] = useState<BagAssignment>("spread");
  const [customBagCounts, setCustomBagCounts] = useState<number[]>([1, 0]);
  const [shareStatus, setShareStatus] = useState("");
  const [flights, setFlights] = useState<FlightInput[]>([
    { ...EMPTY_FLIGHT },
    { ...EMPTY_FLIGHT },
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("v") !== "1") return;

    const restoredCurrency = params.get("c");
    const restoredFlights: FlightInput[] = [];
    for (let slot = 1; slot <= 4; slot += 1) {
      if (!params.has(`a${slot}`)) continue;
      const requestedAirline = params.get(`a${slot}`) ?? "";
      const airline = airlines.find((item) => item.slug === requestedAirline);
      const requestedProfile = params.get(`p${slot}`) ?? "";
      const profileId = airline?.pilotProfiles.some((profile) => profile.id === requestedProfile) ? requestedProfile : "";
      const requestedBenefit = params.get(`w${slot}`) ?? "";
      restoredFlights.push({
        airline: airline?.slug ?? "",
        profileId,
        fare: restoredAmount(params, `f${slot}`),
        bagsIncluded: params.get(`bi${slot}`) === "1",
        checkedBagTripTotal: restoredAmount(params, `bt${slot}`),
        paidCarryOns: Math.round(boundedNumber(params.get(`co${slot}`), 0, 9, 0)),
        carryOnFee: restoredAmount(params, `cf${slot}`),
        paidSeats: Math.round(boundedNumber(params.get(`s${slot}`), 0, 9, 0)),
        seatFee: restoredAmount(params, `sf${slot}`),
        otherTripFees: restoredAmount(params, `o${slot}`) ?? 0,
        bagBenefitId: airline?.bagBenefits.some((benefit) => benefit.id === requestedBenefit) ? requestedBenefit : "",
        paymentChannel: params.get(`pc${slot}`) === "airport" ? "airport" : "online",
      });
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (restoredCurrency && CURRENCIES.includes(restoredCurrency as ComparisonCurrency)) {
        setCurrency(restoredCurrency as ComparisonCurrency);
      }
      setTravelers(Math.round(boundedNumber(params.get("t"), 1, 9, 2)));
      setDirections(params.get("d") === "1" ? 1 : 2);
      setBags(Math.round(boundedNumber(params.get("b"), 0, 9, 1)));
      setRoute((params.get("r") ?? "").slice(0, 160));
      const restoredMarket = params.get("m") ?? "";
      setMarketContext(MARKET_CONTEXTS.some((item) => item.value === restoredMarket) ? restoredMarket : "");
      const restoredAssignment = params.get("ba");
      setBagAssignment(restoredAssignment === "single" || restoredAssignment === "custom" ? restoredAssignment : "spread");
      setCustomBagCounts((params.get("bc") ?? "").split(".").slice(0, 9).map((value) => Math.max(0, Math.min(9, Math.round(Number(value) || 0)))));
      if (restoredFlights.length >= 2) setFlights(restoredFlights);
    });
    return () => { cancelled = true; };
  }, [airlines]);

  const results = useMemo(() => flights.map((flight) => {
    const airline = airlines.find((item) => item.slug === flight.airline);
    const profile = airline?.pilotProfiles.find((item) => item.id === flight.profileId && (!item.marketContexts || item.marketContexts.includes(marketContext)));
    const benefit = airline?.bagBenefits.find((item) => item.id === flight.bagBenefitId);
    const automaticBagTotal = profile ? profileBagTotal(profile, bags, travelers, directions, currency, bagAssignment, customBagCounts, flight.paymentChannel, benefit) : null;
    const bagTotal = bags === 0 || (!profile && flight.bagsIncluded) ? 0 : automaticBagTotal ?? flight.checkedBagTripTotal;
    const fareTotal = flight.fare == null ? null : flight.fare * travelers;
    const carryTotal = flight.paidCarryOns === 0 ? 0 : flight.carryOnFee == null ? null : flight.carryOnFee * flight.paidCarryOns * directions;
    const seatTotal = flight.paidSeats === 0 ? 0 : flight.seatFee == null ? null : flight.seatFee * flight.paidSeats * directions;
    const total = fareTotal == null || bagTotal == null || carryTotal == null || seatTotal == null
      ? null
      : fareTotal + bagTotal + carryTotal + seatTotal + flight.otherTripFees;
    return { airline, profile, benefit, automaticBagTotal, bagTotal, carryTotal, fareTotal, seatTotal, total };
  }), [airlines, bagAssignment, bags, currency, customBagCounts, directions, flights, marketContext, travelers]);

  const totalsComplete = results.every((result) => result.total != null);
  const ranked = totalsComplete
    ? results.map((result, index) => ({ index, total: result.total! })).sort((a, b) => a.total - b.total)
    : [];
  const winner = ranked.length > 1 && ranked[0].total < ranked[1].total ? ranked[0].index : null;
  const difference = winner == null ? null : ranked[1].total - ranked[0].total;
  const runnerUp = ranked.length > 1 ? ranked[1].index : null;
  const winnerExplanation = winner != null && runnerUp != null
    ? (() => {
        const winning = results[winner];
        const other = results[runnerUp];
        const fareGap = (winning.fareTotal ?? 0) - (other.fareTotal ?? 0);
        const winningExtras = (winning.bagTotal ?? 0) + (winning.carryTotal ?? 0) + (winning.seatTotal ?? 0);
        const otherExtras = (other.bagTotal ?? 0) + (other.carryTotal ?? 0) + (other.seatTotal ?? 0);
        if (fareGap > 0 && winningExtras < otherExtras) return `Flight ${flightLabel(winner)} starts ${money(fareGap, currency)} higher on fare, but saves ${money(otherExtras - winningExtras, currency)} on modeled bags, carry-ons, and seats.`;
        if (fareGap < 0 && winningExtras > otherExtras) return `Flight ${flightLabel(winner)} adds ${money(winningExtras - otherExtras, currency)} more in modeled extras, but its fare starts ${money(Math.abs(fareGap), currency)} lower.`;
        return `Flight ${flightLabel(winner)} has the lower combined fare-and-fee total for the inputs above.`;
      })()
    : null;

  function updateFlight(index: number, patch: Partial<FlightInput>) {
    setFlights((current) => current.map((flight, flightIndex) => flightIndex === index ? { ...flight, ...patch } : flight));
  }

  function changeAirline(index: number, airline: string) {
    setFlights((current) => current.map((flight, flightIndex) => flightIndex === index ? {
      ...EMPTY_FLIGHT,
      airline,
    } : flight));
  }

  function changeDirections(nextDirections: number) {
    setDirections(nextDirections);
    setFlights((current) => current.map((flight) => ({
      ...flight,
      fare: null,
      checkedBagTripTotal: null,
      carryOnFee: null,
      seatFee: null,
      otherTripFees: 0,
    })));
  }

  function changeBagCount(nextBags: number) {
    setBags(nextBags);
    setFlights((current) => current.map((flight) => ({ ...flight, checkedBagTripTotal: null })));
  }

  function changeCurrency(nextCurrency: ComparisonCurrency) {
    setCurrency(nextCurrency);
    setFlights((current) => current.map((flight) => ({
      ...flight,
      fare: null,
      checkedBagTripTotal: null,
      carryOnFee: null,
      seatFee: null,
      otherTripFees: 0,
    })));
  }

  function changeMarketContext(nextMarket: string) {
    setMarketContext(nextMarket);
    setFlights((current) => current.map((flight) => {
      const airline = airlines.find((item) => item.slug === flight.airline);
      const profile = airline?.pilotProfiles.find((item) => item.id === flight.profileId);
      return profile?.marketContexts && !profile.marketContexts.includes(nextMarket)
        ? { ...flight, profileId: "", checkedBagTripTotal: null }
        : flight;
    }));
  }

  function changeProfile(index: number, profileId: string) {
    setFlights((current) => current.map((flight, flightIndex) => flightIndex === index ? {
      ...flight,
      profileId,
      bagsIncluded: false,
      checkedBagTripTotal: null,
      paidCarryOns: 0,
      carryOnFee: null,
      paidSeats: 0,
      seatFee: null,
    } : flight));
  }

  function applyPreset(preset: ComparisonPreset) {
    setRoute(preset.route);
    setCurrency(preset.currency);
    setMarketContext(preset.marketContext);
    setFlights([
      { ...EMPTY_FLIGHT, airline: preset.airlineA },
      { ...EMPTY_FLIGHT, airline: preset.airlineB },
    ]);
  }

  function addFlight() {
    setFlights((current) => current.length >= 4 ? current : [...current, { ...EMPTY_FLIGHT }]);
  }

  function removeFlight(index: number) {
    setFlights((current) => current.length <= 2 ? current : current.filter((_, flightIndex) => flightIndex !== index));
  }

  async function copyShareableComparison() {
    const params = new URLSearchParams({
      v: "1",
      t: String(travelers),
      d: String(directions),
      b: String(bags),
      c: currency,
    });
    if (route.trim()) params.set("r", route.trim().slice(0, 160));
    if (marketContext) params.set("m", marketContext);
    params.set("ba", bagAssignment);
    if (bagAssignment === "custom") params.set("bc", customBagCounts.slice(0, travelers).join("."));

    flights.forEach((flight, index) => {
      const slot = index + 1;
      params.set(`a${slot}`, flight.airline);
      if (flight.profileId) params.set(`p${slot}`, flight.profileId);
      if (flight.fare != null) params.set(`f${slot}`, String(flight.fare));
      if (flight.bagsIncluded) params.set(`bi${slot}`, "1");
      if (flight.checkedBagTripTotal != null) params.set(`bt${slot}`, String(flight.checkedBagTripTotal));
      if (flight.paidCarryOns) params.set(`co${slot}`, String(flight.paidCarryOns));
      if (flight.carryOnFee != null) params.set(`cf${slot}`, String(flight.carryOnFee));
      if (flight.paidSeats) params.set(`s${slot}`, String(flight.paidSeats));
      if (flight.seatFee != null) params.set(`sf${slot}`, String(flight.seatFee));
      if (flight.otherTripFees) params.set(`o${slot}`, String(flight.otherTripFees));
      if (flight.bagBenefitId) params.set(`w${slot}`, flight.bagBenefitId);
      if (flight.paymentChannel === "airport") params.set(`pc${slot}`, "airport");
    });

    const url = new URL(window.location.href);
    url.search = params.toString();
    url.hash = "";
    window.history.replaceState({}, "", url);

    try {
      await navigator.clipboard.writeText(url.toString());
      setShareStatus("Comparison link copied.");
    } catch {
      setShareStatus("Shareable link created in the address bar. Copy it from there.");
    }
  }

  return (
    <section className="grid gap-6" aria-label="True trip cost calculator">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-black text-slate-950">Start with flights that actually compete</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">Choose two or more flights you found for the same route and dates. The examples below are overlapping markets, not recommendations or live fare quotes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {comparisonPresets.map((preset) => (
            <button key={preset.route} type="button" onClick={() => applyPreset(preset)} className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm hover:border-blue-400 hover:bg-blue-50">
              <span className="block font-black text-slate-950">{preset.label}</span>
              <span className="mt-1 block text-slate-600">{preset.detail}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold text-slate-800">Route being compared
            <input value={route} onChange={(event) => setRoute(event.target.value)} placeholder="Example: Los Angeles (LAX)–Tokyo (NRT)" className="mt-2 w-full rounded-xl border-slate-300" />
          </label>
          <label className="text-sm font-bold text-slate-800">Market context
            <select value={marketContext} onChange={(event) => changeMarketContext(event.target.value)} className="mt-2 w-full rounded-xl border-slate-300">
              {MARKET_CONTEXTS.map((item) => <option key={item.value || "none"} value={item.value}>{item.label}</option>)}
            </select>
            <span className="mt-1 block font-normal text-slate-500">This limits fare rules to markets where the stored policy applies.</span>
          </label>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-bold text-slate-800">Travelers
          <input type="number" min={1} max={9} step={1} value={travelers} onChange={(event) => setTravelers(Math.min(9, Math.max(1, Math.round(numberValue(event.target.value)))))} className="mt-2 w-full rounded-xl border-slate-300" />
        </label>
        <label className="text-sm font-bold text-slate-800">Trip type
          <select value={directions} onChange={(event) => changeDirections(Number(event.target.value))} className="mt-2 w-full rounded-xl border-slate-300">
            <option value={2}>Roundtrip</option><option value={1}>One-way</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-800">Checked bags each direction, whole party
          <input type="number" min={0} max={9} step={1} value={bags} onChange={(event) => changeBagCount(Math.min(9, Math.max(0, Math.round(numberValue(event.target.value)))))} className="mt-2 w-full rounded-xl border-slate-300" />
        </label>
        <label className="text-sm font-bold text-slate-800">Comparison currency
          <select value={currency} onChange={(event) => changeCurrency(event.target.value as ComparisonCurrency)} className="mt-2 w-full rounded-xl border-slate-300">
            {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        <strong>Use one currency throughout:</strong> this calculator does not estimate exchange rates. Enter every competing fare and fee in {currency}. If the airlines quote different currencies, convert one checkout total using a rate you trust before entering it here. Our records show whether an airline publishes checked-bag, carry-on, and seat rules, but route- and fare-dependent amounts still come from your actual checkout.
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-bold text-slate-800">Who checks the bags?
          <select value={bagAssignment} onChange={(event) => setBagAssignment(event.target.value as BagAssignment)} className="mt-2 w-full rounded-xl border-slate-300">
            <option value="spread">Spread bags across travelers</option>
            <option value="single">All bags belong to one traveler</option>
            <option value="custom">Custom bags per traveler</option>
          </select>
          <span className="mt-1 block font-normal text-slate-500">Bag ordinals are charged per traveler. Two first bags can cost less than one traveler&apos;s first and second bags.</span>
        </label>
        {bagAssignment === "custom" ? <div>
          <div className="text-sm font-bold text-slate-800">Bags assigned to each traveler</div>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: travelers }, (_, travelerIndex) => <label key={travelerIndex} className="text-xs font-bold text-slate-600">Traveler {travelerIndex + 1}
              <input type="number" min={0} max={9} value={customBagCounts[travelerIndex] ?? 0} onChange={(event) => setCustomBagCounts((current) => Array.from({ length: travelers }, (_, index) => index === travelerIndex ? Math.max(0, Math.min(9, Math.round(numberValue(event.target.value)))) : current[index] ?? 0))} className="mt-1 w-full rounded-lg border-slate-300" />
            </label>)}
          </div>
          <div className={`mt-2 text-xs font-bold ${customBagCounts.slice(0, travelers).reduce((sum, value) => sum + value, 0) === bags ? "text-emerald-700" : "text-rose-700"}`}>
            Assigned {customBagCounts.slice(0, travelers).reduce((sum, value) => sum + value, 0)} of {bags} bags. Totals remain incomplete until these match.
          </div>
        </div> : <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{bagAssignment === "single" ? "The calculator applies first-, second-, and later-bag pricing to one traveler." : "The calculator gives each traveler one bag before assigning anyone a second bag."}</div>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {flights.map((flight, index) => {
          const result = results[index];
          return <article key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs font-black uppercase tracking-widest text-blue-700">Flight {flightLabel(index)}</div>
              {flights.length > 2 ? <button type="button" onClick={() => removeFlight(index)} className="text-xs font-bold text-slate-500 underline hover:text-red-700">Remove</button> : null}
            </div>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-bold">Airline
                <select value={flight.airline} onChange={(event) => changeAirline(index, event.target.value)} className="mt-2 w-full rounded-xl border-slate-300">
                  <option value="">Choose an airline</option>
                  {airlines.map((airline) => <option key={airline.slug} value={airline.slug}>{airline.name}</option>)}
                </select>
              </label>
              {result.airline ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="font-bold text-slate-800">Policy records available</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span>{result.airline.checkedBagCoverage ? "Checked bags ✓" : "Checked bags —"}</span>
                  <span>{result.airline.carryOnCoverage ? "Carry-on ✓" : "Carry-on —"}</span>
                  <span>{result.airline.seatCoverage ? "Seats ✓" : "Seats —"}</span>
                </div>
                {result.airline.lastVerified ? <div className="mt-2">Latest source check in this airline record: {result.airline.lastVerified}</div> : null}
              </div> : null}
              {result.airline?.pilotProfiles.length ? <label className="text-sm font-bold">Fare or bundle
                <select value={flight.profileId} onChange={(event) => changeProfile(index, event.target.value)} className="mt-2 w-full rounded-xl border-slate-300">
                  <option value="">Use manual checkout inputs</option>
                  {result.airline.pilotProfiles
                    .filter((profile) => !profile.marketContexts || (marketContext && profile.marketContexts.includes(marketContext)))
                    .map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
                </select>
                {!marketContext && result.airline.pilotProfiles.some((profile) => profile.marketContexts?.length) ? <span className="mt-1 block font-normal text-amber-700">Choose a market context to unlock route-specific verified fare rules.</span> : null}
              </label> : null}
              {result.profile ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-950">
                <div className="font-black">Applied rule: {result.profile.label}</div>
                <p className="mt-1">{result.profile.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white px-2 py-1">Checked allowance: {result.profile.checkedBaggage.includedPerTraveler} per traveler</span>
                  <span className="rounded-full bg-white px-2 py-1">Carry-on: {result.profile.carryOnIncluded ? "included" : "checkout-priced"}</span>
                  <span className="rounded-full bg-white px-2 py-1">Standard seat: {result.profile.standardSeatIncluded ? "no added fee modeled" : "checkout-priced"}</span>
                </div>
                <div className="mt-2 text-xs">{bagAssignment === "single" ? "All checked bags are priced as belonging to one traveler." : bagAssignment === "custom" ? "Checked bags follow the traveler-by-traveler assignment entered above." : "Each traveler receives one checked bag before anyone is assigned a second bag."} Fixed paid amounts apply only when the comparison currency matches {result.profile.currency}; included allowances remain zero in any currency.</div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
                  {result.profile.sources.map((source, sourceIndex) => <a key={`${source.url}-${sourceIndex}`} href={source.url} target="_blank" rel="noreferrer" className="underline">{source.label} · verified {source.lastVerified}</a>)}
                </div>
              </div> : null}
              {result.profile?.checkedBaggage.airportFeeByOrdinal ? <label className="text-sm font-bold">Checked-bag payment channel
                <select value={flight.paymentChannel} onChange={(event) => updateFlight(index, { paymentChannel: event.target.value as "online" | "airport" })} className="mt-2 w-full rounded-xl border-slate-300">
                  <option value="online">Online / prepaid</option>
                  <option value="airport">At the airport</option>
                </select>
                <span className="mt-1 block font-normal text-slate-500">The automatic bag total uses the airline&apos;s verified channel-specific amount.</span>
              </label> : null}
              {result.airline?.bagBenefits.length ? <label className="text-sm font-bold">Verified checked-bag benefit
                <select value={flight.bagBenefitId} onChange={(event) => updateFlight(index, { bagBenefitId: event.target.value })} className="mt-2 w-full rounded-xl border-slate-300">
                  <option value="">No verified card benefit applied</option>
                  {result.airline.bagBenefits.map((benefit) => <option key={benefit.id} value={benefit.id}>{benefit.name}</option>)}
                </select>
                {result.benefit ? <span className="mt-2 block rounded-lg border border-blue-200 bg-blue-50 p-2 font-normal text-blue-950">Applies up to {result.benefit.freeCheckedBags} checked {result.benefit.freeCheckedBags === 1 ? "bag" : "bags"} for {Math.min(travelers, result.benefit.coveredTravelers)} eligible {Math.min(travelers, result.benefit.coveredTravelers) === 1 ? "traveler" : "travelers"}. {result.benefit.requiresCardPayment ? "The ticket must be purchased with the eligible card." : "Card payment is not modeled as a requirement."} Verified {result.benefit.verified}. This waiver is applied only when the fare profile has deterministic bag prices.</span> : null}
              </label> : null}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600"><strong>Other waivers:</strong> elite status, military, premium-cabin, and unlisted benefits remain manual unless the exact entitlement is supported here. Enter the airline checkout total after the benefit instead of assuming every bag is free.</div>
              <label className="text-sm font-bold">Advertised fare per traveler, including mandatory taxes ({currency})
                <input type="number" min={0} step="0.01" required value={flight.fare ?? ""} onChange={(event) => updateFlight(index, { fare: optionalNumberValue(event.target.value) })} placeholder="Enter the fare you found" className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
              {bags > 0 && !result.profile ? <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold">
                <input type="checkbox" checked={flight.bagsIncluded} onChange={(event) => updateFlight(index, { bagsIncluded: event.target.checked })} className="mt-0.5 rounded border-slate-300" />
                <span>These checked bags are included or waived<span className="mt-1 block font-normal text-slate-600">Use this only when the selected fare, cabin, status, or card benefit covers them.</span></span>
              </label> : null}
              {bags > 0 && !flight.bagsIncluded && result.automaticBagTotal == null ? <label className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold">Checked-bag total for the whole trip ({currency})
                <input type="number" min={0} step="0.01" required value={flight.checkedBagTripTotal ?? ""} onChange={(event) => updateFlight(index, { checkedBagTripTotal: optionalNumberValue(event.target.value) })} placeholder="Enter airline checkout total" className="mt-2 w-full rounded-xl border-amber-300 bg-white" />
                <span className="mt-2 block font-normal text-amber-900">Use the total for {bags} {bags === 1 ? "bag" : "bags"} each direction across the whole party. The selected profile cannot determine this amount because the airline uses checkout pricing, the allowance is exceeded, or its fixed fee is published in another currency.</span>
              </label> : null}
              <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                <label className="text-sm font-bold">Paid carry-ons each direction
                  <input type="number" min={0} max={travelers} step={1} value={flight.paidCarryOns} onChange={(event) => updateFlight(index, { paidCarryOns: Math.min(travelers, Math.max(0, Math.round(numberValue(event.target.value)))) })} className="mt-2 w-full rounded-xl border-slate-300" />
                </label>
                <label className="text-sm font-bold">Fee per paid carry-on, each way ({currency})
                  <input type="number" min={0} step="0.01" disabled={flight.paidCarryOns === 0} required={flight.paidCarryOns > 0} value={flight.carryOnFee ?? ""} onChange={(event) => updateFlight(index, { carryOnFee: optionalNumberValue(event.target.value) })} placeholder={flight.paidCarryOns === 0 ? "Not needed" : "Enter fee"} className="mt-2 w-full rounded-xl border-slate-300 disabled:bg-slate-100" />
                </label>
              </div>
              <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                <label className="text-sm font-bold">Paid seat selections each direction
                  <input type="number" min={0} max={travelers} step={1} value={flight.paidSeats} onChange={(event) => updateFlight(index, { paidSeats: Math.min(travelers, Math.max(0, Math.round(numberValue(event.target.value)))) })} className="mt-2 w-full rounded-xl border-slate-300" />
                </label>
                <label className="text-sm font-bold">Fee per selected seat, each way ({currency})
                  <input type="number" min={0} step="0.01" disabled={flight.paidSeats === 0} required={flight.paidSeats > 0} value={flight.seatFee ?? ""} onChange={(event) => updateFlight(index, { seatFee: optionalNumberValue(event.target.value) })} placeholder={flight.paidSeats === 0 ? "Not needed" : "Enter fee"} className="mt-2 w-full rounded-xl border-slate-300 disabled:bg-slate-100" />
                </label>
              </div>
              <label className="text-sm font-bold">Other fees for the whole trip ({currency})
                <input type="number" min={0} step="0.01" value={flight.otherTripFees} onChange={(event) => updateFlight(index, { otherTripFees: numberValue(event.target.value) })} className="mt-2 w-full rounded-xl border-slate-300" />
              </label>
            </div>
            <dl className="mt-5 grid gap-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between gap-4"><dt>Fare</dt><dd>{result.fareTotal == null ? "Enter fare" : money(result.fareTotal, currency)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Checked bags {flight.bagsIncluded ? "(included)" : result.automaticBagTotal != null ? result.benefit ? "(verified rule + benefit)" : "(verified rule)" : ""}</dt><dd>{result.bagTotal == null ? "Enter trip total" : money(result.bagTotal, currency)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Carry-ons</dt><dd>{result.carryTotal == null ? "Enter amount" : money(result.carryTotal, currency)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Seats</dt><dd>{result.seatTotal == null ? "Enter amount" : money(result.seatTotal, currency)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-black"><dt>True trip cost</dt><dd>{result.total == null ? "Incomplete" : money(result.total, currency)}</dd></div>
              {result.total != null ? <div className="flex justify-between gap-4 text-xs text-slate-500"><dt>Effective cost per traveler</dt><dd>{money(result.total / travelers, currency)}</dd></div> : null}
            </dl>
            {flight.airline ? <Link href={`/airlines/${flight.airline}`} className="mt-4 inline-block text-sm font-bold text-blue-700 underline">Check the airline rules and sources</Link> : null}
          </article>;
        })}
      </div>

      {flights.length < 4 ? <button type="button" onClick={addFlight} className="justify-self-start rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-black text-blue-800 hover:bg-blue-50">+ Compare another flight</button> : null}

      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <h2 className="text-2xl font-black text-white">{!totalsComplete ? "Complete the missing prices to compare these flights." : winner == null ? "The lowest-cost options currently tie." : `Flight ${flightLabel(winner)} is ${money(difference!, currency)} cheaper than the next option.`}</h2>
        {winnerExplanation ? <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-100">{winnerExplanation}</p> : null}
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Compare the completed totals, then confirm any price that can change by route, fare, or purchase timing during checkout.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={copyShareableComparison} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 hover:bg-blue-50">Copy shareable comparison</button>
          {shareStatus ? <span className="text-sm text-slate-300" role="status">{shareStatus}</span> : null}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">The link contains only the route label, calculator choices, and amounts shown here. It stores no name, email, booking reference, or account information.</p>
      </div>
    </section>
  );
}
