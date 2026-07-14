// app/compare/[table]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPARE_TABLES } from "@/content/compare-tables";
import { buildComparisonRows } from "@/lib/compare";
import { FeeTable } from "@/components/Table";
import { canonical } from "@/lib/seo";

type PageProps = {
  params: Promise<{
    table: string;
  }>;
};

function categoryNextSteps(category: string): Array<{ href: string; label: string; body: string }> {
  switch (category) {
    case "checked_baggage":
      return [
        {
          href: "/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes",
          label: "Price a checked-bag scenario",
          body: "Turn the comparison into a trip estimate with travelers, bags, and annual trips.",
        },
        {
          href: "/best-cards?travelers=2&bags=1&trips=2&pay=yes",
          label: "Run card break-even",
          body: "Check whether recurring first-bag fees can justify an eligible airline card.",
        },
        {
          href: "/guides/international-baggage-allowance",
          label: "Check international allowance rules",
          body: "Best when the comparison depends on route, fare family, or piece-vs-weight concept.",
        },
      ];
    case "change_cancellation":
      return [
        {
          href: "/guides/basic-economy-traps",
          label: "Check Basic fare risk",
          body: "Compare the cheapest fare against bags, seats, and flexibility before booking.",
        },
        {
          href: "/fees/change_cancellation",
          label: "Open change/cancel fee guide",
          body: "See the broader fee category with airline-specific timing and fare conditions.",
        },
        {
          href: "/passenger-rights/us-dot-refund",
          label: "Review U.S. DOT refund rights",
          body: "Best when the issue is refund rights rather than an ordinary fare change.",
        },
      ];
    case "unaccompanied_minor":
      return [
        {
          href: "/fees/unaccompanied_minor",
          label: "Open unaccompanied minor fee guide",
          body: "Compare age bands, route restrictions, and whether the service is offered.",
        },
        {
          href: "/airlines/southwest",
          label: "Check Southwest",
          body: "A useful benchmark because route type can change the child-travel fee.",
        },
        {
          href: "/airlines/ryanair",
          label: "Check Ryanair",
          body: "Important because some carriers do not offer unaccompanied minor service at all.",
        },
      ];
    default:
      return [
        {
          href: "/fees",
          label: "Open fee topics",
          body: "Choose the fee category that matches the rule affecting your trip.",
        },
        {
          href: "/airlines",
          label: "Browse airline pages",
          body: "Use airline pages when route, fare family, or timing changes the rule.",
        },
      ];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { table } = await params;
  const entry = COMPARE_TABLES.find((t) => t.id === table);

  if (!entry) {
    return { title: "Comparison not found" };
  }

  return {
    title: entry.title,
    alternates: {
      canonical: canonical(`/compare/${entry.id}`),
    },
  };
}

export default async function CompareTablePage({ params }: PageProps) {
  const { table } = await params;
  const entry = COMPARE_TABLES.find((t) => t.id === table);

  if (!entry) return notFound();

  const rows = buildComparisonRows(entry);
  const nextSteps = categoryNextSteps(entry.category);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          <Link href="/compare" className="text-blue-700 underline">
            All comparisons
          </Link>
          <Link href={`/fees/${entry.category}`} className="text-blue-700 underline">
            Fee topic
          </Link>
          <Link href="/airlines" className="text-blue-700 underline">
            Airline pages
          </Link>
        </div>
        <h1 style={{ margin: 0, fontSize: 20 }}>{entry.title}</h1>
        <p style={{ maxWidth: 820, fontSize: 14, lineHeight: 1.6, color: "#475569" }}>
          This comparison narrows published airline fees to a specific scenario. Use it to find the
          relevant airlines, then move into the airline page or calculator before treating the
          published fee as the full trip cost.
        </p>
      </header>

      <FeeTable rows={rows} />

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
            Next step
          </div>
          <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>Turn the comparison into a trip decision</h2>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {nextSteps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              style={{
                border: "1px solid #dbeafe",
                borderRadius: 10,
                padding: 12,
                background: "#fff",
                color: "#1e3a8a",
                textDecoration: "none",
              }}
            >
              <div style={{ fontWeight: 800, textDecoration: "underline" }}>{step.label}</div>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#334155" }}>{step.body}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
