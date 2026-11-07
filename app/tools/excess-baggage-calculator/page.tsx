import type { Metadata } from "next";
import { ExcessBaggageCalculatorClient } from "@/components/ExcessBaggageCalculatorClient";
import { JsonLd } from "@/components/JsonLd";
import { EXCESS_BAG_FAQS } from "@/lib/excess-bag-calculator-content";
import { getAllAirlines } from "@/lib/data";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Excess Baggage Calculator | Overweight & Oversize Fees",
  description:
    "Use the excess baggage calculator to check overweight and oversize bag charges by airline, or identify when the exact route requires an airline quote.",
  alternates: {
    canonical: canonical("/tools/excess-baggage-calculator"),
  },
};

function excessBaggageCalculatorJsonLd() {
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
            name: "Excess baggage cost calculator",
            item: canonical("/tools/excess-baggage-calculator"),
          },
        ],
      },
      {
        "@type": "WebApplication",
        "@id": canonical("/tools/excess-baggage-calculator"),
        name: "Excess baggage calculator",
        url: canonical("/tools/excess-baggage-calculator"),
        applicationCategory: "TravelApplication",
        operatingSystem: "Any",
        description:
          "Calculate supported excess baggage charges for overweight or oversized bags and identify when a route-specific airline quote is required.",
      },
      {
        "@type": "FAQPage",
        mainEntity: EXCESS_BAG_FAQS.map((faq) => ({
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

export default function ExcessBaggageCalculatorPage() {
  const airlines = getAllAirlines().map(({ slug, name, fees }) => ({
    slug,
    name,
    fees: fees.filter(
      (fee) => fee.category === "overweight_baggage" || fee.category === "oversize_baggage"
    ),
  }));

  return (
    <>
      <JsonLd data={excessBaggageCalculatorJsonLd()} />
      <ExcessBaggageCalculatorClient airlines={airlines} />
    </>
  );
}
