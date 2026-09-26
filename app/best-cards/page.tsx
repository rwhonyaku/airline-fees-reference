import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import { BestCardsClient } from "@/components/BestCardsClient";
import type { AirlineOverrides, CardsJson } from "@/lib/bag-cost-calculator";
import { getAllAirlines } from "@/lib/data";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free Checked Bag Card Calculator | Airline Fees Reference",
  description:
    "Calculate whether an airline credit card's free checked bag benefit offsets its annual fee using published bag fees, traveler coverage, and card-payment rules.",
  alternates: {
    canonical: canonical("/best-cards"),
  },
};

async function readJsonFile<T>(relPathFromRepoRoot: string): Promise<T> {
  const full = path.join(process.cwd(), relPathFromRepoRoot);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
}

export default async function BestCardsPage() {
  const cardsJson = await readJsonFile<CardsJson>("data/cards/cards.json");
  const overrides = await readJsonFile<AirlineOverrides>("data/cards/airline_overrides.json");
  const airlines = getAllAirlines().map(({ slug, name, fees }) => ({
    slug,
    name,
    fees: fees.filter((fee) => fee.category === "checked_baggage"),
  }));

  return (
    <BestCardsClient
      airlines={airlines}
      cards={cardsJson.cards}
      overrides={overrides}
    />
  );
}
