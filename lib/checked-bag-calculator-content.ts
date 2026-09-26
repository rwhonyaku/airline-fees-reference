export const CHECKED_BAG_FAQS = [
  {
    question: "How does the checked baggage calculator estimate cost?",
    answer:
      "It multiplies the selected airline's usable published checked-bag fee by travelers, bags, flight directions, and annual roundtrips. If a bag price depends on route, fare, or booking timing, the tool explains the lookup instead of inventing a number.",
  },
  {
    question: "Why does the calculator sometimes refuse to quote a checked bag total?",
    answer:
      "Some airlines publish checked-bag prices by route, fare family, domestic versus international market, or booking channel. When no reliable fixed fee applies to the requested bag, the tool directs you to an airline-specific lookup.",
  },
  {
    question: "Can an airline credit card reduce the checked bag total?",
    answer:
      "Some airline cards publish a first checked bag waiver for the cardholder and eligible companions. The comparison counts only verified bag savings and excludes points, bonuses, lounge access, and unrelated perks.",
  },
  {
    question: "Can I use this as a United baggage fee calculator?",
    answer:
      "Yes. Select United, then enter travelers, checked bags per traveler, one-way or roundtrip, and annual roundtrips. The result calculates the checked-bag total when a broadly applicable published price is available.",
  },
  {
    question: "Are baggage fees calculated round trip?",
    answer:
      "The calculator multiplies checked-bag fees by flight direction. If the airline publishes a per-direction bag fee, a roundtrip applies that fee once outbound and once again on the return.",
  },
  {
    question: "What is the difference between a baggage calculator and a checked bag fee calculator?",
    answer:
      "This tool is focused on checked baggage fees. It does not model carry-on add-ons, overweight fees, or oversize fees; those require the related carry-on and excess-baggage tools.",
  },
] as const;
