import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import { getLatestVerifiedDateFromFees } from "@/lib/freshness";
import type { FeeItem } from "@/lib/types";
import { RelatedTools } from "@/components/RelatedTools";
import { AIRLINE_STRATEGY } from "@/lib/airline-strategy";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function safeText(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

function safeUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  try {
    return new URL(s).toString();
  } catch {
    return null;
  }
}

function formatAmount(amount: unknown, currency: unknown): string {
  const cur = typeof currency === "string" ? currency.trim() : "";
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return cur ? `${amount.toFixed(0)} ${cur}` : `${amount.toFixed(0)}`;
  }
  if (typeof amount === "string" && amount.trim()) {
    const a = amount.trim();
    return cur ? `${a} ${cur}` : a;
  }
  return "Not published";
}

function findFee(fees: FeeItem[], category: string, predicate?: (row: FeeItem) => boolean): FeeItem | null {
  const rows = fees.filter((x) => safeText(x.category) === category);
  if (!rows.length) return null;
  if (!predicate) return rows[0];
  return rows.find(predicate) ?? null;
}

function buildGenericSections(airlineName: string, strategyText?: string) {
  return [
    {
      id: "bags",
      title: "1) Bags: where the cheap fare usually breaks first",
      body:
        strategyText ??
        `${airlineName} usually extracts the easiest margin from bag behavior: waiting to pay, bringing the wrong shape of bag, or assuming the lightest fare still works for a normal trip.`,
      tip: "Do the bag math before checkout. If one carry-on or checked bag erases the fare gap, the cheap fare was never really cheaper.",
    },
    {
      id: "basic",
      title: "2) Basic or entry fares: price the restrictions, not just the ticket",
      body:
        `The trap is not the fare itself. It is the follow-on cost of restoring normal travel behavior: seat choice, flexibility, or cabin-bag access.`,
      tip: "Treat the regular fare as insurance when there is any chance you will need a bag, a seat assignment, or a change.",
    },
    {
      id: "seats",
      title: "3) Seats: avoid paying premium pricing for normal comfort",
      body:
        "Airlines often monetize anxiety here. Preferred seating can mean very little extra value while still being priced like an upgrade.",
      tip: "Check again at online check-in before paying early booking-time seat prices.",
    },
    {
      id: "changes",
      title: "4) Changes: flexibility has value even when the fee says zero",
      body:
        "Published change policy is only half the story. Fare difference, bundle restrictions, and locked entry fares are what turn changes into real money.",
      tip: "If your plans are soft, price the flexible fare against the cost of having to rebuy.",
    },
    {
      id: "stack",
      title: "Fee-stack math: why the lowest fare is often fake cheap",
      body:
        `The all-in price is what matters: fare + likely bag costs + seat costs + flexibility risk. That is the number users should compare against alternatives.`,
      tip: "Move into the fee table and the tool pages only after you identify which add-ons are actually likely for your trip.",
    },
  ];
}

function decisionToolLinks(slug: string) {
  const enc = encodeURIComponent(slug);
  return [
    {
      href: `/tools/checked-baggage-calculator?airline=${enc}&travelers=2&bags=1&directions=2&trips=2&pay=yes`,
      label: "Estimate checked-bag cost",
      body: "Use this first if a checked bag could erase the fare savings.",
    },
    {
      href: `/best-cards?airline=${enc}&travelers=2&bags=1&trips=2&pay=yes`,
      label: "Check free-bag card math",
      body: "Use this only after you know repeat first-bag fees are a real part of the trip.",
    },
    {
      href: "/sizer-rules?height=22&width=14&depth=9",
      label: "Test carry-on fit",
      body: "Use this when the best fee move may be avoiding the checked bag entirely.",
    },
    {
      href: "/guides/basic-economy-traps#basic-economy-tool",
      label: "Check Basic fare risk",
      body: "Use this when the cheapest fare may restrict bags, seats, or flexibility.",
    },
  ];
}

function getScenarioCards(slug: string, airlineName: string) {
  const enc = encodeURIComponent(slug);
  return [
    {
      title: "One checked bag",
      body: "Price the first checked bag before you compare this fare against another airline.",
      href: `/tools/checked-baggage-calculator?airline=${enc}&travelers=1&bags=1&directions=2&trips=1&pay=yes`,
      cta: "Price one checked bag",
    },
    {
      title: "Two travelers, repeat trips",
      body: "This is where recurring bag fees can make a card waiver or different fare rational.",
      href: `/best-cards?airline=${enc}&travelers=2&bags=1&trips=2&pay=yes`,
      cta: "Run annual bag math",
    },
    {
      title: "Carry-on only",
      body: `If ${airlineName} is strict or the fare is stripped down, the carry-on plan matters before the ticket does.`,
      href: "/sizer-rules?height=22&width=14&depth=9",
      cta: "Check sizer risk",
    },
    {
      title: "Heavy or odd-size bag",
      body: "A normal checked-bag fee may not be the whole bill if weight or size limits are crossed.",
      href: `/tools/excess-baggage-calculator?airline=${enc}&bags=1&directions=2&weight=51&size=63`,
      cta: "Test excess-bag risk",
    },
  ];
}

