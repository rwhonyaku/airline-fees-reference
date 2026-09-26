import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { TrueTripCostCalculator } from "@/components/TrueTripCostCalculator";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import { findCheckedBagFeeUsd } from "@/lib/bag-cost-calculator";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "True Trip Cost Calculator | Compare Flights After Fees",
  description: "Compare advertised airfares after checked bags, carry-ons, seats, and other trip fees to see which flight is actually cheaper.",
  alternates: { canonical: canonical("/tools/true-trip-cost") },
};

export default function TrueTripCostPage() {
  const airlines = getAirlineSlugs().map((slug) => getAirlineBySlug(slug)!)
    .filter((airline) => airline.data_quality?.status !== "ceased_operations")
    .map((airline) => ({
      slug: airline.slug,
      name: airline.name,
      firstBagUsd: findCheckedBagFeeUsd(airline.fees, 1),
      secondBagUsd: findCheckedBagFeeUsd(airline.fees, 2),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const comparisonPresets = [
    {
      label: "Los Angeles–Tokyo",
      detail: "ZIPAIR vs Japan Airlines",
      route: "Los Angeles (LAX)–Tokyo (NRT)",
      airlineA: "zipair",
      airlineB: "jal",
    },
    {
      label: "Denver–Las Vegas",
      detail: "Frontier vs Southwest",
      route: "Denver (DEN)–Las Vegas (LAS)",
      airlineA: "frontier",
      airlineB: "southwest",
    },
  ].filter((preset) => airlines.some((airline) => airline.slug === preset.airlineA) && airlines.some((airline) => airline.slug === preset.airlineB));

  return <main className="grid gap-8">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "True Trip Cost Calculator", url: canonical("/tools/true-trip-cost"), applicationCategory: "TravelApplication", operatingSystem: "Any" }} />
    <header className="grid gap-3">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Flight comparison tool</div>
      <h1 className="text-4xl font-black tracking-tight">Compare the true cost of two flights</h1>
      <p className="max-w-3xl leading-relaxed text-slate-700">Enter two fares you found, then add the bags, seats, and extras your trip actually needs. The calculator shows which option costs less for the whole party.</p>
    </header>
    <TrueTripCostCalculator airlines={airlines} comparisonPresets={comparisonPresets} />
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
      <h2 className="text-xl font-black text-slate-950">Before you trust the total</h2>
      <p className="mt-3">Copy changing bag, carry-on, and seat prices from the airline checkout. If a bag price cannot be determined without your route or fare, the calculator will ask for it instead of treating the bag as free.</p>
      <p className="mt-3">Select “included or waived” only when your fare, cabin, status, or card benefit covers the bags shown. For roundtrips, the calculator assumes the same fee applies in both directions.</p>
      <div className="mt-4 flex flex-wrap gap-4 font-bold text-blue-700 underline"><Link href="/fees/checked_baggage">Checked baggage reference</Link><Link href="/fees/carry_on">Carry-on reference</Link><Link href="/methodology">Data methodology</Link></div>
    </section>
  </main>;
}
