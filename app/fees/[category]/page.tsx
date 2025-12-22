// app/fees/[category]/page.tsx

import { notFound } from "next/navigation";
import { isFeeCategoryKey, getFeeCategoryLabel, FEE_CATEGORY_KEYS } from "@/content/fee-categories";
import { getFeeRowsByCategory } from "@/lib/data";
import { FeeTable } from "@/components/Table";
import { canonical } from "@/lib/seo";

export function generateStaticParams() {
  return FEE_CATEGORY_KEYS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isFeeCategoryKey(category)) return { title: "Category not found" };

  return {
    title: `${getFeeCategoryLabel(category)} fees`,
    alternates: {
      canonical: canonical(`/fees/${category}`),
    },
  };
}

function normalizeTimingIntoConditions(item: any) {
  const raw = typeof item?.timing === "string" ? item.timing.trim() : "";

  // Standardize "timing" as a pricing unit ONLY (per direction).
  const unitMap: Record<string, string> = {
    "each way": "per direction",
    "one-way": "per direction",
    "per direction": "per direction",
  };

  const normalizedUnit = raw ? unitMap[raw.toLowerCase()] : undefined;

  // Anything that is not a pricing unit gets moved into Conditions.
  // Example: "before departure", "after 24h", "60+ days before departure",
  //          "at booking / manage trip", "check-in / boarding", etc.
  const timingIsNonUnit = raw && !normalizedUnit;

  const conditions = typeof item?.conditions === "string" ? item.conditions.trim() : "";

  const nextConditions =
    timingIsNonUnit && raw
      ? conditions
        ? `${conditions}; ${raw}`
        : raw
      : conditions;

  return {
    ...item,
    conditions: nextConditions,
    // Keep column behavior deterministic: only show pricing unit values here.
    timing: normalizedUnit ?? (raw ? "Not published" : item.timing),
  };
}

export default async function FeeCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isFeeCategoryKey(category)) return notFound();

  const rows = getFeeRowsByCategory(category);

  const normalizedRows = rows.map((r) => ({
    ...r,
    item: normalizeTimingIntoConditions(r.item as any),
  }));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>{getFeeCategoryLabel(category)}</h1>
      <FeeTable rows={normalizedRows} />
    </div>
  );
}
