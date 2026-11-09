import assert from "node:assert/strict";
import { findZipairRoutePrice, getZipairBaggageQuote } from "../lib/zipair-baggage-pricing.ts";

assert.deepEqual(findZipairRoutePrice("Los Angeles (LAX) to Tokyo (NRT)"), {
  origin: "LAX",
  destination: "NRT",
  label: "Los Angeles (LAX) to Tokyo (NRT)",
  amount: 85,
  currency: "USD",
});

const roundtrip = getZipairBaggageQuote("Los Angeles (LAX) to Tokyo (NRT)", 2);
assert.equal(roundtrip.length, 2);
assert.equal(roundtrip[0].amount, 85);
assert.equal(roundtrip[1].amount, 11000);
assert.equal(roundtrip[1].currency, "JPY");

assert.equal(findZipairRoutePrice("unknown route"), null);
console.log("OK   ZIPAIR route and direction prices remain deterministic");
