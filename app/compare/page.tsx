import Link from "next/link";
import { COMPARE_TABLES } from "@/content/compare-tables";
import { getFeeCategoryLabel } from "@/content/fee-categories";
import { canonical } from "@/lib/seo";

export const metadata = {
  title: "Airline fee comparisons | Airline Fees Reference",
  alternates: {
    canonical: canonical("/compare"),
  },
};

type CompareTable = (typeof COMPARE_TABLES)[number];

export default function CompareIndexPage() {
  const groups = new Map<string, CompareTable[]>();

  for (const t of COMPARE_TABLES) {
    const label = getFeeCategoryLabel(t.category);
    const existing = groups.get(label) ?? [];
    groups.set(label, existing.concat(t));
  }

  const sortedLabels = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Airline fee comparisons</h1>
          <p className="max-w-3xl text-gray-600">
            Compare published airline fees for common trip scenarios, then move into the airline
            page, fee topic, or calculator that fits your trip.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/fees/checked_baggage" className="font-medium text-blue-700 underline">
            Checked baggage
          </Link>
          <Link href="/tools/checked-baggage-calculator" className="font-medium text-blue-700 underline">
            Checked-bag calculator
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-medium text-blue-700 underline">
            Basic Economy guide
          </Link>
          <Link href="/airlines" className="font-medium text-blue-700 underline">
            Airline pages
          </Link>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-relaxed text-slate-700">
          <strong className="text-slate-950">How to use comparisons:</strong> start here when you
          need a side-by-side fee check, then use the calculator or airline page before treating that
          number as the full trip cost. Route, fare family, purchase timing, and included allowances can
          still change the answer.
        </div>
      </header>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Best first moves</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/compare/us-domestic-economy-checked-baggage-bag1-2025" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300">
            <div className="font-semibold text-slate-950">Compare first checked bags</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Useful when the first checked bag is the main fare difference.
            </p>
          </Link>
          <Link href="/guides/basic-economy-traps" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300">
            <div className="font-semibold text-slate-950">Check Basic fare restrictions</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Best when bags, seats, or flexibility may change the comparison.
            </p>
          </Link>
          <Link href="/tools/checked-baggage-calculator" className="rounded-xl border border-slate-200 p-4 hover:border-blue-300">
            <div className="font-semibold text-slate-950">Price a bag scenario</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Convert a published bag fee into a traveler-and-bag estimate.
            </p>
          </Link>
        </div>
      </section>

      {sortedLabels.map((label) => {
        const tables = groups.get(label) ?? [];
        return (
          <section key={label} className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tables.map((t) => (
                <Link
                  key={t.id}
                  href={`/compare/${t.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="font-medium text-gray-900">{t.title}</div>
                  <div className="text-sm text-gray-500 mt-1">Open comparison and next steps →</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
