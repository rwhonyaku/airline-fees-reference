// app/contact/page.tsx
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact & Data Corrections",
  description: "Contact the Airline-Fees.com team for data corrections, site issues, or general inquiries.",
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Contact</h1>

      <div className="space-y-6 text-slate-700 leading-relaxed text-lg">
        <p>
          We are committed to maintaining the highest level of accuracy across our database of 80+ airlines. If you find a discrepancy or have a technical issue to report, please reach out to us directly.
        </p>

        <div className="py-6 border-y border-slate-100 group">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">General Inquiries & Feedback</p>
          <a 
            className="text-2xl font-bold text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-800 transition-colors" 
            href="mailto:contact@airline-fees.com"
          >
            contact@airline-fees.com
          </a>
        </div>

        <section className="mt-10 bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="mr-2">📝</span> Submit a Data Correction
          </h2>
          <p className="text-base mb-6">
            To ensure our database remains factual, we only update information based on **official airline documentation**. If you are reporting a correction, please include:
          </p>
          
          <ul className="grid gap-3 text-base text-slate-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span> 
              <span><strong>Airline & Category:</strong> Specific carrier and fee type (e.g., Carry-on, Oversized).</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span> 
              <span><strong>Source Link:</strong> A direct URL to the official airline help center or fee schedule.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span> 
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