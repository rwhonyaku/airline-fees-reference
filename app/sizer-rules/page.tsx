// app/sizer-rules/page.tsx
import Link from "next/link";
import Image from "next/image";
import fs from "fs/promises";
import path from "path";

type GearItem = {
  id: string;
  type: string;
  title: string;
  why_it_works: string;
  offer_url?: string;
};

type GearItemsJson = { gear_items: GearItem[] };
type GearRecsJson = Record<string, Record<string, string[]>>;

const LAST_VERIFIED = "2026-02-16";

async function readJson<T>(rel: string): Promise<T> {
  const full = path.join(process.cwd(), rel);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
}

async function getGearForSection(section: string) {
  const items = await readJson<GearItemsJson>("data/gear/items.json");
  const recs = await readJson<GearRecsJson>("data/gear/recommendations.json");

  const sectionMap = recs?.[section] ?? {};
  const byId = new Map(items.gear_items.map((x) => [x.id, x]));

  const resolved: { type: string; items: GearItem[] }[] = [];
  for (const [type, ids] of Object.entries(sectionMap)) {
    const arr = (ids ?? [])
      .map((id) => byId.get(id))
      .filter(Boolean) as GearItem[];
    if (arr.length) resolved.push({ type, items: arr });
  }
  return resolved;
}

function titleForType(type: string): string {
  switch (type) {
    case "soft_personal_item":
      return "Soft-sided personal item";
    case "underseat_backpack":
      return "Under-seat backpack";
    case "foldable_duffel":
      return "Foldable “weight-split” duffel";
    case "luggage_scale":
      return "Digital luggage scale";
    case "compact_roller":
      return "Compact roller";
    default:
      return type.replace(/_/g, " ");
  }
}

