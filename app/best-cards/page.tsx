import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import type { FeeItem } from "@/lib/types";
import {
  calcCardBagOffset,
  clampInt,
  findCheckedBagFeeUsd,
  firstString,
  safeExternalUrl,
  usd,
  type AirlineOverrides,
  type CardsJson,
} from "@/lib/bag-cost-calculator";
import fs from "fs/promises";
import path from "path";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

const LAST_VERIFIED = "2026-06-10";

export const metadata: Metadata = {
  title: "Free Checked Bag Card Calculator | Airline Fees Reference",
  description:
    "Calculate whether an airline credit card's free checked bag benefit offsets its annual fee using published bag fees, traveler coverage, and card-payment rules.",
};

async function readJsonFile<T>(relPathFromRepoRoot: string): Promise<T> {
  const full = path.join(process.cwd(), relPathFromRepoRoot);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
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
        "With these inputs, the card does not offset recurring first checked bag fees.",
      className: "border-rose-200 bg-rose-50 text-rose-950",
    };
  }

  if (r.netAnnualUsd >= 0) {
    return {
      label: "Worth it on bag fees alone",
      detail:
        "The first checked bag savings cover the annual fee before counting points, credits, lounge access, or other perks.",
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

function AirlineSelect({ value }: { value: string }) {
  const slugs = getAirlineSlugs();
  return (
    <select
      name="airline"
      defaultValue={value}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
    >
      {slugs.map((slug) => {
        const a = getAirlineBySlug(slug);
        const label = a?.name ?? slug;
        return (
          <option key={slug} value={slug}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export default async function BestCardsPage({ searchParams }: PageProps) {
  const sp: SearchParams = (await searchParams) ?? {};

  const airlineSlug = firstString(sp.airline) || "united";
  const airline = getAirlineBySlug(airlineSlug);
  if (!airline) notFound();

  const travelers = clampInt(firstString(sp.travelers), 1, 9, 2);
  const bags = clampInt(firstString(sp.bags), 0, 2, 1);
  const trips = clampInt(firstString(sp.trips), 0, 30, 2);
  const payWithCard = (firstString(sp.pay) ?? "yes") !== "no";

  const fees = (airline.fees ?? []) as FeeItem[];
  const firstBagFeeUsd = findCheckedBagFeeUsd(fees, 1);
  const feeByBagOrdinal = new Map<number, number>();
  if (firstBagFeeUsd != null) feeByBagOrdinal.set(1, firstBagFeeUsd);

  const cardsJson = await readJsonFile<CardsJson>("data/cards/cards.json");
  const overridesJson = await readJsonFile<AirlineOverrides>("data/cards/airline_overrides.json");

  const airlineOverrides = overridesJson?.[airlineSlug];
  const allCardsForAirline = (cardsJson.cards ?? []).filter((c) => c.airline_slug === airlineSlug);

  if (allCardsForAirline.length === 0) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">Free checked bag card calculator</h1>
        <p className="mt-3 text-slate-600">
          This calculator does not currently have a verified free checked bag credit-card entry for{" "}
          <strong>{airline.name}</strong>. That does not mean a baggage exception can never apply; it
          means this site is not modeling a co-branded card waiver for this airline yet.
        </p>
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

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight">Free checked bag card calculator</h1>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-700">
          This is a checked-baggage break-even calculator, not a general travel-card ranking. It tests
          whether an airline card&apos;s published free checked bag benefit is enough to cover
          the annual fee from first-bag savings alone.
        </p>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          Enter the airline, number of travelers, checked bags, annual trips, and whether the
          ticket is paid for with the card. This page does not include points, lounge access,
          statement credits, or sign-up bonuses. Last verified:{" "}
          <span className="font-medium">{LAST_VERIFIED}</span>.
        </p>
        <p className="text-sm leading-relaxed text-slate-600">
          Start with the selected airline&apos;s{" "}
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="text-blue-700 underline">
            fee page
          </Link>{" "}
          and the broader{" "}
          <Link href="/fees/checked_baggage" className="text-blue-700 underline">
            checked baggage fee reference
          </Link>{" "}
          if you want to confirm the bag fees behind the calculation. For a broader reference on
          airline bag benefits, see{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits" className="text-blue-700 underline">
            airline credit card baggage benefits
          </Link>
          .
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What this calculator models</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>First checked bag savings from the airline fee details on this site.</li>
            <li>Annual fee cost for the airline card.</li>
            <li>Traveler-count limits and card-payment requirements where they apply.</li>
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
        method="get"
        className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Airline</label>
            <AirlineSelect value={airlineSlug} />
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

      <div className={`mt-8 rounded-2xl border p-6 ${topVerdict.className}`}>
        <div className="text-xs font-bold uppercase tracking-widest">Calculator verdict</div>
        <div className="mt-2 text-2xl font-extrabold">{topVerdict.label}</div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed">{topVerdict.detail}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
          Largest bag-fee offset for these inputs
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
          This result only compares first checked bag savings against the annual fee.
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
          Uses first checked bag fees only. One roundtrip = 2 flight directions. Traveler coverage
          is capped by each card&apos;s published benefit, and non-bag perks are excluded.
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
