import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { hasActiveStrategyPage } from "@/lib/airline-strategy";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Carry-on strictness by airline (2026) | Airline Fees Reference",
  description:
    "Compare carry-on risk by fare entitlement, paid overhead access, aircraft constraints, bag dimensions, and the practical cost of getting the plan wrong.",
  alternates: { canonical: canonical("/guides/carry-on-strictness-by-airline") },
};

const LAST_VERIFIED = "2026-11-08";

type StrictnessRow = {
  slug: string;
  airline: string;
  tier: "Low fee risk" | "Operational risk" | "Fare-dependent" | "Paid-access";
  summary: string;
  travelerMove: string;
};

const STRICTNESS_ROWS: StrictnessRow[] = [
  {
    slug: "southwest",
    airline: "Southwest",
    tier: "Low fee risk",
    summary: "Every current Southwest fare includes one carry-on and one personal item, so the main risk is physical fit and available cabin space—not buying overhead access.",
    travelerMove: "Use Southwest as an all-in fare benchmark when another airline charges separately for the same cabin-bag setup.",
  },
  {
    slug: "alaska",
    airline: "Alaska",
    tier: "Operational risk",
    summary: "Saver and higher fares include a carry-on and personal item, but smaller aircraft and limited bin space can still force gate-checking.",
    travelerMove: "Keep medicine, batteries, documents, and valuables in the personal item in case the roller is taken at the gate.",
  },
  {
    slug: "jetblue",
    airline: "JetBlue",
    tier: "Low fee risk",
    summary: "JetBlue includes one carry-on and one personal item on every current fare, including Main Base; checked bags, seats, and flexibility are the larger add-on risks.",
    travelerMove: "Do not pay to solve a cabin-bag problem the fare does not create. Compare Main Base with Standard for seats and flexibility instead.",
  },
  {
    slug: "delta",
    airline: "Delta",
    tier: "Operational risk",
    summary: "Delta includes a standard carry-on on all current fares, but full flights can still lead to gate-checking when overhead space runs out.",
    travelerMove: "If the flight is full, a soft-sided bag is often a smarter play than a boxy roller that invites a pre-tag.",
  },
  {
    slug: "american",
    airline: "American",
    tier: "Operational risk",
    summary: "American's published allowance is straightforward, but regional aircraft can have less cabin storage and may require gate-checking larger carry-ons.",
    travelerMove: "Do not treat every American gate-check as jetbridge pickup. Keep essentials on-person if a regional aircraft is involved.",
  },
  {
    slug: "united",
    airline: "United",
    tier: "Fare-dependent",
    summary: "United Economy includes an overhead carry-on, while Basic Economy is usually personal-item only unless a route, status, or eligible-card exception applies.",
    travelerMove: "Check the fare label before measuring the bag. A perfectly sized roller still fails the plan when the ticket does not include overhead access.",
  },
  {
    slug: "frontier",
    airline: "Frontier",
    tier: "Paid-access",
    summary: "Frontier Basic includes a personal item, while a larger cabin bag requires a separate purchase or an eligible bundle.",
    travelerMove: "Choose the correct bag or bundle before the airport, when pricing is generally clearer and may be lower.",
  },
  {
    slug: "ryanair",
    airline: "Ryanair",
    tier: "Paid-access",
    summary: "Ryanair's free allowance is a small personal bag; larger cabin-bag access requires an eligible paid option.",
    travelerMove: "Decide early whether you are truly traveling inside the free allowance or whether you need to buy the bag path upfront.",
  },
  {
    slug: "easyjet",
    airline: "easyJet",
    tier: "Paid-access",
    summary: "easyJet includes one small under-seat bag; a large cabin bag requires an add-on or an eligible fare or membership benefit.",
    travelerMove: "Compare the large-bag add-on with the eligible fare or benefit that includes it before paying for the bag alone.",
  },
  {
    slug: "wizz-air",
    airline: "Wizz Air",
    tier: "Paid-access",
    summary: "Wizz Air Basic includes one under-seat bag, while WIZZ Priority or an eligible bundle adds the overhead trolley bag.",
    travelerMove: "Price Priority or the relevant bundle during booking and treat airport purchase as the failure case, not the plan.",
  },
];

const CORE_LINKS = [
  { href: "/airlines/united", label: "United" },
  { href: "/airlines/delta", label: "Delta" },
  { href: "/airlines/american", label: "American" },
  { href: "/airlines/southwest", label: "Southwest" },
  { href: "/airlines/jetblue", label: "JetBlue" },
  { href: "/airlines/alaska", label: "Alaska" },
  { href: "/airlines/frontier", label: "Frontier" },
  { href: "/airlines/ryanair", label: "Ryanair" },
  { href: "/airlines/easyjet", label: "easyJet" },
  { href: "/airlines/wizz-air", label: "Wizz Air" },
];

function strictnessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
          { "@type": "ListItem", position: 2, name: "Carry-on strictness by airline", item: canonical("/guides/carry-on-strictness-by-airline") },
        ],
      },
      {
        "@type": "Article",
        headline: "Carry-on strictness by airline",
        description: metadata.description,
        dateModified: LAST_VERIFIED,
        mainEntityOfPage: canonical("/guides/carry-on-strictness-by-airline"),
      },
    ],
  };
}

