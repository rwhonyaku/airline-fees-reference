import type { Metadata } from "next";
import { SizerRulesClient } from "@/components/SizerRulesClient";
import { JsonLd } from "@/components/JsonLd";
import { getAllAirlines } from "@/lib/data";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Carry-on Sizer Rules by Airline",
  description:
    "Compare your bag dimensions with published airline carry-on and personal-item size rules, then see which bags fit, fail, or sit close to the limit.",
  alternates: {
    canonical: canonical("/sizer-rules"),
  },
};

export default async function SizerRulesPage() {
  const airlines = getAllAirlines().map(({ slug, name, fees }) => ({
    slug,
    name,
    fees: fees.filter((fee) => fee.category === "carry_on"),
  }));

  const dates = airlines.flatMap((airline) => airline.fees.map((fee) => fee.last_verified)).filter(Boolean).sort();
  const latestSourceCheck = dates.at(-1);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: canonical("/") },
                { "@type": "ListItem", position: 2, name: "Carry-on sizer rules", item: canonical("/sizer-rules") },
              ],
            },
            {
              "@type": "SoftwareApplication",
              name: "Carry-on sizer rules by airline",
              applicationCategory: "TravelApplication",
              operatingSystem: "Web",
              url: canonical("/sizer-rules"),
              description: metadata.description,
              dateModified: latestSourceCheck,
              offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
            },
          ],
        }}
      />
      <SizerRulesClient airlines={airlines} />
    </>
  );
}
