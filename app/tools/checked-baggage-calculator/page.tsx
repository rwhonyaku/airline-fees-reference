import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import { JsonLd } from "@/components/JsonLd";
import { CheckedBaggageCalculatorClient } from "@/components/CheckedBaggageCalculatorClient";
import { CHECKED_BAG_FAQS } from "@/lib/checked-bag-calculator-content";
import { getAllAirlines } from "@/lib/data";
import type { AirlineOverrides, CardsJson } from "@/lib/bag-cost-calculator";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Baggage Calculator | Checked Bag Fee Calculator by Airline",
  description:
    "Use the checked bag fee calculator to estimate baggage costs by airline, travelers, bags, and roundtrip, then test whether a free checked bag card benefit could offset the cost.",
};

async function readJsonFile<T>(relPathFromRepoRoot: string): Promise<T> {
  const full = path.join(process.cwd(), relPathFromRepoRoot);
  const raw = await fs.readFile(full, "utf8");
  return JSON.parse(raw) as T;
}

function checkedBagCalculatorJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
          {
            "@type": "ListItem",
            position: 2,
            name: "Checked baggage cost calculator",
            item: canonical("/tools/checked-baggage-calculator"),
          },
        ],
      },
      {
        "@type": "WebApplication",
        "@id": canonical("/tools/checked-baggage-calculator"),
        name: "Checked baggage cost calculator",
        url: canonical("/tools/checked-baggage-calculator"),
        applicationCategory: "TravelApplication",
        operatingSystem: "Any",
        description:
          "Calculate checked baggage fees from published airline fee details and test whether a free checked bag card benefit could offset the cost.",
      },
      {
        "@type": "FAQPage",
        mainEntity: CHECKED_BAG_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

export default async function CheckedBaggageCalculatorPage() {
  const airlines = getAllAirlines().map(({ slug, name, fees }) => ({
    slug,
    name,
    fees: fees.filter((fee) => fee.category === "checked_baggage"),
  }));
  const cardsJson = await readJsonFile<CardsJson>("data/cards/cards.json");
  const overrides = await readJsonFile<AirlineOverrides>("data/cards/airline_overrides.json");

  return (
    <>
      <JsonLd data={checkedBagCalculatorJsonLd()} />
      <CheckedBaggageCalculatorClient
        airlines={airlines}
        cards={cardsJson.cards}
        overrides={overrides}
      />
    </>
  );
}
