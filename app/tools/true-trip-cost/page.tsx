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

  return <main className="grid gap-8">
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "True Trip Cost Calculator", url: canonical("/tools/true-trip-cost"), applicationCategory: "TravelApplication", operatingSystem: "Any" }} />
    <header className="grid gap-3">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Flight comparison tool</div>
      <h1 className="text-4xl font-black tracking-tight">What will this flight actually cost?</h1>
      <p className="max-w-3xl leading-relaxed text-slate-700">Compare two flights you actually found. Enter each advertised fare and the choices your trip requires; the calculator turns the headline price into a realistic total for the whole party.</p>
    </header>
    <TrueTripCostCalculator airlines={airlines} />
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
      <h2 className="text-xl font-black text-slate-950">What the result does—and does not—claim</h2>
      <p className="mt-3">Usable published USD checked-bag rows can provide a baseline estimate. Route-, fare-, currency-, or booking-dependent prices must be entered from the airline checkout, and the comparison remains incomplete until they are. Carry-on and seat charges are traveler-entered in this first version because those products frequently vary by itinerary and timing.</p>
      <p className="mt-3">A zero means you entered zero or selected no bags; it does not prove an airline benefit applies. Verify fare inclusions, operating carrier, status, and card conditions on the linked airline page.</p>
      <div className="mt-4 flex flex-wrap gap-4 font-bold text-blue-700 underline"><Link href="/fees/checked_baggage">Checked baggage reference</Link><Link href="/fees/carry_on">Carry-on reference</Link><Link href="/methodology">Data methodology</Link></div>
    </section>
  </main>;
}