export function generateStaticParams() {
  return getAirlineSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) return { title: "Airline not found | Airline Fees Expert" };

  return {
    title: `How to beat ${airline.name} fees (2026)`,
    description: `Practical tactics to avoid the biggest fee traps on ${airline.name}: bags, seats, fare restrictions, and common add-on stacks.`,
  };
}

export default async function HowToBeatFeesPage({ params }: PageProps) {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) notFound();

  const strategy = AIRLINE_STRATEGY[slug];
  const fees = (airline.fees ?? []) as FeeItem[];
  const insights = airline.unique_insights;
  const insightTraps = Array.isArray(insights?.traps) ? insights.traps.filter(Boolean) : [];
  const insightProHack = safeText(insights?.pro_hack);
  const latestVerified = getLatestVerifiedDateFromFees(fees);

  const bag1 = findFee(fees, "checked_baggage", (r) =>
    safeText(r.conditions).toLowerCase().includes("first checked bag") ||
    safeText(r.conditions).toLowerCase().includes("1st")
  );
  const bag2 = findFee(fees, "checked_baggage", (r) =>
    safeText(r.conditions).toLowerCase().includes("2nd checked bag") ||
    safeText(r.conditions).toLowerCase().includes("second")
  );
  const basicSeat = findFee(fees, "seat_selection", (r) =>
    safeText(r.applies_to).toLowerCase().includes("basic")
  );
  const econPlus = findFee(fees, "seat_selection", (r) =>
    safeText(r.conditions).toLowerCase().includes("economy plus")
  );
  const changeFlex = findFee(fees, "change_cancellation", (r) =>
    safeText(r.conditions).toLowerCase().includes("no change fee") ||
    safeText(r.amount).toLowerCase() === "0"
  );
  const changeBasic = findFee(fees, "change_cancellation", (r) =>
    safeText(r.applies_to).toLowerCase().includes("basic") ||
    safeText(r.amount).toLowerCase().includes("not permitted") ||
    safeText(r.conditions).toLowerCase().includes("not permitted")
  );

  const isUnited = slug === "united" || safeText(airline.iata) === "UA";
  const peers = (strategy?.relatedAirlines ?? [])
    .map((peerSlug) => getAirlineBySlug(peerSlug))
    .filter(Boolean);
  const genericSections = strategy?.playbookSections ?? buildGenericSections(airline.name, strategy?.feeEngine);
  const toolLinks = decisionToolLinks(slug);
  const scenarioCards = getScenarioCards(slug, airline.name);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="space-y-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">How to beat {airline.name} fees</h1>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Last verified {latestVerified}
          </span>
        </div>

        <p className="max-w-4xl text-base leading-relaxed text-slate-700">
          {isUnited
            ? "United’s fee pattern is predictable: airport bag payment costs more than prepaying, Basic Economy limits normal trip flexibility, and seat selection can add up fast. If you control bags, seats, and flexibility before booking, most of the avoidable cost disappears."
            : strategy?.verdict ??
              "This airline’s fees are usually won or lost in three places: bags, seats, and fare restrictions. The sections below focus on the costs that matter most before you buy."}
        </p>

        <nav className="flex flex-wrap gap-4 text-sm">
          <Link href="/airlines" className="font-medium text-blue-700 underline">
            All airlines
          </Link>
          <Link href={`/airlines/${encodeURIComponent(slug)}`} className="font-medium text-blue-700 underline">
            {airline.name} fee table
          </Link>
          <Link href="/fees" className="font-medium text-blue-700 underline">
            Fee categories
          </Link>
            <Link href="/methodology" className="font-medium text-blue-700 underline">
            Methodology
          </Link>
        </nav>

        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Decision tools</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Turn this fee guide into trip math
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {toolLinks.map((tool) => (
              <Link key={tool.href} href={tool.href} className="rounded-2xl border border-blue-100 bg-white p-4 hover:border-blue-300">
                <div className="font-bold text-blue-800 underline">{tool.label}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{tool.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Start with your trip scenario</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scenarioCards.map((card) => (
            <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300">
              <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{card.body}</p>
              <div className="mt-3 text-sm font-semibold text-blue-700 underline">{card.cta}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Related references</div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {(strategy?.relatedGuides ?? []).map((guide) => (
            <Link key={guide.href} href={guide.href} className="font-semibold text-blue-700 underline">
              {guide.label}
            </Link>
          ))}
          <Link href="/guides/international-baggage-allowance" className="font-semibold text-blue-700 underline">
            International baggage allowance
          </Link>
          <Link href="/guides/basic-economy-traps" className="font-semibold text-blue-700 underline">
            Basic Economy guide
          </Link>
          {peers.map((peer) => (
            <Link key={peer!.slug} href={`/airlines/${peer!.slug}`} className="font-semibold text-blue-700 underline">
              Compare with {peer!.name}
            </Link>
          ))}
        </div>
      </section>

      {(insightTraps.length > 0 || insightProHack) && (
        <section className="grid gap-6 md:grid-cols-[1.3fr_0.9fr]">
          {insightTraps.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
              <h2 className="text-lg font-bold text-rose-900">Critical traps</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-rose-950">
                {insightTraps.map((trap) => (
                  <li key={trap} className="border-l-4 border-rose-300 pl-4">
                    {trap}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insightProHack && (
            <div className="rounded-2xl border border-blue-200 bg-blue-600 p-6 text-white">
              <h2 className="text-lg font-bold">Key point</h2>
              <p className="mt-4 text-sm leading-relaxed text-blue-50">{insightProHack}</p>
            </div>
          )}
        </section>
      )}

      {isUnited ? (
        <div className="grid gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">1) Bags: stop paying the airport penalty</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                United’s domestic bag fees are classic behavior pricing. The airport price is worse because United wants the revenue before you arrive.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  First checked bag: <strong>{bag1 ? formatAmount(bag1.amount, bag1.currency) : "$35"}</strong>
                  {bag1 && safeUrl(bag1.source_url) ? (
                    <>
                      {" "}
                      (<a href={safeUrl(bag1.source_url)!} target="_blank" rel="noreferrer" className="text-blue-700 underline">source</a>)
                    </>
                  ) : null}
                </li>
                <li>
                  Second checked bag: <strong>{bag2 ? formatAmount(bag2.amount, bag2.currency) : "$45"}</strong>
                </li>
              </ul>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <strong>Traveler move:</strong> prepay bags online once the trip is locked. There is no upside to handing United extra money at the airport.
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">2) Basic Economy: where the fee stack starts</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                United Basic Economy is not just a cheaper ticket. It is a restriction bundle designed to push you back into paying for normal travel behavior.
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <strong>Traveler move:</strong> if plans are even slightly uncertain, buy out of Basic. The non-Basic fare often costs less than one bad change or one bag-plus-seat combo.
              </div>
              {changeFlex && (
                <p>
                  Published flexible rule: <strong>{safeText(changeFlex.conditions)}</strong>
                  {safeUrl(changeFlex.source_url) ? (
                    <>
                      {" "}
                      (<a href={safeUrl(changeFlex.source_url)!} target="_blank" rel="noreferrer" className="text-blue-700 underline">source</a>)
                    </>
                  ) : null}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">3) Seats: do not pay fake-upgrade pricing blindly</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                United sells seat peace of mind. Basic seat assignment starts around{" "}
                <strong>{basicSeat ? formatAmount(basicSeat.amount, basicSeat.currency) : "$15+"}</strong>, while Preferred and Economy Plus pricing can spike hard.
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <strong>Traveler move:</strong> re-check seat prices at online check-in. Booking-time seat pricing is often the worst moment to say yes.
              </div>
              <p>
                Economy Plus reality:{" "}
                <strong>{econPlus ? safeText(econPlus.conditions) : "$29 to $299 per flight"}</strong>.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">4) Changes: the non-Basic premium is often insurance</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
              <p>United’s real flexibility value is not “free changes.” It is staying in the game instead of locking yourself out.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Non-Basic: <strong>{changeFlex ? safeText(changeFlex.conditions) : "No change fee; fare difference applies"}</strong>
                </li>
                <li>
                  Basic: <strong>{changeBasic ? safeText(changeBasic.conditions) : "Changes often not permitted after 24 hours"}</strong>
                </li>
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-900">Fee-stack math</h2>
            <div className="mt-4 text-sm leading-relaxed text-slate-700">
              A common United stack looks like: <strong>$199 Basic fare + $70 roundtrip bag fees + $48 roundtrip seat fees = $317</strong>. That is why the cheap fare often stops being cheap the moment you travel like a normal person.
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-6">
          {genericSections.map((section) => (
            <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
                <p>{section.body}</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <strong>Traveler move:</strong> {section.tip}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">Next steps</h2>
        <ul className="mt-4 grid gap-3 text-sm">
          <li>
            <Link href={`/airlines/${encodeURIComponent(slug)}`} className="font-semibold text-blue-700 underline">
              Review the full {airline.name} fee table
            </Link>
          </li>
          <li>
            <Link href="/fees" className="font-semibold text-blue-700 underline">
              Browse fee-topic pages
            </Link>
          </li>
          <li>
            <Link href={`/tools/checked-baggage-calculator?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&directions=2&trips=2&pay=yes`} className="font-semibold text-blue-700 underline">
              Run the {airline.name} checked-bag scenario
            </Link>
          </li>
          <li>
            <Link href="/compare" className="font-semibold text-blue-700 underline">
              Compare airlines side-by-side
            </Link>
          </li>
        </ul>
      </section>

      <RelatedTools slug={slug} />

      <footer className="text-sm leading-relaxed text-slate-500">
        This page combines published fee rows with route, fare, and baggage context. If a carrier source is unclear, the page should show that uncertainty rather than guess.
      </footer>
    </main>
  );
}
