import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { calcExcessBaggageTripCost, clampInt, firstString, usd } from "@/lib/bag-cost-calculator";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Overweight and Oversize Baggage Calculator | Airline Fees Reference",
  description:
    "Estimate overweight and oversize baggage charges when published airline fee details include a usable numeric USD fee.",
};

function AirlineSelect({ value }: { value: string }) {
  return (
    <select
      name="airline"
      defaultValue={value}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
    >
      {getAirlineSlugs().map((slug) => {
        const airline = getAirlineBySlug(slug);
        return (
          <option key={slug} value={slug}>
            {airline?.name ?? slug}
          </option>
        );
      })}
    </select>
  );
}

function scenarioHref(airlineSlug: string, weight: number, size: number): string {
  return `/tools/excess-baggage-calculator?airline=${encodeURIComponent(airlineSlug)}&bags=1&directions=2&weight=${weight}&size=${size}`;
}

function checkedBagHref(airlineSlug: string): string {
  return `/tools/checked-baggage-calculator?airline=${encodeURIComponent(airlineSlug)}&travelers=1&bags=1&directions=2&trips=1&pay=yes`;
}

function sizerHref(): string {
  return "/sizer-rules?height=22&width=14&depth=9";
}

function rowSummary(row: NonNullable<ReturnType<typeof calcExcessBaggageTripCost>["overweight"]>["row"]): string {
  return [row.conditions, row.region_or_route, row.timing].filter(Boolean).join(" · ");
}

export default async function ExcessBaggageCalculatorPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const airlineSlug = firstString(sp.airline) || "american";
  const airline = getAirlineBySlug(airlineSlug);
  if (!airline) notFound();

  const bagCount = clampInt(firstString(sp.bags), 1, 6, 1);
  const directions = clampInt(firstString(sp.directions), 1, 2, 2);
  const weightLbs = clampInt(firstString(sp.weight), 1, 150, 51);
  const linearInches = clampInt(firstString(sp.size), 1, 150, 63);

  const result = calcExcessBaggageTripCost({
    fees: airline.fees,
    bagCount,
    directions,
    weightLbs,
    linearInches,
  });

  const needsOverweight = weightLbs > 50;
  const needsOversize = linearInches > 62;
  const noExcess = !needsOverweight && !needsOversize;

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10">
      <header className="grid gap-3">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Excess-bag cost tool
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Overweight and oversize baggage calculator</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
          Estimate excess-baggage charges before the airport scale. The tool uses published numeric
          USD fees only. When an airline prices excess baggage by route, allowance, currency, or
          special-item rule, it says so instead of inventing a number.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={checkedBagHref(airlineSlug)} className="font-semibold text-blue-700 underline">
            Price normal checked bag first
          </Link>
          <Link href={sizerHref()} className="font-semibold text-blue-700 underline">
            Check carry-on fallback
          </Link>
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="font-semibold text-blue-700 underline">
            {airline.name} fee page
          </Link>
        </div>
      </header>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-600">Quick scenarios</div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={scenarioHref(airlineSlug, 51, 62)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700">
            51 lb checked bag
          </Link>
          <Link href={scenarioHref(airlineSlug, 70, 62)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700">
            70 lb checked bag
          </Link>
          <Link href={scenarioHref(airlineSlug, 50, 63)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700">
            63 linear inch bag
          </Link>
          <Link href={scenarioHref(airlineSlug, 70, 70)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-blue-700">
            Heavy and oversized
          </Link>
        </div>
      </section>

      <form method="get" className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Airline</label>
            <AirlineSelect value={airlineSlug} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Trip type</label>
            <select name="directions" defaultValue={String(directions)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="2">Roundtrip</option>
              <option value="1">One-way</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Number of bags</label>
            <input name="bags" defaultValue={String(bagCount)} inputMode="numeric" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Bag weight, lbs</label>
            <input name="weight" defaultValue={String(weightLbs)} inputMode="numeric" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Linear inches</label>
            <input name="size" defaultValue={String(linearInches)} inputMode="numeric" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
        </div>

        <button type="submit" className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 md:w-fit">
          Estimate excess-bag cost
        </button>
      </form>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-600">Answer first</div>
        {noExcess ? (
          <>
            <h2 className="text-3xl font-extrabold text-slate-950">This bag does not cross the common excess-bag thresholds.</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
              The entered weight is at or below 50 lb and the entered size is at or below 62 linear
              inches, so this tool does not model an overweight or oversize charge.
            </p>
          </>
        ) : result.canEstimate ? (
          <>
            <h2 className="text-3xl font-extrabold text-slate-950">
              Estimated excess-bag charges: {result.totalUsd != null ? usd(result.totalUsd) : "-"}.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
              This multiplies the matched published excess-bag fees by {bagCount} bag{bagCount === 1 ? "" : "s"} and{" "}
              {directions} flight direction{directions === 1 ? "" : "s"}. It does not include the
              regular checked-bag fee that may also apply.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-slate-950">
              {airline.name} needs an airline-specific lookup before this tool can quote the excess-bag charge.
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
              That usually means the charge depends on route, currency, allowance type, special-item
              handling, or whether the airline stacks overweight and oversize fees.
            </p>
          </>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Before accepting the excess charge
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h2 className="text-base font-bold text-slate-950">Check the base bag fee</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Overweight and oversize fees may be charged in addition to the normal checked-bag fee,
              so the excess number is not always the full bag cost.
            </p>
            <Link href={checkedBagHref(airlineSlug)} className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
              Price normal checked bag
            </Link>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h2 className="text-base font-bold text-slate-950">Try a repack</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              If the issue is a few pounds over the limit, moving weight into a personal item or
              carry-on can be cheaper than paying the airport scale.
            </p>
            <Link href={sizerHref()} className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
              Check carry-on fit
            </Link>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <h2 className="text-base font-bold text-slate-950">Confirm the airline rule</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Route, aircraft, special-item rules, and maximum accepted weight can change whether a
              bag is priced, restricted, or refused.
            </p>
            <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
              Open {airline.name} fees
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Fees used for this estimate</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Overweight</div>
            {needsOverweight ? (
              result.overweight ? (
                <>
                  <div className="mt-2 text-2xl font-black text-slate-950">{usd(result.overweight.fee)}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{rowSummary(result.overweight.row)}</p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Needs route or allowance lookup.</p>
              )
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Not overweight by the 50 lb screening threshold.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Oversize</div>
            {needsOversize ? (
              result.oversize ? (
                <>
                  <div className="mt-2 text-2xl font-black text-slate-950">{usd(result.oversize.fee)}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{rowSummary(result.oversize.row)}</p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Needs route or special-item lookup.</p>
              )
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Not oversized by the 62 linear inch screening threshold.</p>
            )}
          </div>
        </div>

        {result.warnings.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
            <div className="font-bold">Important notes</div>
            <ul className="mt-2 grid gap-2">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-bold text-slate-950">Related guides</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/airlines/${encodeURIComponent(airlineSlug)}`} className="text-blue-700 underline">
            {airline.name} fees
          </Link>
          <Link href="/fees/overweight_baggage" className="text-blue-700 underline">
            Overweight baggage fees
          </Link>
          <Link href="/fees/oversize_baggage" className="text-blue-700 underline">
            Oversize baggage fees
          </Link>
          <Link href="/tools/checked-baggage-calculator" className="text-blue-700 underline">
            Checked-baggage calculator
          </Link>
          <Link href="/sizer-rules" className="text-blue-700 underline">
            Carry-on sizer rules
          </Link>
          <Link href="/guides/carry-on-strictness-by-airline" className="text-blue-700 underline">
            Carry-on strictness guide
          </Link>
        </div>
      </section>
    </main>
  );
}
