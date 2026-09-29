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
    airportFeeByOrdinal?: number[];
    thirdPlusFee?: number;
  };
  personalItemIncluded: boolean;
  carryOnIncluded: boolean;
  carryOnFeeEachWay?: number;
  carryOnWarning?: string;
  standardSeatIncluded: boolean;
  randomSeatAssignmentIncluded?: boolean;
  seatFeeEachWay?: number;
  seatSelectionWarning?: string;
  marketContexts?: string[];
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
    personalItemIncluded: true,
    carryOnIncluded: true,
    standardSeatIncluded: false,
    randomSeatAssignmentIncluded: fare === "Basic Fare",
    seatSelectionWarning: fare === "Basic Fare"
      ? "Declining paid seat selection still produces a standard seat assignment at check-in; it does not mean traveling without a seat."
      : "Paid or included seat treatment varies by Southwest fare and seat type. Enter a checkout price only when selecting a seat or upgrade that is not already included.",
    marketContexts: ["us-domestic"],
    sources: [
      rowSource("First checked bag", first),
      rowSource("Second checked bag", second),
      rowSource("Third or additional checked bag", third),
      rowSource("Carry-on allowance", carry),
      rowSource("Seat assignment rule", seat),
    ],
  };
}

function fixedBagProfile(
  airline: Airline,
  options: {
    id: string;
    label: string;
    summary: string;
    appliesTo: string;
    firstBagCondition?: string;
    secondBagCondition?: string;
    marketContexts?: string[];
    standardSeatIncluded?: boolean;
    airportFeeByOrdinal?: number[];
  },
): TripCostPilotProfile {
  const matchingBag = (ordinal: "1st" | "2nd", condition?: string) => (row: FeeItem) => {
    const conditions = row.conditions.toLowerCase();
    const bagNumber = ordinal === "1st" ? "bag 1" : "bag 2";
    return row.category === "checked_baggage" &&
      row.applies_to === options.appliesTo &&
      (conditions.includes(ordinal) || conditions.includes(bagNumber)) &&
      (!condition || conditions.includes(condition));
  };
  const first = requireRow(airline, `${options.label} first checked bag`, matchingBag("1st", options.firstBagCondition));
  const second = requireRow(airline, `${options.label} second checked bag`, matchingBag("2nd", options.secondBagCondition));
  const carry = requireRow(airline, "included carry-on", (row) => row.category === "carry_on" && row.amount === 0);
  const firstAmount = typeof first.amount === "number" ? first.amount : null;
  const secondAmount = typeof second.amount === "number" ? second.amount : null;
  if (firstAmount == null || secondAmount == null) throw new Error(`Non-numeric checked-bag pilot fee for ${airline.slug} ${options.label}`);

  return {
    id: options.id,
    label: options.label,
    summary: options.summary,
    currency: "USD",
    checkedBaggage: { includedPerTraveler: 0, feeByOrdinal: [firstAmount, secondAmount], airportFeeByOrdinal: options.airportFeeByOrdinal },
    personalItemIncluded: true,
    carryOnIncluded: true,
    standardSeatIncluded: options.standardSeatIncluded ?? false,
    marketContexts: options.marketContexts,
    sources: [
      rowSource("First checked bag", first),
      rowSource("Second checked bag", second),
      rowSource("Carry-on allowance", carry),
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
      personalItemIncluded: true,
      carryOnIncluded: true,
      standardSeatIncluded: false,
      seatSelectionWarning: "Seat selection is paid unless the exact package entered for the flight includes it. Use ZIPAIR's checkout amount for the selected seat type.",
      marketContexts: ["transpacific"],
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
      personalItemIncluded: true,
      carryOnIncluded: true,
      standardSeatIncluded: true,
      marketContexts: ["transpacific"],
      sources: [rowSource("International checked allowance", checked), rowSource("Carry-on allowance", carry), rowSource("Seat selection", seat)],
    }];
  }

  if (airline.slug === "frontier") {
    const checked = requireRow(airline, "checked baggage", category("checked_baggage"));
    const carry = requireRow(airline, "paid carry-on", (row) => row.category === "carry_on" && typeof row.amount === "string");
    const seat = requireRow(airline, "random seat assignment", (row) => row.category === "seat_selection" && row.applies_to === "Basic fare" && row.amount === 0);
    const basic: TripCostPilotProfile = {
      id: "frontier-basic",
      label: "Basic — personal item and random seat",
      summary: "No checked bag or full-size carry-on is assumed included. Bag prices remain manual because Frontier prices them by flight and purchase timing; declining seat selection adds no seat fee.",
      currency: "USD",
      checkedBaggage: { includedPerTraveler: 0 },
      personalItemIncluded: true,
      carryOnIncluded: false,
      carryOnWarning: "Basic includes a personal item, not a full-size overhead carry-on. Enter Frontier's price from checkout for every traveler who needs the larger bag.",
      standardSeatIncluded: false,
      randomSeatAssignmentIncluded: true,
      seatSelectionWarning: "Declining paid selection triggers Frontier's free random assignment. Set selected seats to zero if the party accepts that assignment; enter checkout pricing only when choosing seats.",
      sources: [rowSource("Checked baggage", checked), rowSource("Carry-on pricing", carry), rowSource("Random seat assignment", seat)],
    };
    const bundleProfiles = ["Economy", "Premium", "Business"].map((bundle) => {
      const bundleSeat = requireRow(airline, `${bundle} bundle seat`, (row) => row.category === "seat_selection" && row.applies_to === `${bundle} bundle` && row.amount === 0);
      return {
        id: `frontier-${bundle.toLowerCase()}-bundle`, label: `${bundle} bundle — included seat; bags from checkout`,
        summary: `${bundle} includes the published seat entitlement stored for this bundle. Checked-bag and full-size carry-on totals remain manual because the records do not support one route-independent bundle price.`,
        currency: "USD", checkedBaggage: { includedPerTraveler: 0 }, personalItemIncluded: true, carryOnIncluded: false, standardSeatIncluded: true,
        carryOnWarning: "Frontier bundle contents can change. Enter the checkout carry-on price unless the selected bundle explicitly shows the full-size carry-on as included.",
        seatSelectionWarning: `${bundle} includes its published seat entitlement. Premium or upgraded seating beyond that entitlement remains a separate checkout-priced choice.`,
        marketContexts: ["us-domestic", "us-short-haul", "other"], sources: [rowSource("Checked baggage", checked), rowSource("Carry-on pricing", carry), rowSource("Seat entitlement", bundleSeat)],
      } satisfies TripCostPilotProfile;
    });
    return [basic, ...bundleProfiles];
  }

  if (airline.slug === "easyjet") {
    const smallBag = requireRow(airline, "included small cabin bag", (row) => row.category === "carry_on" && row.amount === 0 && row.applies_to === "All fares");
    const largeBag = requireRow(airline, "checkout-priced large cabin bag", (row) => row.category === "carry_on" && typeof row.amount === "string" && row.applies_to?.includes("Optional add-on") === true);
    const standardSeat = requireRow(airline, "standard seat or random assignment", (row) => row.category === "seat_selection" && row.conditions.toLowerCase().includes("random seat"));
    return [
      {
        id: "easyjet-standard-small-bag",
        label: "Standard fare — small underseat bag only",
        summary: "The fare includes one small underseat bag. A large overhead cabin bag is a separate checkout-priced product unless an eligible fare or benefit explicitly includes it.",
        currency: "GBP",
        checkedBaggage: { includedPerTraveler: 0 },
        personalItemIncluded: true,
        carryOnIncluded: false,
        carryOnWarning: "Do not count easyJet's free small underseat bag as a full-size overhead carry-on. Enter the live large-cabin-bag price from checkout.",
        standardSeatIncluded: false,
        randomSeatAssignmentIncluded: true,
        seatSelectionWarning: "A free random seat is assigned when standard seat selection is declined. Enter the live checkout price only for travelers choosing seats.",
        marketContexts: ["other"],
        sources: [rowSource("Small cabin bag", smallBag), rowSource("Large cabin bag", largeBag), rowSource("Seat assignment", standardSeat)],
      },
      {
        id: "easyjet-large-cabin-bag-included",
        label: "Eligible fare or benefit — large cabin bag included",
        summary: "Use this only when the booking itself confirms a large cabin bag entitlement, such as an eligible Inclusive Plus or easyJet Plus path.",
        currency: "GBP",
        checkedBaggage: { includedPerTraveler: 0 },
        personalItemIncluded: true,
        carryOnIncluded: true,
        standardSeatIncluded: false,
        randomSeatAssignmentIncluded: true,
        seatSelectionWarning: "The cabin-bag entitlement does not by itself prove that a selected seat is included. Accept free random assignment or enter the seat price shown at checkout.",
        marketContexts: ["other"],
        sources: [rowSource("Small cabin bag", smallBag), rowSource("Large cabin bag entitlement", largeBag), rowSource("Seat assignment", standardSeat)],
      },
    ];
  }

  if (airline.slug === "ryanair") {
    const smallBag = requireRow(airline, "included small bag", (row) => row.category === "carry_on" && row.amount === 0 && row.applies_to === "Basic fare");
    const priority = requireRow(airline, "Priority cabin bag", (row) => row.category === "carry_on" && typeof row.amount === "string" && row.applies_to === "Optional add-on" && row.timing?.includes("booking") === true);
    const standardSeat = requireRow(airline, "reserved or random seat", (row) => row.category === "seat_selection" && row.conditions.toLowerCase().includes("free random seat"));
    return [
      {
        id: "ryanair-basic-small-bag",
        label: "Basic — small underseat bag only",
        summary: "Basic includes the small underseat bag, not the 10 kg overhead cabin bag. Priority pricing varies by flight, date, availability, and purchase timing.",
        currency: "EUR",
        checkedBaggage: { includedPerTraveler: 0 },
        personalItemIncluded: true,
        carryOnIncluded: false,
        carryOnWarning: "Enter the live Priority & 2 Cabin Bags price from checkout for each traveler who needs a 10 kg overhead bag.",
        standardSeatIncluded: false,
        randomSeatAssignmentIncluded: true,
        seatSelectionWarning: "Declining a reserved seat produces a free random assignment, subject to Ryanair's family-seating rules. Enter checkout pricing only for travelers reserving seats.",
        marketContexts: ["other"],
        sources: [rowSource("Small bag allowance", smallBag), rowSource("Priority cabin bag", priority), rowSource("Seat assignment", standardSeat)],
      },
      {
        id: "ryanair-priority-two-cabin-bags",
        label: "Priority & 2 Cabin Bags already included",
        summary: "Use this when the entered fare already includes Priority & 2 Cabin Bags. The small underseat bag and one 10 kg overhead cabin bag are then included.",
        currency: "EUR",
        checkedBaggage: { includedPerTraveler: 0 },
        personalItemIncluded: true,
        carryOnIncluded: true,
        standardSeatIncluded: false,
        randomSeatAssignmentIncluded: true,
        seatSelectionWarning: "Priority adds cabin-bag and boarding benefits; it does not automatically make every reserved seat free. Accept random assignment or enter the checkout seat price.",
        marketContexts: ["other"],
        sources: [rowSource("Small bag allowance", smallBag), rowSource("Priority cabin bag", priority), rowSource("Seat assignment", standardSeat)],
      },
    ];
  }

  if (airline.slug === "lufthansa") {
    const standardCarry = requireRow(airline, "Economy overhead carry-on", (row) => row.category === "carry_on" && row.amount === 0 && row.applies_to?.includes("Economy Light") === true);
    const basicCarry = requireRow(airline, "Economy Basic personal item", (row) => row.category === "carry_on" && row.amount === 0 && row.applies_to === "Economy Basic");
    const checked = requireRow(airline, "fare-dependent checked baggage", category("checked_baggage"));
    const seat = requireRow(airline, "fare-dependent seat selection", category("seat_selection"));
    return [
      {
        id: "lufthansa-europe-basic-personal-item",
        label: "Europe Economy Basic — personal item only",
        summary: "On selected short- and medium-haul routes, Economy Basic includes the personal item but not the normal 8 kg overhead carry-on, checked baggage, or seat reservation.",
        currency: "EUR",
        checkedBaggage: { includedPerTraveler: 0 },
        personalItemIncluded: true,
        carryOnIncluded: false,
        carryOnWarning: "If Lufthansa offers an overhead-bag option for this itinerary, enter its checkout price. Do not substitute the Economy Light allowance.",
        standardSeatIncluded: false,
        seatSelectionWarning: "Advance seat selection depends on the itinerary, fare, and status. Enter the price shown in Lufthansa checkout when choosing seats.",
        marketContexts: ["other"],
        sources: [rowSource("Economy Basic cabin allowance", basicCarry), rowSource("Checked baggage", checked), rowSource("Seat selection", seat)],
      },
      {
        id: "lufthansa-economy-light-carry-on",
        label: "Economy Light or higher — 8 kg carry-on included",
        summary: "The normal Economy cabin allowance includes one 8 kg overhead carry-on plus the published personal item. Checked baggage and advance seating still depend on the itinerary and fare.",
        currency: "EUR",
        checkedBaggage: { includedPerTraveler: 0 },
        personalItemIncluded: true,
        carryOnIncluded: true,
        standardSeatIncluded: false,
        seatSelectionWarning: "Economy Light's overhead bag does not imply free advance seat selection. Enter Lufthansa's checkout price if selecting seats.",
        marketContexts: ["other", "transatlantic"],
        sources: [rowSource("Economy carry-on allowance", standardCarry), rowSource("Checked baggage", checked), rowSource("Seat selection", seat)],
      },
    ];
  }

  if (airline.slug === "southwest") {
    return [
      southwestProfile(airline, "Basic Fare", "Basic — current U.S. Mainland rules"),
      southwestProfile(airline, "Choice Fare", "Choice — current U.S. Mainland rules"),
      southwestProfile(airline, "Choice Preferred Fare", "Choice Preferred — current U.S. Mainland rules"),
      southwestProfile(airline, "Choice Extra Fare", "Choice Extra — two checked bags included"),
    ];
  }

  if (airline.slug === "delta") {
    return [
      fixedBagProfile(airline, {
        id: "delta-domestic-basic",
        label: "Domestic Basic Economy — no bag waiver",
        summary: "Models Delta's published U.S. domestic first- and second-bag charges for a standard bag under 50 lb, with no card, status, military, or cabin waiver. Carry-on is included; any paid seat choice remains manual.",
        appliesTo: "Basic Economy",
        marketContexts: ["us-domestic"],
      }),
      fixedBagProfile(airline, {
        id: "delta-domestic-main",
        label: "Domestic Main Cabin — no bag waiver",
        summary: "Models Delta's published U.S. domestic first- and second-bag charges for a standard bag under 50 lb, with no card, status, military, or cabin waiver. Carry-on is included; any paid seat choice remains manual.",
        appliesTo: "Economy (non-Basic)",
        marketContexts: ["us-domestic"],
      }),
    ];
  }

  if (airline.slug === "american") {
    return [
      fixedBagProfile(airline, {
        id: "american-domestic-main-online",
        label: "Domestic Main Cabin — bags prepaid online",
        summary: "Models current online first- and second-bag prices for eligible U.S. and short-haul Main Cabin itineraries ticketed on or after April 9, 2026. Airport payment, exceptions, and paid seat choices remain manual.",
        appliesTo: "Economy (non-Basic)",
        firstBagCondition: "on/after apr. 9, 2026",
        secondBagCondition: "on/after apr. 9, 2026",
        marketContexts: ["us-domestic", "us-short-haul"],
        airportFeeByOrdinal: [50, 60],
      }),
      fixedBagProfile(airline, {
        id: "american-domestic-basic-online",
        label: "Domestic Basic Economy — bags prepaid online",
        summary: "Models current online first- and second-bag prices for eligible U.S. and short-haul Basic Economy itineraries ticketed on or after May 18, 2026. Airport payment, exceptions, and paid seat choices remain manual.",
        appliesTo: "Basic Economy",
        firstBagCondition: "on/after may 18, 2026",
        secondBagCondition: "on/after may 18, 2026",
        marketContexts: ["us-domestic", "us-short-haul"],
        airportFeeByOrdinal: [55, 65],
      }),
    ];
  }

  if (airline.slug === "united") {
    const first = requireRow(airline, "current most-market first bag", (row) => row.category === "checked_baggage" && row.amount === 45 && row.conditions.toLowerCase().includes("on or after april 3, 2026"));
    const second = requireRow(airline, "current most-market second bag", (row) => row.category === "checked_baggage" && row.amount === 55 && row.conditions.toLowerCase().includes("on or after april 3, 2026"));
    const third = requireRow(airline, "current most-market third bag", (row) => row.category === "checked_baggage" && row.amount === 200 && row.conditions.toLowerCase().includes("on or after april 3, 2026"));
    const carry = requireRow(airline, "Economy carry-on", (row) => row.category === "carry_on" && row.amount === 0);
    return [{
      id: "united-economy-current-most-markets",
      label: "Economy — current most-market online bag prices",
      summary: "Models United's online first- and second-bag prices for Economy tickets purchased on or after April 3, 2026 in most covered U.S./short-haul markets. Route exceptions, cards, status, Basic Economy, and paid seats remain outside the automatic total.",
      currency: "USD",
      checkedBaggage: { includedPerTraveler: 0, feeByOrdinal: [45, 55], airportFeeByOrdinal: [50, 60], thirdPlusFee: 200 },
      personalItemIncluded: true,
      carryOnIncluded: true,
      standardSeatIncluded: false,
      marketContexts: ["us-domestic", "us-short-haul"],
      sources: [rowSource("First checked bag", first), rowSource("Second checked bag", second), rowSource("Third checked bag", third), rowSource("Carry-on allowance", carry)],
    }];
  }

  if (airline.slug === "alaska") {
    const current = (ordinal: string) => requireRow(airline, `current North America ${ordinal} bag`, (row) => row.category === "checked_baggage" && row.region_or_route?.startsWith("North America") === true && row.conditions.toLowerCase().includes(ordinal) && row.conditions.toLowerCase().includes("on or after april 10, 2026"));
    const first = current("1st checked bag");
    const second = current("2nd checked bag");
    const third = current("3rd checked bag");
    const carry = requireRow(airline, "included carry-on", (row) => row.category === "carry_on" && row.amount === 0);
    const standardSeat = requireRow(airline, "Main Cabin standard seat", (row) => row.category === "seat_selection" && row.amount === 0 && row.applies_to === "Main Cabin");
    const makeProfile = (id: string, label: string): TripCostPilotProfile => ({
      id,
      label,
      summary: "Models current North America first- and second-bag prices for tickets issued on or after April 10, 2026. Carry-on is included; seat choices remain manual until the supporting seat policy is reverified. Card, status, military, and route exceptions are excluded.",
      currency: "USD",
      checkedBaggage: { includedPerTraveler: 0, feeByOrdinal: [45, 55], thirdPlusFee: 200 },
      personalItemIncluded: true,
      carryOnIncluded: true,
      standardSeatIncluded: id === "alaska-main-current",
      seatSelectionWarning: id === "alaska-main-current"
        ? "Main Cabin includes standard-seat selection; preferred or premium seating remains a separate paid choice."
        : "Saver seat-selection treatment is not automatically priced here. Enter an amount only when Alaska checkout charges for the seat being selected.",
      marketContexts: ["us-domestic", "us-short-haul"],
      sources: [rowSource("First checked bag", first), rowSource("Second checked bag", second), rowSource("Third checked bag", third), rowSource("Carry-on allowance", carry), rowSource("Main Cabin standard seat", standardSeat)],
    });
    return [makeProfile("alaska-main-current", "Main Cabin — current North America rules"), makeProfile("alaska-saver-current", "Saver — current North America rules")];
  }

  if (airline.slug === "jetblue") {
    const checked = requireRow(airline, "route-priced checked baggage", (row) => row.category === "checked_baggage" && row.region_or_route?.includes("U.S.") === true);
    const carry = requireRow(airline, "included carry-on", (row) => row.category === "carry_on" && row.amount === 0);
    const seat = requireRow(airline, "included standard seat", (row) => row.category === "seat_selection" && row.amount === 0);
    return [
      {
        id: "jetblue-main-base",
        label: "Main Base — carry-on included; bags and seats priced separately",
        summary: "A normal carry-on is included. Checked bags vary by route, date, and purchase timing, while advance seat selection is checkout-priced.",
        currency: "USD", checkedBaggage: { includedPerTraveler: 0 }, personalItemIncluded: true, carryOnIncluded: true, standardSeatIncluded: false,
        seatSelectionWarning: "Main Base advance seat selection is checkout-priced. Enter the standard-seat amount shown for this flight; do not substitute an EvenMore or other premium-seat price.",
        marketContexts: ["us-domestic", "us-short-haul", "transatlantic", "other"], sources: [rowSource("Checked baggage", checked), rowSource("Carry-on allowance", carry)],
      },
      {
        id: "jetblue-main",
        label: "Main / Main Flex / EvenMore — standard seat included",
        summary: "A normal carry-on and standard seat selection are included. Checked-bag pricing remains manual because it changes by market, peak date, and fare family.",
        currency: "USD", checkedBaggage: { includedPerTraveler: 0 }, personalItemIncluded: true, carryOnIncluded: true, standardSeatIncluded: true,
        seatSelectionWarning: "Standard selection is included for this fare path. Preferred or extra-legroom products remain separate paid upgrades.",
        marketContexts: ["us-domestic", "us-short-haul", "other"], sources: [rowSource("Checked baggage", checked), rowSource("Carry-on allowance", carry), rowSource("Standard seat", seat)],
      },
    ];
  }

  return [];
}
