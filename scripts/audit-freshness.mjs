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
  if (airline.data_quality?.status && airline.data_quality.status !== "active") continue;
  for (const fee of airline.fees ?? []) {
    const date = typeof fee.last_verified === "string" ? fee.last_verified : "";
    const age = /^\d{4}-\d{2}-\d{2}$/.test(date) ? ageDays(date) : Number.POSITIVE_INFINITY;
    if (age <= REVIEW_AFTER_DAYS) continue;
    const attempted = typeof fee.data_quality?.last_attempted === "string" ? fee.data_quality.last_attempted : "";
    const attemptedAge = /^\d{4}-\d{2}-\d{2}$/.test(attempted) ? ageDays(attempted) : Number.POSITIVE_INFINITY;
    const recentlyAttemptedButBlocked =
      age > RECHECK_AFTER_DAYS &&
      fee.data_quality?.confidence === "ambiguous" &&
      attemptedAge <= REVIEW_AFTER_DAYS;
    queue.push({
      priority: PRIORITY.has(airline.slug) ? "high" : "standard",
      state: recentlyAttemptedButBlocked ? "unable_to_verify" : age > RECHECK_AFTER_DAYS ? "needs_recheck" : "review_due",
      airline: airline.name,
      slug: airline.slug,
      category: fee.category ?? "unknown",
      last_verified: date || null,
      last_attempted: attempted || null,
      age_days: Number.isFinite(age) ? age : null,
      source_url: fee.source_url ?? null,
    });
  }
}

queue.sort((a, b) => {
  if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
  const stateRank = { needs_recheck: 0, unable_to_verify: 1, review_due: 2 };
  if (a.state !== b.state) return stateRank[a.state] - stateRank[b.state];
  return (b.age_days ?? Number.MAX_SAFE_INTEGER) - (a.age_days ?? Number.MAX_SAFE_INTEGER);
});

const summary = {
  as_of: TODAY,
  policy: { review_after_days: REVIEW_AFTER_DAYS, needs_recheck_after_days: RECHECK_AFTER_DAYS },
  counts: {
    high_priority: queue.filter((item) => item.priority === "high").length,
    needs_recheck: queue.filter((item) => item.state === "needs_recheck").length,
    unable_to_verify: queue.filter((item) => item.state === "unable_to_verify").length,
    review_due: queue.filter((item) => item.state === "review_due").length,
  },
  queue,
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
