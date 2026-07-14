import Link from "next/link";
import { getAirlinesIndex } from "@/lib/data";
import { canonical } from "@/lib/seo";
import { MarketAnalysis } from "@/components/MarketAnalysis";
import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";
import type { AirlineSummary } from "@/lib/types";

export const metadata = {
  title: "Airlines Fee Index 2026 | Verified Baggage & Service Costs",
  alternates: {
    canonical: canonical("/airlines"),
  },
};

const PRIORITY_AIRLINES = [
  "united",
  "delta",
  "american",
  "southwest",
  "jetblue",
  "alaska",
  "spirit",
  "frontier",
  "ryanair",
  "easyjet",
];

const INTERNATIONAL_AIRLINES = [
  "air-canada",
  "air-france",
  "lufthansa",
  "singapore-airlines",
  "air-india",
  "eva-air",
  "british-airways",
  "klm",
  "emirates",
  "qatar-airways",
];

function pickAirlines(airlines: AirlineSummary[], slugs: string[]) {
  const bySlug = new Map(airlines.map((airline) => [airline.slug, airline]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((airline): airline is AirlineSummary => Boolean(airline));
}

function AirlineCard({ airline }: { airline: AirlineSummary }) {
  return (
    <Link
      href={`/airlines/${airline.slug}`}
      className="group rounded-lg border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg"
    >
      <div className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
        {airline.name}
      </div>
      <div className="mt-3 flex items-center gap-3">
        {airline.iata && (
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-mono font-bold text-slate-500">
            {airline.iata}
          </span>
        )}
        {airline.country && (
          <span className="text-xs font-medium tracking-tight text-slate-400">
            {airline.country}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function AirlinesIndexPage() {
  const airlines = getAirlinesIndex();
  const latestVerified = getLatestVerifiedAcrossAirlines();
  const priorityAirlines = pickAirlines(airlines, PRIORITY_AIRLINES);
  const internationalAirlines = pickAirlines(airlines, INTERNATIONAL_AIRLINES);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-12 max-w-3xl">
        <h1 className="mb-6 text-5xl font-black tracking-tight text-slate-900">Airline Fee Pages</h1>
        <p className="text-lg leading-relaxed text-slate-600">
          Start with the airline, then move into the fee guide or calculator that matches your trip.
          The strongest pages explain carry-on rules, checked-bag charges, seat fees, change rules,
          and the places where fare restrictions can make a cheap ticket more expensive.
        </p>
        <div className="mt-4 text-sm text-slate-500">Last verified: {latestVerified}</div>
        <div className="mt-6 flex items-center gap-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {airlines.length} Carriers Tracked
          </div>
          <div className="h-px flex-1 bg-slate-200"></div>
          <Link
            href="/methodology"
            className="text-xs font-bold uppercase tracking-widest text-blue-600 hover:underline"
          >
            Our methodology {" >"}
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <Link href="/fees/checked_baggage" className="font-medium text-blue-700 underline">
            Checked baggage reference
          </Link>
          <Link href="/tools/checked-baggage-calculator" className="font-medium text-blue-700 underline">
            Checked baggage calculator
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-medium text-blue-700 underline">
            Basic Economy guide
          </Link>
          <Link href="/guides/international-baggage-allowance" className="font-medium text-blue-700 underline">
            International baggage allowance
          </Link>
          <Link href="/best-cards" className="font-medium text-blue-700 underline">
            Free checked bag calculator
          </Link>
        </div>
      </header>

      <div className="my-10">
        <MarketAnalysis count={airlines.length} />
      </div>

      <section className="my-12">
        <div className="mb-5 max-w-3xl">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Start with high-fee-risk airlines
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            These pages are usually the best first checks for U.S. domestic bag fees, Basic Economy
            restrictions, low-cost carrier add-ons, and card break-even decisions.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {priorityAirlines.map((airline) => (
            <AirlineCard key={airline.slug} airline={airline} />
          ))}
        </div>
      </section>

      <section className="my-12">
        <div className="mb-5 max-w-3xl">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            International baggage rules to check carefully
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            These airlines often need extra context because checked baggage can depend on route,
            cabin, fare family, and whether the itinerary uses a piece or weight allowance.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {internationalAirlines.map((airline) => (
            <AirlineCard key={airline.slug} airline={airline} />
          ))}
        </div>
      </section>

      <section className="my-12 rounded-lg border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-black text-slate-900">Not sure where to start?</h2>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <Link href="/tools/checked-baggage-calculator" className="font-semibold text-blue-700 underline">
            Price a checked-bag trip
          </Link>
          <Link href="/tools/excess-baggage-calculator" className="font-semibold text-blue-700 underline">
            Check overweight or oversize risk
          </Link>
          <Link href="/best-cards" className="font-semibold text-blue-700 underline">
            Test card break-even
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5 max-w-3xl">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">All airline fee pages</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Use the full list when you already know the carrier and need the airline-specific fee page.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {airlines.map((a) => (
            <AirlineCard key={a.slug} airline={a} />
          ))}
        </div>
      </section>

      <footer className="mt-20 border-t border-slate-100 pt-10">
        <div className="max-w-3xl rounded-lg bg-slate-50 p-8">
          <h3 className="mb-2 font-bold text-slate-900">About these pages</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            Airline fees can change quickly and often depend on route, fare, and timing. These
            pages use published airline sources where available, and each airline page shows its
            last verified date.
          </p>
          <div className="mt-4 text-xs font-medium text-slate-500">Last verified: {latestVerified}</div>
        </div>
      </footer>
    </main>
  );
}
