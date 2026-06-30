import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import {
  calcCardBagOffset,
  calcCheckedBagTripCost,
  clampInt,
  firstString,
  safeExternalUrl,
  usd,
  type AirlineOverrides,
  type CardsJson,
} from "@/lib/bag-cost-calculator";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Checked Baggage Cost Calculator | Airline Fees Reference",
  description:
    "Estimate checked baggage fees from published airline fee data, then see whether an eligible free checked bag card could offset the cost.",
};

async function readJsonFile<T>(relPathFromRepoRoot: string): Promise<T> {
  const full = path.join(process.cwd(), relPathFromRepoRoot);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
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
        const airline = getAirlineBySlug(slug);
        return (
          <option key={slug} value={slug}>
            {airline?.name ?? slug}
          </option>
        );
      })}
    </select>
  );
}

function missingBagLabel(ordinals: number[]): string {
  return ordinals.map((n) => (n === 1 ? "first" : n === 2 ? "second" : `${n}rd`)).join(", ");
}

export default async function CheckedBaggageCalculatorPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const airlineSlug = firstString(sp.airline) || "alaska";
  const airline = getAirlineBySlug(airlineSlug);
  if (!airline) notFound();

  const travelers = clampInt(firstString(sp.travelers), 1, 9, 2);
  const bags = clampInt(firstString(sp.bags), 0, 3, 1);
  const directions = clampInt(firstString(sp.directions), 1, 2, 2);
  const roundtrips = clampInt(firstString(sp.trips), 1, 30, 1);
  const payWithCard = (firstString(sp.pay) ?? "yes") !== "no";

  const trip = calcCheckedBagTripCost({
    fees: airline.fees,
    travelers,
    bagsPerTravelerPerDirection: bags,
    directions,
  });

  const cardsJson = await readJsonFile<CardsJson>("data/cards/cards.json");
  const overridesJson = await readJsonFile<AirlineOverrides>("data/cards/airline_overrides.json");
  const airlineOverrides = overridesJson[airlineSlug];
  const cards = cardsJson.cards.filter((card) => card.airline_slug === airlineSlug);
  const cardResults = cards
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
  const cardHref = `/best-cards?airline=${encodeURIComponent(airlineSlug)}&travelers=${travelers}&bags=${bags}&trips=${roundtrips}&pay=${payWithCard ? "yes" : "no"}`;

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10">
      <header className="grid gap-3">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Deterministic baggage tool
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Checked baggage cost calculator</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
          Estimate the checked-bag bill before booking, then see whether a tracked free checked bag
          card could offset it. The tool uses published fee rows from this site and refuses to
          invent route- or fare-specific amounts when the dataset does not support them.
        </p>
      </header>

      <form method="get" className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Airline</label>
            <AirlineSelect value={airlineSlug} />
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

        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 md:w-fit"
        >
          Estimate baggage cost
        </button>
      </form>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-600">Answer first</div>
        {trip.canEstimate ? (
          <>
            <h2 className="text-3xl font-extrabold text-slate-950">
              You will probably pay about {usd(trip.tripCostUsd)} in checked baggage fees for this trip.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
              Annualized across {roundtrips} roundtrip{roundtrips === 1 ? "" : "s"}, that is about{" "}
              <span className="font-bold">{annualBagCost != null ? usd(annualBagCost) : "-"}</span> in
              modeled checked-bag fees before elite status, fare bundles, included allowances, or
              route-specific exceptions.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-slate-950">
              This airline needs a route- or fare-specific baggage lookup before the tool can quote a total.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
              The missing piece is the {missingBagLabel(trip.missingBagOrdinals)} checked-bag amount.
              That usually means the charge varies by route, fare family, ticketing timing, or whether
              the itinerary follows a piece or weight concept.
            </p>
          </>
        )}
        <p className="text-sm leading-relaxed text-slate-600">{trip.explanation}</p>
      </section>

      {trip.canEstimate ? (
        <section className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Card savings bridge
          </div>
          {best ? (
            <>
              <h2 className="text-2xl font-extrabold text-slate-950">
                A tracked free checked bag card could save about {usd(best.result.annualSavingsUsd)} per year.
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                Best modeled match: <span className="font-bold">{best.card.name}</span>. After its annual
                fee, the modeled bag-only value is{" "}
                <span className={best.result.netAnnualUsd >= 0 ? "font-bold text-emerald-800" : "font-bold text-rose-700"}>
                  {best.result.netAnnualUsd >= 0 ? "+" : "-"}
                  {usd(Math.abs(best.result.netAnnualUsd))}
                </span>
                . This excludes points, sign-up bonuses, lounge access, and unrelated perks.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={cardHref} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700">
                  Compare eligible cards
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
                No tracked card produces a modeled checked-bag offset for these inputs.
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
                That can happen when this airline has no card in the dataset, when the benefit requires
                card payment and you selected no, or when the card benefit does not cover the requested bag pattern.
              </p>
            </>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Fee rows used</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2 pr-4">Bag</th>
                <th className="py-2 pr-4">Modeled fee</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(1, bags) }, (_, index) => index + 1).map((ordinal) => (
                <tr key={ordinal} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {ordinal === 1 ? "First" : ordinal === 2 ? "Second" : "Third"} checked bag
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {trip.feeByBagOrdinal.has(ordinal) ? usd(trip.feeByBagOrdinal.get(ordinal) ?? 0) : "Not modeled"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          The calculator prefers current, broad-market USD fee rows and avoids special-case rows such
          as intra-island or long-haul routes when broader domestic or North America pricing exists.
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
          <Link href="/best-cards" className="text-blue-700 underline">
            Free checked bag card calculator
          </Link>
          <Link href="/guides/airline-credit-card-baggage-benefits" className="text-blue-700 underline">
            Card baggage benefit rules
          </Link>
        </div>
      </section>
    </main>
  );
}
