// app/compare/[table]/page.tsx

import { notFound } from "next/navigation";
import { COMPARE_TABLES } from "@/content/compare-tables";
import { buildComparisonRows } from "@/lib/compare";
import { FeeTable } from "@/components/Table";

export function generateStaticParams() {
  return COMPARE_TABLES.map((t) => ({ table: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const def = COMPARE_TABLES.find((t) => t.id === table);
  if (!def) return { title: "Comparison not found | Airline Fees Reference" };
  return { title: `${def.title} | Airline Fees Reference` };
}

export default async function CompareTablePage({ params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const def = COMPARE_TABLES.find((t) => t.id === table);
  if (!def) return notFound();

  const rows = buildComparisonRows(def);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>{def.title}</h1>
      <FeeTable rows={rows} />
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        This table includes only rows that match the stated conditions and have verifiable sources and last-verified dates.
      </div>
    </div>
  );
}
