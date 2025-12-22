// app/compare/page.tsx

import Link from "next/link";
import { COMPARE_TABLES } from "@/content/compare-tables";
import { getFeeCategoryLabel } from "@/content/fee-categories";

export const metadata = {
  title: "Comparison tables | Airline Fees Reference",
};

export default function CompareIndexPage() {
  // Group by category (still “boring” and deterministic)
  const groups = new Map<string, typeof COMPARE_TABLES>();

  for (const t of COMPARE_TABLES) {
    const label = getFeeCategoryLabel(t.category);
    const arr = groups.get(label) ?? [];
    arr.push(t);
    groups.set(label, arr);
  }

  const sortedGroupLabels = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Comparison tables</h1>

      {sortedGroupLabels.map((label) => {
        const tables = groups.get(label)!;
        const sorted = [...tables].sort((a, b) => a.title.localeCompare(b.title));

        return (
          <section key={label} style={{ display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{label}</h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {sorted.map((t) => (
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
