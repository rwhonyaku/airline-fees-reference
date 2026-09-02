import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveReviewItem, validateReviewQueue } from "../lib/provenance-monitor.mjs";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "provenance", "air-france.json"), "utf8"));
const openItem = {
  review_id: "review.src.air-france.extra-baggage.2026-09-01.synthetic",
  dataset_id: dataset.dataset_id,
  source_id: "src.air-france.extra-baggage",
  status: "open",
  verification_state: "potential_change_detected",
  detected_at: "2026-09-01",
  previous_check_id: "check.previous",
  observed_check_id: "check.observed",
  previous_sha256: "a".repeat(64),
  observed_sha256: "b".repeat(64),
  affected_claim_ids: ["air-france.overweight.acceptance"],
  reviewer_action: "Inspect the official source."
};
const queue = { schema_version: "0.1.0-pilot", items: [openItem] };

assert.deepEqual(validateReviewQueue(queue, [dataset]), []);

const dismissed = resolveReviewItem(queue, {
  reviewId: openItem.review_id,
  reviewer: "test-human",
  outcome: "nonmaterial_change",
  note: "Navigation changed; the cited baggage rule did not.",
  resolvedAt: "2026-09-01",
});
assert.equal(dismissed.items[0].status, "dismissed");
assert.equal(dismissed.items[0].resolution.reviewed_by.type, "human");
assert.deepEqual(validateReviewQueue(dismissed, [dataset]), []);
assert.equal(queue.items[0].status, "open", "Resolution must return a new queue instead of mutating history in memory.");

assert.throws(
  () => resolveReviewItem(queue, {
    reviewId: openItem.review_id,
    reviewer: "test-human",
    outcome: "policy_updated",
    note: "Material policy change.",
    resolvedAt: "2026-09-01",
  }),
  /claim revision identifier/
);
assert.throws(
  () => resolveReviewItem(queue, {
    reviewId: openItem.review_id,
    reviewer: "",
    outcome: "nonmaterial_change",
    note: "No reviewer supplied.",
    resolvedAt: "2026-09-01",
  }),
  /human reviewer identifier/
);

console.log("OK   valid open review queue passes validation");
console.log("OK   nonmaterial change is retained as a human dismissal");
console.log("OK   policy update requires a linked claim revision");
console.log("OK   review resolution requires a human identifier");
