// components/LastVerified.tsx

import { getVerificationFreshness } from "@/lib/freshness";

export function LastVerified({ date }: { date: string }) {
  const freshness = getVerificationFreshness(date);
  return <span title={freshness.detail}>Last checked: {date} · {freshness.label}</span>;
}
