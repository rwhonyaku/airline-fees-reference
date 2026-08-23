// scripts/audit-gold-airline-data.mjs
// Reports how close each airline is to the gold-standard policy data target.
// This is advisory: it should guide batch work, not block builds.

import fs from "node:fs";
import path from "node:path";

const AIRLINES_DIR = path.join(process.cwd(), "data", "airlines");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const REQUIRED_CORE_CATEGORIES = [
  "checked_baggage",
  "carry_on",
  "overweight_baggage",
  "oversize_baggage",
  "seat_selection",
  "change_cancellation",
];

const IMPORTANT_EXPANSION_CATEGORIES = [
  "same_day_change",
  "same_day_standby",
  "unaccompanied_minor",
  "sports_equipment",
  "pet_fee",
  "award_ticket",
  "infant_child",
  "military_exemption",
  "status_exemption",
  "credit_card_exemption",
];

const PRIORITY_SLUGS = new Set([
  "united",
  "delta",
  "american",
  "southwest",
  "jetblue",
  "alaska",
  "frontier",
  "ryanair",
  "easyjet",
  "air-canada",
  "air-france",
  "lufthansa",
  "singapore-airlines",
  "air-india",
  "eva-air",
  "british-airways",
  "klm",
  "emirates",
  "qatar-airways",
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\/.+/i.test(value.trim());
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasAnySignal(fees, patterns) {
  return fees.some((fee) => {
    const haystack = [
      fee.category,
      fee.amount,
      fee.conditions,
      fee.applies_to,
      fee.region_or_route,
      fee.timing,
      fee.notes,
    ]
      .filter((value) => value !== undefined && value !== null)
      .join(" ")
      .toLowerCase();

    return patterns.some((pattern) => haystack.includes(pattern));
  });
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function auditAirline(airline) {
  const inactive = airline.data_quality?.status === "ceased_operations";
  const fees = Array.isArray(airline.fees) ? airline.fees : [];
  const categories = new Set(fees.map((fee) => fee.category).filter(Boolean));

  const corePresent = REQUIRED_CORE_CATEGORIES.filter((category) => categories.has(category));
  const expansionPresent = IMPORTANT_EXPANSION_CATEGORIES.filter((category) => categories.has(category));

  const rowCount = fees.length;
  const sourcedRows = fees.filter((fee) => isHttpUrl(fee.source_url)).length;
  const verifiedRows = fees.filter((fee) => DATE_RE.test(fee.last_verified ?? "")).length;
  const scopedRows = fees.filter(
    (fee) => hasText(fee.conditions) && hasText(fee.applies_to) && hasText(fee.region_or_route) && hasText(fee.timing)
  ).length;

  const signals = {
    fareFamily: hasAnySignal(fees, ["basic", "light", "saver", "fare", "flex", "economy"]),
    routeMarket: hasAnySignal(fees, ["domestic", "international", "transatlantic", "transpacific", "route", "market"]),
    purchaseTiming: hasAnySignal(fees, ["online", "airport", "booking", "manage booking", "check-in", "gate"]),
    weightSize: hasAnySignal(fees, ["kg", "lb", "weight", "cm", "inch", "linear", "size"]),
    exemptions: hasAnySignal(fees, ["credit card", "cardholder", "military", "status", "elite", "member", "flying blue"]),
    effectiveDates: fees.some((fee) => DATE_RE.test(fee.effective_date ?? "") || /effective|purchased on or after|before/i.test(fee.conditions ?? "")),
    changeHistory: Array.isArray(airline.policy_change_history) && airline.policy_change_history.length > 0,
  };

  const checklist = [
    ...REQUIRED_CORE_CATEGORIES.map((category) => ({
      label: `category:${category}`,
      ok: categories.has(category),
      required: true,
    })),
    { label: "all rows sourced", ok: rowCount > 0 && sourcedRows === rowCount, required: true },
    { label: "all rows verified", ok: rowCount > 0 && verifiedRows === rowCount, required: true },
    { label: "all rows scoped", ok: rowCount > 0 && scopedRows === rowCount, required: true },
    { label: "fare-family signals", ok: signals.fareFamily, required: true },
    { label: "route-market signals", ok: signals.routeMarket, required: true },
    { label: "purchase-timing signals", ok: signals.purchaseTiming, required: true },
    { label: "weight-size signals", ok: signals.weightSize, required: true },
    { label: "exemption signals", ok: signals.exemptions, required: false },
    { label: "effective-date signals", ok: signals.effectiveDates, required: false },
    { label: "policy-change history", ok: signals.changeHistory, required: false },
  ];

  const requiredChecks = checklist.filter((item) => item.required);
  const optionalChecks = checklist.filter((item) => !item.required);
  const requiredScore = percent(requiredChecks.filter((item) => item.ok).length, requiredChecks.length);
  const optionalScore = percent(optionalChecks.filter((item) => item.ok).length, optionalChecks.length);

  return {
    slug: airline.slug,
    name: airline.name,
    inactive,
    priority: PRIORITY_SLUGS.has(airline.slug) && !inactive,
    rowCount,
    corePresent,
    coreMissing: REQUIRED_CORE_CATEGORIES.filter((category) => !categories.has(category)),
    expansionPresent,
    requiredScore,
    optionalScore,
    missingRequired: requiredChecks.filter((item) => !item.ok).map((item) => item.label),
    missingOptional: optionalChecks.filter((item) => !item.ok).map((item) => item.label),
  };
}

function main() {
  const files = fs.readdirSync(AIRLINES_DIR).filter((file) => file.endsWith(".json") && !file.startsWith("_"));
  const reports = files
    .map((file) => auditAirline(readJson(path.join(AIRLINES_DIR, file))))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      if (a.inactive !== b.inactive) return a.inactive ? 1 : -1;
      if (a.requiredScore !== b.requiredScore) return a.requiredScore - b.requiredScore;
      return a.name.localeCompare(b.name);
    });

  console.log("Gold-standard airline data audit");
  console.log("Advisory only. Lower scores identify the next source/data-depth work.");
  console.log("");

  for (const report of reports) {
    if (report.inactive) continue;
    const marker = report.inactive ? "inactive" : report.priority ? "PRIORITY" : "long-tail";
    console.log(
      `${String(report.requiredScore).padStart(3)}% required / ${String(report.optionalScore).padStart(3)}% optional | ${marker} | ${report.name} (${report.slug}) | rows:${report.rowCount}`
    );
    if (report.coreMissing.length) console.log(`     missing core: ${report.coreMissing.join(", ")}`);
    if (report.missingRequired.length) console.log(`     missing signals: ${report.missingRequired.join("; ")}`);
    if (report.expansionPresent.length) console.log(`     expansion rows: ${report.expansionPresent.join(", ")}`);
  }
}

main();
