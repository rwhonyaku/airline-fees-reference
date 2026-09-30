import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getTripCostPilotProfiles } from "../lib/trip-cost-pilot.ts";

const airlineDirectory = path.join(process.cwd(), "data", "airlines");
const airlines = fs.readdirSync(airlineDirectory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(airlineDirectory, file), "utf8")));

const profileEntries = airlines.flatMap((airline) =>
  getTripCostPilotProfiles(airline).map((profile) => ({ airline, profile })),
);
const supportedSlugs = [...new Set(profileEntries.map(({ airline }) => airline.slug))].sort();

assert.deepEqual(supportedSlugs, [
  "air-canada",
  "alaska",
  "american",
  "delta",
  "easyjet",
  "frontier",
  "jal",
  "jetblue",
  "lufthansa",
  "ryanair",
  "southwest",
  "united",
  "zipair",
], "Structured pricing coverage must expand intentionally.");

const profileIds = profileEntries.map(({ profile }) => profile.id);
assert.equal(new Set(profileIds).size, profileIds.length, "Trip-cost profile IDs must be unique.");

for (const { airline, profile } of profileEntries) {
  assert.ok(profile.label.trim(), `${profile.id} must have a traveler-facing label.`);
  assert.ok(profile.summary.trim(), `${profile.id} must explain its applicability.`);
  assert.match(profile.currency, /^[A-Z]{3}$/, `${profile.id} must use an ISO-style currency code.`);
  assert.ok(profile.checkedBaggage.includedPerTraveler >= 0, `${profile.id} has an invalid included-bag count.`);
  assert.ok(profile.sources.length > 0, `${profile.id} must cite at least one official source.`);
  assert.notEqual(airline.data_quality?.status, "ceased_operations", `${profile.id} cannot model a ceased airline.`);

  for (const amount of [
    ...(profile.checkedBaggage.feeByOrdinal ?? []),
    ...(profile.checkedBaggage.airportFeeByOrdinal ?? []),
    profile.checkedBaggage.thirdPlusFee,
    profile.carryOnFeeEachWay,
    profile.seatFeeEachWay,
  ].filter((value) => value != null)) {
    assert.equal(typeof amount, "number", `${profile.id} has a non-numeric deterministic amount.`);
    assert.ok(Number.isFinite(amount) && amount >= 0, `${profile.id} has an invalid deterministic amount.`);
  }

  for (const source of profile.sources) {
    assert.match(source.url, /^https:\/\//, `${profile.id} must use an absolute HTTPS source URL.`);
    assert.match(source.lastVerified, /^\d{4}-\d{2}-\d{2}$/, `${profile.id} has an invalid verification date.`);
  }
}

const airCanadaProfiles = profileEntries
  .filter(({ airline }) => airline.slug === "air-canada")
  .map(({ profile }) => profile);
assert.equal(airCanadaProfiles.length, 2, "Air Canada should expose exactly the controlled short-haul profiles.");

const airCanadaStandard = airCanadaProfiles.find((profile) => profile.id === "air-canada-short-haul-standard-current");
const airCanadaBasic = airCanadaProfiles.find((profile) => profile.id === "air-canada-short-haul-basic-personal-item");
assert.ok(airCanadaStandard && airCanadaBasic, "Both Air Canada fare profiles must be present.");
assert.deepEqual(airCanadaStandard.checkedBaggage.feeByOrdinal, [45, 60]);
assert.equal(airCanadaStandard.carryOnIncluded, true);
assert.equal(airCanadaStandard.standardSeatIncluded, true);
assert.deepEqual(airCanadaStandard.marketContexts, ["us-short-haul"]);
assert.deepEqual(airCanadaBasic.checkedBaggage.feeByOrdinal, [45, 60]);
assert.equal(airCanadaBasic.carryOnIncluded, false);
assert.equal(airCanadaBasic.standardSeatIncluded, false);
assert.match(airCanadaBasic.carryOnWarning, /checkout|booking/i);

console.log(`OK   ${profileEntries.length} structured trip-cost profiles are valid`);
console.log("OK   profile IDs, official sources, currencies, and amounts pass invariants");
console.log("OK   Air Canada Standard and affected Basic boundaries are preserved");