export default function CarryOnStrictnessGuide() {
  return (
    <main style={{ display: "grid", gap: 16 }}>
      <JsonLd data={strictnessJsonLd()} />
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: 1.08, letterSpacing: "-0.025em" }}>Carry-on strictness by airline</h1>
          <span style={{ fontSize: 12, color: "#555" }}>Last verified: {LAST_VERIFIED}</span>
        </div>

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          <Link href="/airlines">All airlines</Link>
          <Link href="/fees/carry_on">Carry-on fees</Link>
          <Link href="/sizer-rules">Sizer rules</Link>
          <Link href="/recommended-carry-on-luggage">Carry-on shortlist</Link>
          <Link href="/guides/basic-economy-traps">Basic Economy guide</Link>
          <Link href="/tools/checked-baggage-calculator">Checked-bag calculator</Link>
        </nav>

        <section style={{ display: "grid", gap: 8, fontSize: 14, lineHeight: 1.6, color: "#333" }}>
          <div style={{ border: "1px solid #bfdbfe", borderRadius: 10, padding: 12, background: "#eff6ff" }}>
            <strong>Verdict:</strong> The highest-risk carry-on plans are not simply the airlines with the smallest dimensions.
            They are fares that include only an under-seat item, airlines that sell overhead access separately, and flights
            where aircraft or bin space can force an otherwise compliant bag into the hold.
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
            <strong>Quick check:</strong> First confirm entitlement, then measure outside dimensions including wheels and handles,
            then check weight. A soft bag helps with fit, but it does not create overhead access on a personal-item-only fare.
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
            <strong>What this ranking measures:</strong> published fare entitlement, whether cabin access is sold separately,
            the consequence of getting the plan wrong, and operational gate-check risk. It is not a claim that every agent at
            every airport enforces the rule identically.
          </div>
        </section>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>The four kinds of carry-on risk</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Low fee risk</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              The fare includes the standard cabin-bag setup. Size and available space still matter,
              but there is no separate overhead-access purchase to repair.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Operational risk</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              The bag is included, but aircraft type and available bin space can still force a gate-check.
              Keep essentials in the smaller personal item.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Fare-dependent</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              One fare includes the overhead bag while another does not. Confirm the fare family before relying on dimensions.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Paid-access</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              The base fare includes only a small under-seat item. Resolve the add-on or bundle before the airport, where mistakes are hardest to fix.
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Core 10 airline snapshot</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Airline</th>
                <th>Risk model</th>
                <th>What matters most</th>
                <th>Traveler move</th>
                <th>Fee guide</th>
              </tr>
            </thead>
            <tbody>
              {STRICTNESS_ROWS.map((row) => (
                <tr key={row.slug}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/airlines/${row.slug}`} style={{ textDecoration: "underline" }}>
                      {row.airline}
                    </Link>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{row.tier}</td>
                  <td>{row.summary}</td>
                  <td>{row.travelerMove}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {hasActiveStrategyPage(row.slug) ? (
                      <Link href={`/airlines/${row.slug}/how-to-beat-fees`} style={{ textDecoration: "underline" }}>
                        Fee guide
                      </Link>
                    ) : (
                      <Link href={`/airlines/${row.slug}`} style={{ textDecoration: "underline" }}>Airline policy</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>What to do with this information</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>If overhead access is included</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Use that airline as the benchmark. If another fare is only cheaper after you accept heavy bag risk, it probably is not actually cheaper.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>If overhead access is paid or fare-dependent</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Solve the bag before the airport: commit to the personal-item path, buy the correct access, select a qualifying bundle, or switch airlines.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>If the fare is Basic or stripped down</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Carry-on strictness is rarely isolated. It often comes with seat limits, less
              flexibility, or more paid add-ons.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>If the bag is compliant but the flight is full</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Plan for an operational gate-check: move lithium batteries, medicine, documents, keys, and valuables into the personal item before boarding.
            </div>
          </div>
        </div>
      </section>

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
        <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
          The carry-on risk model is only useful if it changes what you do next: trust the fare, choose
          a different airline, buy the right bag option, or price a checked bag before booking.
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700 }}>
              <Link href="/sizer-rules" style={{ textDecoration: "underline" }}>
                Sizer rules
              </Link>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Compare your bag against published dimensions and see why shape matters at the gate.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700 }}>
              <Link href="/tools/true-trip-cost" style={{ textDecoration: "underline" }}>
                True Trip Cost comparison
              </Link>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Compare fares after required carry-on access, checked bags, and seat choices are added for every traveler and direction.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700 }}>
              <Link href="/fees/carry_on" style={{ textDecoration: "underline" }}>
                Carry-on fee hub
              </Link>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Check the published carry-on fees and airline-specific bag paths after deciding strictness matters.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700 }}>
              <Link href="/guides/basic-economy-traps" style={{ textDecoration: "underline" }}>
                Basic Economy guide
              </Link>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Check this when the carry-on rule is only one part of a stripped-down fare.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700 }}>
              <Link href="/recommended-carry-on-luggage" style={{ textDecoration: "underline" }}>
                Dimension-checked carry-on shortlist
              </Link>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Compare a small editorial set using manufacturer-published exterior dimensions, empty weight, and airline-rule fit.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700 }}>
              <Link href="/tools/checked-baggage-calculator" style={{ textDecoration: "underline" }}>
                Checked baggage cost calculator
              </Link>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              If the carry-on plan is too risky, price the checked-bag path before comparing card break-even math.
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Core 10 airline pages</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          {CORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ textDecoration: "underline" }}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
