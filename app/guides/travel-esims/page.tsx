import Link from "next/link";
import type { Metadata } from "next";

const LAST_VERIFIED = "2026-06-30";

export const metadata: Metadata = {
  title: "Travel eSIM Decision Guide: When It Is Worth Buying Before You Fly",
  description:
    "A practical travel eSIM decision guide for international flyers: when to buy before departure, when roaming is enough, and what to check before paying.",
};

const DECISION_ROWS = [
  {
    situation: "International arrival where you need maps, rideshare, or messaging immediately",
    verdict: "Usually worth buying before departure",
    reason:
      "The value is not only data price. It is avoiding the airport SIM counter and having working data before you leave arrivals.",
  },
  {
    situation: "Short domestic trip or a route fully covered by your normal plan",
    verdict: "Usually skip",
    reason:
      "An eSIM solves international data friction. If your existing plan already covers the trip at no meaningful extra cost, the add-on may be clutter.",
  },
  {
    situation: "Multi-country itinerary",
    verdict: "Compare regional versus country plans",
    reason:
      "A country plan can be cheaper for one destination, while a regional plan can be cleaner when border crossings or connections create coverage gaps.",
  },
  {
    situation: "Tight connection, delay risk, or late-night arrival",
    verdict: "Buy before travel if the price is reasonable",
    reason:
      "The risk is being stranded without data when airline apps, hotel messages, rideshare, and rebooking tools matter most.",
  },
];

const CHECKLIST = [
  "Confirm your phone is unlocked and supports eSIM activation.",
  "Check whether the plan includes the countries where you will actually need data, including long layovers.",
  "Confirm whether the plan is data-only or includes calls and SMS.",
  "Check when the plan activates: at purchase, at install, or when it first connects abroad.",
  "Make sure the data amount fits your trip length. Navigation, messaging, and airline apps need less than video or hotspot use.",
  "Save installation instructions before travel in case airport Wi-Fi is weak or captive portals fail.",
];

export default function TravelEsimsGuidePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="/guides/basic-economy-traps" className="underline hover:text-blue-600">
            Guides
          </Link>
          <span>/</span>
          <span className="text-slate-900">Travel eSIMs</span>
        </nav>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Travel eSIM decision guide
        </h1>
        <div className="text-sm text-slate-500">Last verified: {LAST_VERIFIED}</div>
        <p className="max-w-3xl text-base leading-relaxed text-slate-700">
          Buy a travel eSIM when international data access will prevent a real travel-day problem:
          finding transport, receiving airline updates, rebooking during disruption, or contacting
          lodging after arrival. Skip it when your normal roaming plan already solves that at a
          predictable price.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Answer-first verdict
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          A travel eSIM is not automatically a money-saver. Its best use is risk control: data at
          the moment you land, before you have found airport Wi-Fi, a local SIM counter, or a hotel
          desk. If your trip depends on airline apps, maps, messaging, train tickets, rideshare, or
          same-day rebooking, buying before departure can be rational even when it is not the
          absolute cheapest data option.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">When an eSIM is worth it</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3">Situation</th>
                <th className="px-4 py-3">Verdict</th>
                <th className="px-4 py-3">Why it matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {DECISION_ROWS.map((row) => (
                <tr key={row.situation} className="align-top">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.situation}</td>
                  <td className="px-4 py-3">{row.verdict}</td>
                  <td className="px-4 py-3">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">What to check before paying</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
            {CHECKLIST.map((item) => (
              <li key={item} className="border-l-4 border-slate-300 pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-bold text-slate-900">Buy before departure when</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            You are landing internationally, arriving late, relying on rideshare or public transit,
            managing airline disruption, or traveling through multiple countries where local SIM
            shopping would waste trip time.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Skip or delay when</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Your home plan includes the destination at a clear price, the trip is domestic, the
            phone is locked, or you only need data after reaching a hotel with reliable Wi-Fi.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">How this connects to flight disruption</h2>
        <p className="text-sm leading-relaxed text-slate-700">
          Connectivity matters most when the trip stops going to plan. A delay, gate change,
          misconnect, baggage issue, or hotel message can turn airport Wi-Fi into the weak link.
          Pair this guide with passenger-rights pages when the question shifts from data access to
          refunds, compensation, or baggage-delay rules.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/passenger-rights/eu261" className="font-semibold text-blue-700 underline">
            EU261 passenger rights
          </Link>
          <Link href="/passenger-rights/us-dot-refund" className="font-semibold text-blue-700 underline">
            U.S. DOT refund rights
          </Link>
          <Link href="/fees/change_cancellation" className="font-semibold text-blue-700 underline">
            Change and cancellation fees
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
        This page is a decision framework, not a provider ranking. Add eSIM provider links only
        after plan coverage, activation rules, refund terms, and disclosure language have been
        verified.
      </section>
    </main>
  );
}
