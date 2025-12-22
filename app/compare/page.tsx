// app/compare/page.tsx

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
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Comparison tables</h1>

      {sortedLabels.map((label) => {
        const tables = groups.get(label) ?? [];
        return (
          <section key={label} style={{ display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14 }}>{label}</h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {tables.map((t) => (
                <li key={t.id} style={{ margin: "6px 0" }}>
                  <Link href={`/compare/${t.id}`}>{t.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
