import type { Metadata } from "next";
import Link from "next/link";
import { CalculatorClient } from "./CalculatorClient";

const LAST_VERIFIED = "2026-04-27";

export const metadata: Metadata = {
  title: "EU261 Calculator for Flight Delay and Cancellation Checks",
};

export default function Eu261CalculatorPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          EU261 calculator for flight delay and cancellation checks
        </h1>
        <div className="text-sm text-slate-500">Last verified: {LAST_VERIFIED}</div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          This helps screen EU261 basics when a Europe-related flight is delayed,
          cancelled, or rerouted. It uses fixed informational rules only, does not calculate
          distance, and does not make a final legal determination.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/passenger-rights/eu261" className="font-semibold text-blue-700 underline">
            Read EU261 rules
          </Link>
          <Link href="/fees/change_cancellation" className="font-semibold text-blue-700 underline">
            Compare change and cancellation fees
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-semibold text-blue-700 underline">
            Check fare restrictions
          </Link>
        </div>
      </header>

      <CalculatorClient />
    </main>
  );
}
