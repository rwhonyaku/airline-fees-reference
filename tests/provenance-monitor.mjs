import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  appendUniqueCheck,
  appendUniqueReview,
  compareSourceCheck,
  createSourceCheck,
  normalizeOfficialSource,
} from "../lib/provenance-monitor.mjs";

const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "provenance", "air-france.json"), "utf8"));
const source = {
  ...fixture.sources.find((item) => item.source_id === "src.air-france.extra-baggage"),
  monitoring: {
    policy_regions: [{
      region_id: "test-policy",
      start_marker: "Start policy region",
      end_marker: "End policy region",
      claim_ids: ["air-france.overweight.acceptance"],
    }],
  },
};
const htmlA = `<html><head><script>dynamic()</script></head><body><p>Page navigation</p><h1>Start policy region</h1><p>Maximum weight is 32 kg.</p>${"Policy details. ".repeat(20)}<p>End policy region</p><footer>Footer A</footer></body></html>`;
const htmlB = htmlA.replace("32 kg", "31 kg");
const htmlPageOnly = htmlA.replace("Footer A", "Footer B");

assert.equal(normalizeOfficialSource(htmlA).includes("dynamic"), false, "Script content must not affect the fingerprint.");

const first = createSourceCheck({ source, fetchedUrl: source.url, checkedAt: "2026-09-01", html: htmlA });
const same = createSourceCheck({ source, fetchedUrl: source.url, checkedAt: "2026-09-02", html: htmlA });
const changed = createSourceCheck({ source, fetchedUrl: source.url, checkedAt: "2026-09-03", html: htmlB });
const pageOnly = createSourceCheck({ source, fetchedUrl: source.url, checkedAt: "2026-09-04", html: htmlPageOnly });

assert.equal(compareSourceCheck({ dataset: fixture, previousCheck: first, observedCheck: same }).outcome, "unchanged");
const comparison = compareSourceCheck({ dataset: fixture, previousCheck: first, observedCheck: changed });
assert.equal(comparison.outcome, "policy_region_changed");
assert.equal(comparison.reviewItem.verification_state, "potential_change_detected");
assert.equal(comparison.reviewItem.public_recheck_required, true);
assert.ok(comparison.reviewItem.affected_claim_ids.includes("air-france.overweight.acceptance"));
assert.equal(JSON.stringify(comparison.reviewItem).includes("31 kg"), false, "Review items must not publish observed page content as a policy fact.");

const pageOnlyComparison = compareSourceCheck({ dataset: fixture, previousCheck: first, observedCheck: pageOnly });
assert.equal(pageOnlyComparison.outcome, "page_changed_only");
assert.equal(pageOnlyComparison.reviewItem.public_recheck_required, false);

const snapshots = { schema_version: "0.1.0-pilot", dataset_id: fixture.dataset_id, checks: [] };
const once = appendUniqueCheck(snapshots, first);
const twice = appendUniqueCheck(once, first);
assert.equal(twice.checks.length, 1, "A retry must not duplicate a source check.");

const queue = { schema_version: "0.1.0-pilot", items: [] };
const queuedOnce = appendUniqueReview(queue, comparison.reviewItem);
const queuedTwice = appendUniqueReview(queuedOnce, comparison.reviewItem);
assert.equal(queuedTwice.items.length, 1, "A retry must not duplicate a review item.");

console.log("OK   source normalization ignores scripts and markup noise");
console.log("OK   unchanged source content does not create a review item");
console.log("OK   policy-region changes create a public-recheck review item");
console.log("OK   changes outside policy regions are classified as page-only");
console.log("OK   affected claims are mapped through evidence references");
console.log("OK   observed content is not promoted to a policy assertion");
console.log("OK   source checks and review items are idempotent");
