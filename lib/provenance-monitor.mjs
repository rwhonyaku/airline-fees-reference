import { createHash } from "node:crypto";

const REVIEWABLE_STATUSES = new Set(["open", "resolved", "dismissed"]);
const RESOLUTIONS = new Set(["policy_updated", "nonmaterial_change", "source_restored", "unable_to_verify"]);

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;|&#38;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;|&#60;/gi, "<")
    .replace(/&gt;|&#62;/gi, ">");
}

export function normalizeOfficialSource(html) {
  return decodeEntities(
    String(html)
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function fingerprintOfficialSource(html) {
  const normalized = normalizeOfficialSource(html);
  return {
    sha256: createHash("sha256").update(normalized, "utf8").digest("hex"),
    normalizedCharacterCount: normalized.length,
  };
}

export function fingerprintPolicyRegions(html, regions) {
  const normalized = normalizeOfficialSource(html);
  const normalizedLower = normalized.toLowerCase();
  return regions.map((region) => {
    const start = normalizedLower.indexOf(region.start_marker.toLowerCase());
    const end = start === -1 ? -1 : normalizedLower.indexOf(region.end_marker.toLowerCase(), start + region.start_marker.length);
    if (start === -1 || end === -1 || end <= start) {
      return { region_id: region.region_id, status: "marker_missing", sha256: null, normalized_character_count: 0, claim_ids: region.claim_ids };
    }
    const content = normalized.slice(start, end);
    return {
      region_id: region.region_id,
      status: "found",
      sha256: createHash("sha256").update(content, "utf8").digest("hex"),
      normalized_character_count: content.length,
      claim_ids: region.claim_ids,
    };
  });
}

export function claimsForSource(dataset, sourceId) {
  return dataset.claims
    .filter((claim) => claim.revisions.some((revision) => revision.evidence.some((item) => item.source_id === sourceId)))
    .map((claim) => claim.claim_id)
    .sort();
}

export function latestSourceCheck(snapshotStore, sourceId) {
  return snapshotStore.checks
    .filter((check) => check.source_id === sourceId)
    .sort((a, b) => a.checked_at.localeCompare(b.checked_at))
    .at(-1) ?? null;
}

export function createSourceCheck({ source, fetchedUrl, checkedAt, html }) {
  const fingerprint = fingerprintOfficialSource(html);
  const policyRegions = fingerprintPolicyRegions(html, source.monitoring?.policy_regions ?? []);
  if (fingerprint.normalizedCharacterCount < 200) {
    throw new Error(`Source ${source.source_id} returned too little readable content to fingerprint safely.`);
  }
  return {
    check_id: `check.${source.source_id}.${checkedAt}.${fingerprint.sha256.slice(0, 8)}.${createHash("sha256").update(JSON.stringify(policyRegions)).digest("hex").slice(0, 8)}`,
    source_id: source.source_id,
    requested_url: source.url,
    fetched_url: fetchedUrl,
    checked_at: checkedAt,
    whole_page_sha256: fingerprint.sha256,
    normalized_character_count: fingerprint.normalizedCharacterCount,
    policy_regions: policyRegions,
  };
}

export function compareSourceCheck({ dataset, previousCheck, observedCheck }) {
  if (!previousCheck) return { outcome: "baseline_required", reviewItem: null };
  if (!Array.isArray(previousCheck.policy_regions)) return { outcome: "region_baseline_required", reviewItem: null };

  const previousRegions = new Map(previousCheck.policy_regions.map((region) => [region.region_id, region]));
  const missingRegions = observedCheck.policy_regions.filter((region) => region.status !== "found");
  const changedRegions = observedCheck.policy_regions.filter((region) => {
    const previous = previousRegions.get(region.region_id);
    return region.status === "found" && previous?.status === "found" && previous.sha256 !== region.sha256;
  });
  const structuralChange = missingRegions.length > 0 || observedCheck.policy_regions.some((region) => !previousRegions.has(region.region_id));
  const policyChanged = changedRegions.length > 0;
  const wholePageChanged = previousCheck.whole_page_sha256 !== observedCheck.whole_page_sha256;
  if (!structuralChange && !policyChanged && !wholePageChanged) return { outcome: "unchanged", reviewItem: null };

  const classification = structuralChange ? "source_structure_changed" : policyChanged ? "policy_region_changed" : "page_changed_only";
  const affectedClaimIds = [...new Set(
    (structuralChange ? [...missingRegions, ...changedRegions] : changedRegions).flatMap((region) => region.claim_ids ?? [])
  )].sort();
  const fallbackClaimIds = affectedClaimIds.length > 0 ? affectedClaimIds : claimsForSource(dataset, observedCheck.source_id);
  return {
    outcome: classification,
    reviewItem: {
      review_id: `review.${observedCheck.source_id}.${observedCheck.checked_at}.${classification}.${observedCheck.whole_page_sha256.slice(0, 12)}`,
      dataset_id: dataset.dataset_id,
      source_id: observedCheck.source_id,
      status: "open",
      verification_state: "potential_change_detected",
      detected_at: observedCheck.checked_at,
      previous_check_id: previousCheck.check_id,
      observed_check_id: observedCheck.check_id,
      change_classification: classification,
      public_recheck_required: classification !== "page_changed_only",
      previous_sha256: previousCheck.whole_page_sha256,
      observed_sha256: observedCheck.whole_page_sha256,
      changed_region_ids: changedRegions.map((region) => region.region_id),
      missing_region_ids: missingRegions.map((region) => region.region_id),
      affected_claim_ids: fallbackClaimIds,
      reviewer_action: "Inspect the official source, determine whether a material policy fact changed, and append a human-verified claim revision if required.",
    },
  };
}

export function appendUniqueCheck(snapshotStore, check) {
  if (snapshotStore.checks.some((item) => item.check_id === check.check_id)) return snapshotStore;
  return { ...snapshotStore, checks: [...snapshotStore.checks, check] };
}

export function appendUniqueReview(reviewQueue, reviewItem) {
  if (!reviewItem) return reviewQueue;
  if (!REVIEWABLE_STATUSES.has(reviewItem.status)) throw new Error(`Invalid review status: ${reviewItem.status}`);
  if (reviewQueue.items.some((item) => item.review_id === reviewItem.review_id)) return reviewQueue;
  return { ...reviewQueue, items: [...reviewQueue.items, reviewItem] };
}

export function validateReviewQueue(reviewQueue, datasets = []) {
  const errors = [];
  if (reviewQueue?.schema_version !== "0.1.0-pilot") errors.push("unsupported_review_queue_schema_version");
  if (!Array.isArray(reviewQueue?.items)) return [...errors, "review_items_missing"];

  const datasetIds = new Set(datasets.map((dataset) => dataset.dataset_id));
  const sourceIds = new Set(datasets.flatMap((dataset) => dataset.sources.map((source) => source.source_id)));
  const claimIds = new Set(datasets.flatMap((dataset) => dataset.claims.map((claim) => claim.claim_id)));
  const reviewIds = new Set();

  reviewQueue.items.forEach((item, index) => {
    const label = `items[${index}]`;
    if (!item.review_id || reviewIds.has(item.review_id)) errors.push(`${label}: duplicate_or_missing_review_id`);
    reviewIds.add(item.review_id);
    if (!REVIEWABLE_STATUSES.has(item.status)) errors.push(`${label}: invalid_status`);
    if (datasets.length > 0 && !datasetIds.has(item.dataset_id)) errors.push(`${label}: unknown_dataset_id`);
    if (datasets.length > 0 && !sourceIds.has(item.source_id)) errors.push(`${label}: unknown_source_id`);
    if (!Array.isArray(item.affected_claim_ids) || item.affected_claim_ids.length === 0) errors.push(`${label}: affected_claim_ids_missing`);
    if (datasets.length > 0 && item.affected_claim_ids?.some((claimId) => !claimIds.has(claimId))) errors.push(`${label}: unknown_claim_id`);

    if (item.status === "open" && item.resolution) errors.push(`${label}: open_item_cannot_have_resolution`);
    if (item.status !== "open") {
      if (!item.resolution || !RESOLUTIONS.has(item.resolution.outcome)) errors.push(`${label}: invalid_or_missing_resolution`);
      if (item.resolution?.reviewed_by?.type !== "human") errors.push(`${label}: resolution_requires_human_review`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.resolution?.resolved_at ?? "")) errors.push(`${label}: invalid_resolved_at`);
      if (!item.resolution?.note?.trim()) errors.push(`${label}: resolution_note_missing`);
      if (item.resolution?.outcome === "policy_updated" && !item.resolution?.claim_revision_id) {
        errors.push(`${label}: policy_update_requires_claim_revision_id`);
      }
    }
  });

  return errors;
}

export function resolveReviewItem(reviewQueue, { reviewId, reviewer, outcome, note, resolvedAt, claimRevisionId = null }) {
  if (!reviewer?.trim()) throw new Error("A human reviewer identifier is required.");
  if (!note?.trim()) throw new Error("A resolution note is required.");
  if (!RESOLUTIONS.has(outcome)) throw new Error(`Invalid resolution outcome: ${outcome}`);
  if (outcome === "policy_updated" && !claimRevisionId) throw new Error("policy_updated requires a claim revision identifier.");

  const index = reviewQueue.items.findIndex((item) => item.review_id === reviewId);
  if (index === -1) throw new Error(`Unknown review item: ${reviewId}`);
  if (reviewQueue.items[index].status !== "open") throw new Error(`Review item is already ${reviewQueue.items[index].status}.`);

  const items = [...reviewQueue.items];
  items[index] = {
    ...items[index],
    status: outcome === "nonmaterial_change" ? "dismissed" : "resolved",
    resolution: {
      outcome,
      resolved_at: resolvedAt,
      reviewed_by: { type: "human", identifier: reviewer.trim() },
      note: note.trim(),
      claim_revision_id: claimRevisionId,
    },
  };
  return { ...reviewQueue, items };
}
