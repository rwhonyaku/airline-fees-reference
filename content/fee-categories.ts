// content/fee-categories.ts

import type { FeeCategory, FeeCategoryKey } from "@/lib/types";

export const FEE_CATEGORIES: ReadonlyArray<FeeCategory> = Object.freeze([
  { key: "checked_baggage", label: "Checked baggage" },
  { key: "carry_on", label: "Carry-on" },
  { key: "seat_selection", label: "Seat selection" },
  { key: "change_cancellation", label: "Change / cancellation" },
  { key: "same_day_change", label: "Same-day change" },
  { key: "unaccompanied_minor", label: "Unaccompanied minor" },
]);

export const FEE_CATEGORY_KEYS: ReadonlyArray<FeeCategoryKey> = Object.freeze(
  FEE_CATEGORIES.map((c) => c.key)
);

export function isFeeCategoryKey(value: string): value is FeeCategoryKey {
  return (FEE_CATEGORY_KEYS as readonly string[]).includes(value);
}

export function getFeeCategoryLabel(key: FeeCategoryKey): string {
  const found = FEE_CATEGORIES.find((c) => c.key === key);
  return found ? found.label : key;
}
