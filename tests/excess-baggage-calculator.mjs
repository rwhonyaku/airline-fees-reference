import assert from "node:assert/strict";
import fs from "node:fs";
import { calcExcessBaggageTripCost, findExcessBaggageFee } from "../lib/bag-cost-calculator.ts";

const american = JSON.parse(fs.readFileSync("data/airlines/american.json", "utf8"));

assert.equal(
  findExcessBaggageFee({
    fees: american.fees,
    category: "overweight_baggage",
    measurement: 51,
  })?.fee,
  30,
  "51 lb must match American's 51–53 lb band.",
);

assert.equal(
  findExcessBaggageFee({
    fees: american.fees,
    category: "overweight_baggage",
    measurement: 70,
  })?.fee,
  100,
  "70 lb must match American's 54–70 lb band instead of the first numeric row.",
);

assert.equal(
  findExcessBaggageFee({
    fees: american.fees,
    category: "overweight_baggage",
    measurement: 71,
  })?.fee,
  200,
  "71 lb must match American's 71–100 lb band.",
);

const heavyAndOversize = calcExcessBaggageTripCost({
  fees: american.fees,
  bagCount: 1,
  directions: 2,
  weightLbs: 70,
  linearInches: 70,
});

assert.equal(
  heavyAndOversize.canEstimate,
  false,
  "Separate weight and size fees must not be added without an explicit combined or stacking rule.",
);
assert.equal(heavyAndOversize.totalUsd, null);

console.log("OK   excess-baggage bands and unverified stacking behavior are deterministic");
