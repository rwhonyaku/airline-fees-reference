import Link from "next/link";

export function TravelEsimCallout({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-sky-800">
        International trip prep
      </div>
      <h2 className={compact ? "mt-2 text-lg font-bold text-slate-900" : "mt-2 text-xl font-bold text-slate-900"}>
        Do you need a travel eSIM before you fly?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        For international trips, an eSIM is most useful when you need data immediately after
        landing, want to avoid airport SIM counters, or do not trust your home carrier&apos;s roaming
        price.
      </p>
      <div className="mt-4 text-sm">
        <Link href="/guides/travel-esims" className="font-bold text-sky-900 underline">
          Check the eSIM decision guide
        </Link>
      </div>
    </section>
  );
}
