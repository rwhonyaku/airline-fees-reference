// components/Table.tsx

import type { FeeRow } from "@/lib/types";
import { SourceBadge } from "@/components/SourceBadge";
import { LastVerified } from "@/components/LastVerified";

type ColumnMode =
  | "show_pricing_unit"
  | "show_when_charged"
  | "hide_both"
  | "show_both"; // fallback when category is mixed/unknown

type TimingDerived = {
  pricingUnit: string; // per direction | —
  whenCharged: string; // at booking | at booking / manage trip | manage trip | check-in / boarding | at airport | —
  appendToConditions: string | null; // windows/eligibility strings
};

function getColumnMode(rows: FeeRow[]): ColumnMode {
  const cats = new Set<string>();
  for (const r of rows) {
    const c = typeof (r.item as any).category === "string" ? (r.item as any).category : "";
    if (c) cats.add(c);
  }

  // If we can't determine a single category, fall back to showing both.
  if (cats.size !== 1) return "show_both";

  const category = Array.from(cats)[0];

  if (category === "checked_baggage" || category === "unaccompanied_minor") return "show_pricing_unit";
  if (category === "seat_selection") return "show_when_charged";
  if (category === "change_cancellation") return "hide_both";

  return "show_both";
}

function deriveTiming(timing: unknown): TimingDerived {
  const raw = typeof timing === "string" ? timing.trim() : "";
  if (!raw) return { pricingUnit: "—", whenCharged: "—", appendToConditions: null };

  const v = raw.toLowerCase();

  // Pricing unit: normalize
  if (v === "each way" || v === "one-way" || v === "per direction") {
    return { pricingUnit: "per direction", whenCharged: "—", appendToConditions: null };
  }

  // When charged / purchase stage: normalize
  if (v.includes("at booking") && v.includes("manage trip")) {
    return { pricingUnit: "—", whenCharged: "at booking / manage trip", appendToConditions: null };
  }
  if (v === "at booking") return { pricingUnit: "—", whenCharged: "at booking", appendToConditions: null };
  if (v === "manage trip") return { pricingUnit: "—", whenCharged: "manage trip", appendToConditions: null };
  if (v === "check-in / boarding" || v === "check-in" || v === "boarding") {
    return { pricingUnit: "—", whenCharged: "check-in / boarding", appendToConditions: null };
  }
  if (v === "at airport") return { pricingUnit: "—", whenCharged: "at airport", appendToConditions: null };

  // Everything else: rule window / eligibility timing -> move into Conditions.
  return { pricingUnit: "—", whenCharged: "—", appendToConditions: raw };
}

function mergeConditions(conditions: unknown, extra: string | null): string {
  const c = typeof conditions === "string" ? conditions.trim() : "";
  if (!extra) return c || "—";
  if (!c) return extra;
  if (c.includes(extra)) return c;
  return `${c}; ${extra}`;
}

export function FeeTable({ rows }: { rows: FeeRow[] }) {
  if (rows.length === 0) {
    return <div style={{ opacity: 0.8 }}>No verified data available.</div>;
  }

  const mode = getColumnMode(rows);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Airline</th>
            <th style={th}>Amount</th>
            <th style={th}>Conditions</th>
            <th style={th}>Applies to</th>
            <th style={th}>Region / route</th>

            {(mode === "show_pricing_unit" || mode === "show_both") && <th style={th}>Pricing unit</th>}
            {(mode === "show_when_charged" || mode === "show_both") && <th style={th}>When charged</th>}

            <th style={th}>Source</th>
            <th style={th}>Last verified</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const t = deriveTiming((r.item as any).timing);
            // Always push non-unit/non-stage timing into conditions; this is especially important for change/cancellation.
            const conditions = mergeConditions((r.item as any).conditions, t.appendToConditions);

            const pricingUnit = t.pricingUnit;
            const whenCharged = t.whenCharged;

            return (
              <tr key={`${r.airline_slug}-${idx}`}>
                <td style={td}>{r.airline_name}</td>
                <td style={td}>
                  {typeof (r.item as any).amount === "number"
                    ? (r.item as any).amount.toFixed(2)
                    : (r.item as any).amount}{" "}
                  {(r.item as any).currency}
                </td>
                <td style={td}>{conditions}</td>
                <td style={td}>{(r.item as any).applies_to ?? "—"}</td>
                <td style={td}>{(r.item as any).region_or_route ?? "—"}</td>

                {(mode === "show_pricing_unit" || mode === "show_both") && <td style={td}>{pricingUnit}</td>}
                {(mode === "show_when_charged" || mode === "show_both") && <td style={td}>{whenCharged}</td>}

                <td style={td}>
                  <SourceBadge url={(r.item as any).source_url} />
                </td>
                <td style={td}>
                  <LastVerified date={(r.item as any).last_verified} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid rgba(0,0,0,0.15)",
  padding: "10px 8px",
  whiteSpace: "nowrap",
  fontSize: 13,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  padding: "10px 8px",
  verticalAlign: "top",
  fontSize: 13,
};
