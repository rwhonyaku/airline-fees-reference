import assert from "node:assert/strict";
import { calcCardBagOffset } from "../lib/bag-cost-calculator.ts";

const card = {
  id: "test-card",
  name: "Test card",
  airline_slug: "test-airline",
  annual_fee_usd: 95,
  free_checked_bags: 1,
  applies_to_travelers: 2,
  requires_purchase_with_card: true,
};

const base = {
  feeByBagOrdinal: new Map([[1, 40]]),
  directions: 2,
  roundtripsPerYear: 2,
  travelers: 2,
  bagsPerTravelerPerDirection: 1,
  card,
  userWillPayWithCard: true,
};

const unconfirmed = calcCardBagOffset({ ...base, userConfirmsEligibility: false });
assert.equal(unconfirmed.eligible, false);
assert.equal(unconfirmed.savingsPerTripUsd, 0);
assert.equal(unconfirmed.annualSavingsUsd, 0);

const confirmed = calcCardBagOffset({ ...base, userConfirmsEligibility: true });
assert.equal(confirmed.eligible, true);
assert.equal(confirmed.savingsPerTripUsd, 160);
assert.equal(confirmed.annualSavingsUsd, 320);
assert.equal(confirmed.netAnnualUsd, 225);

console.log("OK   card savings remain blocked until benefit conditions are confirmed");
