import type { Airline, FeeItem } from "@/lib/types";

export type TripCostRuleSource = {
  label: string;
  url: string;
  lastVerified: string;
};

export type TripCostPilotProfile = {
  id: string;
  label: string;
  summary: string;
  currency: string;
  checkedBaggage: {
    includedPerTraveler: number;
    feeByOrdinal?: number[];
    thirdPlusFee?: number;
  };
  carryOnIncluded: boolean;
  standardSeatIncluded: boolean;
  sources: TripCostRuleSource[];
};

function rowSource(label: string, row: FeeItem): TripCostRuleSource {
  return { label, url: row.source_url, lastVerified: row.last_verified };
}

function requireRow(airline: Airline, description: string, predicate: (row: FeeItem) => boolean): FeeItem {
  const row = airline.fees.find(predicate);
  if (!row) throw new Error(`Missing ${description} source row for ${airline.slug}`);
  return row;
}

function category(category: FeeItem["category"]) {
  return (row: FeeItem) => row.category === category;
}

function southwestProfile(
  airline: Airline,
  fare: "Basic Fare" | "Choice Fare" | "Choice Preferred Fare" | "Choice Extra Fare",
  label: string,
): TripCostPilotProfile {
  const current = (row: FeeItem) =>
    row.category === "checked_baggage" &&
    row.applies_to === fare &&
    row.conditions.toLowerCase().includes("on or after april 9, 2026");
  const first = requireRow(airline, `${fare} first checked bag`, (row) => current(row) && row.conditions.toLowerCase().includes("1st checked bag"));
  const second = requireRow(airline, `${fare} second checked bag`, (row) => current(row) && row.conditions.toLowerCase().includes("2nd checked bag"));
  const third = requireRow(airline, "third checked bag", (row) => row.category === "checked_baggage" && row.conditions.toLowerCase().includes("3rd+ checked bag"));
  const carry = requireRow(airline, "included carry-on", (row) => row.category === "carry_on" && row.amount === 0);
  const seat = requireRow(airline, "Basic assigned seat", (row) => row.category === "seat_selection" && row.applies_to === "Basic Fare" && row.amount === 0);
  const firstAmount = typeof first.amount === "number" ? first.amount : null;
  const secondAmount = typeof second.amount === "number" ? second.amount : null;
  const thirdAmount = typeof third.amount === "number" ? third.amount : null;
  if (firstAmount == null || secondAmount == null || thirdAmount == null) throw new Error(`Non-numeric Southwest pilot fee for ${fare}`);

  return {
    id: `southwest-${fare.toLowerCase().replaceAll(" ", "-")}`,
    label,
    summary: fare === "Choice Extra Fare"
      ? "Two checked bags per traveler and a normal carry-on are included; this profile does not add a paid seat upgrade."
      : "Current U.S. Mainland checked-bag prices apply per traveler and direction. A normal carry-on is included; no paid seat upgrade is modeled.",
    currency: "USD",
    checkedBaggage: {
      includedPerTraveler: fare === "Choice Extra Fare" ? 2 : 0,
      feeByOrdinal: fare === "Choice Extra Fare" ? [thirdAmount] : [firstAmount, secondAmount],
      thirdPlusFee: thirdAmount,
    },
    carryOnIncluded: true,
    standardSeatIncluded: true,
    sources: [
      rowSource("First checked bag", first),
      rowSource("Second checked bag", second),
      rowSource("Third or additional checked bag", third),
      rowSource("Carry-on allowance", carry),
      rowSource("Seat assignment rule", seat),
    ],
  };
}

export function getTripCostPilotProfiles(airline: Airline): TripCostPilotProfile[] {
  if (airline.slug === "zipair") {
    const checked = requireRow(airline, "checked baggage", category("checked_baggage"));
    const carry = requireRow(airline, "carry-on", category("carry_on"));
    const seat = requireRow(airline, "seat selection", category("seat_selection"));
    return [{
      id: "zipair-standard",
      label: "Standard fare — 7 kg carry-on",
      summary: "The 7 kg cabin allowance is included. Checked bags and seat selection remain checkout-priced for the selected route and flight.",
      currency: "JPY",
      checkedBaggage: { includedPerTraveler: 0 },
      carryOnIncluded: true,
      standardSeatIncluded: false,
      sources: [rowSource("Checked baggage", checked), rowSource("Carry-on allowance", carry), rowSource("Seat selection", seat)],
    }];
  }

  if (airline.slug === "jal") {
    const checked = requireRow(airline, "international checked allowance", (row) => row.category === "checked_baggage" && row.amount === 0);
    const carry = requireRow(airline, "carry-on", category("carry_on"));
    const seat = requireRow(airline, "standard seat selection", (row) => row.category === "seat_selection" && row.amount === 0);
    return [{
      id: "jal-international-economy",
      label: "International Economy — standard allowance",
      summary: "Models two checked pieces up to 23 kg per traveler, the published cabin allowance, and an eligible standard seat selection as included. Premium-seat charges remain manual.",
      currency: "JPY",
      checkedBaggage: { includedPerTraveler: 2 },
      carryOnIncluded: true,
      standardSeatIncluded: true,
      sources: [rowSource("International checked allowance", checked), rowSource("Carry-on allowance", carry), rowSource("Seat selection", seat)],
    }];
  }

  if (airline.slug === "frontier") {
    const checked = requireRow(airline, "checked baggage", category("checked_baggage"));
    const carry = requireRow(airline, "paid carry-on", (row) => row.category === "carry_on" && typeof row.amount === "string");
    const seat = requireRow(airline, "random seat assignment", (row) => row.category === "seat_selection" && row.applies_to === "Basic fare" && row.amount === 0);
    return [{
      id: "frontier-basic",
      label: "Basic — personal item and random seat",
      summary: "No checked bag or full-size carry-on is assumed included. Bag prices remain manual because Frontier prices them by flight and purchase timing; declining seat selection adds no seat fee.",
      currency: "USD",
      checkedBaggage: { includedPerTraveler: 0 },
      carryOnIncluded: false,
      standardSeatIncluded: true,
      sources: [rowSource("Checked baggage", checked), rowSource("Carry-on pricing", carry), rowSource("Random seat assignment", seat)],
    }];
  }

  if (airline.slug === "southwest") {
    return [
      southwestProfile(airline, "Basic Fare", "Basic — current U.S. Mainland rules"),
      southwestProfile(airline, "Choice Fare", "Choice — current U.S. Mainland rules"),
      southwestProfile(airline, "Choice Preferred Fare", "Choice Preferred — current U.S. Mainland rules"),
      southwestProfile(airline, "Choice Extra Fare", "Choice Extra — two checked bags included"),
    ];
  }

  return [];
}
