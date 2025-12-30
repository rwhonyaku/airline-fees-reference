// app/page.tsx
import Link from "next/link";
import { getAirlinesIndex } from "@/lib/data";

export default function HomePage() {
  const airlines = getAirlinesIndex();
  const popularAirlines = airlines.slice(0, 12);

  return (
    <>
      {/* Hero - Simplified */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Airline Fees Database
        </h1>
        <p className="text-gray-600 text-lg max-w-3xl">
          Verified reference tables for baggage, seat selection, change fees, and more.
          Direct from airline websites. No opinions, no fluff, just facts.
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-10 text-center">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{airlines.length}</div>
          <div className="text-sm text-gray-600">Airlines</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-700">8+</div>
          <div className="text-sm text-gray-600">Fee Categories</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">Updated</div>
          <div className="text-sm text-gray-600">Monthly</div>
        </div>
      </div>

      {/* Quick Actions - Keep as is */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link href="/airlines" className="bg-white border rounded-lg p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Browse Airlines</h2>
          <p className="text-gray-600">View fees organized by airline</p>
        </Link>
        <Link href="/compare" className="bg-white border rounded-lg p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Compare Fees</h2>
          <p className="text-gray-600">Side-by-side comparisons</p>
        </Link>
        <Link href="/fees" className="bg-white border rounded-lg p-6 hover:shadow-md">
          <h2 className="text-xl font-semibold mb-2">Fee Categories</h2>
          <p className="text-gray-600">Understand different fee types</p>
        </Link>
      </div>

      {/* Popular Airlines - Keep as is */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Popular Airlines</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularAirlines.map((airline) => (
            <Link
              key={airline.slug}
              href={`/airlines/${airline.slug}`}
              className="bg-white border rounded-lg p-4 text-center hover:shadow-md"
            >
              <div className="font-medium">{airline.name}</div>
              {airline.iata && <div className="text-sm text-gray-500">{airline.iata}</div>}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}