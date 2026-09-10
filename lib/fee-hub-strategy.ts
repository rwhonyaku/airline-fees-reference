type StrategyLink = {
  href: string;
  label: string;
  reason: string;
};

type SpotlightAirline = {
  slug: string;
  reason: string;
};

export type FeeHubStrategy = {
  introLabel: string;
  scenarioCards: Array<{
    title: string;
    body: string;
  }>;
  spotlightAirlines: SpotlightAirline[];
  toolLinks: StrategyLink[];
  bridgeText: string;
};

export const FEE_HUB_STRATEGY: Record<string, FeeHubStrategy> = {
  unaccompanied_minor: {
    introLabel: "deciding whether the service is mandatory, avoidable, or impossible on your route before you book.",
    scenarioCards: [
      {
        title: "The biggest money saver is itinerary design",
        body: "On many airlines, nonstop flying is the line between a manageable fee and a trip that is not allowed for an unaccompanied child at all.",
      },
      {
        title: "Some carriers do not offer the service",
        body: "Ryanair, easyJet, and Frontier effectively force you to solve the problem with a traveling adult, not a paid service fee.",
      },
      {
        title: "The airline fee is not always the whole cost",
        body: "Published UM pricing can stack with full-fare rules, route limits, or age-band restrictions. That is why the airline-specific page matters after this table.",
      },
    ],
    spotlightAirlines: [
      { slug: "southwest", reason: "Southwest has a sharp split between mainland and Hawaii pricing, which makes route context matter immediately." },
      { slug: "alaska", reason: "Alaska shows how geography changes the fee math, especially for Hawaii flying." },
      { slug: "jetblue", reason: "JetBlue is a good benchmark for the common nonstop-only UM model." },
      { slug: "ryanair", reason: "Ryanair is important because the service is not offered at all." },
    ],
    toolLinks: [
      { href: "/best-cards", label: "Card break-even calculator", reason: "The card tool is not a direct UM fix, but it becomes relevant if the same trip also triggers recurring first-bag fees for the accompanying adult." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "Carry-on enforcement still matters when the adult escort is trying to keep the trip from adding baggage costs." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Restricted fares can make a child-travel itinerary even harder to fix once booked." },
    ],
    bridgeText: "After the fee table, the most useful next step is usually the airline-specific page or guide that shows the route and age restrictions in context.",
  },
  checked_baggage: {
    introLabel: "separating a paid first checked bag from an included allowance, then pricing the real trip by travelers, bags, and route.",
    scenarioCards: [
      {
        title: "Paid first bag is only one model",
        body: "Some trips have a simple first-bag charge. Others include baggage by cabin, fare family, route, or status before any fee applies.",
      },
      {
        title: "Timing can change the bill",
        body: "When an airline sells bags before travel, airport purchase can be the worst moment to solve a predictable baggage need.",
      },
      {
        title: "The useful math is party-level",
        body: "One fee row is not enough when two travelers, roundtrips, repeat trips, or a card benefit can change the annual baggage cost.",
      },
    ],
    spotlightAirlines: [
      { slug: "air-france", reason: "Air France is getting baggage-charge impressions and is useful because route, fare, and excess-baggage logic matter more than one flat first-bag number." },
      { slug: "air-canada", reason: "Air Canada is a strong example of Basic, route, fare brand, and allowance differences changing the checked-bag answer." },
      { slug: "alaska", reason: "Alaska is useful because ticketing date, route exceptions, and card/status benefits can all change the bag math." },
      { slug: "zipair", reason: "ZIPAIR is useful because checked baggage is purchased as an add-on by route, weight, and timing." },
    ],
    toolLinks: [
      { href: "/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked baggage cost calculator", reason: "Best when you need a traveler-and-bag estimate instead of a raw fee row." },
      { href: "/best-cards", label: "Card break-even calculator", reason: "Best when the main question is whether a free checked bag benefit covers a card's annual fee." },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance", reason: "Best when baggage depends on route, fare family, cabin, or piece-versus-weight concept instead of one flat fee." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "Avoiding a checked bag entirely is often more useful than comparing checked bag fees after the fact." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Basic restrictions often make a checked bag more likely, even when the fare looked cheaper at first." },
    ],
    bridgeText: "After checking the baggage rows, the most useful next step is usually the checked-bag calculator for cash cost, the airline page for route and fare rules, or the card-benefit reference when repeat first-bag fees are the problem.",
  },
  carry_on: {
    introLabel: "deciding whether to buy cabin space, pack smaller, or change airlines before reaching the gate.",
    scenarioCards: [
      {
        title: "First identify the free item",
        body: "A personal item and an overhead-bin carry-on are different products. The cheapest fare may include only the smaller under-seat item.",
      },
      {
        title: "Bag shape beats bag marketing",
        body: "A soft bag that actually compresses is often more valuable than a roller marketed with optimistic dimensions.",
      },
      {
        title: "Price cabin access before checkout",
        body: "Frontier, Ryanair, and easyJet show why an apparently cheap fare should be compared only after the required cabin-bag path is added.",
      },
    ],
    spotlightAirlines: [
      { slug: "frontier", reason: "Frontier is where personal-item limits and bundle choice determine the real fare." },
      { slug: "ryanair", reason: "Ryanair is one of the clearest examples of a fare with paid cabin-bag access." },
      { slug: "easyjet", reason: "easyJet matters because seat bundles can effectively include the larger bag." },
    ],
    toolLinks: [
      { href: "/sizer-rules", label: "Sizer rules", reason: "Compare the bag's actual dimensions before relying on an overhead-bin plan." },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide", reason: "Best when the question is not just the size limit, but whether the airline is likely to enforce it." },
      { href: "/guides/basic-economy-traps#basic-economy-tool", label: "Basic Economy decision tool", reason: "Best when the cheapest fare may restrict carry-on access or make a checked bag more likely." },
      { href: "/tools/checked-baggage-calculator", label: "Checked-bag cost calculator", reason: "Price the checked-bag fallback when the carry-on plan is too risky." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Carry-on restrictions are one of the main ways cheap fares stop being cheap." },
    ],
    bridgeText: "After checking the carry-on rows, the most useful next step is usually the airline-specific page or the enforcement guide that shows how strict the rule is in practice.",
  },
  seat_selection: {
    introLabel: "figuring out whether a seat fee buys real value or only fixes a restrictive fare.",
    scenarioCards: [
      {
        title: "Preferred does not always mean better",
        body: "Many carriers price non-legroom seats as if they were a real upgrade simply because they are closer to the front or window/aisle inventory is thin.",
      },
      {
        title: "Entry fares can exclude seat choice",
        body: "Basic or stripped-down fares use seating uncertainty to push travelers back into paid choices they thought they had avoided.",
      },
      {
        title: "The right benchmark is all-in comfort cost",
        body: "A fare that requires paid seat selection to feel tolerable should be compared against the next cabin or a different airline, not judged in isolation.",
      },
    ],
    spotlightAirlines: [
      { slug: "delta", reason: "Delta is a strong example of premium seat upsell logic hiding inside a polished product." },
      { slug: "united", reason: "United is useful because Basic and Preferred pricing can add seat costs quickly." },
      { slug: "american", reason: "American highlights how preferred and extra-legroom products can blur together for the buyer." },
      { slug: "easyjet", reason: "easyJet is a good European comparison because seats and bag access can interact." },
    ],
    toolLinks: [
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Best when Basic restrictions are what make seat fees feel unavoidable." },
      { href: "/tools/checked-baggage-calculator", label: "Checked-bag cost calculator", reason: "Price bags too if the paid seat is only one part of the cheapest-fare add-on total." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "If the traveler is paying to avoid discomfort, it often helps to also inspect whether they are carrying the wrong bag for that airline." },
    ],
    bridgeText: "After checking seat fees, compare the airline page and the fare guide, because seat pricing rarely exists in isolation.",
  },
  change_cancellation: {
    introLabel: "This page should help users decide whether the cheapest fare is actually safe to buy when plans are unstable.",
    scenarioCards: [
      {
        title: "The real cost is often not the fee label",
        body: "A fare can say no change fee and still become expensive once fare difference, credits, or locked restrictions show up.",
      },
      {
        title: "Late changes can cost more on low-cost fares",
        body: "Frontier, Ryanair, and easyJet are useful because they show how late changes and stripped fares turn flexibility into a paid product.",
      },
      {
        title: "Legacy carriers still use the cheapest fare as the trapdoor",
        body: "United, Delta, American, and JetBlue all show versions of the same pattern: the worst flexibility lives in the lowest fare family.",
      },
    ],
    spotlightAirlines: [
      { slug: "united", reason: "United clearly distinguishes non-Basic flexibility from Basic Economy restrictions." },
      { slug: "delta", reason: "Delta shows how Basic can still carry meaningful change and cancellation pain even on a polished product." },
      { slug: "frontier", reason: "Frontier clearly shows how timing and bundle choice affect change costs." },
      { slug: "ryanair", reason: "Ryanair is a strong benchmark for airlines that still price flexibility like a premium add-on." },
    ],
    toolLinks: [
      { href: "/best-cards", label: "Card break-even calculator", reason: "Cards do not solve change fees directly, but they matter when bag benefits make the better fare rational instead of the stripped fare." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "Trip changes often become harder when the traveler is also trying to force the wrong bag onto the new itinerary." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Most flexibility mistakes start with buying the cheapest fare family without pricing the downside." },
    ],
    bridgeText: "After the change-fee page, compare the airline-specific fare page and the stripped-fare guide, because flexibility problems usually start before the fee is ever charged.",
  },
  overweight_baggage: {
    introLabel: "checking whether a bag is just over the standard checked-bag limit or heavy enough that the airline may treat it as a special-handling problem.",
    scenarioCards: [
      {
        title: "The common warning line is 50 lb / 23 kg",
        body: "Many airlines start overweight treatment above the normal checked-bag allowance, commonly 50 lb or 23 kg. The exact fee still depends on the airline, route, and cabin or fare allowance.",
      },
      {
        title: "The charge may stack on top of the bag fee",
        body: "If the checked bag itself is not included, the overweight charge can be an extra penalty on top of the ordinary checked-bag price.",
      },
      {
        title: "Very heavy bags may not be accepted",
        body: "Some airlines stop treating very heavy baggage as ordinary checked luggage. If the bag is beyond the carrier's maximum accepted checked-bag weight, cargo rules or refusal can matter more than a simple fee.",
      },
    ],
    spotlightAirlines: [
      { slug: "air-france", reason: "Air France is useful for searches where baggage cost depends on route, fare, and whether the bag is excess baggage rather than included allowance." },
      { slug: "air-canada", reason: "Air Canada is a good comparison when the question is whether the issue is the first checked bag, an overweight bag, or an international allowance rule." },
      { slug: "zipair", reason: "ZIPAIR gets search interest because international baggage fees can be purchased as add-ons and depend on the selected allowance." },
      { slug: "alaska", reason: "Alaska is a useful U.S. benchmark for separating normal checked-bag pricing from overweight handling." },
    ],
    toolLinks: [
      { href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=51&size=62", label: "51 lb / 23 kg overweight estimate", reason: "Use this when the bag is just over a common checked-bag weight threshold and published numeric fees are available." },
      { href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=70&size=62", label: "Heavy checked-bag estimate", reason: "Use this when the bag is much heavier than a normal allowance but still needs to be checked as luggage." },
      { href: "/fees/checked_baggage", label: "Standard checked-bag baseline", reason: "Check the normal bag fee first, because overweight charges can be added on top of the base checked-bag price." },
      { href: "/guides/international-baggage-allowance", label: "International allowance explainer", reason: "Best when weight, route, fare family, or piece-versus-weight rules decide whether the bag is included or excess." },
    ],
    bridgeText: "After checking overweight fees, the most useful next step is usually the excess-baggage calculator plus the airline page, because the charge depends on the carrier's weight bands, route, cabin or fare allowance, and maximum accepted checked-bag weight.",
  },
  oversize_baggage: {
    introLabel: "bag shapes that could trigger a separate airport charge beyond the normal bag count.",
    scenarioCards: [
      {
        title: "Oversize is hard to fix late",
        body: "A heavy bag can sometimes be repacked. An oversized suitcase, case, or sports item is usually a structural problem by the time you reach the counter.",
      },
      {
        title: "The base checked-bag fee may still apply",
        body: "Oversize charges often sit on top of the normal checked-bag fee, so the right comparison starts with the standard bag baseline.",
      },
      {
        title: "Route and aircraft handling matter",
        body: "Some airlines publish route- or aircraft-dependent acceptance rules, which is why a single universal oversize number can be misleading.",
      },
    ],
    spotlightAirlines: [
      { slug: "american", reason: "American is a useful benchmark for published oversize and overweight ladders." },
      { slug: "delta", reason: "Delta shows how oversize pricing interacts with a broader legacy-carrier baggage table." },
      { slug: "southwest", reason: "Southwest is useful because free checked bags do not mean free oversize baggage." },
      { slug: "frontier", reason: "Frontier shows how special bag handling can stack on top of a fragile low-fare bag plan." },
    ],
    toolLinks: [
      { href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=50&size=63", label: "Oversize baggage calculator", reason: "Best when the bag crosses a common linear-inch threshold and you need a trip-level estimate." },
      { href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=70&size=70", label: "Heavy and oversized scenario", reason: "Models the worse case where both weight and size may matter." },
      { href: "/fees/checked_baggage", label: "Checked baggage baseline", reason: "Oversize fees may be in addition to the normal checked-bag fee, not a replacement for it." },
      { href: "/guides/international-baggage-allowance", label: "International allowance explainer", reason: "International itineraries may move the problem into piece, weight, route, or aircraft handling rules." },
    ],
    bridgeText: "After checking oversize fees, use the excess-baggage calculator and the airline page together, because oversize acceptance can be more conditional than ordinary checked baggage.",
  },
};
