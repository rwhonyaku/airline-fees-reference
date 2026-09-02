# Data provenance pilot

## Purpose

This pilot tests a claim-level, append-only policy dataset before it becomes a production dependency. Air France is the only pilot subject. Public pages and calculators continue to read `data/airlines/air-france.json`.

The pilot must prove that Airline-Fees.com can trace every material assertion to official evidence, preserve earlier revisions, and distinguish a published fact from an editorial conclusion.

## Unit of record

A **claim** is one independently verifiable airline-policy assertion. A claim keeps a stable `claim_id` even when its value changes. Examples include a cabin weight limit, a purchase deadline, or an exception for a particular market.

Each claim contains one or more immutable **revisions**. A correction or policy change adds a revision; it does not edit or delete the earlier revision. The newest publishable revision is the last revision whose verification status is `verified`.

An assertion stores the airline-published fact. It must not contain advice, inferred savings, or marketing language. Interpretation belongs in a separate future editorial layer.

## Source hierarchy

Sources use the lowest applicable numeric rank:

1. Airline fee or policy page
2. Airline conditions or tariff
3. Airline booking flow or baggage calculator
4. Airline help center
5. Other official airline publication

Third-party sources may detect a possible change, but they cannot support a verified production claim. This pilot accepts only official Air France HTTPS URLs.

## Verification lifecycle

Allowed states are:

- `verified`: a human checked the assertion against cited official evidence
- `needs_recheck`: the record is due for review but no specific change is known
- `source_changed`: the cited source moved or materially changed
- `potential_change_detected`: automation or a reviewer found a possible policy change
- `unable_to_verify`: available official evidence is insufficient

Only `verified` revisions are eligible to power definitive public claims or calculator rules. Automated comparison may create a proposed revision, but it must not mark that revision `verified` or publish it. A verified revision requires `reviewed_by.type` to be `human` and a `verified_at` date.

## Change workflow

1. Monitor the official source and retain a snapshot hash or other comparison signal.
2. Detect a possible change and add a proposed revision with `potential_change_detected`.
3. Inspect the official source and record the applicable route, market, fare, cabin, passenger, timing, and currency scope.
4. Have a human reviewer verify or reject the proposal.
5. Mark the accepted revision `verified`, retaining the prior revision.
6. Update production data, public copy, and calculator rules through an explicit implementation change.

`detected_at`, `checked_at`, `verified_at`, and the policy's `effective_from` are different facts. An effective date must remain `null` with `effective_date_status: "not_published"` when the airline does not publish one.

## Pilot files

- `data/provenance/air-france.json`: non-production Air France fixture
- `data/schemas/provenance.schema.json`: formal structure and allowed values
- `scripts/validate-provenance.mjs`: deterministic pilot validation

Run:

```sh
pnpm run validate:provenance
pnpm run test:provenance
pnpm run test:provenance-summary
```

The validator checks identifiers, revision ordering, official-source ownership, source hierarchy, evidence references, date formats, verification requirements, and duplicate records.
The test simulates an automation-detected policy change in memory. It confirms that the previous verified revision is retained, the proposal is not publishable, automated approval fails, and broken revision lineage is rejected. The synthetic value is never written to the fixture.

## Read-only summary adapter

`lib/provenance-summary.mjs` validates a dataset before producing any output. Its publishable claim list contains only verified revisions. Review items expose identifiers and workflow status, but never the unverified assertion value.

Page-level status is deterministic:

- `verified`: every latest revision is verified
- `review_pending`: at least one proposed change is waiting for review
- `needs_recheck`: at least one claim is marked `needs_recheck` or `source_changed`
- `unable_to_verify`: at least one claim cannot currently be verified

A pending proposal or changed source leaves the preceding verified revision available and marks it as having a newer review item. This supports a future public caution without replacing a known verified fact with an unreviewed assertion.

Source labels are also deterministic. Hierarchy ranks 1–3 are `primary_policy_source`; other Air France-published sources are `supporting_official_source`.

## Source monitoring and review queue

`scripts/monitor-provenance-sources.mjs` fetches official sources and fingerprints normalized readable text. Scripts, styles, SVG, comments, tags, and whitespace do not affect the fingerprint. The monitor never edits policy claims.

Commands:

```sh
pnpm run test:provenance-monitor
pnpm run monitor:provenance
pnpm run monitor:provenance:write
node scripts/monitor-provenance-sources.mjs --initialize
node scripts/monitor-provenance-sources.mjs --initialize-regions
```

The default command is a dry run. `--initialize` creates missing baselines without creating review items. `--write` appends source checks and creates an open review item when a fingerprint differs from the latest stored check.

Snapshot checks live under `data/provenance/source-snapshots/`. Review items live in `data/provenance/review-queue.json`. Both use deterministic identifiers so retrying the same observation does not create duplicates.

A review item records hashes, check identifiers, affected claim identifiers, and the required reviewer action. It deliberately does not copy observed wording into a policy assertion. A human must inspect the source and append a verified claim revision separately.

Each source also defines one or more policy regions using reviewed start and end markers. Checks retain both a whole-page fingerprint and independent fingerprints for each policy region. After adding or changing region definitions, `--initialize-regions` appends region-aware baselines without rewriting the earlier whole-page baseline.

Change classifications are:

- `page_changed_only`: the whole page changed but monitored policy regions did not; queued for low-priority inspection without changing the public badge
- `policy_region_changed`: a monitored policy region changed; public verification becomes `Needs recheck`
- `source_structure_changed`: a required policy-region marker disappeared; public verification becomes `Needs recheck`

Open source-monitor review items are read by the provenance summary adapter. They change the Air France verification panel to `Needs recheck` while leaving the previous verified facts visible. Resolved and dismissed items do not affect the public status.

Human review commands:

```sh
pnpm run review:provenance -- list
pnpm run review:provenance -- show <review-id>
pnpm run review:provenance -- resolve <review-id> --reviewer <id> --resolution nonmaterial_change --note "Navigation changed; policy did not."
```

Resolution outcomes are `policy_updated`, `nonmaterial_change`, `source_restored`, and `unable_to_verify`. A `policy_updated` resolution requires `--claim-revision <revision-id>`. Resolution appends human review metadata to the existing queue item; items are never deleted.

## Deliberate limitations

- The pilot does not replace the current airline JSON.
- The site does not render claim history yet.
- No monitor, source snapshot store, or review queue is implemented yet.
- Exact route-priced Air France fees are not represented as fixed amounts.
- The pilot does not define a universal route/fare pricing matrix.
- No AI or automated process can approve a revision.

## Success criteria before integration

The model should survive at least one real policy revision without losing the prior value, express route-dependent pricing without inventing a number, generate a complete source list, and provide deterministic inputs for a public verification summary. Only then should a production adapter be designed.
