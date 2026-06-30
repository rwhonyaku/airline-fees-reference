import type { Metadata } from "next";
import { TravelEsimCallout } from "@/components/TravelEsimCallout";

const LAST_VERIFIED = "2026-04-27";

export const metadata: Metadata = {
  title: "EU261 Passenger Rights (Reference)",
};

export default function Eu261ReferencePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          EU261 Passenger Rights (Reference)
        </h1>
        <div className="text-sm text-slate-500">Last verified: {LAST_VERIFIED}</div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          This page is a neutral reference summary of core EU261 scope, delay thresholds,
          compensation brackets, and complaint routing.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">1. Scope of applicability</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700">
          <p>EU261 commonly applies when a flight departs from an EU airport.</p>
          <p className="mt-3">
            EU261 can also apply when a flight arrives in the EU and the operating carrier is an
            EU carrier.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">2. Delay threshold</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700">
          A 3+ hour arrival delay is the commonly referenced threshold for compensation review under
          EU261.
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">
          3. Distance brackets and compensation
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3">Distance bracket</th>
                <th className="px-4 py-3">Published compensation amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3">Up to 1500 km</td>
                <td className="px-4 py-3">EUR 250</td>
              </tr>
              <tr>
                <td className="px-4 py-3">1500-3500 km</td>
                <td className="px-4 py-3">EUR 400</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Over 3500 km</td>
                <td className="px-4 py-3">EUR 600</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
          EU261 also includes a reduced compensation scenario of 50% in certain cases. This page
          does not evaluate those conditions.
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">4. Extraordinary circumstances</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li className="border-l-4 border-slate-300 pl-4">Air traffic management decisions</li>
            <li className="border-l-4 border-slate-300 pl-4">Political instability</li>
            <li className="border-l-4 border-slate-300 pl-4">Adverse weather conditions</li>
            <li className="border-l-4 border-slate-300 pl-4">Security risks</li>
            <li className="border-l-4 border-slate-300 pl-4">Hidden manufacturing defects</li>
            <li className="border-l-4 border-slate-300 pl-4">
              Strikes that are external to the operating air carrier
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">5. Exclusions / conditions</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li className="border-l-4 border-slate-300 pl-4">
              A confirmed reservation is generally required.
            </li>
            <li className="border-l-4 border-slate-300 pl-4">
              Check-in within the carrier&apos;s stated deadline is generally required unless the
              flight is cancelled.
            </li>
            <li className="border-l-4 border-slate-300 pl-4">
              Timing of notification can affect how cancellation-related rights are assessed.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">
          6. Official complaint process (high-level only)
        </h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700">
          <p>The carrier is typically the first contact point for an EU261 complaint.</p>
          <p className="mt-3">
            If the matter is not resolved, the relevant national enforcement authority is the next
            formal escalation point.
          </p>
        </div>
      </section>

      <TravelEsimCallout />

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">7. Sources</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            <li>
              <a
                href="https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_en.htm"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                European Commission passenger rights overview
              </a>
            </li>
            <li>
              <a
                href="https://eur-lex.europa.eu/eli/reg/2004/261/oj"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                EUR-Lex: Regulation (EC) No 261/2004
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
