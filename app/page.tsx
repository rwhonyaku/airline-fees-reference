// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Airline Fees Reference</h1>
      <p>Reference tables of published airline fees, organized by airline and fee category.</p>

      <ul>
        <li><Link href="/airlines">Airlines</Link></li>
        <li><Link href="/fees">Fee categories</Link></li>
        <li><Link href="/compare">Comparison tables</Link></li>
      </ul>
    </main>
  );
}
