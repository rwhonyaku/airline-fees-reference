import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
        The Mission: Making Travel Costs Transparent
      </h1>

      <div className="space-y-6 text-slate-700 leading-relaxed text-lg">
        <p>
          In 2026, the "sticker price" of a flight is rarely the final price. Between unbundled baggage tiers, seat selection surcharges, and varying sizer rules, calculating the true cost of travel has become nearly impossible for the average passenger.
        </p>

        <p>
          <strong>Airline-Fees.com</strong> was created to fix this. We provide a standardized, independent database that cuts through the noise of airline marketing to show you the actual documented fees.
        </p>

        <section className="bg-slate-50 border-l-4 border-slate-400 p-8 my-10 rounded-r-xl">
          <h2 className="text-slate-900 font-bold text-xl mb-3">Our Data Process</h2>
          <p className="mb-4">
            We don't guess, and we don't crowdsource. Our data is pulled directly from official airline fee schedules and primary help centers. 
          </p>
          <ul className="list-disc pl-5 space-y-2 text-base">
            <li>
              <strong>Standardized Format:</strong> We take the confusing jargon from 80+ different airlines and translate it into a single, easy-to-read interface.
            </li>
            <li>
              <strong>Date Stamped:</strong> Each entry includes a "Last Verified" date so you know exactly how fresh the data is.
            </li>
          </ul>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3 text-sm uppercase tracking-widest text-slate-500">What We Do</h2>
            <ul className="list-disc pl-5 space-y-2 text-base">
              <li>Organize 80+ airlines into one consistent system.</li>
              <li>Document sizer rules to help you avoid gate surprises.</li>
              <li>Enable direct cost comparisons between budget and legacy carriers.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3 text-sm uppercase tracking-widest text-slate-500">Our Independence</h2>
            <ul className="list-disc pl-5 space-y-2 text-base">
              <li>100% unaffiliated with any airline.</li>
              <li>Objective data focused on published numbers.</li>
              <li>Consumer-first approach to fee transparency.</li>
            </ul>
          </div>
        </div>

        <p className="pt-10 text-base text-slate-500 border-t border-slate-100 text-center">
          To see our specific data collection rules, visit our{" "}
          <Link href="/methodology" className="text-blue-600 font-bold underline decoration-2 underline-offset-4 hover:text-blue-800 transition-colors">
            Methodology Page
          </Link>
          .
        </p>
      </div>
    </main>
  );
}