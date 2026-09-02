import fs from "node:fs";
import path from "node:path";

const TODAY = process.env.FRESHNESS_AS_OF ?? new Date().toISOString().slice(0, 10);
const REVIEW_AFTER_DAYS = 120;
const RECHECK_AFTER_DAYS = 240;
const PRIORITY = new Set([
  "united", "delta", "american", "southwest", "jetblue", "alaska", "frontier", "ryanair", "easyjet",
  "air-france", "air-canada", "zipair",
]);

function ageDays(date) {
  return Math.floor((Date.parse(`${TODAY}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
}

const directory = path.join(process.cwd(), "data", "airlines");
const queue = [];

for (const filename of fs.readdirSync(directory).filter((name) => name.endsWith(".json"))) {
  const airline = JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8"));
  for (const fee of airline.fees ?? []) {
    const date = typeof fee.last_verified === "string" ? fee.last_verified : "";
    const age = /^\d{4}-\d{2}-\d{2}$/.test(date) ? ageDays(date) : Number.POSITIVE_INFINITY;
    if (age <= REVIEW_AFTER_DAYS) continue;
    queue.push({
      priority: PRIORITY.has(airline.slug) ? "high" : "standard",
      state: age > RECHECK_AFTER_DAYS ? "needs_recheck" : "review_due",
      airline: airline.name,
      slug: airline.slug,
      category: fee.category ?? "unknown",
      last_verified: date || null,
      age_days: Number.isFinite(age) ? age : null,
      source_url: fee.source_url ?? null,
    });
  }
}

queue.sort((a, b) => {
  if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
  if (a.state !== b.state) return a.state === "needs_recheck" ? -1 : 1;
  return (b.age_days ?? Number.MAX_SAFE_INTEGER) - (a.age_days ?? Number.MAX_SAFE_INTEGER);
});

const summary = {
  as_of: TODAY,
  policy: { review_after_days: REVIEW_AFTER_DAYS, needs_recheck_after_days: RECHECK_AFTER_DAYS },
  counts: {
    high_priority: queue.filter((item) => item.priority === "high").length,
    needs_recheck: queue.filter((item) => item.state === "needs_recheck").length,
    review_due: queue.filter((item) => item.state === "review_due").length,
  },
  queue,
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
