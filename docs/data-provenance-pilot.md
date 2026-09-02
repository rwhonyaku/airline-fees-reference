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
```

The validator checks identifiers, revision ordering, official-source ownership, source hierarchy, evidence references, date formats, verification requirements, and duplicate records.
The test simulates an automation-detected policy change in memory. It confirms that the previous verified revision is retained, the proposal is not publishable, automated approval fails, and broken revision lineage is rejected. The synthetic value is never written to the fixture.

## Deliberate limitations

- The pilot does not replace the current airline JSON.
- The site does not render claim history yet.
- No monitor, source snapshot store, or review queue is implemented yet.
- Exact route-priced Air France fees are not represented as fixed amounts.
- The pilot does not define a universal route/fare pricing matrix.
- No AI or automated process can approve a revision.

## Success criteria before integration

The model should survive at least one real policy revision without losing the prior value, express route-dependent pricing without inventing a number, generate a complete source list, and provide deterministic inputs for a public verification summary. Only then should a production adapter be designed.
