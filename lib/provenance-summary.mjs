import { getPublishableRevision, validateDataset } from "../scripts/validate-provenance.mjs";

const COVERAGE_LABELS = new Map([
  ["additional_baggage", "additional baggage"],
  ["baggage_policy_scope", "policy scope"],
  ["carry_on", "cabin baggage"],
  ["checked_baggage", "checked baggage"],
  ["oversize_baggage", "oversize baggage"],
  ["overweight_baggage", "overweight baggage"],
]);

const RECHECK_STATUSES = new Set(["needs_recheck", "source_changed"]);

function latestRevision(claim) {
  return claim.revisions.at(-1) ?? null;
}

function pageStatus(reviewItems) {
  if (reviewItems.some((item) => item.status === "unable_to_verify")) return "unable_to_verify";
  if (reviewItems.some((item) => RECHECK_STATUSES.has(item.status))) return "needs_recheck";
  if (reviewItems.length > 0) return "review_pending";
  return "verified";
}

export function buildProvenanceSummary(dataset) {
  const errors = validateDataset(dataset);
  if (errors.length > 0) {
    throw new Error(`Invalid provenance dataset:\n${errors.join("\n")}`);
  }

  const publishableClaims = [];
  const reviewItems = [];
  const usedSourceIds = new Set();
  let lastVerified = null;

  for (const claim of dataset.claims) {
    const publishableRevision = getPublishableRevision(claim);
    const latest = latestRevision(claim);

    if (publishableRevision) {
      for (const evidence of publishableRevision.evidence) usedSourceIds.add(evidence.source_id);
      if (!lastVerified || publishableRevision.verification.verified_at > lastVerified) {
        lastVerified = publishableRevision.verification.verified_at;
      }
      publishableClaims.push({
        claimId: claim.claim_id,
        category: claim.category,
        factType: claim.fact_type,
        revisionId: publishableRevision.revision_id,
        assertion: publishableRevision.assertion,
        scope: publishableRevision.scope,
        verifiedAt: publishableRevision.verification.verified_at,
        hasNewerReviewItem: latest.revision_id !== publishableRevision.revision_id,
      });
    }

    if (latest.verification.status !== "verified") {
      reviewItems.push({
        claimId: claim.claim_id,
        category: claim.category,
        revisionId: latest.revision_id,
        status: latest.verification.status,
        detectedAt: latest.verification.detected_at,
      });
    }
  }

  const officialSources = dataset.sources
    .filter((source) => usedSourceIds.has(source.source_id))
    .map((source) => ({
      sourceId: source.source_id,
      title: source.title,
      url: source.url,
      hierarchyRank: source.hierarchy_rank,
      classification: source.hierarchy_rank <= 3 ? "primary_policy_source" : "supporting_official_source",
    }))
    .sort((a, b) => a.hierarchyRank - b.hierarchyRank || a.title.localeCompare(b.title));

  return {
    airline: dataset.subject.name,
    slug: dataset.subject.slug,
    lastVerified,
    verificationStatus: pageStatus(reviewItems),
    verifiedClaimCount: publishableClaims.length,
    coverage: [...new Set(publishableClaims.map((claim) => COVERAGE_LABELS.get(claim.category) ?? claim.category))].sort(),
    officialSources,
    primarySourceCount: officialSources.filter((source) => source.classification === "primary_policy_source").length,
    pendingReviewCount: reviewItems.filter((item) => item.status === "potential_change_detected").length,
    needsRecheckClaimCount: reviewItems.filter((item) => RECHECK_STATUSES.has(item.status)).length,
    reviewItems,
    publishableClaims,
  };
}
