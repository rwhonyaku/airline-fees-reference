import Link from "next/link";
import type { Metadata } from "next";
import { getAllAirlines } from "@/lib/data";
import type { FeeItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "International baggage allowance: piece vs weight concept (2026) | Airline Fees Reference",
  description:
    "Why international checked baggage allowance often depends on route, cabin, fare family, and piece-versus-weight concept instead of one flat first-bag fee.",
};

const LAST_VERIFIED = "2026-07-02";

type ExampleRow = {
  slug: string;
  airline: string;
  amount: string;
  appliesTo: string;
  regionOrRoute: string;
  conditions: string;
  sourceUrl: string;
  lastVerified: string;
  signals: string[];
};

function safeText(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "Not published";
}

function formatAmount(row: FeeItem): string {
  const amount = row.amount;
  const currency = safeText(row.currency);
  if (typeof amount === "number" && Number.isFinite(amount)) return `${amount.toFixed(0)} ${currency}`;
  if (typeof amount === "string" && amount.trim()) return `${amount.trim()} ${currency}`;
  return "Not published";
}

function conceptSignals(row: FeeItem): string[] {
  const haystack = [row.amount, row.conditions, row.applies_to, row.region_or_route, row.timing, row.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const signals: string[] = [];
  if (haystack.includes("piece")) signals.push("piece concept");
  if (haystack.includes("weight") || haystack.includes("kg")) signals.push("weight concept");
  if (haystack.includes("route") || haystack.includes("market") || haystack.includes("itinerary")) signals.push("route-based");
  if (haystack.includes("fare")) signals.push("fare-family based");
  if (haystack.includes("cabin")) signals.push("cabin based");
  if (haystack.includes("booking") || haystack.includes("my bookings") || haystack.includes("purchase")) signals.push("priced during purchase");
  return Array.from(new Set(signals));
}

function buildExamples(): ExampleRow[] {
  return getAllAirlines()
    .flatMap((airline) =>
      airline.fees
        .filter((row) => row.category === "checked_baggage")
        .map((row) => ({
          row,
          airline,
          signals: conceptSignals(row),
        }))
    )
    .filter((item) => item.signals.some((signal) => ["piece concept", "weight concept", "route-based", "fare-family based"].includes(signal)))
    .map(({ airline, row, signals }) => ({
      slug: airline.slug,
      airline: airline.name,
      amount: formatAmount(row),
      appliesTo: safeText(row.applies_to),
      regionOrRoute: safeText(row.region_or_route),
      conditions: safeText(row.conditions),
      sourceUrl: safeText(row.source_url),
      lastVerified: safeText(row.last_verified),
      signals,
    }))
    .sort((a, b) => {
      const signalDiff = b.signals.length - a.signals.length;
      if (signalDiff !== 0) return signalDiff;
      return a.airline.localeCompare(b.airline);
    })
    .slice(0, 14);
}

const CHECKLIST = [
  {
    title: "Countries and route",
    body:
      "The same airline can use different baggage logic depending on the countries served. Long-haul, transatlantic, transpacific, domestic, and regional itineraries may not share one allowance table.",
  },
  {
    title: "Fare family",
    body:
      "Light, Basic, Saver, Standard, Flex, and premium fares can carry different included allowances even when the flight number is the same.",
  },
  {
    title: "Piece versus weight concept",
    body:
      "Under the piece concept, the question is how many checked pieces are included and what each piece may weigh. Under the weight concept, the question is total included checked weight, sometimes across one or more bags.",
  },
  {
    title: "Operating carrier",
    body:
      "Partner-operated, codeshare, and interline itineraries can change which baggage table applies. Do not rely only on the marketing airline if another carrier operates a segment.",
  },
  {
    title: "Where the bag is purchased",
    body:
      "Some additional-bag products are priced during booking or manage booking. Airport purchase can be a separate and less forgiving path.",
  },
  {
    title: "Excess, overweight, and oversize rules",
    body:
      "Once you exceed the included allowance, the fee may move to excess-baggage tables rather than a simple first-bag or second-bag price.",
  },
];

export default function InternationalBaggageAllowanceGuide() {
  const examples = buildExamples();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="space-y-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            International baggage allowance: piece vs weight concept
          </h1>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Last verified {LAST_VERIFIED}
          </span>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/fees/checked_baggage" className="font-medium text-blue-700 underline">
            Checked baggage
          </Link>
          <Link href="/tools/checked-baggage-calculator" className="font-medium text-blue-700 underline">
            Checked-bag calculator
          </Link>
          <Link href="/tools/excess-baggage-calculator" className="font-medium text-blue-700 underline">
            Excess-bag calculator
          </Link>
          <Link href="/airlines/singapore-airlines" className="font-medium text-blue-700 underline">
            Singapore Airlines
          </Link>
          <Link href="/airlines/air-france" className="font-medium text-blue-700 underline">
            Air France
          </Link>
          <Link href="/airlines/air-india" className="font-medium text-blue-700 underline">
            Air India
          </Link>
        </nav>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Answer first
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            International baggage often cannot be reduced to one first-bag fee.
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">
            On many international airlines, checked baggage is an allowance system before it is a fee
            table. The useful question is not always &quot;What is the first checked bag price?&quot; It is
            whether your route, cabin, fare family, and operating carrier use a piece allowance,
            weight allowance, or a separately priced excess-baggage product.
          </p>
        </section>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">Piece concept</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            The piece concept is built around how many checked bags are included. A ticket might
            include one or two pieces, with a weight cap per piece. Once you add another piece or
            exceed the per-piece limit, excess, overweight, or oversize logic can apply.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            This is why a table row that says an allowance is included can still be useful: the
            included piece count may be the thing that saves you from a separate excess-baggage
            purchase.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">Weight concept</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            The weight concept is built around total included checked weight, usually expressed in
            kilograms. The practical trap is different: you may not be buying a &quot;second bag&quot; so much
            as exceeding a total weight allowance attached to the route and fare.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            This is why some international rows say the charge depends on route and piece/weight
            concept. That is not filler. It means the airline is using different baggage math for
            different itineraries.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">What to check before you book</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CHECKLIST.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Examples from the current fee dataset</h2>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          These are not invented fares. They are source-linked checked-baggage rows already used by
          the site, surfaced here because their conditions mention route, fare family, cabin, piece
          concept, weight concept, or purchase-path behavior.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Airline</th>
                <th className="px-4 py-3 font-semibold">Amount label</th>
                <th className="px-4 py-3 font-semibold">Applies to</th>
                <th className="px-4 py-3 font-semibold">Route / region</th>
                <th className="px-4 py-3 font-semibold">Why it varies</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((row) => (
                <tr key={`${row.slug}-${row.conditions}`} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    <Link href={`/airlines/${row.slug}`} className="text-blue-700 underline">
                      {row.airline}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{row.amount}</td>
                  <td className="px-4 py-4 text-slate-700">{row.appliesTo}</td>
                  <td className="px-4 py-4 text-slate-700">{row.regionOrRoute}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <div>{row.conditions}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {row.signals.map((signal) => (
                        <span key={signal} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                      Source
                    </a>
                    <div className="mt-1 text-xs text-slate-500">Verified {row.lastVerified}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-2xl font-bold text-slate-900">How to avoid paying the wrong baggage fee</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-amber-950">
            <li>
              Price the exact origin and destination before assuming baggage is included the same way
              it was on another route.
            </li>
            <li>
              Check the fare family before comparing airlines. A Light or Basic international fare
              can remove an allowance that a Standard fare includes.
            </li>
            <li>
              Verify whether the itinerary uses the marketing airline or an operating partner for
              each segment.
            </li>
            <li>
              If the fee table says additional baggage is shown during booking or manage booking,
              treat checkout as the quote, not a generic first-bag table.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-2xl font-bold text-slate-900">Next useful tools</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/fees/checked_baggage" className="font-semibold text-blue-800 underline">
              Compare checked-baggage fee rows
            </Link>
            <Link href="/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes" className="font-semibold text-blue-800 underline">
              Run checked-bag cost math
            </Link>
            <Link href="/tools/excess-baggage-calculator?bags=1&directions=2&weight=51&size=63" className="font-semibold text-blue-800 underline">
              Test overweight and oversize exposure
            </Link>
            <Link href="/guides/basic-economy-traps" className="font-semibold text-blue-800 underline">
              Compare Basic and Light fare traps
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
