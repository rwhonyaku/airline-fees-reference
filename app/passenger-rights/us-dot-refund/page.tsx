import type { Metadata } from "next";
import Link from "next/link";

const LAST_VERIFIED = "2026-04-27";

export const metadata: Metadata = {
  title: "U.S. DOT Refund Rules for Flight Cancellations and Delays",
};

export default function UsDotRefundReferencePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          U.S. DOT refund rules for flight cancellations and delays
        </h1>
        <div className="text-sm text-slate-500">Last verified: {LAST_VERIFIED}</div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          Start here when a U.S. itinerary changes because the airline cancelled the flight,
          changed the schedule significantly, or delayed baggage. This is different from choosing
          a restrictive fare: airline-caused disruption rights and fare-rule change fees are
          separate questions.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/fees/change_cancellation" className="font-semibold text-blue-700 underline">
            Compare change and cancellation fees
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-semibold text-blue-700 underline">
            Check Basic Economy restrictions
          </Link>
          <Link href="/airlines/united" className="font-semibold text-blue-700 underline">
            United fee page
          </Link>
          <Link href="/airlines/delta" className="font-semibold text-blue-700 underline">
            Delta fee page
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">Quick answer</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          If the airline cancels or significantly changes the flight and you do not accept the
          alternative, refund rights may apply. If you voluntarily change your plans, the ticket&apos;s
          fare rules usually control the fee, credit, or refund outcome.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">1. Refunds for cancellations</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700">
          When an airline cancels a flight and the passenger declines the offered alternative, a
          refund is required.
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">2. Significant delay / change</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            <p>Published DOT reference thresholds commonly cited are:</p>
            <ul className="space-y-2">
              <li className="border-l-4 border-slate-300 pl-4">3 hours for domestic itineraries</li>
              <li className="border-l-4 border-slate-300 pl-4">
                6 hours for international itineraries
              </li>
            </ul>
            <p>Examples listed in DOT guidance include:</p>
            <ul className="space-y-2">
              <li className="border-l-4 border-slate-300 pl-4">Schedule shift</li>
              <li className="border-l-4 border-slate-300 pl-4">Airport change</li>
              <li className="border-l-4 border-slate-300 pl-4">Added connections</li>
              <li className="border-l-4 border-slate-300 pl-4">Downgrade</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">3. Tarmac delay rules</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li className="border-l-4 border-slate-300 pl-4">
              3-hour limit for domestic flights
            </li>
            <li className="border-l-4 border-slate-300 pl-4">
              4-hour limit for international flights
            </li>
            <li className="border-l-4 border-slate-300 pl-4">
              Exceptions include safety, security, and air traffic control constraints.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">4. Baggage delay refunds</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li className="border-l-4 border-slate-300 pl-4">
              12 hours for domestic itineraries
            </li>
            <li className="border-l-4 border-slate-300 pl-4">
              15 hours for international itineraries under 12 hours in length
            </li>
            <li className="border-l-4 border-slate-300 pl-4">
              30 hours for international itineraries of 12 hours or more
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">5. Where this fits with airline fees</h2>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-700">
          <p>
            Use DOT refund rules when the problem is an airline-caused cancellation, significant
            schedule change, tarmac delay, or baggage delay timing issue.
          </p>
          <p className="mt-3">
            Use the <Link href="/fees/change_cancellation" className="font-semibold text-blue-700 underline">change and cancellation fee guide</Link>{" "}
            when the problem is a passenger-requested change, Basic Economy restriction, or fare
            credit rule.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">6. Sources</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li>
              <a
                href="https://www.transportation.gov/individuals/aviation-consumer-protection/refunds"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                U.S. DOT refunds guidance
              </a>
            </li>
            <li>
              <a
                href="https://www.transportation.gov/individuals/aviation-consumer-protection/tarmac-delays"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                U.S. DOT tarmac delays guidance
              </a>
            </li>
            <li>
              <a
                href="https://www.transportation.gov/lost-delayed-or-damaged-baggage"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                U.S. DOT lost, delayed, or damaged baggage guidance
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
