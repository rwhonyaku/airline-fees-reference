// app/compare/page.tsx - UPDATED (with Tailwind, same logic)
import Link from "next/link";
import { COMPARE_TABLES } from "@/content/compare-tables";
import { getFeeCategoryLabel } from "@/content/fee-categories";
import { canonical } from "@/lib/seo";

export const metadata = {
  title: "Comparison tables | Airline Fees Reference",
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Comparison Tables</h1>
        <p className="text-gray-600">
          Pre-built comparison tables for common fee scenarios.
        </p>
      </div>

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
                  <div className="text-sm text-gray-500 mt-1">View comparison →</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}