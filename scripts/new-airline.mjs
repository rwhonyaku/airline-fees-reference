// scripts/new-airline.mjs
import fs from "node:fs";
import path from "node:path";

const AIRLINES_DIR = path.join(process.cwd(), "data", "airlines");

function usage() {
  console.log(`Usage:
node scripts/new-airline.mjs --slug delta --name "Delta Air Lines" --iata DL --country US --region "North America"

Creates: data/airlines/<slug>.json (if it doesn't exist)
`);
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function main() {
  const slug = getArg("--slug");
  const name = getArg("--name");
  const iata = getArg("--iata");
  const country = getArg("--country");
  const region = getArg("--region");

  if (!slug || !name) {
    usage();
    process.exit(1);
  }

  if (!fs.existsSync(AIRLINES_DIR)) fs.mkdirSync(AIRLINES_DIR, { recursive: true });

  const filePath = path.join(AIRLINES_DIR, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`);
    process.exit(2);
  }

  const obj = {
    slug,
    name,
    ...(iata ? { iata } : {}),
    ...(country ? { country } : {}),
    ...(region ? { region } : {}),
    fees: [
      {
        category: "checked_baggage",
        amount: 0,
        currency: "USD",
        conditions: "REPLACE: short label-like conditions only",
        applies_to: "Economy (non-Basic)",
        region_or_route: "US domestic",
        timing: "standard",
        source_url: "REPLACE: https://...",
        last_verified: "REPLACE: YYYY-MM-DD"
      },
      {
        category: "change_cancellation",
        amount: 0,
        currency: "USD",
        conditions: "REPLACE: short label-like conditions only",
        applies_to: "Economy (non-Basic)",
        region_or_route: "US domestic",
        timing: "standard",
        source_url: "REPLACE: https://...",
        last_verified: "REPLACE: YYYY-MM-DD"
      }
    ]
  };

  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
  console.log(`Created ${filePath}`);
  console.log(`Next: open the file and replace amount/source_url/last_verified/conditions with verified data.`);
}

main();
