// app/updates/page.tsx
import { UPDATES } from "@/content/updates";
import { Metadata } from "next";
import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";

export const metadata: Metadata = {
  title: "Data Update Log | Airline Fees Reference",
  description: "A transparent record of all data additions, fee updates, and policy removals across our database.",
};

export default function UpdatesPage() {
  const latestVerified = getLatestVerifiedAcrossAirlines();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Update Log</h1>
        <p className="text-slate-600 text-lg font-medium">
          A transparent record of database additions and fee verification.
        </p>
        <div className="mt-3 text-sm text-slate-500">Last verified: {latestVerified}</div>
      </div>

      {UPDATES.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <p>No updates recorded yet. Initial database audit in progress.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-bold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Scope</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {UPDATES.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-400 whitespace-nowrap">{u.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-tighter ${
                      u.type === 'added' ? 'bg-green-100 text-green-700' : 
                      u.type === 'updated' ? 'bg-blue-100 text-blue-700' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{u.scope}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">{u.target}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">
                    {u.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-slate-400">
        Notice a discrepancy? Please reach out via our <a href="/contact" className="text-blue-600 underline hover:text-blue-800">Contact Page</a>.
      </p>
    </main>
  );
}
