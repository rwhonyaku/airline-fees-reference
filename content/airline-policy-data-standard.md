# Airline Policy Data Standard

Use this standard for the next phase of Airline-Fees.com: building a source-linked airline policy system that can power definitive airline pages, calculators, comparisons, and future policy-change history.

The goal is not to make every airline file huge. The goal is to make each priority airline record complete enough that the site can answer real traveler questions with traceable rules.

## Gold-Standard Airline Record

A gold-standard airline record should capture these areas when they apply to the airline:

- checked-baggage prices and included checked-bag allowances
- carry-on and personal-item rules
- weight and size limits for cabin and checked bags
- overweight, oversize, and extra-piece charges
- fare-family differences, including Basic, Light, Saver, Economy, Flex, and bundled fares
- domestic, international, and route-market differences
- advance-purchase, online, airport, and gate purchase differences
- seat-selection fees and included-seat rules
- change, cancellation, same-day change, standby, refund, and travel-credit rules
- award-ticket fees or award-specific restrictions
- pet fees, sports equipment, musical instruments, and special baggage
- infant, child, unaccompanied-minor, military, elite-status, and credit-card exemptions
- partner-operated, codeshare, and interline caveats
- effective dates and policy-change history when known

Do not invent unavailable rows just to fill the checklist. If the airline does not publish a specific amount, store the confirmed explanation: route-priced, shown during booking, airport-priced, fare-condition dependent, weight-concept based, piece-concept based, or not published.

## Required Row Evidence

Every material row should include:

- `source_url`: primary airline source whenever possible
- `last_verified`: the date the row was checked against the source
- `conditions`: a short factual description of the rule
- `applies_to`: fare, cabin, passenger type, bag number, or product scope
- `region_or_route`: route or market scope
- `timing`: when the fee applies or when it can be purchased
- `effective_date`: when the airline publishes a start date
- `confidence`: `confirmed`, `ambiguous`, or `not_published` when the row needs uncertainty tracking

## Calculator Readiness

An airline is calculator-ready when the dataset can answer at least these questions for its main searched markets:

- Is the traveler allowed a carry-on and personal item?
- Is the checked bag included or paid?
- What does the first, second, and extra checked bag cost?
- Does the answer change by fare family?
- Does the answer change by route or domestic/international market?
- Does the answer change if the bag is bought online vs at the airport?
- What are the standard checked-bag weight and size limits?
- What happens at common overweight or oversize thresholds?
- Which card, status, military, or passenger exemptions can waive the charge?

If any of those questions cannot be answered from published sources, the calculator should say why instead of guessing.

## Page Readiness

A definitive airline page should be able to convert the data into:

- answer-first summary
- carry-on and personal-item explanation
- checked-baggage explanation
- excess, overweight, and oversize explanation
- fare-family explanation
- seat-selection fees
- change and cancellation rules
- exceptions and important notes
- practical traveler scenarios
- related calculators and guides
- visible verification language
- comparable airlines

## Policy-Change History

Start capturing policy changes now even if the public UI remains simple.

Each change record should store:

- category
- previous value
- new value
- effective date when known
- source URL
- verification date
- short summary

Historical data compounds. A competitor can copy today's published fee, but it cannot instantly reproduce a clean multi-year change history.

## Priority Workflow

Use this order:

1. Upgrade the highest-opportunity airlines with GSC impressions and commercial/search value.
2. Bring each upgraded airline to source-linked calculator readiness.
3. Add missing policy categories only when the source supports them.
4. Store ambiguity explicitly instead of smoothing it into vague copy.
5. Promote the best-covered airlines into public page enhancements and tools.

For now, prioritize depth on the existing Tier 1 and Tier 2 airlines before broad long-tail expansion.
