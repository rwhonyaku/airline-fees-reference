import type { Metadata } from "next";
import { CalculatorClient } from "./CalculatorClient";

const LAST_VERIFIED = "2026-04-27";

export const metadata: Metadata = {
  title: "EU261 Calculator (Reference)",
};

export default function Eu261CalculatorPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          EU261 Calculator (Reference)
        </h1>
        <div className="text-sm text-slate-500">Last verified: {LAST_VERIFIED}</div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          This calculator uses fixed informational rules only. It does not calculate distance and
          does not make a final legal determination.
        </p>
      </header>

      <CalculatorClient />
    </main>
  );
}
