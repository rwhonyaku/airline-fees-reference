import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 20, marginTop: 0 }}>About</h1>

      <p>
        Airline Fees Reference is a factual reference site that documents published airline fee data.
        It is not affiliated with any airline.
      </p>

      <p>
        The site organizes fee information by airline and fee category, with each row linked to a
        source and a last-verified date.
      </p>
    </div>
  );
}
