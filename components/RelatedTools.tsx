// components/RelatedTools.tsx
import Link from "next/link";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";
import { TravelEsimCallout } from "@/components/TravelEsimCallout";

export function RelatedTools({ slug }: { slug: string }) {
  const enc = encodeURIComponent(slug);

  return (
    <div className="mt-10 grid gap-4">
      <CheckedBagCardMathCallout airlineSlug={slug} compact />
      <TravelEsimCallout compact />
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="text-sm font-bold text-slate-900">Related tools</div>
        <div className="mt-3 grid gap-2 text-sm">
          <Link className="underline text-blue-700" href="/sizer-rules">
            Sizer rules & enforcement reality
          </Link>
          <Link className="underline text-blue-700" href={`/best-cards?airline=${enc}`}>
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
