// app/airlines/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import type { FeeItem } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type DerivedTiming = {
  pricingUnit: string; // per direction | Not published
  whenCharged: string; // at booking | at booking / manage trip | manage trip | check-in / boarding | at airport | Not published
  extraForConditions: string | null; // anything else goes into conditions
};

function deriveTiming(timing: unknown): DerivedTiming {
  const raw = typeof timing === "string" ? timing.trim() : "";
  if (!raw) return { pricingUnit: "Not published", whenCharged: "Not published", extraForConditions: null };

  const v = raw.toLowerCase();

  // Pricing unit normalization
  if (v === "each way" || v === "one-way" || v === "per direction") {
    return { pricingUnit: "per direction", whenCharged: "Not published", extraForConditions: null };
  }

  // When charged / purchase stage normalization
  if (v.includes("at booking") && v.includes("manage trip")) {
    return { pricingUnit: "Not published", whenCharged: "at booking / manage trip", extraForConditions: null };
  }
  if (v === "at booking") {
    return { pricingUnit: "Not published", whenCharged: "at booking", extraForConditions: null };
  }
  if (v === "manage trip") {
    return { pricingUnit: "Not published", whenCharged: "manage trip", extraForConditions: null };
  }
  if (v === "check-in / boarding" || v === "check-in" || v === "boarding") {
    return { pricingUnit: "Not published", whenCharged: "check-in / boarding", extraForConditions: null };
  }
  if (v === "at airport") {
    return { pricingUnit: "Not published", whenCharged: "at airport", extraForConditions: null };
  }

  // Everything else is rule/eligibility timing -> goes into Conditions
  return { pricingUnit: "Not published", whenCharged: "Not published", extraForConditions: raw };
}

function appendToConditions(conditions: unknown, extra: string | null): string {
  const c = typeof conditions === "string" ? conditions.trim() : "";
  if (!extra) return c || "Not published";
  if (!c) return extra;
  if (c.includes(extra)) return c;
  return `${c}; ${extra}`;
}

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

function formatAmount(amount: unknown, currency: unknown): string {
  const cur = typeof currency === "string" ? currency.trim() : "";

  if (typeof amount === "number" && Number.isFinite(amount)) {
    return cur ? `${amount.toFixed(2)} ${cur}` : amount.toFixed(2);
  }

  if (typeof amount === "string" && amount.trim()) {
    const a = amount.trim();
    if (a.toLowerCase() === "not permitted") return "Not permitted";
    return cur ? `${a} ${cur}` : a;
  }

  return "Not published";
}

export function generateStaticParams() {
  return getAirlineSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const airline = getAirlineBySlug(slug);
  if (!airline) return { title: "Airline not found | Airline Fees Reference" };

  return {
    title: `${airline.name} fees | Airline Fees Reference`,
    description: `Verifiable fee references for ${airline.name}.`,
  };
}

export default async function AirlinePage({ params }: PageProps) {
  const { slug } = await params;

  const allowed = new Set(getAirlineSlugs());
  if (!allowed.has(slug)) notFound();

  const airline = getAirlineBySlug(slug);
  if (!airline) notFound();

  const fees = (airline.fees ?? []) as FeeItem[];

  return (
    <main style={{ display: "grid", gap: 14 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>{airline.name}</h1>
          <span style={{ color: "#555", fontSize: 13, display: "none" }}>Slug: {airline.slug}</span>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          {airline.iata && <span>IATA: {airline.iata}</span>}
          {airline.icao && <span>ICAO: {airline.icao}</span>}
          {airline.country && <span>Country: {airline.country}</span>}
          {airline.region && <span>Region: {airline.region}</span>}
        </div>

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          <Link href="/airlines">All airlines</Link>
          <Link href="/fees">Fee categories</Link>
          <Link href="/compare">Comparison tables</Link>
          <Link href="/updates">Updates</Link>
        </nav>
      </header>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Fees</h2>

        {fees.length === 0 ? (
          <p style={{ margin: 0, color: "#444" }}>No fee rows are published for this airline.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Conditions</th>
                  <th>Applies to</th>
                  <th>Region / route</th>
                  <th>Pricing unit</th>
                  <th>When charged</th>
                  <th>Source</th>
                  <th>Last verified</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((item, idx) => {
                  const categoryRaw = (item as any).category;
                  const category = safeText(categoryRaw);

                  const { pricingUnit, whenCharged, extraForConditions } = deriveTiming((item as any).timing);
                  const conditions = appendToConditions((item as any).conditions, extraForConditions);

                  const amount = formatAmount((item as any).amount, (item as any).currency);
                  const appliesTo = (item as any).applies_to ?? "—";
                  const regionOrRoute = (item as any).region_or_route ?? "—";
                  const sourceUrl = safeUrl((item as any).source_url);
                  const lastVerified = safeDate((item as any).last_verified);

                  return (
                    <tr key={`${String(categoryRaw ?? "category")}-${idx}`}>
                      <td>
                        <Link href={`/fees/${encodeURIComponent(String(categoryRaw ?? ""))}`}>{category}</Link>
                      </td>
                      <td>{amount}</td>
                      <td style={{ minWidth: 260 }}>{conditions}</td>
                      <td>{appliesTo}</td>
                      <td>{regionOrRoute}</td>
                      <td>{pricingUnit}</td>
                      <td>{whenCharged}</td>
                      <td>
                        {sourceUrl ? (
                          <a href={sourceUrl} target="_blank" rel="noreferrer">
                            Source
                          </a>
                        ) : (
                          "Not published"
                        )}
                      </td>
                      <td>{lastVerified}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
