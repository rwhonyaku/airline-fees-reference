// scripts/validate-data.mjs
import fs from "node:fs";
import path from "node:path";

const AIRLINES_DIR = path.join(process.cwd(), "data", "airlines");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const REQUIRED_FEE_FIELDS = ["category", "amount", "currency", "conditions", "source_url", "last_verified"];

function readJsonSafe(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return { ok: false, error: "empty_file" };
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: `json_parse_failed: ${e.message}` };
  }
}

function isHttpUrl(s) {
  return typeof s === "string" && /^https?:\/\/.+/i.test(s.trim());
}

function validateAirline(airline, fileName) {
  const errs = [];

  if (!airline || typeof airline !== "object") {
    errs.push("root_not_object");
    return errs;
  }

  if (!airline.slug || typeof airline.slug !== "string") errs.push("missing_slug");
  if (!airline.name || typeof airline.name !== "string") errs.push("missing_name");
  if (!Array.isArray(airline.fees)) errs.push("fees_not_array");

  if (Array.isArray(airline.fees)) {
    airline.fees.forEach((fee, idx) => {
      if (!fee || typeof fee !== "object") {
        errs.push(`fees[${idx}]: not_object`);
        return;
      }
      for (const k of REQUIRED_FEE_FIELDS) {
        if (fee[k] === undefined || fee[k] === null || (typeof fee[k] === "string" && !fee[k].trim())) {
          errs.push(`fees[${idx}]: missing_${k}`);
        }
      }
      if (fee.last_verified && !DATE_RE.test(fee.last_verified)) {
        errs.push(`fees[${idx}]: invalid_last_verified_format`);
      }
      if (fee.source_url && !isHttpUrl(fee.source_url)) {
        errs.push(`fees[${idx}]: invalid_source_url`);
      }
      if (fee.conditions && typeof fee.conditions === "string" && fee.conditions.length > 140) {
        errs.push(`fees[${idx}]: conditions_too_long(>${140})`);
      }
    });
  }

  // sanity: filename should match slug (optional but helpful)
  if (airline.slug && fileName) {
    const expected = `${airline.slug}.json`;
    if (fileName !== expected) errs.push(`filename_mismatch(expected_${expected})`);
  }

  return errs;
}

function main() {
  if (!fs.existsSync(AIRLINES_DIR)) {
    console.error(`Missing folder: ${AIRLINES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(AIRLINES_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  if (files.length === 0) {
    console.log("No airline JSON files found (excluding _TEMPLATE.json).");
    return;
  }

  let badCount = 0;

  for (const f of files.sort()) {
    const fp = path.join(AIRLINES_DIR, f);
    const parsed = readJsonSafe(fp);

    if (!parsed.ok) {
      badCount += 1;
      console.log(`BAD  ${f} -> ${parsed.error}`);
      continue;
    }

    const errs = validateAirline(parsed.data, f);
    if (errs.length === 0) {
      console.log(`OK   ${f}`);
    } else {
      badCount += 1;
      console.log(`BAD  ${f}`);
      errs.forEach((e) => console.log(`     - ${e}`));
    }
  }

  if (badCount > 0) process.exit(2);
}

main();
