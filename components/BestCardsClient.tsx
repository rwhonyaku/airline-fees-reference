"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { FeeItem } from "@/lib/types";
import type { ToolAirline } from "@/lib/tool-airline";
import {
  calcCardBagOffset,
  clampInt,
  findCheckedBagFeeUsd,
  getCheckedBagFeeMap,
  safeExternalUrl,
  usd,
  type AirlineOverrides,
  type Card,
} from "@/lib/bag-cost-calculator";

const PAGE_REVIEWED = "2026-09-10";

function parseLowerRangeAmountUsd(amount: FeeItem["amount"]): number | null {
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  if (typeof amount !== "string") return null;

  const match = amount.trim().match(/^\$?\s*(\d+(?:\.\d+)?)\s*[-–]\s*\$?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const low = Number(match[1]);
  const high = Number(match[2]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  return Math.min(low, high);
}

function bagOrdinalMatches(row: FeeItem, ordinal: number): boolean {
  const conditions = typeof row.conditions === "string" ? row.conditions.toLowerCase() : "";
  if (ordinal === 1) {
    return conditions.includes("1st checked bag") || conditions.includes("first checked bag") || conditions.includes("bag 1");
  }
  if (ordinal === 2) {
    return conditions.includes("2nd checked bag") || conditions.includes("second checked bag") || conditions.includes("bag 2");
  }
  if (ordinal === 3) {
    return conditions.includes("3rd checked bag") || conditions.includes("third checked bag") || conditions.includes("bag 3");
  }
  return false;
}

function getCardMathBagFeeMap(fees: FeeItem[], maxBags: number): Map<number, number> {
  const map = getCheckedBagFeeMap(fees, maxBags);

  for (let ordinal = 1; ordinal <= maxBags; ordinal += 1) {
    if (map.has(ordinal)) continue;

    const fallback = fees
      .filter((row) => {
        if (row.category !== "checked_baggage") return false;
        if (row.currency && row.currency.toUpperCase() !== "USD") return false;
        if (!bagOrdinalMatches(row, ordinal)) return false;
        const appliesTo = typeof row.applies_to === "string" ? row.applies_to.toLowerCase() : "";
        return !appliesTo.includes("blue plus") && parseLowerRangeAmountUsd(row.amount) != null;
      })
      .sort((a, b) => {
        const verifiedA = typeof a.last_verified === "string" ? a.last_verified : "";
        const verifiedB = typeof b.last_verified === "string" ? b.last_verified : "";
        return verifiedB.localeCompare(verifiedA);
      })[0];

    const fee = fallback ? parseLowerRangeAmountUsd(fallback.amount) : null;
    if (fee != null) map.set(ordinal, fee);
  }

  return map;
}

function verdictForResult(r: ReturnType<typeof calcCardBagOffset>): {
  label: string;
  detail: string;
  className: string;
} {
  if (!r.eligible) {
    return {
      label: "Needs a route-specific fee lookup",
      detail:
        "The calculator needs a published first checked bag fee and applicable benefit rules before it can make a card judgment.",
      className: "border-amber-200 bg-amber-50 text-amber-950",
    };
  }

  if (r.savingsPerTripUsd <= 0) {
    return {
      label: "Not justified by bag fees",
      detail:
        "With these inputs, the card does not offset recurring checked-bag fees.",
      className: "border-rose-200 bg-rose-50 text-rose-950",
    };
  }

  if (r.netAnnualUsd >= 0) {
    return {
      label: "Worth it on calculated bag savings alone",
      detail:
        "The calculated checked-bag savings cover the annual fee before counting points, credits, lounge access, or other perks.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    };
  }

  return {
    label: "Only worth it if you value non-bag perks",
    detail:
      "The checked-bag savings help, but they do not cover the annual fee by themselves under these inputs.",
    className: "border-slate-200 bg-slate-50 text-slate-800",
  };
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

function plural(n: number, singular: string, pluralLabel = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralLabel}`;
}

const QUICK_SCENARIOS = [
  {
    label: "Solo traveler",
    description: "1 traveler, 1 checked bag, 2 roundtrips per year",
    airline: "united",
    travelers: 1,
    bags: 1,
    trips: 2,
  },
  {
    label: "Couple",
    description: "2 travelers, 1 checked bag each, 2 roundtrips per year",
    airline: "delta",
    travelers: 2,
    bags: 1,
    trips: 2,
  },
  {
    label: "Family trip pattern",
    description: "4 travelers, 1 checked bag each, 1 roundtrip per year",
    airline: "american",
    travelers: 4,
    bags: 1,
    trips: 1,
  },
  {
    label: "Repeat Alaska traveler",
    description: "2 travelers, 1 checked bag each, 3 roundtrips per year",
    airline: "alaska",
    travelers: 2,
    bags: 1,
    trips: 3,
  },
];

function scenarioHref(scenario: (typeof QUICK_SCENARIOS)[number]): string {
  const params = new URLSearchParams({
    airline: scenario.airline,
    travelers: String(scenario.travelers),
    bags: String(scenario.bags),
    trips: String(scenario.trips),
    pay: "yes",
  });

  return `/best-cards?${params.toString()}`;
}

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

export function BestCardsClient({
  airlines,
  cards,
  overrides,
}: {
  airlines: ToolAirline[];
  cards: Card[];
  overrides: AirlineOverrides;
}) {
  const queryString = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerLocationSearch
  );
  const sp = new URLSearchParams(queryString);
  const requestedAirlineSlug = sp.get("airline") || "united";
  const airline = airlines.find((item) => item.slug === requestedAirlineSlug) ?? airlines[0];
  const airlineSlug = airline.slug;

  const travelers = clampInt(sp.get("travelers") ?? undefined, 1, 9, 2);
  const bags = clampInt(sp.get("bags") ?? undefined, 0, 2, 1);
  const trips = clampInt(sp.get("trips") ?? undefined, 0, 30, 2);
  const payWithCard = (sp.get("pay") ?? "yes") !== "no";

  const fees = (airline.fees ?? []) as FeeItem[];
  const feeByBagOrdinal = getCardMathBagFeeMap(fees, bags);
  const firstBagFeeUsd = feeByBagOrdinal.get(1) ?? findCheckedBagFeeUsd(fees, 1);

  const airlineOverrides = overrides?.[airlineSlug];
  const allCardsForAirline = cards.filter((card) => card.airline_slug === airlineSlug);

  if (allCardsForAirline.length === 0) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-800">
            No reliable bag-fee comparison available
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
            No verified recurring free checked bag card is available for {airline.name} in this calculator.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
            That does not mean a baggage exception can never apply. It means this calculator does
            not currently have a verified co-branded card entry that behaves like a reusable
            checked-bag waiver for {airline.name}.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
            To qualify for comparison, a card needs a published checked-bag waiver, clear traveler coverage,
            a usable annual fee, and baggage fees that can be compared against that annual fee without
            guessing. Cards that mainly offer points, lounge access, status paths, baggage-delay
            protection, or non-USD annual fees may still be useful, but they are not clean bag-fee
            break-even inputs yet.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">What to do instead</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Price the checked-bag bill first. If the airline uses route, fare, allowance, or
              currency-specific pricing, the bag calculator will explain the lookup instead of
              inventing a number.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Why this builds trust</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              A blank card match is better than forcing a weak recommendation. The site only models
              card savings when the bag benefit can be compared against cash checked-bag fees.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">Cards currently covered</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Current verified benefit coverage is focused on Alaska, Air Canada, American,
              United, Delta, and JetBlue.
            </p>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 underline">
            Review {airline.name} fees
          </Link>
          <Link href={`/tools/checked-baggage-calculator?airline=${encodeURIComponent(airlineSlug)}&travelers=${travelers}&bags=${bags}&directions=2&trips=${trips}&pay=${payWithCard ? "yes" : "no"}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 underline">
            Estimate checked-bag cost
          </Link>
          <Link href="/guides/airline-credit-card-baggage-benefits" className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 underline">
            See supported card benefits
          </Link>
          <Link href="/fees/checked_baggage" className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 underline">
            Compare checked-bag fees
          </Link>
        </div>
      </main>
    );
  }

  const computed = allCardsForAirline
    .map((card) => ({
      card,
      r: calcCardBagOffset({
        feeByBagOrdinal,
        directions: 2,
        roundtripsPerYear: trips,
        travelers,
        bagsPerTravelerPerDirection: bags,
        card,
        userWillPayWithCard: payWithCard,
        airlineOverrides,
      }),
    }))
    .sort((a, b) => {
      const netDiff = b.r.netAnnualUsd - a.r.netAnnualUsd;
      if (netDiff !== 0) return netDiff;
      const beA = a.r.breakEvenRoundtrips ?? Number.POSITIVE_INFINITY;
      const beB = b.r.breakEvenRoundtrips ?? Number.POSITIVE_INFINITY;
      if (beA !== beB) return beA - beB;
      return a.card.annual_fee_usd - b.card.annual_fee_usd;
    });

  const top = computed[0];
  const topVerdict = verdictForResult(top.r);
  const topOfferUrl = safeExternalUrl(top.card.offer_url);
  const calculatorHref = `/tools/checked-baggage-calculator?airline=${encodeURIComponent(airlineSlug)}&travelers=${travelers}&bags=${bags}&directions=2&trips=${trips}&pay=${payWithCard ? "yes" : "no"}`;
  const netLabel = top.r.netAnnualUsd >= 0 ? `save about ${usd(top.r.netAnnualUsd)}` : `come up about ${usd(Math.abs(top.r.netAnnualUsd))} short`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-700">Checked-bag card math</div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
              Will a free checked bag card actually save you money?
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              For {airline.name}, this setup would produce about{" "}
              <span className="font-bold text-slate-950">{usd(top.r.annualSavingsUsd)}</span> in calculated annual checked-bag savings before the card annual fee. After the annual fee, the top match would{" "}
              <span className="font-bold text-slate-950">{netLabel}</span>.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              This is a baggage-fee break-even calculator, not a general travel-card ranking. It uses published checked-bag fees, card annual fees, traveler coverage, and card-payment rules. It does not count points, lounge access, statement credits, or sign-up bonuses.
            </p>
          </div>
          <div className={`rounded-2xl border p-5 lg:w-72 ${topVerdict.className}`}>
            <div className="text-xs font-bold uppercase tracking-widest">Answer first</div>
            <div className="mt-2 text-xl font-extrabold">{topVerdict.label}</div>
            <p className="mt-2 text-sm leading-relaxed">{topVerdict.detail}</p>
            {top.r.breakEvenRoundtrips != null ? (
              <p className="mt-2 text-sm leading-relaxed">
                Breaks even after <span className="font-bold">{plural(top.r.breakEvenRoundtrips, "roundtrip")}</span> per year.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="#card-inputs" className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">
            Change the inputs
          </Link>
          <Link href={calculatorHref} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 underline">
            Price this baggage scenario
          </Link>
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-blue-700 underline">
            Review {airline.name} fees
          </Link>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Page reviewed: <span className="font-medium">{PAGE_REVIEWED}</span>. Individual benefit-check dates appear with each card. Start with the selected airline&apos;s{" "}
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="text-blue-700 underline">
            fee page
          </Link>
          , the{" "}
          <Link href="/fees/checked_baggage" className="text-blue-700 underline">
            checked baggage fee reference
          </Link>
          , or the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="text-blue-700 underline">
            credit card baggage benefit guide
          </Link>{" "}
          if you want to check the source context behind the math.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What this calculator models</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>First checked bag savings from the airline fee details on this site.</li>
            <li>Annual fee cost for the airline card.</li>
            <li>Traveler-count limits and card-payment requirements where they apply.</li>
            <li>For published fee ranges, the lower end is used so estimated savings are conservative.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-bold text-slate-900">What this calculator does not model</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>Points value or award-travel value.</li>
            <li>Lounge access, upgrade priority, or companion certificates.</li>
            <li>Sign-up bonuses, statement credits, or unrelated travel perks.</li>
          </ul>
        </div>
      </section>

      <form
        key={`${airlineSlug}-${travelers}-${bags}-${trips}-${payWithCard}`}
        id="card-inputs"
        method="get"
        className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Your baggage setup</div>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Run the card break-even math</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Use the actual number of people and checked bags you expect to pay for. A card only makes sense here when the recurring bag savings beat the annual fee.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Airline</label>
            <AirlineSelect airlines={airlines} value={airlineSlug} />
            <p className="mt-2 text-xs text-slate-500">
              First bag fee used:{" "}
              <span className="font-medium text-slate-700">
                {firstBagFeeUsd != null ? usd(firstBagFeeUsd) : "Not published"}
              </span>
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Pay with the card?</label>
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

        <div className="grid gap-4 md:grid-cols-3">
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
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Checked bags / traveler (one-way)
            </label>
            <select
              name="bags"
              defaultValue={String(bags)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Roundtrips / year</label>
            <input
              name="trips"
              defaultValue={String(trips)}
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Compare card tiers
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-bold text-slate-900">Try common trip patterns</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_SCENARIOS.map((scenario) => (
            <Link
              key={scenario.label}
              href={scenarioHref(scenario)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="font-bold text-slate-950">{scenario.label}</div>
              <p className="mt-2 leading-relaxed text-slate-600">{scenario.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-600">What the card math is testing</div>
        <h2 className="text-2xl font-extrabold text-slate-950">
          {top.r.eligible
            ? `About ${usd(top.r.annualSavingsUsd)} in calculated annual checked-bag savings for the top match.`
            : "This airline needs a first-bag fee lookup before card math can be trusted."}
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Scenario</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {plural(travelers, "traveler")}, {plural(bags, "checked bag")} each way, {plural(trips, "roundtrip")} per year.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Fee used</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {firstBagFeeUsd != null
                ? `${usd(firstBagFeeUsd)} first checked bag fee${bags > 1 && feeByBagOrdinal.get(2) != null ? ` and ${usd(feeByBagOrdinal.get(2) ?? 0)} second checked bag fee` : ""}, multiplied by eligible travelers and roundtrip directions. Range-priced fees use the lower published amount.`
                : "No fixed USD first checked bag fee is available for this airline in the current fee data."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Important limit</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              This page tests bag-fee savings against annual fees. It does not add points, credits, lounge access, or sign-up bonuses.
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          If you are checking more than one bag per traveler, this page only counts bag positions
          covered by the card&apos;s published benefit and available fee data. Use the checked baggage
          calculator to estimate the full cash bill for first, second, and third bags.
        </p>
      </section>

      <div className={`mt-8 rounded-2xl border p-6 ${topVerdict.className}`}>
        <div className="text-xs font-bold uppercase tracking-widest">Calculator verdict</div>
        <div className="mt-2 text-2xl font-extrabold">{topVerdict.label}</div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed">{topVerdict.detail}</p>
        {top.r.breakEvenRoundtrips != null ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed">
            This card breaks even after{" "}
            <span className="font-bold">{plural(top.r.breakEvenRoundtrips, "roundtrip")}</span> per year on calculated
            checked-bag savings alone.
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
          Top baggage match for these inputs
        </div>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{top.card.name}</div>
            <div className="mt-1 text-sm text-slate-700">
              Annual fee: <span className="font-semibold">{usd(top.card.annual_fee_usd)}</span>
              {top.card.tier ? ` | Tier: ${top.card.tier}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-700">Estimated value after annual fee</div>
            <div
              className={
                top.r.netAnnualUsd >= 0
                  ? "text-3xl font-extrabold text-emerald-800"
                  : "text-3xl font-extrabold text-rose-700"
              }
            >
              {top.r.netAnnualUsd >= 0 ? "+" : "-"}
              {usd(Math.abs(top.r.netAnnualUsd))}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-slate-700">
          This is not a general card recommendation. It only compares calculated checked-bag savings
          against the annual fee. Delta&apos;s domestic second-bag waiver is not counted because it
          applies to eligible Basic Card Members rather than every companion covered by the first-bag benefit.
        </div>

        {top.r.breakEvenRoundtrips != null && (
          <div className="mt-3 text-sm text-slate-700">
            Break-even point: <span className="font-semibold">{top.r.breakEvenRoundtrips}</span>{" "}
            roundtrip(s) per year
          </div>
        )}

        {top.r.warnings.length > 0 && (
          <div className="mt-3 text-sm text-rose-700">{top.r.warnings[0]}</div>
        )}

        {topOfferUrl ? (
          <div className="mt-5 flex flex-col gap-2 border-t border-emerald-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-relaxed text-slate-600">
              {top.card.issuer_disclosure ??
                "Issuer terms can change. Verify the annual fee, baggage benefit, and application terms before applying."}
            </div>
            <a
              href={topOfferUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              {top.card.offer_label || "Check issuer terms"}
            </a>
          </div>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Cards included for {airline.name}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2 pr-4">Card</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Annual fee</th>
                <th className="py-2 pr-4">Savings / RT</th>
                <th className="py-2 pr-4">Annual savings</th>
                <th className="py-2 pr-4">Net</th>
                <th className="py-2 pr-4">Break-even RTs</th>
                <th className="py-2 pr-4">Next step</th>
              </tr>
            </thead>
            <tbody>
              {computed.map(({ card, r }) => {
                const offerUrl = safeExternalUrl(card.offer_url);
                const verdict = verdictForResult(r);

                return (
                  <tr key={card.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">{card.name}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">{verdict.label}</div>
                      {r.warnings.length > 0 && (
                        <div className="mt-2 text-xs text-rose-700">{r.warnings[0]}</div>
                      )}
                      {card.last_offer_verified ? (
                        <div className="mt-2 text-xs text-slate-500">
                          Offer link verified: {card.last_offer_verified}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{card.tier ?? "-"}</td>
                    <td className="py-3 pr-4 text-slate-700">{usd(card.annual_fee_usd)}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {r.eligible ? usd(r.savingsPerTripUsd) : "-"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {r.eligible ? usd(r.annualSavingsUsd) : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {r.eligible ? (
                        <span
                          className={
                            r.netAnnualUsd >= 0
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-rose-700"
                          }
                        >
                          {r.netAnnualUsd >= 0 ? "+" : "-"}
                          {usd(Math.abs(r.netAnnualUsd))}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {r.eligible && r.breakEvenRoundtrips != null ? r.breakEvenRoundtrips : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {offerUrl ? (
                        <a
                          href={offerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="whitespace-nowrap font-semibold text-blue-700 underline"
                        >
                          {card.offer_label || "Check terms"}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">No outbound offer listed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 text-xs text-slate-500">
          Uses published checked-bag fees for the selected bag count. One roundtrip = 2 flight
          directions. Traveler coverage is capped by each card&apos;s published benefit, and non-bag
          perks are excluded.
        </div>
      </div>

      <div className="mt-8 text-sm text-slate-600">
        Related:{" "}
        <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="text-blue-700 underline">
          {airline.name} fee table
        </Link>{" "}
        |{" "}
        <Link href="/fees/checked_baggage" className="text-blue-700 underline">
          checked baggage fee reference
        </Link>{" "}
        |{" "}
        <Link href="/guides/airline-credit-card-baggage-benefits" className="text-blue-700 underline">
          baggage benefit reference
        </Link>{" "}
        |{" "}
        <Link href="/methodology" className="text-blue-700 underline">
          methodology
        </Link>
      </div>
    </main>
  );
}
