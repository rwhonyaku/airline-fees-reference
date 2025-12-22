// content/labels.ts

/**
 * Label standards are a *data-entry contract*.
 * Keep these boring and consistent.
 *
 * These are not exhaustive; they are the preferred vocabulary.
 */

export const ROUTE_LABELS = Object.freeze([
  "US domestic",
  "Canada domestic",
  "UK domestic",
  "Within Europe",
  "Transatlantic",
  "Transpacific",
  "International",
  "Varies"
]);

export const TIMING_LABELS = Object.freeze([
  "at booking",
  "after booking",
  "before departure",
  "within 24h",
  "at airport",
  "standard",
  "Varies"
]);

export const APPLIES_TO_LABELS = Object.freeze([
  "Basic Economy",
  "Economy",
  "Economy (non-Basic)",
  "Premium Economy",
  "Business",
  "First",
  "All fares",
  "Varies"
]);
