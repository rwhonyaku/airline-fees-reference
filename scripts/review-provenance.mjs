import fs from "node:fs";
import path from "node:path";
import { resolveReviewItem, validateReviewQueue } from "../lib/provenance-monitor.mjs";

const provenanceDir = path.join(process.cwd(), "data", "provenance");
const queuePath = path.join(provenanceDir, "review-queue.json");
const localDate = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonAtomic(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function usage() {
  console.log("Usage:");
  console.log("  pnpm run review:provenance -- list");
  console.log("  pnpm run review:provenance -- show <review-id>");
  console.log("  pnpm run review:provenance -- resolve <review-id> --reviewer <id> --resolution <outcome> --note <text> [--claim-revision <id>]");
  console.log("Outcomes: policy_updated, nonmaterial_change, source_restored, unable_to_verify");
}

const datasets = fs
  .readdirSync(provenanceDir)
  .filter((file) => file.endsWith(".json") && file !== "review-queue.json")
  .map((file) => readJson(path.join(provenanceDir, file)));
const queue = readJson(queuePath);
const initialErrors = validateReviewQueue(queue, datasets);
if (initialErrors.length > 0) throw new Error(`Invalid review queue:\n${initialErrors.join("\n")}`);

const [command, reviewId] = process.argv.slice(2).filter((argument) => argument !== "--");
if (command === "list") {
  const openItems = queue.items.filter((item) => item.status === "open");
  if (openItems.length === 0) console.log("No open provenance review items.");
  for (const item of openItems) {
    console.log(`${item.review_id} | ${item.detected_at} | ${item.source_id} | ${item.affected_claim_ids.length} affected claims`);
  }
} else if (command === "show" && reviewId) {
  const item = queue.items.find((entry) => entry.review_id === reviewId);
  if (!item) throw new Error(`Unknown review item: ${reviewId}`);
  console.log(JSON.stringify(item, null, 2));
} else if (command === "resolve" && reviewId) {
  const updated = resolveReviewItem(queue, {
    reviewId,
    reviewer: option("reviewer"),
    outcome: option("resolution"),
    note: option("note"),
    claimRevisionId: option("claim-revision"),
    resolvedAt: localDate(),
  });
  const errors = validateReviewQueue(updated, datasets);
  if (errors.length > 0) throw new Error(`Resolution would create an invalid review queue:\n${errors.join("\n")}`);
  writeJsonAtomic(queuePath, updated);
  const resolved = updated.items.find((item) => item.review_id === reviewId);
  console.log(`${reviewId} -> ${resolved.status} (${resolved.resolution.outcome})`);
} else {
  usage();
  process.exitCode = 1;
}
