import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import {
  carryOnProducts,
  carryOnProductsVerified,
  formatProductDimensions,
  formatProductPrice,
  getPublishedCabinRules,
  productFitSummary,
} from "@/lib/carry-on-products";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Recommended Carry-On Luggage, Checked Against Airline Size Rules",
  description: "Six carry-ons compared by verified exterior dimensions, empty weight, capacity, drawbacks, and fit against published airline cabin-bag rules.",
  alternates: { canonical: canonical("/recommended-carry-on-luggage") },
};

export default function RecommendedCarryOnLuggagePage() {
  const rules = getPublishedCabinRules();

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-12">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "Recommended carry-on luggage", url: canonical("/recommended-carry-on-luggage"), numberOfItems: carryOnProducts.length }} />
      <header className="grid gap-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Editorial carry-on shortlist</div>
        <h1 className="text-4xl font-black tracking-tight text-slate-950">Six carry-ons checked against published airline dimensions</h1>
        <p className="max-w-3xl leading-relaxed text-slate-700">This is a deliberately small shortlist, not a catalog. We compare manufacturer-published exterior dimensions—including wheels and handles—with the airline cabin-bag rules in our database, then show the compromises the product page usually leaves out.</p>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <strong>Read “fits” narrowly:</strong> the unexpanded exterior dimensions fit the published size rule. It does not override a cabin-weight limit, fare restriction, smaller aircraft, operating-carrier rule, or a gate agent&apos;s measurement.
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-bold text-blue-700 underline">
          <Link href="/sizer-rules">Test your own bag</Link>
          <Link href="/fees/carry_on">Carry-on fee reference</Link>
          <Link href="/methodology">Data methodology</Link>
        </div>
      </header>

      <section className="grid gap-5">
        {carryOnProducts.map((product) => {
          const fit = productFitSummary(product, rules);
          return (
            <article key={product.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-blue-700">{product.category}</div>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">{product.brand} {product.model}</h2>
                  <p className="mt-3 max-w-3xl leading-relaxed text-slate-700">{product.verdict}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950">
                  <div className="font-black">Fits {fit.fits} of {fit.evaluated}</div>
                  <div className="mt-1 text-xs">airlines with evaluable published cabin dimensions</div>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="font-bold text-slate-500">Exterior size</dt><dd className="mt-1 text-slate-950">{formatProductDimensions(product)}</dd></div>
                <div><dt className="font-bold text-slate-500">Empty weight</dt><dd className="mt-1 text-slate-950">{product.weight_lb} lb</dd></div>
                <div><dt className="font-bold text-slate-500">Capacity</dt><dd className="mt-1 text-slate-950">{product.capacity_l ?? "Not published"}{product.capacity_l ? ` L${product.expanded_capacity_l ? ` / ${product.expanded_capacity_l} L expanded` : ""}` : ""}</dd></div>
                <div><dt className="font-bold text-slate-500">Published price seen</dt><dd className="mt-1 text-slate-950">{formatProductPrice(product)}</dd></div>
              </dl>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div><h3 className="font-black text-slate-950">Why it may work</h3><ul className="mt-2 space-y-2 text-sm text-slate-700">{product.advantages.map((item) => <li key={item}>• {item}</li>)}</ul></div>
                <div><h3 className="font-black text-slate-950">Reasons to hesitate</h3><ul className="mt-2 space-y-2 text-sm text-slate-700">{product.drawbacks.map((item) => <li key={item}>• {item}</li>)}</ul></div>
              </div>

              <a href={product.source_url} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-bold text-blue-700 underline">Verify dimensions at {product.brand}</a>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-black text-slate-950">How this comparison is calculated</h2>
        <p className="mt-2">We sort the three exterior measurements from largest to smallest, then compare them with each airline&apos;s published cabin-bag dimensions the same way. This avoids treating a rotated bag as a different size. Personal-item rules are excluded from the headline count.</p>
        <p className="mt-2">Product specifications and observed manufacturer prices were checked on {carryOnProductsVerified}. Prices and availability can change; the dimensional result uses the stored exterior measurements, not a retailer&apos;s “carry-on approved” label.</p>
      </section>
    </main>
  );
}
