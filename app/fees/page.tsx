// app/fees/page.tsx

import Link from "next/link";
import { FEE_CATEGORIES } from "@/content/fee-categories";

export const metadata = {
  title: "Fee categories | Airline Fees Reference",
};

export default function FeeCategoriesIndexPage() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Fee categories</h1>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {FEE_CATEGORIES.map((c) => (
          <li key={c.key} style={{ margin: "6px 0" }}>
            <Link href={`/fees/${c.key}`}>{c.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
