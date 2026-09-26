import type { Metadata } from "next";
import { SizerRulesClient } from "@/components/SizerRulesClient";
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

  return <SizerRulesClient airlines={airlines} />;
}
