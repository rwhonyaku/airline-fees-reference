import fs from "node:fs";
import path from "node:path";
import {
  appendUniqueCheck,
  appendUniqueReview,
  compareSourceCheck,
  createSourceCheck,
  latestSourceCheck,
  validateReviewQueue,
} from "../lib/provenance-monitor.mjs";
import { validateDataset } from "./validate-provenance.mjs";

const args = new Set(process.argv.slice(2));
const initialize = args.has("--initialize");
const initializeRegions = args.has("--initialize-regions");
const write = initialize || initializeRegions || args.has("--write");
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const provenanceDir = path.join(process.cwd(), "data", "provenance");
const snapshotsDir = path.join(provenanceDir, "source-snapshots");
const reviewQueuePath = path.join(provenanceDir, "review-queue.json");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

async function fetchOfficialSource(source) {
  const response = await fetch(source.url, {
    headers: { "user-agent": "Airline-Fees.com policy verification monitor/0.1" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { fetchedUrl: response.url, html: await response.text() };
}

const datasets = fs
  .readdirSync(provenanceDir)
  .filter((file) => file.endsWith(".json") && file !== "review-queue.json")
  .map((file) => ({ file, data: readJson(path.join(provenanceDir, file), null) }));

let reviewQueue = readJson(reviewQueuePath, { schema_version: "0.1.0-pilot", items: [] });
let failures = 0;
const queueErrors = validateReviewQueue(reviewQueue, datasets.map(({ data }) => data));
if (queueErrors.length > 0) {
  throw new Error(`Invalid review queue:\n${queueErrors.join("\n")}`);
}

for (const { file, data: dataset } of datasets) {
  const errors = validateDataset(dataset);
  if (errors.length > 0) {
    failures += 1;
    console.error(`BAD  ${file}: invalid provenance dataset`);
    continue;
  }

  const snapshotPath = path.join(snapshotsDir, file);
  let snapshotStore = readJson(snapshotPath, {
    schema_version: "0.1.0-pilot",
    dataset_id: dataset.dataset_id,
    checks: [],
  });

  for (const source of dataset.sources) {
    try {
      const fetched = await fetchOfficialSource(source);
      const observedCheck = createSourceCheck({ source, checkedAt: today, ...fetched });
      const previousCheck = latestSourceCheck(snapshotStore, source.source_id);
      const comparison = compareSourceCheck({ dataset, previousCheck, observedCheck });

      if (initialize && previousCheck) {
        console.log(`SKIP ${source.source_id}: baseline already exists`);
        continue;
      }
      if (!initialize && comparison.outcome === "baseline_required") {
        console.log(`BASE ${source.source_id}: run with --initialize to establish a baseline`);
        continue;
      }
      if (comparison.outcome === "region_baseline_required" && !initializeRegions) {
        console.log(`REGN ${source.source_id}: run with --initialize-regions to add policy-region baselines`);
        continue;
      }

      const baselineRun = initialize || initializeRegions;
      console.log(`${comparison.outcome === "unchanged" ? "OK  " : baselineRun ? "INIT" : comparison.outcome === "page_changed_only" ? "INFO" : "FLAG"} ${source.source_id}${baselineRun ? "" : `: ${comparison.outcome}`}`);
      if (write) {
        snapshotStore = appendUniqueCheck(snapshotStore, observedCheck);
        if (!baselineRun) reviewQueue = appendUniqueReview(reviewQueue, comparison.reviewItem);
      }
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${source.source_id}: ${error.message}`);
    }
  }

  if (write) writeJsonAtomic(snapshotPath, snapshotStore);
}

if (write) {
  const updatedQueueErrors = validateReviewQueue(reviewQueue, datasets.map(({ data }) => data));
  if (updatedQueueErrors.length > 0) throw new Error(`Monitor produced an invalid review queue:\n${updatedQueueErrors.join("\n")}`);
  writeJsonAtomic(reviewQueuePath, reviewQueue);
}
if (!write) console.log("Dry run only; no snapshots or review items were written.");
if (failures > 0) process.exit(2);
