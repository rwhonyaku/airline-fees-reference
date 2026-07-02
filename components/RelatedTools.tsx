// components/RelatedTools.tsx
import Link from "next/link";
import { CheckedBaggageCalculatorCallout } from "@/components/CheckedBaggageCalculatorCallout";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";
import { TravelEsimCallout } from "@/components/TravelEsimCallout";

export function RelatedTools({ slug }: { slug: string }) {
  const enc = encodeURIComponent(slug);
  const bagScenario = `airline=${enc}&travelers=2&bags=1&directions=2&trips=2&pay=yes`;
  const cardScenario = `airline=${enc}&travelers=2&bags=1&trips=2&pay=yes`;

  return (
    <div className="mt-10 grid gap-4">
      <CheckedBaggageCalculatorCallout airlineSlug={slug} compact />
      <CheckedBagCardMathCallout airlineSlug={slug} compact />
      <TravelEsimCallout compact />
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="text-sm font-bold text-slate-900">Related tools</div>
        <div className="mt-3 grid gap-2 text-sm">
          <Link className="underline text-blue-700" href="/sizer-rules?height=22&width=14&depth=9">
            Sizer rules & enforcement reality
          </Link>
          <Link className="underline text-blue-700" href={`/tools/checked-baggage-calculator?${bagScenario}`}>
            Checked baggage cost calculator
          </Link>
          <Link className="underline text-blue-700" href={`/tools/excess-baggage-calculator?airline=${enc}&bags=1&directions=2&weight=51&size=63`}>
            Overweight and oversize baggage calculator
          </Link>
          <Link className="underline text-blue-700" href={`/best-cards?${cardScenario}`}>
            Free checked bag card calculator for this airline
          </Link>
          <Link className="underline text-blue-700" href="/compare">
            Compare airlines side-by-side
          </Link>
          <Link className="underline text-blue-700" href="/guides/travel-esims">
            Travel eSIM decision guide
          </Link>
        </div>
      </section>
    </div>
  );
}
