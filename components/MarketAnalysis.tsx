import React from "react";

interface MarketAnalysisProps {
  count: number;
}

export function MarketAnalysis({ count }: MarketAnalysisProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-2xl">
      <div className="mb-8 flex flex-col items-start gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-black italic uppercase tracking-tight text-white md:text-3xl">
            2026 Fee Pressure Benchmarks
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Traveler-first pattern reading across {count} source-linked carriers.
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-blue-600 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white">
          Strategy Layer
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="min-w-0 space-y-2 border-l border-blue-500/30 pl-6">
          <span className="block text-xs font-bold uppercase tracking-tighter text-slate-500">
            Bag Timing Pressure
          </span>
          <div className="break-words text-2xl font-black leading-tight text-blue-400 lg:text-4xl">
            Prepay beats airport
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-400">
            The recurring pattern is not just the fee amount. It is the penalty for solving a predictable bag decision too late.
          </p>
        </div>

        <div className="min-w-0 space-y-2 border-l border-blue-500/30 pl-6">
          <span className="block text-xs font-bold uppercase tracking-tighter text-slate-500">
            Carry-On Reality
          </span>
          <div className="break-words text-2xl font-black leading-tight text-blue-400 lg:text-4xl">
            Shape beats specs
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-400">
            Published dimensions matter less than whether the airline treats cabin access like a revenue product and targets rigid bags at the gate.
          </p>
        </div>

        <div className="min-w-0 space-y-2 border-l border-blue-500/30 pl-6">
          <span className="block text-xs font-bold uppercase tracking-tighter text-slate-500">
            The Basic Trap
          </span>
          <div className="break-words text-2xl font-black leading-tight text-blue-400 lg:text-4xl">
            Cheap until normal
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-400">
            The cheapest fare often stops being cheap once the traveler needs one normal behavior back: a bag, a seat, or flexibility.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-400">
            What this section is for
          </h4>
          <p className="text-xs leading-relaxed text-slate-300">
            These are durable patterns pulled from the fee data and airline strategy pages, not live news claims that can age into bad advice.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-400">
            Best next move
          </h4>
          <p className="text-xs leading-relaxed text-slate-300">
            Use the guides and fee hubs to decide which trap applies, then move into the airline page and calculator that changes the booking math.
          </p>
        </div>
      </div>
    </section>
  );
}
