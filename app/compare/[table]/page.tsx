// app/compare/[table]/page.tsx

import { notFound } from "next/navigation";
import { COMPARE_TABLES } from "@/content/compare-tables";
import { getFeeRowsByCategory } from "@/lib/data";
import { FeeTable } from "@/components/Table";
import { canonical } from "@/lib/seo";

type PageProps = {
  params: Promise<{
    table: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { table } = await params;
  const entry = COMPARE_TABLES.find((t) => t.id === table);

  if (!entry) {
    return { title: "Comparison not found" };
  }

  return {
    title: entry.title,
    alternates: {
      canonical: canonical(`/compare/${entry.id}`),
    },
  };
}

export default async function CompareTablePage({ params }: PageProps) {
  const { table } = await params;
  const entry = COMPARE_TABLES.find((t) => t.id === table);

  if (!entry) return notFound();

  const rows = getFeeRowsByCategory(entry.category);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>{entry.title}</h1>
      <FeeTable rows={rows} />
    </div>
  );
}
