import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import { FEE_HUB_STRATEGY } from "@/lib/fee-hub-strategy";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";

type PageProps = {
  params: Promise<{ category: string }>;
};

type Row = {
  slug: string;
  airlineName: string;
  iata?: string;
  amountText: string;
  appliesTo: string;
  regionOrRoute: string;
  timing: string;
  conditions: string;
  sourceUrl: string | null;
  lastVerified: string;
};

function safeText(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "Not published";
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

function safeDate(v: unknown): string {
  if (typeof v !== "string") return "Not published";
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "Not published";
}

function getLatestVerifiedDate(rows: Row[]): string {
  const dates = rows.map((row) => row.lastVerified).filter((date) => date !== "Not published");
  return dates.length ? dates.sort().at(-1)! : "Not published";
}

function formatAmount(amount: unknown, currency: unknown): string {
  const cur = typeof currency === "string" ? currency.trim() : "";

  if (typeof amount === "number" && Number.isFinite(amount)) {
    return cur ? `${amount.toFixed(0)} ${cur}` : `${amount.toFixed(0)}`;
  }

  if (typeof amount === "string" && amount.trim()) {
    const a = amount.trim();
    if (a.toLowerCase() === "not permitted") return "Not permitted";
    return cur ? `${a} ${cur}` : a;
  }

  return "Not published";
}

function formatContextualAmount(item: { amount: unknown; currency: unknown; category?: string; conditions?: string; applies_to?: string; region_or_route?: string; timing?: string }): string {
  if (typeof item.amount === "number" && Number.isFinite(item.amount)) return formatAmount(item.amount, item.currency);
  if (typeof item.amount !== "string" || !item.amount.trim()) return "Not published";

  const raw = item.amount.trim();
  if (raw.toLowerCase() !== "varies") return formatAmount(item.amount, item.currency);

  const text = [item.conditions, item.applies_to, item.region_or_route, item.timing]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (item.category === "checked_baggage" && (text.includes("additional") || text.includes("my bookings") || text.includes("purchase"))) {
    return "Shown during booking / manage booking";
  }
  if (item.category === "checked_baggage") return "Depends on route and fare";
  if (item.category === "carry_on" && text.includes("basic")) return "Basic fare add-on shown in booking";
  if (item.category === "carry_on") return "Depends on fare and purchase timing";
  if (item.category === "overweight_baggage") return "Airport-priced by route and weight";
  if (item.category === "oversize_baggage") return "Airport-priced by route and size";
  if (item.category === "seat_selection") return "Depends on route, fare, and seat type";
  if (item.category === "change_cancellation") return "Depends on fare conditions";
  if (item.category === "unaccompanied_minor") return "Depends on age and itinerary";

  return "Depends on route, fare, or timing";
}

function titleCaseFromSlug(s: string): string {
  return s
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function getHubCopy(category: string) {
  switch (category) {
    case "checked_baggage":
      return {
        verdict:
          "Checked bag fees can change the real trip price quickly. The biggest differences usually come from prepaid versus airport pricing, fare restrictions, and whether a card or status benefit removes the first bag fee.",
        proTip:
          "If the airline offers prepaid bags, compare that price with the airport rate before travel day. The same bag is often more expensive at the counter.",
        loophole:
          "The cleanest way to avoid checked bag fees is deciding early whether the trip works with a personal item, a carry-on plan, or a bag benefit that removes the first checked bag fee.",
        whatToWatch:
          "Watch prepaid versus airport pricing, one-way versus roundtrip math, and whether the cheapest fare makes a checked bag more likely.",
      };
    case "carry_on":
      return {
        verdict:
          "Carry-on rules are really enforcement rules. The published dimensions matter, but the real money is won or lost on whether the airline monetizes cabin access aggressively.",
        proTip:
          "Treat bag shape as part of the strategy. Soft, compressible bags often outperform rigid rollers even when the claimed dimensions look similar.",
        loophole:
          "On some airlines, buying the right seat or bundle is actually a cheaper way to buy cabin-bag access than paying for the bag as a standalone add-on.",
        whatToWatch:
          "Check whether the fare includes a full cabin bag, only a personal item, or a paid upgrade path that changes the all-in fare.",
      };
    case "seat_selection":
      return {
        verdict:
          "Seat fees are airlines selling anxiety. Many preferred seats are not meaningfully better; they are just normal seats priced like a problem-solving tool.",
        proTip:
          "If you are going to pay for a seat, re-check inventory at online check-in. Booking-time seat pricing is often the worst moment to buy.",
        loophole:
          "Sometimes the right move is not to pay the seat fee. It is to buy out of the restrictive fare or switch airlines before the stack forms.",
        whatToWatch:
          "Compare Basic versus non-Basic seat behavior, preferred versus legroom products, and whether seat selection also changes bag entitlement.",
      };
    case "change_cancellation":
      return {
        verdict:
          "No change fee is not the same as free flexibility. Fare differences and restricted entry fares are where the real cost hides.",
        proTip:
          "Treat a flexible fare as insurance when your plans are soft. One change can erase all the fake savings from the cheapest fare.",
        loophole:
          "The real loophole is avoiding locked fares before you need them, not trying to rescue them after the trip changes.",
        whatToWatch:
          "Check 24-hour windows, whether credits are issued instead of refunds, and what Basic or stripped-down fares block.",
      };
    case "unaccompanied_minor":
      return {
        verdict:
          "Unaccompanied minor fees are a blunt, high-ticket charge, but the bigger issue is whether the service is required, optional, route-limited, or not offered at all.",
        proTip:
          "Confirm the age band and itinerary rules before price-comparing fares. A cheap connection can be useless if the airline only allows nonstop UM travel.",
        loophole:
          "The cheapest workaround is often itinerary design: nonstop routing or a different airline can beat paying a high service fee on the wrong itinerary.",
        whatToWatch:
          "Check age rules, nonstop-only restrictions, route carve-outs, and carriers that simply do not offer the service.",
      };
    default:
      return {
        verdict:
          "This fee category is where airlines monetize confusion. Do not judge the fare in isolation; price the trip as fare plus likely add-ons.",
        proTip:
          "Use the airline page after this hub to verify how the rule behaves on your fare class and route.",
        loophole:
          "The best loophole is usually not cleverness. It is choosing a fare or airline that does not need rescuing.",
        whatToWatch:
          "Watch route carve-outs, fare-family differences, and whether the fee is really a disguised upsell.",
      };
  }
}

function getContextualBridge(category: string) {
  switch (category) {
    case "checked_baggage":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Some airline credit cards include a published first checked bag benefit for the primary
          cardholder and, in some cases, companions on the same reservation. Use the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits">airline credit card baggage benefits guide</Link>{" "}
          to understand benefit rules, use the{" "}
          <Link href="/tools/checked-baggage-calculator">checked baggage cost calculator</Link>{" "}
          to price the trip from traveler and bag inputs, use{" "}
          <Link href="/best-cards">the card break-even calculator</Link> when the question is whether
          recurring first-bag fees offset an annual fee, or use{" "}
          <Link href="/guides/international-baggage-allowance">the international baggage allowance explainer</Link>{" "}
          when the row depends on route, fare family, or piece-versus-weight concept. Use{" "}
          <Link href="/sizer-rules">Sizer rules</Link> if the better comparison is avoiding the
          checked bag entirely.
        </p>
      );
    case "carry_on":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Carry-on strategy gets sharper when you pair this hub with the{" "}
          <Link href="/guides/carry-on-strictness-by-airline">carry-on strictness guide</Link>, then check{" "}
          <Link href="/airlines/spirit">Spirit</Link>, <Link href="/airlines/frontier">Frontier</Link>, and{" "}
          <Link href="/airlines/ryanair">Ryanair</Link> before using{" "}
          <Link href="/sizer-rules">Sizer rules</Link> to test whether your bag survives real enforcement.
        </p>
      );
    case "seat_selection":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Seat-fee pages are most useful when you compare the seat upsell against the stripped fare that created it, so use the{" "}
          <Link href="/guides/basic-economy-traps">Basic Economy guide</Link> alongside{" "}
          <Link href="/airlines/united">United</Link>, <Link href="/airlines/delta">Delta</Link>, and{" "}
          <Link href="/airlines/american">American</Link> before paying for a seat that may only fix a bad fare choice.
        </p>
      );
    case "change_cancellation":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Flexibility problems usually start with the wrong fare family, so pair this page with the{" "}
          <Link href="/guides/basic-economy-traps">Basic Economy guide</Link>, compare{" "}
          <Link href="/airlines/united">United</Link> and <Link href="/airlines/frontier">Frontier</Link>, and use the{" "}
          <Link href="/passenger-rights/us-dot-refund">U.S. DOT refund rules reference</Link> or{" "}
          <Link href="/passenger-rights/eu261">EU261 passenger rights reference</Link> when the disruption question is about refund rights rather than fare rules.
        </p>
      );
    case "overweight_baggage":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Overweight-bag math is usually fixed before the airport scale, so compare{" "}
          <Link href="/airlines/southwest">Southwest</Link>, <Link href="/airlines/frontier">Frontier</Link>, and{" "}
          <Link href="/airlines/spirit">Spirit</Link>, use the{" "}
          <Link href="/tools/excess-baggage-calculator">overweight and oversize baggage calculator</Link>, then check{" "}
          <Link href="/guides/carry-on-strictness-by-airline">carry-on strictness by airline</Link> and{" "}
          <Link href="/sizer-rules">Sizer rules</Link> if repacking into a cabin-first strategy is still realistic.
        </p>
      );
    case "oversize_baggage":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Oversize charges can be harder to rescue at the airport because the bag shape is already
          fixed. Use the{" "}
          <Link href="/tools/excess-baggage-calculator">overweight and oversize baggage calculator</Link>, compare{" "}
          <Link href="/airlines/american">American</Link>, <Link href="/airlines/delta">Delta</Link>, and{" "}
          <Link href="/airlines/southwest">Southwest</Link>, then check{" "}
          <Link href="/fees/checked_baggage">standard checked-bag fees</Link> because oversize charges may be in addition to the normal bag fee.
        </p>
      );
    case "unaccompanied_minor":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Unaccompanied minor fees are rarely the whole story, so compare{" "}
          <Link href="/airlines/southwest">Southwest</Link>, <Link href="/airlines/alaska">Alaska</Link>, and{" "}
          <Link href="/airlines/ryanair">Ryanair</Link> after this hub to see whether the trip is fee-based, route-limited, or not offered at all.
        </p>
      );
    default:
      return null;
  }
}

