import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Methodology",
  alternates: { canonical: canonical("/methodology") },
};

export default function MethodologyPage() {
  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, marginTop: 0 }}>Methodology</h1>

      <p>
        This site displays airline fee information that is verifiable from airline-published sources.
        If a fee cannot be verified, it is omitted.
      </p>

      <h2 style={{ fontSize: 16 }}>What each row contains</h2>
      <ul>
        <li>Amount (or “Not permitted” / “Varies” where explicitly stated)</li>
        <li>Currency</li>
        <li>Conditions (the specific rule the fee depends on)</li>
        <li>Applies to (fare type, cabin, or traveler category when published)</li>
        <li>Region / route (scope where published)</li>
        <li>Source URL (airline page)</li>
        <li>Last verified date (when the source was last checked)</li>
      </ul>

      <h2 style={{ fontSize: 16 }}>What “Last verified” means</h2>
      <p>
        “Last verified” is the date the linked source was checked and the row was confirmed to match
        the published information at that time.
      </p>

      <h2 style={{ fontSize: 16 }}>What this site does not do</h2>
      <ul>
        <li>No advice, recommendations, or optimization guidance</li>
        <li>No ranking of airlines</li>
        <li>No inferred or guessed fees</li>
      </ul>
    </div>
  );
}
