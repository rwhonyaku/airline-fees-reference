import Link from "next/link";
import { FEE_CATEGORIES } from "@/content/fee-categories";
import { getAirlineBySlug } from "@/lib/data";
import { FEE_HUB_STRATEGY } from "@/lib/fee-hub-strategy";
import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";

export const metadata = {
  title: "Airline fee guides and traps | Airline Fees Reference",
};

export default function FeeCategoriesIndexPage() {
  const latestVerified = getLatestVerifiedAcrossAirlines();
  const featuredCategories = [
    "checked_baggage",
    "carry_on",
    "change_cancellation",
    "seat_selection",
  ] as const;

  const spotlightAirlines = ["united", "delta", "spirit", "ryanair"]
    .map((slug) => getAirlineBySlug(slug))
    .filter(Boolean);

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Airline fee guides and traps</h1>
        <div style={{ maxWidth: 860, fontSize: 14, lineHeight: 1.7, color: "#333" }}>
          Use fee categories to confirm the charge, then compare the airline pages and related
          references that affect the real trip price.
        </div>
        <div style={{ fontSize: 12, color: "#555" }}>Last verified: {latestVerified}</div>
        <div
          style={{
            display: "grid",
            gap: 8,
            border: "1px solid #dbe1ea",
            borderRadius: 12,
            padding: 14,
            background: "#f8fafc",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#334155",
          }}
        >
          <div>
            <strong>How to use this page:</strong> start with the fee type most likely to affect
            your trip, then move into the airline pages and related references where the rule
            changes by fare, route, or timing.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
            <Link href="/guides/basic-economy-traps" style={{ textDecoration: "underline" }}>
              Basic Economy guide
            </Link>
            <Link href="/sizer-rules" style={{ textDecoration: "underline" }}>
              Sizer rules
            </Link>
            <Link href="/best-cards" style={{ textDecoration: "underline" }}>
              Free checked bag calculator
            </Link>
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Highest-value fee entry points</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {featuredCategories.map((key) => {
            const strategy = FEE_HUB_STRATEGY[key];
            const category = FEE_CATEGORIES.find((item) => item.key === key);
            if (!category || !strategy) return null;

            return (
              <div
                key={key}
                style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14, background: "#fff" }}
              >
                <div style={{ fontWeight: 700 }}>
                  <Link href={`/fees/${key}`} style={{ textDecoration: "underline" }}>
                    {category.label}
                  </Link>
                </div>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
                  {strategy.introLabel}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>All fee-topic pages</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {FEE_CATEGORIES.map((c) => {
            const strategy = FEE_HUB_STRATEGY[c.key];
            return (
              <div
                key={c.key}
                style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14, background: "#fff" }}
              >
                <div style={{ fontWeight: 700 }}>
                  <Link href={`/fees/${c.key}`} style={{ textDecoration: "underline" }}>
                    {c.label}
                  </Link>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#555" }}>
                  {strategy?.bridgeText ??
                    "Use the fee page to understand the charge, then move into the airline-specific page before booking."}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Airline pages worth checking after the fee hub</h2>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {spotlightAirlines.map((airline) => (
            <div
              key={airline!.slug}
              style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14, background: "#fff" }}
            >
              <div style={{ fontWeight: 700 }}>
                <Link href={`/airlines/${airline!.slug}`} style={{ textDecoration: "underline" }}>
                  {airline!.name}
                </Link>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#555" }}>
                Use the fee topic first, then compare the airline page and fee guide once you know
                which rule affects your trip.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, fontSize: 13 }}>
                <Link href={`/airlines/${airline!.slug}`} style={{ textDecoration: "underline" }}>
                  Fee page
                </Link>
                <Link
                  href={`/airlines/${airline!.slug}/how-to-beat-fees`}
                  style={{ textDecoration: "underline" }}
                >
                  Fee guide
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
