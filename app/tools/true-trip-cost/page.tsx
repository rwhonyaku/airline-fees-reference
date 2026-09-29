import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { TrueTripCostCalculator } from "@/components/TrueTripCostCalculator";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import { canonical } from "@/lib/seo";
import { getTripCostPilotProfiles } from "@/lib/trip-cost-pilot";

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
      checkedBagCoverage: airline.fees.some((fee) => fee.category === "checked_baggage"),
      carryOnCoverage: airline.fees.some((fee) => fee.category === "carry_on" || fee.category === "personal_item"),
      seatCoverage: airline.fees.some((fee) => fee.category === "seat_selection"),
      lastVerified: airline.fees
        .filter((fee) => fee.category === "checked_baggage" || fee.category === "carry_on" || fee.category === "personal_item" || fee.category === "seat_selection")
        .map((fee) => fee.last_verified)
        .filter((date): date is string => typeof date === "string")
        .sort()
        .at(-1) ?? null,
      pilotProfiles: getTripCostPilotProfiles(airline),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const comparisonPresets = [
    {
      label: "Los Angeles–Tokyo",
      detail: "ZIPAIR vs Japan Airlines",
      route: "Los Angeles (LAX)–Tokyo (NRT)",
      currency: "USD" as const,
      marketContext: "transpacific",
      airlineA: "zipair",
      airlineB: "jal",
    },
    {
      label: "Denver–Las Vegas",
      detail: "Frontier vs Southwest",
      route: "Denver (DEN)–Las Vegas (LAS)",
      currency: "USD" as const,
      marketContext: "us-domestic",
      airlineA: "frontier",
      airlineB: "southwest",
    },
  ].filter((preset) => airlines.some((airline) => airline.slug === preset.airlineA) && airlines.some((airline) => airline.slug === preset.airlineB));

  return <main className="grid gap-8">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "True Trip Cost Calculator", url: canonical("/tools/true-trip-cost"), applicationCategory: "TravelApplication", operatingSystem: "Any" }} />
    <header className="grid gap-3">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Flight comparison tool</div>
      <h1 className="text-4xl font-black tracking-tight">Compare the true cost of competing flights</h1>
      <p className="max-w-3xl leading-relaxed text-slate-700">Enter two to four fares you found, then add the bags, seats, and extras your trip actually needs. The calculator shows which option costs less for the whole party.</p>
    </header>
    <TrueTripCostCalculator airlines={airlines} comparisonPresets={comparisonPresets} />
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
      <h2 className="text-xl font-black text-slate-950">Before you trust the total</h2>
      <p className="mt-3">Copy changing bag, carry-on, and seat prices from the airline checkout. Select one comparison currency and enter every amount in that currency. The calculator does not fetch or estimate exchange rates.</p>
      <p className="mt-3">Select a verified fare or bundle only when its market and ticket conditions match your itinerary. Otherwise use manual checkout inputs, and mark bags included or waived only when your fare, cabin, status, or card benefit actually covers them. For roundtrips, per-direction carry-on and seat inputs are applied in both directions.</p>
      <div className="mt-4 flex flex-wrap gap-4 font-bold text-blue-700 underline"><Link href="/fees/checked_baggage">Checked baggage reference</Link><Link href="/fees/carry_on">Carry-on reference</Link><Link href="/methodology">Data methodology</Link></div>
    </section>
  </main>;
}
