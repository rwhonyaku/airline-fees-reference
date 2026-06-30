import Link from "next/link";
import Image from "next/image";
import { getAirlinesIndex } from "@/lib/data";

export default function HomePage() {
  const airlines = getAirlinesIndex();
  const previewAirlines = airlines.slice(0, 12);

  return (
    <div className="w-full">
      <section className="relative -mx-6 -mt-6 mb-12 min-h-[520px] overflow-hidden rounded-t-2xl bg-slate-950 px-6 py-16 md:-mx-10 md:-mt-10 md:rounded-2xl md:px-10 lg:min-h-[560px]">
        <Image
          src="/images/homepage-airport-fees.png"
          alt="Traveler walking through an airport terminal with baggage and departure signs"
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-slate-950/10" />

        <div className="relative flex min-h-[392px] max-w-2xl flex-col justify-center text-white lg:min-h-[432px]">
          <h1 className="mb-6 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
            Avoid airline fee traps before you book or fly
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-slate-100 md:text-xl">
            Check baggage rules, fare restrictions, sizer risk, and card break-even calculations
            before an airline&apos;s cheapest fare turns into the expensive one.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/airlines"
              className="w-full rounded-lg bg-white px-6 py-3 text-center font-bold text-slate-950 transition-all hover:bg-blue-50 sm:w-auto"
            >
              Find Fee Traps by Airline
            </Link>
            <Link
              href="/sizer-rules"
              className="w-full rounded-lg border border-white/35 bg-white/10 px-6 py-3 text-center font-bold text-white backdrop-blur transition-all hover:bg-white/20 sm:w-auto"
            >
              Check Sizer Rules
            </Link>
            <Link
              href="/tools/checked-baggage-calculator"
              className="w-full rounded-lg border border-white/35 bg-white/10 px-6 py-3 text-center font-bold text-white backdrop-blur transition-all hover:bg-white/20 sm:w-auto"
            >
              Bag Cost Calculator
            </Link>
            <Link
              href="/methodology"
              className="w-full rounded-lg border border-white/35 bg-white/10 px-6 py-3 text-center font-bold text-white backdrop-blur transition-all hover:bg-white/20 sm:w-auto"
            >
              Methodology
            </Link>
          </div>
        </div>
      </section>

      <section className="my-16">
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Popular reference topics
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Start with the topic that matches the fee or fare restriction you are trying to verify.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/fees/checked_baggage"
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-sm"
          >
            <div className="text-lg font-bold text-slate-900">Checked baggage fees</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              First-bag, second-bag, and airport-versus-prepaid baggage references.
            </p>
          </Link>

          <Link
            href="/fees/carry_on"
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-sm"
          >
            <div className="text-lg font-bold text-slate-900">Carry-on rules</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Cabin-bag and personal-item rules, including stricter low-cost models.
            </p>
          </Link>

          <Link
            href="/guides/basic-economy-traps"
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-sm"
          >
            <div className="text-lg font-bold text-slate-900">Basic Economy restrictions</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Carry-on, seat, and change-rule differences across entry fare types.
            </p>
          </Link>

          <Link
            href="/guides/airline-credit-card-baggage-benefits"
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-sm"
          >
            <div className="text-lg font-bold text-slate-900">Airline credit-card bag benefits</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Checked-bag benefit rules by airline card family and traveler coverage.
            </p>
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-lg font-bold text-slate-900">Passenger rights</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Official-reference pages for cancellations, delays, and refund rules.
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/passenger-rights/eu261" className="font-medium text-blue-700 underline">
                EU261 reference
              </Link>
              <Link
                href="/passenger-rights/us-dot-refund"
                className="font-medium text-blue-700 underline"
              >
                U.S. DOT refund rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16 rounded-2xl border border-sky-200 bg-sky-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-sky-800">
          International trip prep
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          Avoid landing without data
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
          For international flights, a travel eSIM is worth considering when you need maps,
          rideshare, lodging messages, or airline rebooking tools immediately after arrival.
        </p>
        <Link href="/guides/travel-esims" className="mt-4 inline-block font-bold text-sky-900 underline">
          Check the travel eSIM decision guide
        </Link>
      </section>

      <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <div className="mb-2 text-lg font-bold text-slate-900">What this site is</div>
          <div className="text-sm leading-relaxed text-slate-600">
            A structured airline policy reference: published fee rows where available, plus route,
            fare, and baggage context that changes how those fees apply.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <div className="mb-2 text-lg font-bold text-slate-900">What you get</div>
          <div className="text-sm leading-relaxed text-slate-600">
            Fee tables, carry-on and baggage references, fare-restriction guides, and bag-fee
            math.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <div className="mb-2 text-lg font-bold text-slate-900">What we do not do</div>
          <div className="text-sm leading-relaxed text-slate-600">
            No legal guidance. When we cite fees, we link to the carrier-published source where the
            underlying fee or rule is published.
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 pt-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Airline directory</h2>
            <p className="mt-1 text-slate-500">
              A sample of the {airlines.length} indexed carriers.
            </p>
          </div>
          <Link href="/airlines" className="font-bold text-blue-600 hover:underline">
            View All Airlines
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {previewAirlines.map((airline) => (
            <Link
              key={airline.slug}
              href={`/airlines/${airline.slug}`}
              className="group rounded-xl border border-slate-100 bg-white p-4 text-center transition-all hover:border-blue-500 hover:shadow-xl"
            >
              <div className="font-bold text-slate-900 group-hover:text-blue-600">
                {airline.name}
              </div>
              {airline.iata ? (
                <div className="mt-1 text-[10px] font-mono font-bold text-slate-400">
                  {airline.iata}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
