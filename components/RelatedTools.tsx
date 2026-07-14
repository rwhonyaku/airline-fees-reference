// components/RelatedTools.tsx
import Link from "next/link";
import { CheckedBaggageCalculatorCallout } from "@/components/CheckedBaggageCalculatorCallout";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";

export function RelatedTools({ slug }: { slug: string }) {
  const enc = encodeURIComponent(slug);
  const bagScenario = `airline=${enc}&travelers=2&bags=1&directions=2&trips=2&pay=yes`;
  const cardScenario = `airline=${enc}&travelers=2&bags=1&trips=2&pay=yes`;

  return (
    <div className="mt-10 grid gap-4">
      <CheckedBaggageCalculatorCallout airlineSlug={slug} compact />
      <CheckedBagCardMathCallout airlineSlug={slug} compact />
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-bold text-slate-900">Next fee checks for this airline</div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Start with the bag cost, then check whether size, fare restrictions, or repeat trips
          change the answer.
        </p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <Link
            className="rounded-lg border border-blue-100 bg-blue-50 p-3 font-semibold text-blue-800 hover:border-blue-300"
            href={`/tools/checked-baggage-calculator?${bagScenario}`}
          >
            Price a checked-bag trip
          </Link>
          <Link
            className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 font-semibold text-emerald-900 hover:border-emerald-300"
            href={`/best-cards?${cardScenario}`}
          >
            Run card break-even
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 hover:border-slate-300"
            href={`/tools/excess-baggage-calculator?airline=${enc}&bags=1&directions=2&weight=51&size=63`}
          >
            Check overweight or oversize risk
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 hover:border-slate-300"
            href="/sizer-rules?height=22&width=14&depth=9"
          >
            Check carry-on sizer risk
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 hover:border-slate-300"
            href="/guides/basic-economy-traps"
          >
            Check cheap-fare restrictions
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 hover:border-slate-300"
            href="/guides/international-baggage-allowance"
          >
            Understand international allowance rules
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 hover:border-slate-300"
            href="/fees/checked_baggage"
          >
            Compare checked-bag rules
          </Link>
          <Link
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 hover:border-slate-300"
            href="/compare"
          >
            Compare airlines side by side
          </Link>
        </div>
      </section>
    </div>
  );
}
