import Link from "next/link";
import React from "react";

interface MarketAnalysisProps {
  count: number;
}

export function MarketAnalysis({ count }: MarketAnalysisProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-xl md:p-8">
      <div className="mb-8 flex flex-col items-start gap-4 border-b border-slate-700 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Start with the fees most likely to change the fare
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Across {count} airline pages, these are the places where the cheapest ticket often stops being the cheapest trip.
          </p>
        </div>
        <Link
          href="/tools/checked-baggage-calculator"
          className="shrink-0 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
        >
          Price bags
        </Link>
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
          <Link href="/fees/checked_baggage" className="mt-4 inline-block text-sm font-bold text-white underline">
            Compare checked-bag rules
          </Link>
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
          <Link href="/sizer-rules" className="mt-4 inline-block text-sm font-bold text-white underline">
            Check sizer risk
          </Link>
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
          <Link href="/guides/basic-economy-traps" className="mt-4 inline-block text-sm font-bold text-white underline">
            Check cheap-fare restrictions
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <h4 className="mb-2 text-sm font-bold text-blue-300">
            If you know the airline
          </h4>
          <p className="text-sm leading-relaxed text-slate-300">
            Open its airline page first, then move into the bag calculator, sizer guide, or Basic Economy guide based on the trip.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
          <h4 className="mb-2 text-sm font-bold text-blue-300">
            If you will check bags more than once
          </h4>
          <p className="text-sm leading-relaxed text-slate-300">
            Price the bags first, then run the card break-even calculator only if the annual savings could beat the fee.
          </p>
          <Link href="/best-cards" className="mt-4 inline-block text-sm font-bold text-white underline">
            Run card break-even
          </Link>
        </div>
      </div>
    </section>
  );
}
