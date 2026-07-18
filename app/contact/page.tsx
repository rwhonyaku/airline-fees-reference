// app/contact/page.tsx
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Report an Airline Policy Change or Data Correction",
  description: "Report airline fee policy changes, data corrections, site issues, or general inquiries.",
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Report a policy change</h1>

      <div className="space-y-6 text-slate-700 leading-relaxed text-lg">
        <p>
          Airline fee rules change often. If you spot a baggage, seat, change, or service-fee policy that no longer matches an official airline source, send it over and we will review it against the published documentation.
        </p>

        <div className="py-6 border-y border-slate-100 group">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Data corrections and feedback</p>
          <a
            className="text-2xl font-bold text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-800 transition-colors"
            href="mailto:contact@airline-fees.com?subject=Airline%20policy%20change%20report"
          >
            contact@airline-fees.com
          </a>
        </div>

        <section className="mt-10 bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Submit a data correction</h2>
          <p className="text-base mb-6">
            To keep the database factual, we update fee information from official airline documentation. If you are reporting a correction, please include:
          </p>

          <ul className="grid gap-3 text-base text-slate-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">-</span>
              <span><strong>Airline & Category:</strong> Specific carrier and fee type (e.g., Carry-on, Oversized).</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">-</span>
              <span><strong>Source Link:</strong> A direct URL to the official airline help center or fee schedule.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">-</span>
              <span><strong>The Discrepancy:</strong> What is currently listed vs. the updated official rate.</span>
            </li>
          </ul>
        </section>

        <div className="mt-8 flex items-center justify-between text-sm text-slate-500 italic">
          <p>We typically review and process data corrections within 48 hours.</p>
        </div>

        <p className="text-slate-400 mt-10 text-sm leading-snug">
          Note: We are an independent reference site and cannot assist with flight bookings, refunds, or customer service issues for individual airlines. For these matters, please contact the airline directly.
        </p>
      </div>
    </main>
  );
}
