import { createHash } from "node:crypto";

const REVIEWABLE_STATUSES = new Set(["open", "resolved", "dismissed"]);

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
  if (fingerprint.normalizedCharacterCount < 200) {
    throw new Error(`Source ${source.source_id} returned too little readable content to fingerprint safely.`);
  }
  return {
    check_id: `check.${source.source_id}.${checkedAt}.${fingerprint.sha256.slice(0, 12)}`,
    source_id: source.source_id,
    requested_url: source.url,
    fetched_url: fetchedUrl,
    checked_at: checkedAt,
    sha256: fingerprint.sha256,
    normalized_character_count: fingerprint.normalizedCharacterCount,
  };
}

export function compareSourceCheck({ dataset, previousCheck, observedCheck }) {
  if (!previousCheck) return { outcome: "baseline_required", reviewItem: null };
  if (previousCheck.sha256 === observedCheck.sha256) return { outcome: "unchanged", reviewItem: null };

  const affectedClaimIds = claimsForSource(dataset, observedCheck.source_id);
  return {
    outcome: "potential_change_detected",
    reviewItem: {
      review_id: `review.${observedCheck.source_id}.${observedCheck.checked_at}.${observedCheck.sha256.slice(0, 12)}`,
      dataset_id: dataset.dataset_id,
      source_id: observedCheck.source_id,
      status: "open",
      verification_state: "potential_change_detected",
      detected_at: observedCheck.checked_at,
      previous_check_id: previousCheck.check_id,
      observed_check_id: observedCheck.check_id,
      previous_sha256: previousCheck.sha256,
      observed_sha256: observedCheck.sha256,
      affected_claim_ids: affectedClaimIds,
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
