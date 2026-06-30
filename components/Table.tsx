// components/Table.tsx
import type { FeeRow } from "@/lib/types";
import { SourceBadge } from "@/components/SourceBadge";
import { LastVerified } from "@/components/LastVerified";

// --- HELPERS (The logic TypeScript was missing) ---

type ColumnMode = "show_pricing_unit" | "show_when_charged" | "hide_both" | "show_both";

function getColumnMode(rows: FeeRow[]): ColumnMode {
  const cats = new Set<string>();
  for (const r of rows) {
    const c = typeof (r.item as any).category === "string" ? (r.item as any).category : "";
    if (c) cats.add(c);
  }
  if (cats.size !== 1) return "show_both";
  const category = Array.from(cats)[0];

  if (category === "checked_baggage" || category === "unaccompanied_minor") return "show_pricing_unit";
  if (category === "seat_selection") return "show_when_charged";
  if (category === "change_cancellation") return "hide_both";
  return "show_both";
}

function deriveTiming(timing: unknown) {
  const raw = typeof timing === "string" ? timing.trim() : "";
  if (!raw) return { pricingUnit: "—", whenCharged: "—", appendToConditions: null };
  const v = raw.toLowerCase();

  if (v === "each way" || v === "one-way" || v === "per direction") {
    return { pricingUnit: "per direction", whenCharged: "—", appendToConditions: null };
  }
  if (v.includes("at booking") && v.includes("manage trip")) {
    return { pricingUnit: "—", whenCharged: "at booking / manage trip", appendToConditions: null };
  }
  if (v === "at booking") return { pricingUnit: "—", whenCharged: "at booking", appendToConditions: null };
  if (v === "manage trip") return { pricingUnit: "—", whenCharged: "manage trip", appendToConditions: null };
  if (v === "check-in / boarding") return { pricingUnit: "—", whenCharged: "check-in / boarding", appendToConditions: null };
  if (v === "at airport") return { pricingUnit: "—", whenCharged: "at airport", appendToConditions: null };

  return { pricingUnit: "—", whenCharged: "—", appendToConditions: raw };
}

function mergeConditions(conditions: unknown, extra: string | null): string {
  const c = typeof conditions === "string" ? conditions.trim() : "";
  if (!extra) return c || "—";
  if (!c) return extra;
  return `${c}; ${extra}`;
}

// --- MAIN COMPONENT ---

export function FeeTable({ rows }: { rows: FeeRow[] }) {
  if (rows.length === 0) {
    return <div className="p-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">No verified data available.</div>;
  }

  const mode = getColumnMode(rows);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 font-bold text-slate-900">Airline</th>
            <th className="px-4 py-3 font-bold text-slate-900">Amount</th>
            <th className="px-4 py-3 font-bold text-slate-900">Conditions</th>
            {(mode === "show_pricing_unit" || mode === "show_both") && <th className="px-4 py-3 font-bold text-slate-900">Pricing unit</th>}
            {(mode === "show_when_charged" || mode === "show_both") && <th className="px-4 py-3 font-bold text-slate-900">When charged</th>}
            <th className="px-4 py-3 font-bold text-slate-900">Source</th>
            <th className="px-4 py-3 font-bold text-slate-900">Verified</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((r, idx) => {
            const t = deriveTiming((r.item as any).timing);
            const conditions = mergeConditions((r.item as any).conditions, t.appendToConditions);
            return (
              <tr key={`${r.airline_slug}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 font-medium text-slate-900">{r.airline_name}</td>
                <td className="px-4 py-4 whitespace-nowrap font-bold">
                  {(r.item as any).amount} {(r.item as any).currency}
                </td>
                <td className="px-4 py-4 text-slate-600">{conditions}</td>
                {(mode === "show_pricing_unit" || mode === "show_both") && <td className="px-4 py-4 text-slate-500 italic">{t.pricingUnit}</td>}
                {(mode === "show_when_charged" || mode === "show_both") && (
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] uppercase font-bold text-slate-600 tracking-tight">
                      {t.whenCharged}
                    </span>
                  </td>
                )}
                <td className="px-4 py-4"><SourceBadge url={(r.item as any).source_url} /></td>
                <td className="px-4 py-4 text-[11px] text-slate-400 font-mono italic">
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