function getDecisionToolCards(category: string): Array<{ href: string; label: string; body: string }> {
  switch (category) {
    case "checked_baggage":
      return [
        {
          href: "/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes",
          label: "Checked-bag cost calculator",
          body: "Turn travelers, bags, trip type, and annual trips into a baggage-cost estimate when the dataset has numeric fee rows.",
        },
        {
          href: "/best-cards?travelers=2&bags=1&trips=2&pay=yes",
          label: "Free checked bag card math",
          body: "Check whether repeat first-bag fees can justify an eligible airline card on bag savings alone.",
        },
        {
          href: "/guides/international-baggage-allowance",
          label: "International allowance explainer",
          body: "Use this when a fee row depends on route, fare family, cabin, or piece-versus-weight concept.",
        },
      ];
    case "carry_on":
      return [
        {
          href: "/sizer-rules?height=22&width=14&depth=9",
          label: "Carry-on sizer comparison",
          body: "Compare a bag's outside dimensions against published carry-on and personal-item rules.",
        },
        {
          href: "/guides/carry-on-strictness-by-airline",
          label: "Carry-on strictness guide",
          body: "Decide whether the real issue is published dimensions, fare restrictions, or gate enforcement culture.",
        },
        {
          href: "/guides/basic-economy-traps#basic-economy-tool",
          label: "Basic Economy decision tool",
          body: "Check whether the cheapest fare is risky because it restricts carry-on access, seats, or flexibility.",
        },
      ];
    case "overweight_baggage":
      return [
        {
          href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=51&size=62",
          label: "Overweight baggage calculator",
          body: "Estimate the cost of crossing common weight thresholds when published numeric rows are available.",
        },
        {
          href: "/sizer-rules?height=22&width=14&depth=9",
          label: "Repack into carry-on strategy",
          body: "Check whether moving weight out of a checked bag into a cabin setup is realistic for your airline.",
        },
        {
          href: "/fees/checked_baggage",
          label: "Standard checked-bag baseline",
          body: "Compare the normal checked-bag fee first, because overweight charges can stack on top of it.",
        },
      ];
    case "oversize_baggage":
      return [
        {
          href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=50&size=63",
          label: "Oversize baggage calculator",
          body: "Estimate oversize exposure when a bag crosses common linear-inch thresholds and numeric rows exist.",
        },
        {
          href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=70&size=70",
          label: "Heavy and oversized scenario",
          body: "Model the worse case where weight and size issues may both matter before airport day.",
        },
        {
          href: "/fees/checked_baggage",
          label: "Checked-bag fee baseline",
          body: "Check the normal checked-bag charge because oversize fees may not replace the base bag fee.",
        },
      ];
    default:
      return [];
  }
}

