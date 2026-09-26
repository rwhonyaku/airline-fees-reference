import Link from "next/link";
import { formatDims } from "@/lib/carry-on-sizer";
import { formatProductDimensions, getPublishedCabinRules, productsForAirline } from "@/lib/carry-on-products";

export function CarryOnRecommendations({ airlineSlug, airlineName }: { airlineSlug: string; airlineName: string }) {
  const rules = getPublishedCabinRules();
  const recommendations = productsForAirline(airlineSlug, rules, 3);
  if (!recommendations.length) return null;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Dimension-checked examples</div>
          <h4 className="mt-1 text-lg font-black text-slate-950">Carry-ons within {airlineName}&apos;s published size</h4>
        </div>
        <Link href="/recommended-carry-on-luggage" className="text-sm font-bold text-blue-700 underline">See all six bags</Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {recommendations.map(({ product, result }) => (
          <div key={product.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-black text-slate-950">{product.brand} {product.model}</div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {formatProductDimensions(product)} — within the published {formatDims(result!.dimensionsIn)} limit.
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">Dimension fit is not a guarantee of acceptance. Keep the bag unexpanded and check weight, fare, operating-carrier, and aircraft restrictions.</p>
    </aside>
  );
}
