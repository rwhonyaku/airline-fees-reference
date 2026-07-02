// app/sizer-rules/page.tsx
import Link from "next/link";
import Image from "next/image";
import fs from "fs/promises";
import path from "path";
import { compareBagToRules, extractSizerRules, formatDims } from "@/lib/carry-on-sizer";
import { clampInt, firstString } from "@/lib/bag-cost-calculator";
import { getAllAirlines } from "@/lib/data";

type GearItem = {
  id: string;
  type: string;
  title: string;
  why_it_works: string;
  offer_url?: string;
};

type GearItemsJson = { gear_items: GearItem[] };
type GearRecsJson = Record<string, Record<string, string[]>>;
type SearchParams = Record<string, string | string[] | undefined>;
type PageProps = {
  searchParams?: Promise<SearchParams>;
};

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

function statusBadge(status: "fits" | "near_limit" | "fails") {
  const map = {
    fits: { label: "Fits published dimensions", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
    near_limit: { label: "Very tight", cls: "border-amber-200 bg-amber-50 text-amber-800" },
    fails: { label: "Likely too large", cls: "border-rose-200 bg-rose-50 text-rose-800" },
  } as const;
  const v = map[status];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${v.cls}`}>{v.label}</span>;
}

function statusRank(status: "fits" | "near_limit" | "fails"): number {
  if (status === "fails") return 0;
  if (status === "near_limit") return 1;
  return 2;
}

export default async function SizerRules({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const heightIn = clampInt(firstString(sp.height), 1, 40, 22);
  const widthIn = clampInt(firstString(sp.width), 1, 30, 14);
  const depthIn = clampInt(firstString(sp.depth), 1, 20, 9);
  const gearGroups = await getGearForSection("sizer_rules");
  const rules = extractSizerRules(getAllAirlines());
  const results = compareBagToRules({ heightIn, widthIn, depthIn }, rules);
  const sortedResults = [...results].sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.airlineName.localeCompare(b.airlineName));
  const cabinResults = sortedResults.filter((result) => result.kind === "cabin_bag");
  const personalResults = sortedResults.filter((result) => result.kind === "personal_item");
  const failCount = results.filter((result) => result.status === "fails").length;
  const tightCount = results.filter((result) => result.status === "near_limit").length;

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
          <a href="#fit-checker" className="text-blue-700 underline">
            Bag fit checker
          </a>
          <a href="#gear" className="text-blue-700 underline">
            Recommended gear
          </a>
        </div>
      </header>

      <section id="fit-checker" className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-800">Deterministic sizer check</div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Compare your bag to published carry-on dimensions</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
          Enter the outside dimensions including wheels, handles, and stuffed pockets. This tool only
          compares against dimension triplets published in the dataset; it does not guess missing
          airline dimensions or override airport enforcement.
        </p>

        <form method="get" className="mt-5 grid gap-4 rounded-xl border border-blue-100 bg-white p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Height, inches</label>
            <input name="height" defaultValue={String(heightIn)} inputMode="numeric" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Width, inches</label>
            <input name="width" defaultValue={String(widthIn)} inputMode="numeric" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Depth, inches</label>
            <input name="depth" defaultValue={String(depthIn)} inputMode="numeric" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="self-end rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            Check bag
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Answer first</div>
          <p className="mt-2 text-lg font-bold text-slate-950">
            A {heightIn} × {widthIn} × {depthIn} inch bag fails {failCount} published sizer rule{failCount === 1 ? "" : "s"} in this dataset
            {tightCount ? ` and is very tight on ${tightCount}` : ""}.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The comparison is dimension-only and uses a generous rotated-fit screen. A bag can still
            be challenged if it is rigid, visibly overpacked, too heavy, or used on a stricter fare.
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">Cabin bag matches</h3>
            <div className="mt-4 grid gap-3">
              {cabinResults.slice(0, 10).map((result) => (
                <div key={`${result.airlineSlug}-${result.rawText}`} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/airlines/${result.airlineSlug}`} className="font-semibold text-blue-700 underline">
                      {result.airlineName}
                    </Link>
                    {statusBadge(result.status)}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Published screen: {formatDims(result.dimensionsIn)}. {result.rawText}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">Personal item / small-bag matches</h3>
            <div className="mt-4 grid gap-3">
              {personalResults.slice(0, 10).map((result) => (
                <div key={`${result.airlineSlug}-${result.rawText}`} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/airlines/${result.airlineSlug}`} className="font-semibold text-blue-700 underline">
                      {result.airlineName}
                    </Link>
                    {statusBadge(result.status)}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Published screen: {formatDims(result.dimensionsIn)}. {result.rawText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
