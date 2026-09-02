import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";

export default function Methodology() {
  const latestVerified = getLatestVerifiedAcrossAirlines();

  return (
    <main className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-black mb-4 tracking-tight text-slate-900">
        Data Collection & Methodology
      </h1>
      <p className="text-slate-600 text-xl mb-12 border-l-4 border-blue-500 pl-4 leading-relaxed">
        We turn fragmented official airline policies into traceable facts, practical comparisons, and deterministic traveler tools.
      </p>
      <div className="mb-10 text-sm text-slate-500">Last verified: {latestVerified}</div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-blue-600 font-bold text-sm uppercase mb-2 tracking-widest">Step 1</div>
          <h3 className="font-bold text-lg mb-3 text-slate-900">Primary Source Collection</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We pull data directly from official airline help centers, baggage policy pages, and published fee schedules. We avoid third-party travel blogs to ensure the data is straight from the carrier.
          </p>
        </div>

        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-blue-600 font-bold text-sm uppercase mb-2 tracking-widest">Step 2</div>
          <h3 className="font-bold text-lg mb-3 text-slate-900">Data Normalization</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every airline uses different terminology for personal items and cabin bags. We map those terms into consistent fields while preserving route, fare, cabin, currency, and timing qualifications.
          </p>
        </div>

        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-blue-600 font-bold text-sm uppercase mb-2 tracking-widest">Step 3</div>
          <h3 className="font-bold text-lg mb-3 text-slate-900">Verification & Dating</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Each policy record carries a last-checked date. Records older than the review threshold are marked Review due or Needs recheck; a date is not a promise that the policy is still current.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Integrity of Information</h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-6">
          If an airline does not clearly publish a fee or dimension, our policy is to mark it as <span className="text-blue-400 italic">Not published</span> rather than estimate or copy an unsupported value.
        </p>
        <div className="inline-block px-6 py-2 bg-slate-800 rounded-full text-blue-400 font-mono text-sm border border-slate-700">
          Last verified: {latestVerified}
        </div>
      </div>
    </main>
  );
}
