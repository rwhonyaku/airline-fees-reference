"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AirlineRule = {
  slug: string;
  name: string;
  fareName: string;
  carryOnRisk: number;
  checkedBagRisk: number;
  flexibilityRisk: number;
  seatRisk: number;
  baseline: string;
  strongestWarning: string;
};

const AIRLINE_RULES: AirlineRule[] = [
  {
    slug: "united",
    name: "United",
    fareName: "Basic Economy",
    carryOnRisk: 4,
    checkedBagRisk: 3,
    flexibilityRisk: 3,
    seatRisk: 2,
    baseline: "Usually a bad fit if you need an overhead carry-on or might change plans.",
    strongestWarning: "United Basic Economy is the one to watch if you need more than a small personal item.",
  },
  {
    slug: "american",
    name: "American",
    fareName: "Basic Economy",
    carryOnRisk: 0,
    checkedBagRisk: 2,
    flexibilityRisk: 2,
    seatRisk: 2,
    baseline: "Usually easier for carry-on-only trips, but checked bags and seats can still change the price.",
    strongestWarning: "Price checked bags and seats before assuming Basic Economy is cheaper.",
  },
  {
    slug: "delta",
    name: "Delta",
    fareName: "Basic Economy",
    carryOnRisk: 0,
    checkedBagRisk: 2,
    flexibilityRisk: 4,
    seatRisk: 2,
    baseline: "The carry-on is usually allowed; the bigger issue is what happens if plans change.",
    strongestWarning: "Delta Basic is a poor fit when your dates are not firm.",
  },
  {
    slug: "jetblue",
    name: "JetBlue",
    fareName: "Blue Basic",
    carryOnRisk: 0,
    checkedBagRisk: 2,
    flexibilityRisk: 4,
    seatRisk: 2,
    baseline: "Blue Basic includes a carry-on now, but changes and cancellations are still limited.",
    strongestWarning: "Blue Basic is risky when you may need to cancel or change the trip.",
  },
  {
    slug: "alaska",
    name: "Alaska",
    fareName: "Saver",
    carryOnRisk: 0,
    checkedBagRisk: 2,
    flexibilityRisk: 3,
    seatRisk: 2,
    baseline: "Usually clearer than classic Basic Economy, but still not ideal if plans may change.",
    strongestWarning: "Saver is a bad match when flexibility matters more than the lowest fare.",
  },
  {
    slug: "southwest",
    name: "Southwest",
    fareName: "Basic Fare",
    carryOnRisk: 0,
    checkedBagRisk: 3,
    flexibilityRisk: 1,
    seatRisk: 3,
    baseline: "The carry-on is not the issue. Checked bags and seat choice are what you need to price.",
    strongestWarning: "Do the bag and seat math before treating Southwest Basic like old Southwest.",
  },
  {
    slug: "spirit",
    name: "Spirit",
    fareName: "Value",
    carryOnRisk: 4,
    checkedBagRisk: 4,
    flexibilityRisk: 3,
    seatRisk: 2,
    baseline: "The low fare works best only when you can travel very light and do not need much flexibility.",
    strongestWarning: "Spirit Value gets risky fast if you need a carry-on, checked bag, or flexible plans.",
  },
  {
    slug: "frontier",
    name: "Frontier",
    fareName: "Basic / Standard",
    carryOnRisk: 4,
    checkedBagRisk: 4,
    flexibilityRisk: 3,
    seatRisk: 2,
    baseline: "The low fare works best when you know your bags and plans before booking.",
    strongestWarning: "Frontier can stop being cheap once you add bags or make changes close to departure.",
  },
];

function verdictForScore(score: number) {
  if (score >= 8) {
    return {
      label: "High risk: compare the next fare",
      className: "border-rose-200 bg-rose-50 text-rose-950",
      detail:
        "The cheapest fare probably leaves out something this trip needs. Check the next fare before you book.",
    };
  }

  if (score >= 4) {
    return {
      label: "Maybe: add up the fees first",
      className: "border-amber-200 bg-amber-50 text-amber-950",
      detail:
        "This fare may still work, but only if bags, seats, and change limits do not wipe out the savings.",
    };
  }

  return {
    label: "Probably workable",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    detail:
      "Based on what you selected, this fare does not hit the biggest problem areas. Still check the exact route and fare rules before buying.",
  };
}

