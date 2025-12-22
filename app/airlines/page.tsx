// app/airlines/page.tsx

import Link from "next/link";
import { getAirlinesIndex } from "@/lib/data";
import { canonical } from "@/lib/seo";

export const metadata = {
  title: "Airlines",
  alternates: {
    canonical: canonical("/airlines"),
  },
};

export default function AirlinesIndexPage() {
  const airlines = getAirlinesIndex();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Airlines</h1>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {airlines.map((a) => (
          <li key={a.slug} style={{ margin: "6px 0" }}>
            <Link href={`/airlines/${a.slug}`}>{a.name}</Link>
            {a.iata ? <span style={{ opacity: 0.8 }}> ({a.iata})</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