export function generateStaticParams() {
  const slugs = getAirlineSlugs();
  const set = new Set<string>();
  for (const slug of slugs) {
    const airline = getAirlineBySlug(slug);
    for (const fee of airline?.fees ?? []) {
      if (fee.category) set.add(fee.category);
    }
  }
  return Array.from(set)
    .sort()
    .map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const title = `${titleCaseFromSlug(category)} fees by airline (2026)`;
  const description =
    "Compare published, source-linked airline fee rows across carriers and use the related airline pages and references to understand how the fee applies.";
  return { title, description };
}

export default async function FeeCategoryHubPage({ params }: PageProps) {
  const { category } = await params;
  const cat = decodeURIComponent(category || "").trim();
  if (!cat) notFound();

  const hub = getHubCopy(cat);
  const strategy = FEE_HUB_STRATEGY[cat];

  const rows: Row[] = [];
  for (const slug of getAirlineSlugs()) {
    const airline = getAirlineBySlug(slug);
    if (!airline) continue;

    for (const item of airline.fees ?? []) {
      if (item.category !== cat) continue;

      rows.push({
        slug,
        airlineName: safeText(airline.name),
        iata: airline.iata,
        amountText: formatContextualAmount(item),
        appliesTo: item.applies_to ?? "—",
        regionOrRoute: item.region_or_route ?? "—",
        timing: item.timing ?? "—",
        conditions: item.conditions ?? "—",
        sourceUrl: safeUrl(item.source_url),
        lastVerified: safeDate(item.last_verified),
      });
    }
  }

  if (!rows.length) notFound();

  rows.sort((a, b) => b.lastVerified.localeCompare(a.lastVerified));
  const latestVerified = getLatestVerifiedDate(rows);
  const contextualBridge = getContextualBridge(cat);
  const decisionToolCards = getDecisionToolCards(cat);

  const title = titleCaseFromSlug(cat);
  const spotlightAirlines = (strategy?.spotlightAirlines ?? [])
    .map((entry) => {
      const airline = getAirlineBySlug(entry.slug);
      if (!airline) return null;
      return { ...entry, airline };
    })
    .filter(Boolean);

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>{title} fees by airline</h1>
          <span style={{ fontSize: 12, color: "#555" }}>Last verified: {latestVerified}</span>
        </div>

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          <Link href="/fees">All fee categories</Link>
          <Link href="/airlines">All airlines</Link>
          <Link href="/compare">Comparison tables</Link>
          <Link href="/methodology">Methodology</Link>
        </nav>

        <section style={{ display: "grid", gap: 8, fontSize: 14, lineHeight: 1.6, color: "#333" }}>
          <div>{hub.verdict}</div>

          {strategy && (
            <div style={{ border: "1px solid #dbe1ea", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
              <strong>Use this page for:</strong> {strategy.introLabel}
            </div>
          )}

          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
            <strong>Quick check:</strong> {hub.proTip}
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
            <strong>Common way to avoid the fee:</strong> {hub.loophole}
          </div>

          <div style={{ fontSize: 13, color: "#444" }}>
            <strong>What to watch:</strong> {hub.whatToWatch}
          </div>

          {contextualBridge}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, color: "#444" }}>
            <span>
              Published rows on this page: <strong>{rows.length}</strong>
            </span>
          </div>
        </section>
      </header>

      {decisionToolCards.length > 0 ? (
        <section
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: 14,
            background: "#eff6ff",
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1d4ed8" }}>
              Decision tools
            </div>
            <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>Turn this fee table into a trip decision</h2>
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {decisionToolCards.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fff",
                  color: "#1e3a8a",
                  textDecoration: "none",
                }}
              >
                <div style={{ fontWeight: 800, textDecoration: "underline" }}>{tool.label}</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#334155" }}>{tool.body}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {cat === "checked_baggage" ? (
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/images/checked-baggage-drop.png"
              alt="Checked bags lined up at an airport baggage drop counter"
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">
            The baggage counter is where delayed decisions become expensive. If a checked bag is
            likely, compare prepaid pricing, fare rules, and card waivers before airport day.
          </figcaption>
        </figure>
      ) : null}

      {cat === "checked_baggage" ? <CheckedBagCardMathCallout /> : null}

      {strategy && (
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Common situations</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {strategy.scenarioCards.map((card) => (
              <div key={card.title} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>{card.body}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {spotlightAirlines.length > 0 && (
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Airline pages to compare next</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {spotlightAirlines.map((entry) => (
              <div key={entry!.slug} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>
                  <Link href={`/airlines/${entry!.slug}`} style={{ textDecoration: "underline" }}>
                    {entry!.airline.name}
                  </Link>
                </div>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>{entry!.reason}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, fontSize: 13 }}>
                  <Link href={`/airlines/${entry!.slug}`} style={{ textDecoration: "underline" }}>
                    Fee page
                  </Link>
                  <Link href={`/airlines/${entry!.slug}/how-to-beat-fees`} style={{ textDecoration: "underline" }}>
                    Fee guide
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Published fee rows (source-linked)</h2>

        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Airline</th>
                <th>Amount</th>
                <th>Applies to</th>
                <th>Region / route</th>
                <th>Timing</th>
                <th>Conditions</th>
                <th>Source</th>
                <th>Last verified</th>
                <th>Shortcut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.slug}-${idx}`}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/airlines/${encodeURIComponent(row.slug)}`} style={{ textDecoration: "underline" }}>
                      {row.airlineName}
                    </Link>
                    {row.iata ? <span style={{ color: "#666" }}> ({row.iata})</span> : null}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{row.amountText}</td>
                  <td>{row.appliesTo}</td>
                  <td>{row.regionOrRoute}</td>
                  <td>{row.timing}</td>
                  <td style={{ minWidth: 320 }}>{row.conditions}</td>
                  <td>
                    {row.sourceUrl ? (
                      <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                        Source
                      </a>
                    ) : (
                      "Not published"
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{row.lastVerified}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/airlines/${encodeURIComponent(row.slug)}/how-to-beat-fees`} style={{ textDecoration: "underline" }}>
                      Fee guide
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
          Use the <strong>Fee guide</strong> column if you want the airline-specific page that explains how this fee usually shows up in a real trip.
        </div>

        {contextualBridge}
      </section>

      {strategy && (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            background: "#fafafa",
            display: "grid",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>Related references</h2>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>{strategy.bridgeText}</div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {strategy.toolLinks.map((tool) => (
              <div key={tool.href} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>
                  <Link href={tool.href} style={{ textDecoration: "underline" }}>
                    {tool.label}
                  </Link>
                </div>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>{tool.reason}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