function buildToolHref(base: string, airline: string): string {
  const params = new URLSearchParams({
    airline,
    travelers: "2",
    bags: "1",
    trips: "2",
    pay: "yes",
  });
  if (base.includes("checked-baggage-calculator")) params.set("directions", "2");
  return `${base}?${params.toString()}`;
}

export function BasicEconomyDecisionTool() {
  const [airlineSlug, setAirlineSlug] = useState("united");
  const [needsCarryOn, setNeedsCarryOn] = useState(true);
  const [checksBag, setChecksBag] = useState(false);
  const [plansMayChange, setPlansMayChange] = useState(false);
  const [caresAboutSeat, setCaresAboutSeat] = useState(false);

  const rule = AIRLINE_RULES.find((item) => item.slug === airlineSlug) ?? AIRLINE_RULES[0];
  const result = useMemo(() => {
    const score =
      (needsCarryOn ? rule.carryOnRisk : 0) +
      (checksBag ? rule.checkedBagRisk : 0) +
      (plansMayChange ? rule.flexibilityRisk : 0) +
      (caresAboutSeat ? rule.seatRisk : 0);

    const reasons = [
      needsCarryOn && rule.carryOnRisk >= 3 ? "carry-on access" : null,
      checksBag && rule.checkedBagRisk >= 3 ? "checked-bag cost" : null,
      plansMayChange && rule.flexibilityRisk >= 3 ? "change or cancellation limits" : null,
      caresAboutSeat && rule.seatRisk >= 3 ? "seat certainty" : null,
    ].filter(Boolean) as string[];

    return { score, verdict: verdictForScore(score), reasons };
  }, [caresAboutSeat, checksBag, needsCarryOn, plansMayChange, rule]);

  return (
    <section id="basic-economy-tool" className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Basic Economy decision tool
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Should you avoid the cheapest fare?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Choose an airline and check what you need for the trip. The tool will show whether the
            cheapest fare is likely to cost more once bags, seats, or change rules are included.
          </p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-blue-100 bg-white p-5">
          <label className="text-sm font-bold text-slate-800">
            Airline / entry fare
            <select
              value={airlineSlug}
              onChange={(event) => setAirlineSlug(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
            >
              {AIRLINE_RULES.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} - {item.fareName}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={needsCarryOn}
                onChange={(event) => setNeedsCarryOn(event.target.checked)}
                className="mt-1"
              />
              I need a normal carry-on
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={checksBag}
                onChange={(event) => setChecksBag(event.target.checked)}
                className="mt-1"
              />
              I will check a bag
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={plansMayChange}
                onChange={(event) => setPlansMayChange(event.target.checked)}
                className="mt-1"
              />
              My plans might change
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={caresAboutSeat}
                onChange={(event) => setCaresAboutSeat(event.target.checked)}
                className="mt-1"
              />
              Seat choice matters
            </label>
          </div>

          <div className={`rounded-2xl border p-4 ${result.verdict.className}`}>
            <div className="text-xl font-black">{result.verdict.label}</div>
            <p className="mt-2 text-sm leading-relaxed">{result.verdict.detail}</p>
            <p className="mt-2 text-sm leading-relaxed">
              <span className="font-bold">{rule.name} {rule.fareName}:</span> {rule.baseline}
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {result.reasons.length
                ? `Main thing to check${result.reasons.length === 1 ? "" : "s"} before booking: ${result.reasons.join(", ")}.`
                : rule.strongestWarning}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/airlines/${rule.slug}`} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700">
              Review {rule.name} fees
            </Link>
            <Link href={buildToolHref("/tools/checked-baggage-calculator", rule.slug)} className="rounded-xl border border-blue-200 bg-white px-4 py-2 font-bold text-blue-800 hover:border-blue-400">
              Run bag calculator
            </Link>
            <Link href={buildToolHref("/best-cards", rule.slug)} className="rounded-xl border border-blue-200 bg-white px-4 py-2 font-bold text-blue-800 hover:border-blue-400">
              Check card offset
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
