import React from "react";

interface MarketAnalysisProps {
  count: number;
}

export function MarketAnalysis({ count }: MarketAnalysisProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-2xl">
      <div className="mb-8 flex flex-col items-start gap-4 border-b border-slate-700 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            What to check before booking
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Common fee traps found across {count} airline pages.
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white">
          Quick guide
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-300">
            Checked bags
          </span>
          <div className="mt-2 text-2xl font-black leading-tight text-blue-300">
            Buy bags before the airport
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Many airlines charge more, or give you fewer options, when baggage is handled at the airport.
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-300">
            Carry-on bags
          </span>
          <div className="mt-2 text-2xl font-black leading-tight text-blue-300">
            Soft bags are safer
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            A bag that technically fits can still get noticed if it is rigid, overpacked, or hard to slide into a sizer.
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-300">
            Cheapest fares
          </span>
          <div className="mt-2 text-2xl font-black leading-tight text-blue-300">
            Add the missing pieces
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            The lowest fare may not be cheapest after a bag, seat choice, or change flexibility is included.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <h4 className="mb-2 text-sm font-bold text-blue-300">
            How to use this
          </h4>
          <p className="text-sm leading-relaxed text-slate-300">
            Start with the rule that matches your trip, then open the airline page for the exact bag, seat, or change details.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <h4 className="mb-2 text-sm font-bold text-blue-300">
            Best next step
          </h4>
          <p className="text-sm leading-relaxed text-slate-300">
            If bags are part of the trip, run the checked-bag calculator before comparing fares.
          </p>
        </div>
      </div>
    </section>
  );
}
