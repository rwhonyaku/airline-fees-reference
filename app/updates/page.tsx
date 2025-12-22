// app/updates/page.tsx

import { UPDATES } from "@/content/updates";

export const metadata = {
  title: "Update log | Airline Fees Reference",
};

export default function UpdatesPage() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Update log</h1>
      <div style={{ fontSize: 13, opacity: 0.9 }}>A record of data additions, updates, and removals.</div>

      {UPDATES.length === 0 ? (
        <div style={{ opacity: 0.8 }}>No updates recorded yet.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Type</th>
              <th style={th}>Scope</th>
              <th style={th}>Target</th>
              <th style={th}>Note</th>
            </tr>
          </thead>
          <tbody>
            {UPDATES.map((u, idx) => (
              <tr key={idx}>
                <td style={td}>{u.date}</td>
                <td style={td}>{u.type}</td>
                <td style={td}>{u.scope}</td>
                <td style={td}>{u.target}</td>
                <td style={td}>{u.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid rgba(0,0,0,0.15)",
  padding: "10px 8px",
  whiteSpace: "nowrap",
  fontSize: 13,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  padding: "10px 8px",
  verticalAlign: "top",
  fontSize: 13,
};