function riskLabel(risk: "low" | "medium" | "high" | "extreme") {
  const map: Record<string, { label: string; cls: string }> = {
    low: { label: "Low", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    medium: { label: "Medium", cls: "bg-amber-50 text-amber-800 border-amber-200" },
    high: { label: "High", cls: "bg-orange-50 text-orange-800 border-orange-200" },
    extreme: { label: "Extreme", cls: "bg-rose-50 text-rose-800 border-rose-200" },
  };
  const v = map[risk];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${v.cls}`}>
      {v.label}
    </span>
  );
}

export default async function SizerRules() {
  const gearGroups = await getGearForSection("sizer_rules");

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Sizer rules & enforcement reality (2026)</h1>
        <p className="text-slate-600 max-w-3xl mx-auto">
          Sizers aren’t neutral. The same “carry-on size” can be ignored on one flight and enforced aggressively on another.
          This page focuses on what gets targeted at the gate, and which bag types reduce your odds of getting flagged.
        </p>
        <div className="mt-3 text-xs text-slate-500">Last verified: {LAST_VERIFIED}</div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <a href="#risk" className="text-blue-700 underline">
            Enforcement risk tiers
          </a>
          <a href="#signals" className="text-blue-700 underline">
            What triggers checks
          </a>
          <a href="#gear" className="text-blue-700 underline">
            Recommended gear
          </a>
        </div>
      </header>

      <section id="risk" className="mt-10">
        <h2 className="text-2xl font-bold mb-3">Enforcement risk tiers</h2>
        <p className="text-slate-600 mb-6">
          Use this as a planning heuristic. The stricter the sizer culture, the more “shape” matters (soft bags win).
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="p-4 border-b border-slate-200">Group</th>
                <th className="p-4 border-b border-slate-200">Typical published carry-on</th>
                <th className="p-4 border-b border-slate-200">Primary “gotcha”</th>
                <th className="p-4 border-b border-slate-200">Risk</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              <tr>
                <td className="p-4 border-b border-slate-100 font-semibold">US Big Three (UA / DL / AA)</td>
                <td className="p-4 border-b border-slate-100">22 × 14 × 9 (common baseline)</td>
                <td className="p-4 border-b border-slate-100">Discretion spikes on full flights; hardshell gets targeted</td>
                <td className="p-4 border-b border-slate-100">{riskLabel("medium")}</td>
              </tr>
              <tr className="bg-rose-50/40">
                <td className="p-4 border-b border-slate-100 font-semibold">US ULCC (Spirit / Frontier)</td>
                <td className="p-4 border-b border-slate-100">Personal item is the pricing weapon</td>
                <td className="p-4 border-b border-slate-100">Sizer culture is the business model (fees are the product)</td>
                <td className="p-4 border-b border-slate-100">{riskLabel("extreme")}</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-slate-100 font-semibold">Europe LCC (Ryanair / easyJet)</td>
                <td className="p-4 border-b border-slate-100">Personal item baseline + paid “large cabin bag”</td>
                <td className="p-4 border-b border-slate-100">They monetize enforcement; wearable storage is the classic workaround</td>
                <td className="p-4 border-b border-slate-100">{riskLabel("extreme")}</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">Regional flights (small jets)</td>
                <td className="p-4">Overheads + under-seat are physically smaller</td>
                <td className="p-4">Tags can reroute bags to carousel; under-seat obstructions exist on some aircraft</td>
                <td className="p-4">{riskLabel("high")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Note: published dimensions vary by airline and can change. This page focuses on enforcement patterns and “bag shape” outcomes.
        </div>
      </section>

      <section id="signals" className="mt-12">
        <h2 className="text-2xl font-bold mb-3">What triggers checks</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-slate-900">Trigger #1: boxy hardshell rollers</div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              On busy flights, agents often pre-tag rigid rollers because they don’t compress. Soft bags get “visual passes” more often
              because they look smaller and can squeeze into spaces.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-slate-900">Trigger #2: discretionary enforcement</div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              Some airports are moving away from obvious metal sizers, which shifts enforcement to agent judgment. If it looks big,
              you lose the argument before it starts.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-slate-900">Trigger #3: regional flight constraints</div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              Small aircraft have real physical limits. Even if “carry-on allowed,” you may be forced to gate-check. Plan for what
              happens next: keep medicine/keys on-person if a tag routes to the carousel.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-bold text-slate-900">Trigger #4: ULCC pricing model</div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              On ULCCs, enforcement is not incidental — it’s revenue. The safest play is choosing a personal item that can compress
              into the sizer even when slightly packed.
            </p>
          </div>
        </div>
      </section>

      <section id="gear" className="mt-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Recommended gear</h2>
            <p className="text-slate-600 mt-1">
              These are bag archetypes designed to survive sizers and gate discretion. Where a
              product link is available, it appears below.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Disclosure: some outbound links may be affiliate links. It does not change your price.
          </div>
        </div>

        <figure className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/images/premium-carry-on-gate.png"
              alt="Premium carry-on suitcase waiting near an airport gate"
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">
            Bag shape matters before the gate agent ever measures it: rigid rollers invite scrutiny
            on stricter airlines, while softer bags usually survive sizer pressure better.
          </figcaption>
        </figure>

        {gearGroups.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
            No gear references are listed on this page yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {gearGroups.map((group) => (
              <div key={group.type} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-sm font-bold text-slate-900">{titleForType(group.type)}</div>

                <div className="mt-4 space-y-4">
                  {group.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-700 leading-relaxed">{item.why_it_works}</div>

                      <div className="mt-3">
                        {item.offer_url ? (
                          <a
                            href={item.offer_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            View offer
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-slate-900 p-8 text-white">
          <h3 className="text-xl font-bold">Next: airline-specific tactics</h3>
          <p className="mt-2 opacity-90 leading-relaxed">
            If you want the airline-specific fee guide, use the “How to beat fees” page for your airline.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/airlines" className="inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
              Browse airlines
            </Link>
            <Link href="/airlines/united/how-to-beat-fees" className="inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
              Example: United fee guide
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
