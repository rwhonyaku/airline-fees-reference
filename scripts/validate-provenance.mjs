import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROVENANCE_DIR = path.join(process.cwd(), "data", "provenance");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const OFFICIAL_HOST_RE = /(^|\.)airfrance\.(com|fr|us)$/i;
const STATUSES = new Set([
  "verified",
  "needs_recheck",
  "source_changed",
  "potential_change_detected",
  "unable_to_verify",
]);
const SOURCE_RANKS = new Map([
  ["airline_policy_page", 1],
  ["airline_conditions_or_tariff", 2],
  ["airline_booking_or_calculator", 3],
  ["airline_help_center", 4],
  ["other_official_airline_publication", 5],
]);

function isDate(value) {
  return typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function validateDataset(dataset) {
  const errors = [];
  if (dataset.schema_version !== "0.1.0-pilot") errors.push("unsupported_schema_version");
  if (dataset.subject?.type !== "airline" || !dataset.subject?.slug) errors.push("invalid_subject");
  if (!Array.isArray(dataset.sources) || dataset.sources.length === 0) errors.push("sources_missing");
  if (!Array.isArray(dataset.claims) || dataset.claims.length === 0) errors.push("claims_missing");

  const sourceIds = new Set();
  const sources = new Map();
  for (const [index, source] of (dataset.sources ?? []).entries()) {
    const label = `sources[${index}]`;
    if (!source.source_id || sourceIds.has(source.source_id)) errors.push(`${label}: duplicate_or_missing_source_id`);
    sourceIds.add(source.source_id);
    sources.set(source.source_id, source);
    if (SOURCE_RANKS.get(source.type) !== source.hierarchy_rank) errors.push(`${label}: source_rank_mismatch`);
    if (source.publisher !== dataset.subject?.name) errors.push(`${label}: publisher_must_match_subject`);
    if (!isDate(source.accessed_at)) errors.push(`${label}: invalid_accessed_at`);
    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:" || !OFFICIAL_HOST_RE.test(url.hostname)) errors.push(`${label}: source_not_official_air_france`);
    } catch {
      errors.push(`${label}: invalid_source_url`);
    }
  }

  const claimIds = new Set();
  const revisionIds = new Set();
  for (const [claimIndex, claim] of (dataset.claims ?? []).entries()) {
    const claimLabel = `claims[${claimIndex}]`;
    if (!claim.claim_id || claimIds.has(claim.claim_id)) errors.push(`${claimLabel}: duplicate_or_missing_claim_id`);
    claimIds.add(claim.claim_id);
    if (claim.subject !== dataset.subject?.slug) errors.push(`${claimLabel}: subject_mismatch`);
    if (!Array.isArray(claim.revisions) || claim.revisions.length === 0) {
      errors.push(`${claimLabel}: revisions_missing`);
      continue;
    }

    let previousRevisionId = null;
    let previousCheckedAt = null;
    for (const [revisionIndex, revision] of claim.revisions.entries()) {
      const label = `${claimLabel}.revisions[${revisionIndex}]`;
      if (!revision.revision_id || revisionIds.has(revision.revision_id)) errors.push(`${label}: duplicate_or_missing_revision_id`);
      revisionIds.add(revision.revision_id);
      if (!revision.assertion || typeof revision.assertion !== "object" || Array.isArray(revision.assertion)) errors.push(`${label}: assertion_missing`);
      if (!revision.scope || typeof revision.scope !== "object") errors.push(`${label}: scope_missing`);
      if (!STATUSES.has(revision.verification?.status)) errors.push(`${label}: invalid_verification_status`);
      if (!isDate(revision.verification?.detected_at)) errors.push(`${label}: invalid_detected_at`);
      if (!isDate(revision.verification?.checked_at)) errors.push(`${label}: invalid_checked_at`);
      if (previousCheckedAt && revision.verification?.checked_at < previousCheckedAt) errors.push(`${label}: revisions_not_chronological`);
      previousCheckedAt = revision.verification?.checked_at;

      if (revision.verification?.status === "verified") {
        if (!isDate(revision.verification.verified_at)) errors.push(`${label}: verified_revision_missing_verified_at`);
        if (revision.verification.reviewed_by?.type !== "human") errors.push(`${label}: verified_revision_requires_human_review`);
      }
      if (revision.verification?.reviewed_by?.type === "automation" && revision.verification?.status === "verified") {
        errors.push(`${label}: automation_cannot_verify`);
      }

      if (revision.validity?.effective_from === null && revision.validity?.effective_date_status === "published") {
        errors.push(`${label}: published_effective_date_missing`);
      }
      if (revision.validity?.effective_from !== null && !isDate(revision.validity?.effective_from)) errors.push(`${label}: invalid_effective_from`);
      if (revision.validity?.effective_to !== null && !isDate(revision.validity?.effective_to)) errors.push(`${label}: invalid_effective_to`);

      const expectedSupersedes = revisionIndex === 0 ? null : previousRevisionId;
      if (revision.change?.supersedes_revision_id !== expectedSupersedes) errors.push(`${label}: invalid_supersedes_revision_id`);
      if (revisionIndex === 0 && revision.change?.kind !== "initial") errors.push(`${label}: first_revision_must_be_initial`);
      previousRevisionId = revision.revision_id;

      if (!Array.isArray(revision.evidence) || revision.evidence.length === 0) {
        errors.push(`${label}: evidence_missing`);
      } else {
        for (const [evidenceIndex, evidence] of revision.evidence.entries()) {
          const evidenceLabel = `${label}.evidence[${evidenceIndex}]`;
          if (!sources.has(evidence.source_id)) errors.push(`${evidenceLabel}: unknown_source_id`);
          if (!Array.isArray(evidence.supports) || evidence.supports.length === 0) errors.push(`${evidenceLabel}: supported_paths_missing`);
        }
      }
    }
  }

  return errors;
}

export function getPublishableRevision(claim) {
  return [...(claim?.revisions ?? [])].reverse().find((revision) => revision.verification?.status === "verified") ?? null;
}

function validateFile(fileName) {
  const filePath = path.join(PROVENANCE_DIR, fileName);
  try {
    return validateDataset(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch (error) {
    return [`invalid_json: ${error.message}`];
  }
}

function main() {
  if (!fs.existsSync(PROVENANCE_DIR)) {
    console.error(`Missing folder: ${PROVENANCE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PROVENANCE_DIR).filter((file) => file.endsWith(".json"));
  let failed = false;
  for (const file of files.sort()) {
    const errors = validateFile(file);
    if (errors.length === 0) {
      console.log(`OK   ${file}`);
    } else {
      failed = true;
      console.log(`BAD  ${file}`);
      for (const error of errors) console.log(`     - ${error}`);
    }
  }

  if (failed) process.exit(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
