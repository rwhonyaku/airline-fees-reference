import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { canonical } from "@/lib/seo";

const LAST_VERIFIED = "2026-06-30";

export const metadata: Metadata = {
  title: "Travel eSIM Guide: When to Buy One Before You Fly",
  description:
    "Decide whether you need a travel eSIM, compare it with roaming and local SIMs, and avoid activation, coverage, and refund problems.",
  alternates: {
    canonical: canonical("/guides/travel-esims"),
  },
};

const DECISION_ROWS = [
  {
    situation: "International arrival where you need maps, rideshare, or messaging immediately",
    verdict: "Usually worth buying before departure",
    reason:
      "You can use maps and contact your ride or hotel as soon as you land, without relying on airport Wi-Fi or finding a SIM counter.",
  },
  {
    situation: "Short domestic trip or a route fully covered by your normal plan",
    verdict: "Usually skip",
    reason:
      "If your existing plan already covers the trip at a reasonable price, another data plan adds setup without solving a problem.",
  },
  {
    situation: "Multi-country itinerary",
    verdict: "Compare regional versus country plans",
    reason:
      "A country plan can be cheaper for one destination. A regional plan is often simpler when you cross borders or have a long layover elsewhere.",
  },
  {
    situation: "Tight connection, delay risk, or late-night arrival",
    verdict: "Buy before travel if the price is reasonable",
    reason:
      "Mobile data is especially useful when you need airline updates, hotel messages, a ride, or a last-minute rebooking.",
  },
  {
    situation: "Destination where airport Wi-Fi, kiosks, or SIM counters may be unreliable",
    verdict: "Usually buy before departure",
    reason:
      "Preloading a plan avoids depending on airport Wi-Fi or an open SIM counter during the first hour after landing.",
  },
  {
    situation: "Long stay in one country with easy local SIM access",
    verdict: "Compare against local SIM",
    reason:
      "A local SIM may offer more data for less. An eSIM is usually easier when you need service immediately on arrival.",
  },
  {
    situation: "Phone is locked or eSIM support is uncertain",
    verdict: "Do not buy yet",
    reason:
      "A travel eSIM is useless if the phone cannot activate it. Confirm device compatibility and carrier unlock status before paying.",
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

const BUY_BEFORE_TRAVEL = [
  "You land internationally and need maps, rideshare, train tickets, messaging, or hotel access immediately.",
  "You have a late-night arrival, tight connection, or realistic delay/rebooking risk.",
  "Your trip crosses multiple countries and you do not want to manage local SIM shopping in each place.",
  "Your home roaming price is unclear, expensive, or easy to trigger accidentally.",
  "You want backup internet access for airline apps, baggage updates, hotel messages, or rebooking.",
];

const SKIP_OR_WAIT = [
  "Your normal mobile plan already includes the destination at a clear, acceptable price.",
  "The trip is domestic or mostly covered by Wi-Fi you already trust.",
  "Your phone is carrier-locked or you have not confirmed eSIM support.",
  "You need a local phone number for calls or SMS and the eSIM plan is data-only.",
  "You are staying long enough that a local SIM may be cheaper and easy to buy after arrival.",
];

const ACTIVATION_TRAPS = [
  {
    title: "Activation timing",
    body:
      "Some plans start the validity clock when purchased, some when installed, and some when the eSIM first connects in the destination. This matters if you buy early.",
  },
  {
    title: "Data-only plans",
    body:
      "Many travel eSIMs provide mobile data but not a local voice number or normal SMS. That is fine for maps and messaging apps, but not for every bank, hotel, or local service verification flow.",
  },
  {
    title: "Coverage wording",
    body:
      "A plan can say it covers a country but still rely on partner networks, fair-use limits, speed management, or specific bands. Treat coverage as a practical check, not just a country list.",
  },
  {
    title: "Hotspot and tethering",
    body:
      "Do not assume hotspot is allowed. If you plan to connect a laptop or another traveler, check the plan terms before buying.",
  },
  {
    title: "Refund terms",
    body:
      "Refund rules can depend on whether the eSIM was installed, activated, or used. Save the plan terms before travel, especially for delayed or canceled trips.",
  },
  {
    title: "Primary SIM settings",
    body:
      "After installing an eSIM, set mobile data and data roaming intentionally so your phone does not accidentally use an expensive home-carrier roaming path.",
  },
];

const PROVIDER_EVALUATION = [
  "Clear destination and regional coverage before checkout.",
  "Activation timing stated plainly.",
  "Data amount, validity period, speed limits, and hotspot rules visible before payment.",
  "Refund policy that explains unused, installed, and activated plans.",
  "Installation instructions that can be saved offline.",
  "No vague unlimited-data claim without fair-use or speed details.",
];

const REAL_WORLD_SCENARIOS = [
  {
    title: "Late arrival after an international flight",
    verdict: "Buy before departure if the price is reasonable.",
    body:
      "You can use maps, request a ride, check train routes, message your hotel, and receive airline updates without depending on airport Wi-Fi.",
  },
  {
    title: "Two-country Europe trip",
    verdict: "Compare regional eSIM against two country plans.",
    body:
      "A regional plan can be simpler when crossing borders. A country plan can still win if almost all data use happens in one destination.",
  },
  {
    title: "Family trip with one main planner",
    verdict: "At least one reliable data line is useful.",
    body:
      "Not every traveler needs a separate eSIM. Make sure at least the person handling maps, messages, and tickets has data on arrival.",
  },
  {
    title: "Long stay with local SIM access",
    verdict: "Wait if setup is easy and you do not need data immediately.",
    body:
      "For longer trips, a local SIM can cost less or include more data. The tradeoff is waiting until arrival to buy and activate it.",
  },
];

const FAQS = [
  {
    question: "Is a travel eSIM worth buying before an international flight?",
    answer:
      "A travel eSIM is worth buying before departure when immediate data access will solve a real arrival-day problem, such as maps, rideshare, hotel messaging, airline disruption, or train tickets. It is less useful when your normal roaming plan already covers the trip at a clear price.",
  },
  {
    question: "Should I buy a country eSIM or a regional eSIM?",
    answer:
      "A country eSIM can cost less for one destination, while a regional eSIM is often simpler for multi-country itineraries, long layovers, or border crossings. Compare coverage, validity period, data amount, activation timing, and refund rules before buying.",
  },
  {
    question: "What should I check before buying a travel eSIM?",
    answer:
      "Check that your phone is unlocked and supports eSIM, confirm the countries covered, verify whether the plan is data-only, check when the validity period starts, and save installation instructions before travel.",
  },
  {
    question: "Can a travel eSIM replace my normal phone plan?",
    answer:
      "Usually no. Many travel eSIMs are data-only and may not include local calls or SMS. They are best treated as a travel data layer for maps, messaging apps, airline apps, and web access.",
  },
];

function travelEsimJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
          { "@type": "ListItem", position: 2, name: "Travel eSIM guide", item: canonical("/guides/travel-esims") },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

export default function TravelEsimsGuidePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <JsonLd data={travelEsimJsonLd()} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="/guides/basic-economy-traps" className="underline hover:text-blue-600">
            Guides
          </Link>
          <span>/</span>
          <span className="text-slate-900">Travel eSIMs</span>
        </nav>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Travel eSIM guide: when to buy one before you fly
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
          Quick answer
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          A travel eSIM is not always the cheapest choice. It is most useful when you need mobile
          data as soon as you land, before you can reach reliable Wi-Fi or buy a local SIM. Buying
          before departure can be worthwhile if you will immediately need airline apps, maps,
          messages, train tickets, rideshare, or rebooking tools.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-bold text-slate-900">Buy before departure when</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            {BUY_BEFORE_TRAVEL.map((item) => (
              <li key={item} className="border-l-4 border-emerald-300 pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Skip or wait when</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            {SKIP_OR_WAIT.map((item) => (
              <li key={item} className="border-l-4 border-slate-300 pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
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

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Activation traps that cause problems</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {ACTIVATION_TRAPS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Real-world traveler scenarios</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {REAL_WORLD_SCENARIOS.map((scenario) => (
            <div key={scenario.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">{scenario.title}</h3>
              <div className="mt-2 text-sm font-semibold text-blue-800">{scenario.verdict}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{scenario.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Compare plans carefully
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          What to look for in an eSIM provider
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
          Do not choose a plan from the headline data allowance alone. Check that the provider
          clearly explains where the plan works, when it activates, whether speeds are limited,
          and what happens if you cannot use it.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PROVIDER_EVALUATION.map((item) => (
            <div key={item} className="rounded-xl border border-blue-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Why connectivity matters during disruption</h2>
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
          <Link href="/tools/checked-baggage-calculator" className="font-semibold text-blue-700 underline">
            Checked-bag calculator
          </Link>
          <Link href="/guides/international-baggage-allowance" className="font-semibold text-blue-700 underline">
            International baggage allowance
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Travel eSIM FAQs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
        Before buying, verify coverage, activation timing, data limits, hotspot rules, and refund
        terms on the provider&apos;s website. Plan details can change, and a data-only eSIM may not
        include a local phone number or SMS.
      </section>
    </main>
  );
}
