import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getPublishableRevision, validateDataset } from "../scripts/validate-provenance.mjs";

const fixturePath = path.join(process.cwd(), "data", "provenance", "air-france.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(validateDataset(fixture), [], "The committed pilot fixture must be valid.");

const datasetWithProposal = clone(fixture);
const claim = datasetWithProposal.claims.find((item) => item.claim_id === "air-france.overweight.acceptance");
assert.ok(claim, "The overweight baggage claim must exist.");

const priorRevision = claim.revisions.at(-1);
const priorRevisionSnapshot = JSON.stringify(priorRevision);
const proposedRevision = clone(priorRevision);
proposedRevision.revision_id = "rev.air-france.overweight.acceptance.2026-09-01-proposal";
proposedRevision.assertion.max_weight_kg = 31;
proposedRevision.verification = {
  status: "potential_change_detected",
  detected_at: "2026-09-01",
  checked_at: "2026-09-01",
  verified_at: null,
  reviewed_by: {
    type: "automation",
    identifier: "provenance-pilot-test"
  },
  notes: "Synthetic test value; not an Air France policy claim and never written to the fixture."
};
proposedRevision.change = {
  kind: "policy_change",
  supersedes_revision_id: priorRevision.revision_id,
  summary: "Synthetic proposal used to test review gating."
};
claim.revisions.push(proposedRevision);

assert.deepEqual(
  validateDataset(datasetWithProposal),
  [],
  "A properly linked automation-detected proposal should be structurally valid."
);
assert.equal(claim.revisions.length, 2, "The proposal must append a revision instead of replacing history.");
assert.equal(
  JSON.stringify(claim.revisions[0]),
  priorRevisionSnapshot,
  "Appending a proposal must leave the prior verified revision byte-for-byte unchanged."
);
assert.equal(
  getPublishableRevision(claim)?.revision_id,
  priorRevision.revision_id,
  "An unverified proposal must not replace the current publishable revision."
);

const invalidAutomatedApproval = clone(datasetWithProposal);
const invalidClaim = invalidAutomatedApproval.claims.find((item) => item.claim_id === claim.claim_id);
invalidClaim.revisions.at(-1).verification.status = "verified";
invalidClaim.revisions.at(-1).verification.verified_at = "2026-09-01";
const approvalErrors = validateDataset(invalidAutomatedApproval);
assert.ok(
  approvalErrors.some((error) => error.endsWith("verified_revision_requires_human_review")),
  "An automation-reviewed revision must not pass as verified."
);
assert.ok(
  approvalErrors.some((error) => error.endsWith("automation_cannot_verify")),
  "The validator must explicitly reject automated verification."
);

const brokenHistory = clone(datasetWithProposal);
const brokenClaim = brokenHistory.claims.find((item) => item.claim_id === claim.claim_id);
brokenClaim.revisions.at(-1).change.supersedes_revision_id = null;
assert.ok(
  validateDataset(brokenHistory).some((error) => error.endsWith("invalid_supersedes_revision_id")),
  "A proposed revision must point to the revision immediately before it."
);

console.log("OK   baseline fixture is valid");
console.log("OK   proposed change appends without altering verified history");
console.log("OK   unverified proposal does not become publishable");
console.log("OK   automation cannot approve a verified revision");
console.log("OK   broken revision lineage is rejected");
