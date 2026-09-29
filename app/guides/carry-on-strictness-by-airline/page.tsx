import Link from "next/link";
import type { Metadata } from "next";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";
import { hasActiveStrategyPage } from "@/lib/airline-strategy";

export const metadata: Metadata = {
  title: "Carry-on strictness by airline (2026) | Airline Fees Reference",
  description:
    "An opinionated guide to which airlines are actually strict about carry-ons, where enforcement is discretionary, and when a soft bag beats a hard shell.",
};

const LAST_VERIFIED = "2026-04-13";

type StrictnessRow = {
  slug: string;
  airline: string;
  tier: "Low" | "Medium" | "High" | "Extreme";
  summary: string;
  travelerMove: string;
};

const STRICTNESS_ROWS: StrictnessRow[] = [
  {
    slug: "southwest",
    airline: "Southwest",
    tier: "Low",
    summary: "Southwest is still one of the calmer carry-on environments, but that matters mostly as a benchmark against stricter airlines.",
    travelerMove: "Use Southwest to sanity-check whether another airline's cabin-bag rules are worth the hassle at all.",
  },
  {
    slug: "alaska",
    airline: "Alaska",
    tier: "Low",
    summary: "Alaska is relatively straightforward on carry-ons, making it a useful comparison with fares that charge separately for cabin bags.",
    travelerMove: "Treat Alaska as the comparison point when another airline needs paid cabin access or creates under-seat uncertainty.",
  },
  {
    slug: "jetblue",
    airline: "JetBlue",
    tier: "Low",
    summary: "JetBlue is generally traveler-friendly on cabin bags, but fare family assumptions still matter if you expect a normal trip from the cheapest booking path.",
    travelerMove: "Use JetBlue as the soft benchmark, but still check the fare and bag timing before assuming the carry-on story is finished.",
  },
  {
    slug: "delta",
    airline: "Delta",
    tier: "Medium",
    summary: "Delta publishes a standard carry-on allowance, but full flights can still lead to gate-checking when overhead space runs out.",
    travelerMove: "If the flight is full, a soft-sided bag is often a smarter play than a boxy roller that invites a pre-tag.",
  },
  {
    slug: "american",
    airline: "American",
    tier: "High",
    summary: "American's published allowance is straightforward, but regional aircraft can have less cabin storage and may require gate-checking larger carry-ons.",
    travelerMove: "Do not treat every American gate-check as jetbridge pickup. Keep essentials on-person if a regional aircraft is involved.",
  },
  {
    slug: "united",
    airline: "United",
    tier: "High",
    summary: "United rules become more restrictive when Basic Economy or regional-aircraft constraints apply.",
    travelerMove: "If you are on Basic or a small regional aircraft, build the bag plan around the most restrictive version of the rule, not the most optimistic one.",
  },
  {
    slug: "frontier",
    airline: "Frontier",
    tier: "Extreme",
    summary: "Frontier Basic includes a personal item, while a larger cabin bag requires a separate purchase or an eligible bundle.",
    travelerMove: "Choose the correct bag or bundle before the airport, when pricing is generally clearer and may be lower.",
  },
  {
    slug: "ryanair",
    airline: "Ryanair",
    tier: "Extreme",
    summary: "Ryanair's free allowance is a small personal bag; larger cabin-bag access requires an eligible paid option.",
    travelerMove: "Decide early whether you are truly traveling inside the free allowance or whether you need to buy the bag path upfront.",
  },
  {
    slug: "easyjet",
    airline: "easyJet",
    tier: "High",
    summary: "easyJet is less harsh than Ryanair in some flows, but cabin-bag strictness still matters because seat and bag entitlements interact.",
    travelerMove: "Check whether the seat or bundle changes the cabin-bag economics before you assume the bag fee stands alone.",
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
];

export default function CarryOnStrictnessGuide() {
  return (
    <main style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Carry-on strictness by airline</h1>
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
          <div>
            Published carry-on dimensions are only half the story. What matters is whether the
            airline usually treats cabin bags as a normal allowance, a gate decision, or a paid
            add-on.
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
            <strong>Quick check:</strong> If the airline falls into the <em>high</em> or <em>extreme</em> strictness tier, a soft, compressible bag is often more useful than a rigid roller with optimistic marketing dimensions.
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
            <strong>Traveler rule:</strong> On strict airlines, plan the bag before booking the
            fare. On calmer airlines, treat the included carry-on as part of the real fare value
            when comparing options.
          </div>
        </section>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Strictness tiers that actually matter</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Low</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              These airlines are useful comparison points. They show when a normal carry-on is
              likely to be simpler than buying into a stricter fare.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Medium to High</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Discretion and aircraft type start to matter. The same bag can pass on one trip and become a problem on the next full flight.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Extreme</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Published limits and purchase timing both matter. Resolve uncertain bag size or entitlement before reaching the gate.
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
                <th>Tier</th>
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
            <div style={{ fontWeight: 700, marginBottom: 8 }}>If the airline is low strictness</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Use that airline as the benchmark. If another fare is only cheaper after you accept heavy bag risk, it probably is not actually cheaper.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>If the airline is high or extreme</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Solve the bag before the airport: either commit to the personal-item path, buy the right cabin access, or switch airlines entirely.
            </div>
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>If the fare is Basic or stripped down</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>
              Carry-on strictness is rarely isolated. It often comes with seat limits, less
              flexibility, or more paid add-ons.
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
          The strictness tier is only useful if it changes what you do next: trust the fare, choose
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

      <CheckedBagCardMathCallout />

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
