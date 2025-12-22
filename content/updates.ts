// content/updates.ts

export type UpdateEntry = {
  date: string; // YYYY-MM-DD
  type: "added" | "updated" | "removed";
  scope: "airline" | "category" | "comparison";
  target: string; // e.g., "delta", "checked_baggage", "transatlantic-economy-checked-baggage-2025"
  note?: string; // optional short label only, e.g., "checked baggage rows"
};

export const UPDATES: ReadonlyArray<UpdateEntry> = Object.freeze([
  // Example:
  // { date: "2025-12-19", type: "added", scope: "airline", target: "delta", note: "initial airline page" }
]);
