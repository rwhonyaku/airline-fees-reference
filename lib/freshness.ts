import { getAllAirlines } from "@/lib/data";
import type { FeeItem } from "@/lib/types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getLatestVerifiedDateFromFees(fees: FeeItem[]): string {
  const dates = fees
    .map((fee) => (typeof fee.last_verified === "string" && ISO_DATE_RE.test(fee.last_verified) ? fee.last_verified : ""))
    .filter(Boolean)
    .sort();

  return dates.at(-1) ?? "Not published";
}

export function getLatestVerifiedAcrossAirlines(): string {
  const fees = getAllAirlines().flatMap((airline) => airline.fees ?? []);
  return getLatestVerifiedDateFromFees(fees);
}
