// app/data-entry/page.tsx

export const metadata = {
  title: "Data entry rules | Airline Fees Reference",
};

export default function DataEntryRulesPage() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Data entry rules</h1>

      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
        <li>Each fee row must be verifiable via an official airline source URL.</li>
        <li>Each fee row must include a last verified date (YYYY-MM-DD).</li>
        <li>Conditions must be label-like and minimal (no advice, no tactics, no “avoid fees”).</li>
        <li>If a fee cannot be verified, it is omitted.</li>
        <li>No comparisons framed as judgment. Alphabetical ordering only.</li>
      </ul>
    </div>
  );
}
