import { getAllAirlines } from "@/lib/data";
import type { FeeItem } from "@/lib/types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type VerificationFreshness = {
  label: "Recently checked" | "Review due" | "Needs recheck" | "No verification date";
  detail: string;
  tone: "green" | "amber" | "red" | "slate";
};

export function getVerificationFreshness(date: string, now = new Date()): VerificationFreshness {
  if (!ISO_DATE_RE.test(date)) {
    return {
      label: "No verification date",
      detail: "Do not treat this page as recently verified until its official sources are checked.",
      tone: "slate",
    };
  }

  const checkedAt = Date.parse(`${date}T00:00:00.000Z`);
  const ageDays = Math.max(0, Math.floor((now.getTime() - checkedAt) / 86_400_000));
  if (ageDays <= 120) {
    return { label: "Recently checked", detail: "Official sources were checked within the last 120 days.", tone: "green" };
  }
  if (ageDays <= 240) {
    return { label: "Review due", detail: "Recheck the official source before relying on time-sensitive pricing.", tone: "amber" };
  }
  return { label: "Needs recheck", detail: "This information is more than 240 days old and should be confirmed with the airline.", tone: "red" };
}

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
