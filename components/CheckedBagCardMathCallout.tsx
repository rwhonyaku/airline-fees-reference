import Link from "next/link";

export function CheckedBagCardMathCallout({
  airlineSlug,
  compact = false,
}: {
  airlineSlug?: string;
  compact?: boolean;
}) {
  const href = airlineSlug ? `/best-cards?airline=${encodeURIComponent(airlineSlug)}` : "/best-cards";

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-emerald-800">
        Free checked bag math
      </div>
      <h2 className={compact ? "mt-2 text-lg font-bold text-slate-900" : "mt-2 text-xl font-bold text-slate-900"}>
        Checking bags more than once or twice a year?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        Run the annual-fee break-even math before paying cash for repeat first-bag fees. The
        calculator only counts published checked-bag savings, traveler coverage, and card-payment
        requirements.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href={href} className="font-bold text-emerald-900 underline">
          Use the free checked bag calculator
        </Link>
        <Link href="/guides/airline-credit-card-baggage-benefits" className="font-semibold text-blue-700 underline">
          Compare baggage benefit rules
        </Link>
      </div>
    </section>
  );
}
