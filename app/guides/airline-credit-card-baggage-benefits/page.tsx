import Link from "next/link";
import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";

export const metadata: Metadata = {
  title: "Credit cards with free checked bags: airline baggage benefit rules (2026) | Airline Fees Reference",
  description:
    "Which airline credit cards include free checked bags, how many travelers are covered, where route limits apply, and when the bag benefit can outweigh the annual fee.",
};

const LAST_VERIFIED = "2026-06-10";

type Card = {
  id: string;
  name: string;
  airline_slug: string;
  tier?: string;
  annual_fee_usd: number;
  free_checked_bags: number;
  applies_to_travelers: number;
  requires_purchase_with_card: boolean;
  notes?: string[];
};

type CardsJson = { cards: Card[] };

type AirlineGuideMeta = {
  airlineName: string;
  airlinePage: string;
  cardSource: string;
  cardSourceLabel: string;
  policySource: string;
  policySourceLabel: string;
  routeScope: string;
  coreLimits: string[];
};

const AIRLINE_META: Record<string, AirlineGuideMeta> = {
  alaska: {
    airlineName: "Alaska",
    airlinePage: "/airlines/alaska",
    cardSource: "https://www.alaskaair.com/atmosrewards/content/credit-cards",
    cardSourceLabel: "Atmos Rewards credit cards",
    policySource: "https://www.alaskaair.com/content/travel-info/baggage/baggage-fee-waivers-exceptions",
    policySourceLabel: "Alaska baggage fee waivers and exceptions",
    routeScope: "Alaska Airlines and Hawaiian Airlines flights paid with an eligible Atmos card",
    coreLimits: [
      "Published free-bag language requires the flight to be paid for with the eligible card.",
      "The benefit applies to the cardholder and up to 6 guests on the same reservation.",
      "This is a first-checked-bag benefit, not an overweight or oversized waiver.",
    ],
  },
  american: {
    airlineName: "American",
    airlinePage: "/airlines/american",
    cardSource: "https://creditcards.aa.com/card-benefits/",
    cardSourceLabel: "AA card benefits",
    policySource: "https://www.aa.com/i18n/travel-info/baggage/baggage.jsp",
    policySourceLabel: "American baggage policy",
    routeScope: "Domestic American Airlines itineraries",
    coreLimits: [
      "Benefit is tied to domestic American Airlines itineraries, not every partner or long-haul itinerary.",
      "Companions must be on the same reservation as the eligible primary cardholder.",
      "This is a standard first-bag benefit, not an overweight or oversized waiver.",
    ],
  },
  united: {
    airlineName: "United",
    airlinePage: "/airlines/united",
    cardSource: "https://creditcards.chase.com/travel-credit-cards/united",
    cardSourceLabel: "United card comparison",
    policySource: "https://www.united.com/en/us/fly/baggage/free-bags-for-cardmembers.html",
    policySourceLabel: "United free bags for cardmembers",
    routeScope: "United-operated flights",
    coreLimits: [
      "United requires the primary cardmember's MileagePlus number on the reservation.",
      "In this model, the ticket must be purchased with the eligible card for the bag benefit to apply.",
      "The benefit applies to standard checked bags, not overweight or oversized bags.",
    ],
  },
  delta: {
    airlineName: "Delta",
    airlinePage: "/airlines/delta",
    cardSource: "https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-personal-cards",
    cardSourceLabel: "Delta personal card overview",
    policySource: "https://www.delta.com/us/en/baggage/checked-baggage/first-checked-bag-free",
    policySourceLabel: "Delta first checked bag free terms",
    routeScope: "Delta and Delta Connection segments when checking in with Delta",
    coreLimits: [
      "Reservation must include the Basic Card Member's SkyMiles number.",
      "Delta publishes this benefit for flights booked with the card and checked in with Delta.",
      "Codeshare flights and passengers already receiving a free checked bag through fare, status, or military eligibility are not covered by this benefit line.",
    ],
  },
};

function usd(amount: number): string {
  return `$${Math.round(amount)}`;
}

function bagBenefitLabel(card: Card): string {
  return card.free_checked_bags >= 2
    ? "First and second checked bags free"
    : "First checked bag free";
}

