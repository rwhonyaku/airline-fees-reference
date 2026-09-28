import Link from "next/link";
import type { Metadata } from "next";
import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Airline Fee Data Methodology and Verification",
  description:
    "How Airline-Fees.com sources, qualifies, dates, reviews, and publishes airline fee and baggage-policy records.",
  alternates: { canonical: canonical("/methodology") },
};

const sourceHierarchy = [
  ["1", "Airline fee or policy page", "Preferred when the airline publishes the rule directly for travelers."],
  ["2", "Airline conditions or tariff", "Used when formal terms provide qualifications missing from the summary page."],
  ["3", "Airline booking flow or calculator", "Used for itinerary-priced products when a universal amount is not published."],
  ["4", "Airline help center", "Used for official explanations, exceptions, and traveler eligibility."],
  ["5", "Other official airline publication", "Used only when it directly supports the stated fact."],
] as const;

export default function Methodology() {
  const latestVerified = getLatestVerifiedAcrossAirlines();

  return (
    <main className="mx-auto grid max-w-4xl gap-12 px-6 py-16">
      <header className="grid gap-4">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">Data methodology</div>
        <h1 className="m-0 text-4xl font-black tracking-tight text-slate-900">
          How airline fee records are sourced and verified
        </h1>
        <p className="m-0 border-l-4 border-blue-500 pl-4 text-lg leading-relaxed text-slate-600">
          We turn fragmented official airline policies into qualified records and deterministic tools. We preserve uncertainty
          when an airline does not publish one universal answer.
        </p>
        <div className="text-sm text-slate-500">Latest verification date present in the database: {latestVerified}</div>
      </header>

      <section className="grid gap-4">
        <h2 className="m-0 text-2xl font-black text-slate-900">What every published fee record must contain</h2>
        <p className="m-0 text-sm leading-relaxed text-slate-600">
          A number without scope is not enough. Each public fee record must identify the amount or published limitation,
          currency, who it applies to, route or market, purchase timing, conditions, official source URL, and date checked.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["The fact", "Amount or allowance, currency, bag or service type, and relevant threshold."],
            ["The scope", "Fare, cabin, route, traveler type, timing, and other qualifications that change the answer."],
            ["The evidence", "Official source link and record-level last-verified date."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="m-0 text-base font-black text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Source hierarchy</div>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Official airline publications come first</h2>
        </div>
        <p className="m-0 text-sm leading-relaxed text-slate-600">
          Third-party sites may reveal that a policy deserves another look, but they do not become authoritative inputs to
          the fee database. A material claim should trace back to the airline that publishes or applies the rule.
        </p>
        <ol className="grid list-none gap-3 p-0">
          {sourceHierarchy.map(([rank, title, body]) => (
            <li key={rank} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[44px_1fr]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">{rank}</div>
              <div>
                <div className="font-black text-slate-900">{title}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{body}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="m-0 text-2xl font-black text-slate-900">Published rule versus derived answer</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-white p-5">
            <h3 className="m-0 text-base font-black text-slate-900">Stored fact</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The airline publishes a fee, allowance, threshold, or limitation with route, fare, and timing qualifications.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-5">
            <h3 className="m-0 text-base font-black text-slate-900">Deterministic result</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A calculator applies explicit traveler inputs to usable records. It does not guess a price when the airline
              requires an itinerary lookup.
            </p>
          </div>
        </div>
        <p className="m-0 text-sm leading-relaxed text-slate-700">
          Labels such as <strong>route lookup needed</strong>, <strong>price shown during booking</strong>, or <strong>not published</strong> are intentional.
          They are more accurate than presenting a representative amount as though it applied universally.
        </p>
      </section>

      <section className="grid gap-4">
        <h2 className="m-0 text-2xl font-black text-slate-900">Verification freshness</h2>
        <p className="m-0 text-sm leading-relaxed text-slate-600">
          A last-checked date records when the cited official source was reviewed. It is not a guarantee that the airline
          has made no later change. Public freshness labels currently follow these deterministic thresholds:
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="font-black text-emerald-900">Recently checked</div>
            <div className="mt-2 text-sm leading-relaxed text-emerald-900">Official source checked within 120 days.</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="font-black text-amber-900">Review due</div>
            <div className="mt-2 text-sm leading-relaxed text-amber-900">More than 120 but no more than 240 days old.</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <div className="font-black text-rose-900">Needs recheck</div>
            <div className="mt-2 text-sm leading-relaxed text-rose-900">More than 240 days old; confirm before relying on time-sensitive pricing.</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="m-0 text-2xl font-black text-slate-900">Change detection and publication</h2>
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["1", "Monitor"],
            ["2", "Detect"],
            ["3", "Inspect"],
            ["4", "Verify"],
            ["5", "Publish"],
          ].map(([step, label]) => (
            <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="text-xs font-bold text-blue-700">STEP {step}</div>
              <div className="mt-1 font-black text-slate-900">{label}</div>
            </div>
          ))}
        </div>
        <p className="m-0 text-sm leading-relaxed text-slate-600">
          Automation can detect source changes and prepare a review item. It cannot mark a material claim verified. The
          claim-level provenance validator requires human review before a revision can receive verified status.
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-300 bg-slate-900 p-7 text-white">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-300">Current coverage boundary</div>
        <h2 className="m-0 text-2xl font-black text-white">Claim-level history is still a controlled pilot</h2>
        <p className="m-0 text-sm leading-relaxed text-slate-300">
          All fee rows carry official source links and record-level verification dates. The deeper system—with individual
          claim IDs, evidence paths, revisions, effective-date status, review cadence, and retained history—is currently
          implemented for Air France baggage policy. It has not yet been represented as universal coverage.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-bold">
          <Link href="/airlines/air-france" className="text-blue-300 underline">View the Air France implementation</Link>
          <Link href="/fees" className="text-blue-300 underline">Browse fee records</Link>
          <Link href="/tools/true-trip-cost" className="text-blue-300 underline">See deterministic trip math</Link>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="m-0 text-2xl font-black text-slate-900">What verification does not mean</h2>
        <ul className="m-0 grid gap-2 pl-5 text-sm leading-relaxed text-slate-600">
          <li>It does not guarantee availability or price for a future itinerary.</li>
          <li>It does not override the operating carrier, ticket, airport agent, or airline checkout.</li>
          <li>It does not convert a route-priced product into a universal fee.</li>
          <li>It does not treat a newer page-level date as proof that every older record was rechecked.</li>
        </ul>
      </section>
    </main>
  );
}
