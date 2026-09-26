import type { Metadata } from "next";
import { ExcessBaggageCalculatorClient } from "@/components/ExcessBaggageCalculatorClient";
import { JsonLd } from "@/components/JsonLd";
import { EXCESS_BAG_FAQS } from "@/lib/excess-bag-calculator-content";
import { getAllAirlines } from "@/lib/data";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Overweight & Oversize Baggage Fee Calculator",
  description:
    "Check whether a bag is overweight, oversized, or both; estimate supported airline fees and identify when an itinerary-specific quote is required.",
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
          "Check overweight and oversize baggage charges and identify when route-specific airline lookup is required.",
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
  const airlines = getAllAirlines();

  return (
    <>
      <JsonLd data={excessBaggageCalculatorJsonLd()} />
      <ExcessBaggageCalculatorClient airlines={airlines} />
    </>
  );
}
