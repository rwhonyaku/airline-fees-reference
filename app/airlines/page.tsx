import Link from "next/link";
import { getAirlinesIndex } from "@/lib/data";
import { canonical } from "@/lib/seo";
import { MarketAnalysis } from "@/components/MarketAnalysis";
import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";
import type { AirlineSummary } from "@/lib/types";

export const metadata = {
  title: "Airline Fee and Baggage Policy Pages | Official Sources",
  description:
    "Find airline baggage and fee pages with official sources, verified dates, fare qualifications, and practical tools for comparing the real trip cost.",
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

const AIRLINE_REASONS: Record<string, string> = {
  united: "Compare Basic Economy restrictions, checked-bag costs, and the value of moving to a less restrictive fare.",
  delta: "Check how the fare, route, bag number, and eligible card or status benefit change the baggage total.",
  american: "Separate the published bag price from route exceptions, fare rules, and excess-baggage exposure.",
  southwest: "Check the current included allowance and fare benefits instead of relying on the airline's former baggage policy.",
  jetblue: "Compare fare-level baggage treatment and any eligible card benefit before assuming the lowest fare wins.",
  alaska: "Check ticketing date, route exceptions, Saver treatment, and eligible card or status benefits together.",
  frontier: "Price the personal-item limit, overhead bag, seat, and bundle before comparing its headline fare.",
  ryanair: "Separate the free small personal item from paid cabin-bag access and airport handling charges.",
  easyjet: "Compare the included under-seat bag with large-cabin-bag access through a seat, bundle, or separate purchase.",
  "air-canada": "Check whether the exact Basic itinerary includes an overhead bag and how route and fare brand affect checked baggage.",
  "air-france": "Use the ticket and itinerary allowance first; additional-bag pricing is not one universal amount.",
  lufthansa: "Distinguish short-haul Economy Basic from fares that include an overhead bag, then check route-specific baggage rules.",
  "singapore-airlines": "Identify the applicable piece or weight concept before treating any published allowance as universal.",
  "air-india": "Separate domestic and international baggage rules, weight allowances, and route-specific excess charges.",
  "eva-air": "Check long-haul versus within-Asia allowances and the current prepaid excess-baggage conditions.",
  "british-airways": "Check the booked fare and operating carrier before relying on the cabin or checked-bag allowance.",
  klm: "Use the fare and itinerary because included bags and additional-bag prices can vary by trip.",
  emirates: "Confirm whether the itinerary uses a weight or piece allowance before calculating extra baggage.",
  "qatar-airways": "Check route, cabin, and the applicable piece or weight system before comparing allowances.",
};

function pickAirlines(airlines: AirlineSummary[], slugs: string[]) {
  const bySlug = new Map(airlines.map((airline) => [airline.slug, airline]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((airline): airline is AirlineSummary => Boolean(airline));
}

function AirlineCard({ airline, showReason = false }: { airline: AirlineSummary; showReason?: boolean }) {
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
      {showReason && AIRLINE_REASONS[airline.slug] ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-600">{AIRLINE_REASONS[airline.slug]}</p>
      ) : null}
    </Link>
  );
}

export default function AirlinesIndexPage() {
  const airlines = getAirlinesIndex().filter((airline) => airline.slug !== "spirit");
  const latestVerified = getLatestVerifiedAcrossAirlines();
  const priorityAirlines = pickAirlines(airlines, PRIORITY_AIRLINES);
  const internationalAirlines = pickAirlines(airlines, INTERNATIONAL_AIRLINES);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-12 max-w-3xl">
        <h1 className="mb-6 text-5xl font-black tracking-tight text-slate-900">Airline fee and baggage policy pages</h1>
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
          <Link href="/tools/checked-baggage-calculator" prefetch={false} className="font-medium text-blue-700 underline">
            Checked baggage calculator
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-medium text-blue-700 underline">
            Basic Economy guide
          </Link>
          <Link href="/guides/international-baggage-allowance" className="font-medium text-blue-700 underline">
            International baggage allowance
          </Link>
          <Link href="/best-cards" prefetch={false} className="font-medium text-blue-700 underline">
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
            Priority U.S. and low-cost comparisons
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Start here when baggage, a stripped fare, or an unbundled low-cost model is likely to
            change which flight is actually cheaper.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {priorityAirlines.map((airline) => (
            <AirlineCard key={airline.slug} airline={airline} showReason />
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
            <AirlineCard key={airline.slug} airline={airline} showReason />
          ))}
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
