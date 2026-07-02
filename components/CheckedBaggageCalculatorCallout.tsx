import Link from "next/link";

export function CheckedBaggageCalculatorCallout({
  airlineSlug,
  compact = false,
}: {
  airlineSlug?: string;
  compact?: boolean;
}) {
  const href = airlineSlug
    ? `/tools/checked-baggage-calculator?airline=${encodeURIComponent(airlineSlug)}&travelers=2&bags=1&directions=2&trips=2&pay=yes`
    : "/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes";

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-blue-800">
        Checked-bag decision tool
      </div>
      <h2 className={compact ? "mt-2 text-lg font-bold text-slate-900" : "mt-2 text-xl font-bold text-slate-900"}>
        Price the bags before the fare looks cheap.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        Start with a realistic two-traveler, one-bag scenario, then adjust the inputs. The calculator
        quotes a total only when the published data supports it, and explains what to look up when
        the airline prices bags by route, fare, or purchase timing.
      </p>
      <Link href={href} className="mt-4 inline-flex text-sm font-bold text-blue-800 underline">
        Estimate checked-bag cost
      </Link>
    </section>
  );
}
