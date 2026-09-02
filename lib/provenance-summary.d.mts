export type ProvenanceVerificationStatus = "verified" | "review_pending" | "needs_recheck" | "unable_to_verify";

export type ProvenanceSourceSummary = {
  sourceId: string;
  title: string;
  url: string;
  hierarchyRank: number;
  classification: "primary_policy_source" | "supporting_official_source";
};

export type ProvenanceReviewItem = {
  origin: "claim_revision" | "source_monitor";
  reviewId?: string;
  claimId: string | null;
  affectedClaimIds?: string[];
  category: string;
  revisionId: string | null;
  status: "needs_recheck" | "source_changed" | "potential_change_detected" | "unable_to_verify";
  detectedAt: string;
};

export type PublishableProvenanceClaim = {
  claimId: string;
  category: string;
  factType: string;
  revisionId: string;
  assertion: Record<string, unknown>;
  scope: Record<string, unknown>;
  verifiedAt: string;
  hasNewerReviewItem: boolean;
};

export type ProvenanceSummary = {
  airline: string;
  slug: string;
  lastVerified: string | null;
  verificationStatus: ProvenanceVerificationStatus;
  verifiedClaimCount: number;
  coverage: string[];
  officialSources: ProvenanceSourceSummary[];
  primarySourceCount: number;
  pendingReviewCount: number;
  needsRecheckClaimCount: number;
  reviewItems: ProvenanceReviewItem[];
  publishableClaims: PublishableProvenanceClaim[];
};

export function buildProvenanceSummary(dataset: unknown, reviewQueue?: unknown): ProvenanceSummary;