function travelerCoverageLabel(card: Card): string {
  if (card.applies_to_travelers <= 1) return "Primary cardholder only";
  if (card.applies_to_travelers === 2) return "Cardmember + 1 companion";
  return `Cardmember + up to ${card.applies_to_travelers - 1} companions`;
}

function annualFeeBand(cards: Card[]): string {
  const fees = cards.map((card) => card.annual_fee_usd).sort((a, b) => a - b);
  if (!fees.length) return "No annual fee shown";
  const min = fees[0];
  const max = fees[fees.length - 1];
  return min === max ? usd(min) : `${usd(min)}-${usd(max)}`;
}

async function readCards(): Promise<Card[]> {
  const fullPath = path.join(process.cwd(), "data/cards/cards.json");
  const raw = await fs.readFile(fullPath, "utf8");
  const parsed = JSON.parse(raw) as CardsJson;
  return parsed.cards ?? [];
}

export default async function AirlineCreditCardBaggageBenefitsPage() {
  const cards = await readCards();
  const airlineGroups = Object.entries(AIRLINE_META).map(([slug, meta]) => ({
    slug,
    meta,
    cards: cards
      .filter((card) => card.airline_slug === slug)
      .sort((a, b) => a.annual_fee_usd - b.annual_fee_usd),
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="space-y-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Credit cards with free checked bags
          </h1>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Last verified {LAST_VERIFIED}
          </span>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/fees/checked_baggage" className="font-medium text-blue-700 underline">
            Checked baggage fee reference
          </Link>
          <Link href="/best-cards" className="font-medium text-blue-700 underline">
            Free checked bag calculator
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-medium text-blue-700 underline">
            Basic Economy traps
          </Link>
          <Link href="/methodology" className="font-medium text-blue-700 underline">
            Methodology
          </Link>
        </nav>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Answer first
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            Some airline credit cards include a free checked bag, but the benefit is not universal.
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">
            In this site&apos;s verified calculator, Alaska, American, United, and Delta cards include
            published checked-bag benefits. The important question is not just whether the card says
            &quot;free checked bag.&quot; It is whether your airline, route, traveler count, reservation,
            and payment method satisfy the benefit rules.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                The airline credit cards in this site&apos;s verified dataset that include checked bag
                benefits are currently Alaska Airlines, American Airlines, United Airlines, and
                Delta Air Lines co-branded cards. In each case, the benefit is narrower than a
                blanket baggage waiver: route scope, traveler count, and booking conditions still
                control whether the published free-bag line applies.
              </p>
              <p>
                This page is a technical reference, not a card ranking. It covers the airline card
                families currently included in this site&apos;s bag-fee calculator:{" "}
                <Link href="/airlines/alaska" className="underline">
                  Alaska
                </Link>
                ,{" "}
                <Link href="/airlines/american" className="underline">
                  American
                </Link>
                ,{" "}
                <Link href="/airlines/united" className="underline">
                  United
                </Link>
                , and{" "}
                <Link href="/airlines/delta" className="underline">
                  Delta
                </Link>
                .
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
              <div className="font-bold text-slate-900">Use this page when the question is:</div>
              <ul className="mt-3 space-y-2">
                <li>Which airline credit cards currently include a checked bag benefit?</li>
                <li>How many travelers the waiver covers on one reservation?</li>
                <li>What the published route or booking limits are before using the benefit?</li>
              </ul>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link href="/best-cards?airline=alaska&travelers=2&bags=1&trips=2&pay=yes" className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700">
              Run free checked bag math
            </Link>
            <Link href="/tools/checked-baggage-calculator?airline=alaska&travelers=2&bags=1&directions=2&trips=2&pay=yes" className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-900 hover:border-blue-400">
              Estimate baggage cost first
            </Link>
          </div>
        </section>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Airline-by-airline checked bag benefit reference</h2>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          The useful comparison is not just which card has a bag benefit. It is how many travelers
          the benefit covers, how many bags it removes, and how narrow the route or booking rules
          are.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[1200px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Airline</th>
                <th className="px-4 py-3 font-semibold">Card family / name</th>
                <th className="px-4 py-3 font-semibold">Checked bag benefit</th>
                <th className="px-4 py-3 font-semibold">Companions included</th>
                <th className="px-4 py-3 font-semibold">Annual fee</th>
                <th className="px-4 py-3 font-semibold">Basic restrictions</th>
                <th className="px-4 py-3 font-semibold">Source / verification note</th>
              </tr>
            </thead>
            <tbody>
              {airlineGroups.flatMap(({ meta, cards: airlineCards }) =>
                airlineCards.map((card, index) => (
                  <tr key={card.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-4 text-slate-900">
                      {index === 0 ? (
                        <div className="space-y-2">
                          <Link href={meta.airlinePage} className="font-semibold text-blue-700 underline">
                            {meta.airlineName}
                          </Link>
                          <div className="text-xs text-slate-500">{meta.routeScope}</div>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-900">
                      <div className="font-semibold">{card.name}</div>
                      {card.tier ? <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{card.tier}</div> : null}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{bagBenefitLabel(card)}</td>
                    <td className="px-4 py-4 text-slate-700">{travelerCoverageLabel(card)}</td>
                    <td className="px-4 py-4 text-slate-700">{usd(card.annual_fee_usd)}</td>
                    <td className="px-4 py-4 text-slate-700">
                      <ul className="space-y-2">
                        {meta.coreLimits.slice(0, 2).map((limit) => (
                          <li key={limit}>{limit}</li>
                        ))}
                        {card.notes?.[0] ? <li>{card.notes[0]}</li> : null}
                      </ul>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div>Verified against the airline card and baggage policy pages listed below.</div>
                      <div className="mt-2 text-xs text-slate-500">Last verified {LAST_VERIFIED}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">When baggage benefits actually matter</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Family travel</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              A waiver that extends to companions changes the math much faster than a solo-only
              benefit. That is why the traveler-count column matters more than the card&apos;s brand
              tier by itself.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Repeat bag patterns</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              These benefits are most relevant when the trip pattern regularly includes a first
              checked bag. They matter less when the traveler usually stays carry-on only or pays
              mostly second-bag and overweight charges instead.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Annual fee range</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Current annual-fee ranges in this page run from{" "}
              <strong>{annualFeeBand(cards.filter((card) => card.airline_slug === "alaska"))}</strong>{" "}
              on Alaska,{" "}
              <strong>{annualFeeBand(cards.filter((card) => card.airline_slug === "american"))}</strong>{" "}
              on American,{" "}
              <strong>{annualFeeBand(cards.filter((card) => card.airline_slug === "united"))}</strong>{" "}
              on United, and{" "}
              <strong>{annualFeeBand(cards.filter((card) => card.airline_slug === "delta"))}</strong>{" "}
              on Delta.
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          If you want to test a specific trip pattern instead of reading the benefit table in the
          abstract, use the{" "}
          <Link href="/best-cards" className="underline">
            free checked bag math tool
          </Link>
          . It models first-bag savings only and excludes points, lounge access, credits, and
          bonuses.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Important restrictions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {airlineGroups.map(({ slug, meta }) => (
            <div key={slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-900">
                <Link href={meta.airlinePage} className="underline">
                  {meta.airlineName}
                </Link>
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                {meta.coreLimits.map((limit) => (
                  <li key={limit}>{limit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Related references:{" "}
          <Link href="/fees/checked_baggage" className="underline">
            checked baggage fee reference
          </Link>
          ,{" "}
          <Link href="/guides/basic-economy-traps" className="underline">
            Basic Economy traps
          </Link>
          , and the airline fee pages for{" "}
          <Link href="/airlines/alaska" className="underline">
            Alaska
          </Link>
          ,{" "}
          <Link href="/airlines/american" className="underline">
            American
          </Link>
          ,{" "}
          <Link href="/airlines/united" className="underline">
            United
          </Link>
          , and{" "}
          <Link href="/airlines/delta" className="underline">
            Delta
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-8">
        <h2 className="text-xl font-bold text-slate-900">Official sources used for this page</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
          {airlineGroups.map(({ slug, meta }) => (
            <li key={slug}>
              <a href={meta.cardSource} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                {meta.cardSourceLabel}
              </a>
              {" "}and{" "}
              <a href={meta.policySource} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                {meta.policySourceLabel}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
