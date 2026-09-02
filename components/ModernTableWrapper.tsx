// components/ModernTableWrapper.tsx - NEW (safe)
import { FeeTable } from "./Table";
import type { FeeRow } from "@/lib/types";

export function ModernTableWrapper({ rows }: { rows: FeeRow[] }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <FeeTable rows={rows} /> {/* Your existing component */}
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
        Fees in USD. Verify with airline for latest rates.
      </div>
    </div>
  );
}
