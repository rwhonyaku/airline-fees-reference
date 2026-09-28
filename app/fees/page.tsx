import Link from "next/link";
import type { Metadata } from "next";
import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Airline Fee Guides | Baggage, Seats and Fare Traps",
  description:
    "Understand which airline fees can change the real trip cost, then compare official baggage, seat, change, and special-travel rules.",
  alternates: { canonical: canonical("/fees") },
};

const baggageTopics = [
  {
    href: "/fees/checked_baggage",
    label: "Checked baggage",
    body: "Calculate the party-level, round-trip cost and check whether the fare already includes an allowance.",
  },
  {
    href: "/fees/carry_on",
    label: "Carry-on and personal items",
    body: "Separate free under-seat entitlement from overhead-bin access, then check size, weight, and timing.",
  },
  {
    href: "/fees/overweight_baggage",
    label: "Overweight baggage",
    body: "Check the airline's weight bands and maximum before an airport repack becomes the only practical option.",
  },
  {
    href: "/fees/oversize_baggage",
    label: "Oversize baggage",
    body: "Determine whether the size charge stacks with the normal bag fee and whether the item is accepted at all.",
  },
  {
    href: "/fees/sports_equipment",
    label: "Sports equipment",
    body: "Check whether the item uses the normal allowance, a special fee, or airline-specific handling limits.",
  },
] as const;

const fareTopics = [
  {
    href: "/fees/seat_selection",
    label: "Seat selection",
    body: "Decide whether the charge buys a meaningful seat benefit or merely repairs a restrictive fare.",
  },
  {
    href: "/fees/change_cancellation",
    label: "Changes and cancellations",
    body: "Separate a waived change fee from the fare difference, credit restrictions, and nonrefundable value.",
  },
  {
    href: "/fees/same_day_change",
    label: "Same-day changes",
    body: "Compare confirmed-change charges with standby rules, status waivers, and route restrictions.",
  },
  {
    href: "/fees/same_day_standby",
    label: "Same-day standby",
    body: "Check whether standby is free, restricted to certain fares, or available only on eligible routes.",
  },
  {
    href: "/fees/unaccompanied_minor",
    label: "Unaccompanied minors",
    body: "Confirm the age band, whether the service is required, and whether connections are permitted before comparing fares.",
  },
] as const;

function TopicGrid({ topics }: { topics: ReadonlyArray<{ href: string; label: string; body: string }> }) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
      {topics.map((topic) => (
        <Link
          key={topic.href}
          href={topic.href}
          style={{
            border: "1px solid #dbe1ea",
            borderRadius: 12,
            padding: 14,
            background: "#fff",
            color: "#0f172a",
            textDecoration: "none",
          }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>{topic.label}</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>{topic.body}</div>
        </Link>
      ))}
    </div>
  );
}

export default function FeeCategoriesIndexPage() {
  const latestVerified = getLatestVerifiedAcrossAirlines();

  return (
    <main style={{ display: "grid", gap: 22 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569" }}>
          Fee decision center
        </div>
        <h1 style={{ margin: 0, fontSize: 24 }}>Find the airline fee that changes your trip cost</h1>
        <p style={{ margin: 0, maxWidth: 820, fontSize: 14, lineHeight: 1.7, color: "#334155" }}>
          Start with the charge your trip is likely to trigger—not a generic airline list. Each topic combines official
          source records with the fare, route, timing, and traveler conditions that determine whether the fee applies.
        </p>
        <div style={{ fontSize: 12, color: "#555" }}>Latest source verification across the database: {latestVerified}</div>
      </header>

      <section
        style={{
          display: "grid",
          gap: 12,
          border: "1px solid #bfdbfe",
          borderRadius: 12,
          padding: 14,
          background: "#eff6ff",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1d4ed8" }}>
            Start with the decision
          </div>
          <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>What are you trying to prevent?</h2>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Link href="/tools/true-trip-cost" style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 12, background: "#fff", color: "#1e3a8a", textDecoration: "none" }}>
            <div style={{ fontWeight: 800, textDecoration: "underline" }}>A cheap fare becoming expensive</div>
            <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
              Compare advertised fares after adding the bags, seats, travelers, and directions the trip actually needs.
            </div>
          </Link>
          <Link href="/sizer-rules?height=22&width=14&depth=9" style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 12, background: "#fff", color: "#1e3a8a", textDecoration: "none" }}>
            <div style={{ fontWeight: 800, textDecoration: "underline" }}>A bag failing the published limit</div>
            <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
              Compare the bag&apos;s outside dimensions with published carry-on and personal-item rules.
            </div>
          </Link>
          <Link href="/guides/basic-economy-traps" style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 12, background: "#fff", color: "#1e3a8a", textDecoration: "none" }}>
            <div style={{ fontWeight: 800, textDecoration: "underline" }}>A restricted fare creating add-ons</div>
            <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
              Test whether the savings survive baggage, seat, and flexibility restrictions.
            </div>
          </Link>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Baggage decisions</h2>
          <p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
            Begin with the normal allowance, then check whether weight, size, item type, or purchase timing creates another charge.
          </p>
        </div>
        <TopicGrid topics={baggageTopics} />
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Fare add-ons and flexibility</h2>
          <p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
            These charges are often consequences of the fare chosen, so compare the restriction with the cost of buying a better fare.
          </p>
        </div>
        <TopicGrid topics={fareTopics} />
      </section>

      <section style={{ border: "1px solid #dbe1ea", borderRadius: 12, padding: 14, background: "#f8fafc", display: "grid", gap: 9 }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>Already know the airline?</h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
          Use the airline page for its verified records, qualifications, and official sources. Priority airlines also have
          tactical guides explaining which charges are most avoidable.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, fontWeight: 700 }}>
          <Link href="/airlines">Browse airline pages</Link>
          <Link href="/methodology">How records are verified</Link>
          <Link href="/tools/checked-baggage-calculator">Calculate checked-bag cost</Link>
        </div>
      </section>
    </main>
  );
}
