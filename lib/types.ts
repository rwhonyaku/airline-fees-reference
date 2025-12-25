// lib/types.ts

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "JPY"
  | "CHF"
  | "SEK"
  | "NOK"
  | "DKK"
  | "NZD"
  | "CNY"
  | "HKD"
  | "SGD";

export type FeeCategoryKey =
  | "checked_baggage"
  | "carry_on"
  | "overweight_baggage"
  | "oversize_baggage"
  | "seat_selection"
  | "change_cancellation"
  | "same_day_change"
  | "same_day_standby"
  | "unaccompanied_minor";

export type FeeItem = {
  category: FeeCategoryKey;

  /**
   * Prefer a number. If the airline publishes only a range or multi-case amount,
   * use a short string like "USD 0–35" and keep the details in `conditions`.
   */
  amount: number | string;
  currency: CurrencyCode;

  /**
   * Short, label-like conditions only. No advice. No prose paragraphs.
   * Example: "Economy (non-Basic), US domestic, 1st checked bag, purchased online"
   */
  conditions: string;

  /**
   * Optional but recommended when it meaningfully constrains the fee.
   * Keep these short, label-like.
   */
  applies_to?: string; // e.g., "Basic Economy", "Economy", "All fares"
  region_or_route?: string; // e.g., "US domestic", "Transatlantic", "Within Europe"
  timing?: string; // e.g., "at booking", "at airport", "before departure"

  /**
   * Required for every fee row.
   */
  source_url: string;

  /**
   * Required for every fee row. Format: YYYY-MM-DD
   */
  last_verified: string;

  /**
   * Optional: labels only.
   */
  notes?: string;
};

export type Airline = {
  slug: string; // used in URL: /airlines/[slug]
  name: string; // display name
  iata?: string;
  icao?: string;
  country?: string;
  region?: string;

  fees: FeeItem[];
};

export type FeeCategory = {
  key: FeeCategoryKey;
  label: string; // UI label (English for now; you can add Japanese later)
  description?: string; // keep short; optional
};

export type AirlineSummary = Pick<Airline, "slug" | "name" | "iata" | "icao" | "country" | "region">;

export type FeeRow = {
  airline_slug: string;
  airline_name: string;
  item: FeeItem;
};
