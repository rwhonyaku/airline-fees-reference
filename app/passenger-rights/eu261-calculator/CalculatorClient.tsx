"use client";

import { useState } from "react";

type RegionValue = "eu" | "non-eu";
type CarrierValue = "eu" | "non-eu";
type YesNoValue = "yes" | "no";
type DistanceValue = "up-to-1500" | "1500-3500" | "over-3500";

function compensationLabel(distance: DistanceValue): string {
  switch (distance) {
    case "up-to-1500":
      return "EUR 250";
    case "1500-3500":
      return "EUR 400";
    case "over-3500":
      return "EUR 600";
  }
}

export function CalculatorClient() {
  const [departureCountry, setDepartureCountry] = useState<RegionValue>("eu");
  const [arrivalCountry, setArrivalCountry] = useState<RegionValue>("eu");
  const [operatingCarrier, setOperatingCarrier] = useState<CarrierValue>("eu");
  const [delayHours, setDelayHours] = useState("3");
  const [isCancelled, setIsCancelled] = useState<YesNoValue>("no");
  const [extraordinary, setExtraordinary] = useState<YesNoValue>("no");
  const [distanceBracket, setDistanceBracket] = useState<DistanceValue>("up-to-1500");

  const delayValue = Number(delayHours);
  const delayIsValid = Number.isFinite(delayValue) ? delayValue : 0;
  const covered =
    departureCountry === "eu" ||
    (arrivalCountry === "eu" && operatingCarrier === "eu");

  const coverageStatus = covered ? "Covered" : "Not covered";
  let eligibilityStatus = "Not indicated";

  if (!covered) {
    eligibilityStatus = "Not indicated";
  } else if (extraordinary === "yes") {
    eligibilityStatus = "Compensation excluded (informational)";
  } else if (isCancelled === "yes") {
    eligibilityStatus = "Depends on additional factors";
  } else if (delayIsValid >= 3) {
    eligibilityStatus = "May apply";
  } else {
    eligibilityStatus = "Not indicated";
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Departure country
          <select
            value={departureCountry}
            onChange={(event) => setDepartureCountry(event.target.value as RegionValue)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="eu">EU</option>
            <option value="non-eu">Non-EU</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Arrival country
          <select
            value={arrivalCountry}
            onChange={(event) => setArrivalCountry(event.target.value as RegionValue)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="eu">EU</option>
            <option value="non-eu">Non-EU</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Operating carrier
          <select
            value={operatingCarrier}
            onChange={(event) => setOperatingCarrier(event.target.value as CarrierValue)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="eu">EU</option>
            <option value="non-eu">Non-EU</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Delay hours
          <input
            value={delayHours}
            onChange={(event) => setDelayHours(event.target.value)}
            inputMode="decimal"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Cancellation
          <select
            value={isCancelled}
            onChange={(event) => setIsCancelled(event.target.value as YesNoValue)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Extraordinary circumstances
          <select
            value={extraordinary}
            onChange={(event) => setExtraordinary(event.target.value as YesNoValue)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Distance bracket
          <select
            value={distanceBracket}
            onChange={(event) => setDistanceBracket(event.target.value as DistanceValue)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="up-to-1500">Up to 1500 km</option>
            <option value="1500-3500">1500-3500 km</option>
            <option value="over-3500">Over 3500 km</option>
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Coverage status
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{coverageStatus}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Eligibility status
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{eligibilityStatus}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Compensation bracket
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {compensationLabel(distanceBracket)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Reduction note
            </div>
            <div className="mt-2 text-sm leading-relaxed text-slate-700">
              A possible 50% reduction exists under EU261. This calculator does not evaluate the
              conditions for that reduction.
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
          Final determination rests with the operating airline or the relevant regulator. This
          screening check only evaluates the inputs shown here and does not review every legal or
          factual condition that could affect a claim.
        </div>
      </section>
    </div>
  );
}
