import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildProvenanceSummary } from "../lib/provenance-summary.mjs";

const fixturePath = path.join(process.cwd(), "data", "provenance", "air-france.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));

function appendReviewRevision(dataset, claimId, status) {
  const claim = dataset.claims.find((item) => item.claim_id === claimId);
  assert.ok(claim, `Missing test claim: ${claimId}`);
  const previous = claim.revisions.at(-1);
  const revision = clone(previous);
  revision.revision_id = `${previous.revision_id}.${status}`;
  revision.verification = {
    status,
    detected_at: "2026-09-01",
    checked_at: "2026-09-01",
    verified_at: null,
    reviewed_by: { type: "automation", identifier: "provenance-summary-test" },
    notes: "Synthetic review state; never written to the fixture.",
  };
  revision.change = {
    kind: "source_refresh",
    supersedes_revision_id: previous.revision_id,
    summary: "Synthetic review state used to test the read-only summary adapter.",
  };
  claim.revisions.push(revision);
  return { claim, previous, revision };
}

const cleanSummary = buildProvenanceSummary(fixture);
assert.equal(cleanSummary.airline, "Air France");
assert.equal(cleanSummary.lastVerified, "2026-08-31");
assert.equal(cleanSummary.verificationStatus, "verified");
assert.equal(cleanSummary.verifiedClaimCount, 14);
assert.equal(cleanSummary.pendingReviewCount, 0);
assert.equal(cleanSummary.needsRecheckClaimCount, 0);
assert.deepEqual(cleanSummary.coverage, [
  "additional baggage",
  "cabin baggage",
  "checked baggage",
  "oversize baggage",
  "overweight baggage",
  "policy scope",
]);
assert.equal(cleanSummary.officialSources.length, 5);
assert.equal(cleanSummary.primarySourceCount, 3);

const pendingDataset = clone(fixture);
const pending = appendReviewRevision(pendingDataset, "air-france.overweight.acceptance", "potential_change_detected");
pending.revision.assertion.max_weight_kg = 31;
const pendingSummary = buildProvenanceSummary(pendingDataset);
const pendingPublished = pendingSummary.publishableClaims.find((claim) => claim.claimId === pending.claim.claim_id);
assert.equal(pendingSummary.verificationStatus, "review_pending");
assert.equal(pendingSummary.pendingReviewCount, 1);
assert.equal(pendingSummary.verifiedClaimCount, 14);
assert.equal(pendingPublished.revisionId, pending.previous.revision_id);
assert.equal(pendingPublished.assertion.max_weight_kg, 32);
assert.equal(pendingPublished.hasNewerReviewItem, true);
assert.equal(JSON.stringify(pendingSummary).includes('"max_weight_kg":31'), false, "Unverified assertions must not leak into the summary.");

const changedSourceDataset = clone(fixture);
const changed = appendReviewRevision(changedSourceDataset, "air-france.additional-bag.price-lookup", "source_changed");
const changedSummary = buildProvenanceSummary(changedSourceDataset);
const changedPublished = changedSummary.publishableClaims.find((claim) => claim.claimId === changed.claim.claim_id);
assert.equal(changedSummary.verificationStatus, "needs_recheck");
assert.equal(changedSummary.needsRecheckClaimCount, 1);
assert.equal(changedSummary.verifiedClaimCount, 14);
assert.equal(changedPublished.revisionId, changed.previous.revision_id);
assert.equal(changedPublished.hasNewerReviewItem, true);

const openQueue = {
  schema_version: "0.1.0-pilot",
  items: [
    {
      review_id: "review.src.air-france.extra-baggage.2026-09-01.synthetic",
      dataset_id: fixture.dataset_id,
      source_id: "src.air-france.extra-baggage",
      status: "open",
      verification_state: "potential_change_detected",
      detected_at: "2026-09-01",
      previous_check_id: "check.previous",
      observed_check_id: "check.observed",
      previous_sha256: "a".repeat(64),
      observed_sha256: "b".repeat(64),
      affected_claim_ids: ["air-france.overweight.acceptance", "air-france.oversize.acceptance"],
      reviewer_action: "Inspect the official source."
    }
  ]
};
const queueAwareSummary = buildProvenanceSummary(fixture, openQueue);
assert.equal(queueAwareSummary.verificationStatus, "needs_recheck");
assert.equal(queueAwareSummary.pendingReviewCount, 1);
assert.equal(queueAwareSummary.needsRecheckClaimCount, 2);
assert.equal(queueAwareSummary.verifiedClaimCount, 14, "Open source review must not remove previous verified facts.");

const pageOnlyQueue = clone(openQueue);
pageOnlyQueue.items[0].public_recheck_required = false;
pageOnlyQueue.items[0].change_classification = "page_changed_only";
const pageOnlySummary = buildProvenanceSummary(fixture, pageOnlyQueue);
assert.equal(pageOnlySummary.verificationStatus, "verified");
assert.equal(pageOnlySummary.pendingReviewCount, 0);

const invalidDataset = clone(fixture);
invalidDataset.claims[0].revisions[0].verification.reviewed_by.type = "automation";
assert.throws(() => buildProvenanceSummary(invalidDataset), /Invalid provenance dataset/);

console.log("OK   clean dataset produces a verified summary");
console.log("OK   pending proposal keeps the previous verified assertion visible");
console.log("OK   unverified assertion values do not leak into public summary data");
console.log("OK   changed source marks the page summary as needs recheck");
console.log("OK   open source-monitor item marks the page summary as needs recheck");
console.log("OK   page-only source change does not alter public verification status");
console.log("OK   invalid provenance is rejected before summary generation");
