import Link from "next/link";

export function CheckedBaggageCalculatorCallout({
  airlineSlug,
  compact = false,
}: {
  airlineSlug?: string;
  compact?: boolean;
}) {
  const href = airlineSlug
    ? `/tools/checked-baggage-calculator?airline=${encodeURIComponent(airlineSlug)}`
    : "/tools/checked-baggage-calculator";

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-blue-800">
        Checked-bag decision tool
      </div>
      <h2 className={compact ? "mt-2 text-lg font-bold text-slate-900" : "mt-2 text-xl font-bold text-slate-900"}>
        Price the bags before the fare looks cheap.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        Enter the airline, travelers, and bags per traveler. The calculator estimates the trip&apos;s
        checked-bag cost when a usable published amount is available, then shows whether a free
        checked bag card could offset it.
      </p>
      <Link href={href} className="mt-4 inline-flex text-sm font-bold text-blue-800 underline">
        Estimate checked-bag cost
      </Link>
    </section>
  );
}
