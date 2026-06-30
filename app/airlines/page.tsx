import Link from "next/link";
import { getAirlinesIndex } from "@/lib/data";
import { canonical } from "@/lib/seo";
import { MarketAnalysis } from "@/components/MarketAnalysis";
import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";

export const metadata = {
  title: "Airlines Fee Index 2026 | Verified Baggage & Service Costs",
  alternates: {
    canonical: canonical("/airlines"),
  },
};

export default function AirlinesIndexPage() {
  const airlines = getAirlinesIndex();
  const latestVerified = getLatestVerifiedAcrossAirlines();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-12 max-w-3xl">
        <h1 className="mb-6 text-5xl font-black tracking-tight text-slate-900">Airlines Index</h1>
        <p className="text-lg leading-relaxed text-slate-600">
          Use this directory to open each airline fee page. The airline pages summarize carry-on
          rules, checked bag baselines, fare-class restrictions, and the most relevant fee-topic
          references already in the site.
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
            Our Methodology {" >"}
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <Link href="/fees/checked_baggage" className="font-medium text-blue-700 underline">
            Checked baggage reference
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-medium text-blue-700 underline">
            Basic Economy guide
          </Link>
          <Link href="/best-cards" className="font-medium text-blue-700 underline">
            Free checked bag calculator
          </Link>
        </div>
      </header>

      <div className="my-10">
        <MarketAnalysis count={airlines.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {airlines.map((a) => (
          <Link
            key={a.slug}
            href={`/airlines/${a.slug}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl"
          >
            <div className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
              {a.name}
            </div>
            <div className="mt-3 flex items-center gap-3">
              {a.iata && (
                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-mono font-bold text-slate-500">
                  {a.iata}
                </span>
              )}
              {a.country && (
                <span className="text-xs font-medium tracking-tight text-slate-400">
                  {a.country}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <footer className="mt-20 border-t border-slate-100 pt-10">
        <div className="max-w-3xl rounded-2xl bg-slate-50 p-8">
          <h3 className="mb-2 font-bold text-slate-900">Data Integrity Notice</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            Airline pages use published carrier fee tables and linked source documents in this
            dataset. Because airlines can change fees quickly, treat each page as a source-linked
            reference snapshot and verify route-specific details on the airline page when timing
            matters.
          </p>
          <div className="mt-4 text-xs font-medium text-slate-500">Last verified: {latestVerified}</div>
        </div>
      </footer>
    </main>
  );
}
