// app/airlines/page.tsx - UPDATED VERSION

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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">All Airlines</h1>
      <p className="text-gray-600 mb-8">
        Browse airline fee tables alphabetically. {airlines.length} airlines available.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {airlines.map((a) => (
          <Link
            key={a.slug}
            href={`/airlines/${a.slug}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="font-medium text-gray-900">{a.name}</div>
            {a.iata && (
              <div className="text-sm text-gray-500 mt-1">IATA: {a.iata}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}