import { getLatestVerifiedAcrossAirlines } from "@/lib/freshness";

export default function Methodology() {
  const latestVerified = getLatestVerifiedAcrossAirlines();

  return (
    <main className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-black mb-4 tracking-tight text-slate-900">
        Data Collection & Methodology
      </h1>
      <p className="text-slate-600 text-xl mb-12 border-l-4 border-blue-500 pl-4 leading-relaxed">
        "Our goal is to transform fragmented airline documentation into a standardized, accessible database for travelers."
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
            Every airline uses different terminology for "Personal Items" or "Cabin Bags." We map these into a consistent schema, allowing for direct comparison across different airline types.
          </p>
        </div>

        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-blue-600 font-bold text-sm uppercase mb-2 tracking-widest">Step 3</div>
          <h3 className="font-bold text-lg mb-3 text-slate-900">Verification & Dating</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Each airline entry is stamped with a "Last Verified" date. This represents the last time our database was synced with the airline's publicly available fee documentation.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Integrity of Information</h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-6">
          If an airline does not clearly publish a fee or dimension, our policy is to mark the field as <span className="text-blue-400 italic">"Not Published"</span> rather than providing estimated or crowdsourced data.
        </p>
        <div className="inline-block px-6 py-2 bg-slate-800 rounded-full text-blue-400 font-mono text-sm border border-slate-700">
          Last verified: {latestVerified}
        </div>
      </div>
    </main>
  );
}
