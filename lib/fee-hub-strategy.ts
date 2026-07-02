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
    introLabel: "Use this page to decide whether the service is mandatory, avoidable, or impossible on your route before you book.",
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
        body: "Published UM pricing can stack with full-fare rules, route limits, or age-band restrictions. That is why the airline-specific page matters after this hub.",
      },
    ],
    spotlightAirlines: [
      { slug: "southwest", reason: "Southwest has a sharp split between mainland and Hawaii pricing, which makes route context matter immediately." },
      { slug: "alaska", reason: "Alaska shows how geography changes the fee math, especially for Hawaii flying." },
      { slug: "jetblue", reason: "JetBlue is a good benchmark for the common nonstop-only UM model." },
      { slug: "ryanair", reason: "Ryanair is important because the service is not offered at all." },
    ],
    toolLinks: [
      { href: "/best-cards", label: "Free checked bag calculator", reason: "The card tool is not a direct UM fix, but it becomes relevant if the same trip also triggers bag-fee math for the accompanying adult." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "Carry-on enforcement still matters when the adult escort is trying to avoid turning a family trip into a fee stack." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Restricted fares can make a child-travel itinerary even harder to fix once booked." },
    ],
    bridgeText: "After the fee table, the most useful next step is usually the airline-specific page or guide that shows the route and age restrictions in context.",
  },
  checked_baggage: {
    introLabel: "Use this page when the first checked bag changes the real trip price more than the fare shown in search.",
    scenarioCards: [
      {
        title: "Airport payment is often the most expensive version",
        body: "Legacy carriers often charge more at the counter even when the bag decision was predictable before departure.",
      },
      {
        title: "Low-cost carrier bag pricing depends heavily on timing",
        body: "Spirit, Frontier, Ryanair, and easyJet all make baggage pricing a booking-timing problem, not just a packing problem.",
      },
      {
        title: "Bag benefits can matter more than general card perks",
        body: "This is the fee category where a free first checked bag can sometimes offset an annual fee for travelers who return to the same airline.",
      },
    ],
    spotlightAirlines: [
      { slug: "united", reason: "United is a clean example of prepaid versus airport pricing pressure." },
      { slug: "american", reason: "American shows how route-specific baggage pricing can break simple assumptions." },
      { slug: "southwest", reason: "Southwest matters because it changes the benchmark for what an all-in fare should look like." },
      { slug: "jetblue", reason: "JetBlue is a strong example of the first-bag math that can justify card benefits." },
    ],
    toolLinks: [
      { href: "/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes", label: "Checked baggage cost calculator", reason: "Use this first when you need a traveler-and-bag estimate instead of a raw fee row." },
      { href: "/best-cards", label: "Free checked bag calculator", reason: "Use this if the main question is whether a free checked bag benefit covers a card's annual fee." },
      { href: "/guides/international-baggage-allowance", label: "International baggage allowance", reason: "Use this when baggage depends on route, fare family, cabin, or piece-versus-weight concept instead of one flat fee." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "Avoiding a checked bag entirely is often more useful than comparing checked bag fees after the fact." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Basic restrictions often make a checked bag more likely, even when the fare looked cheaper at first." },
    ],
    bridgeText: "After a checked baggage page, the most useful next step is usually the airline-specific fee page or a bag-benefit reference that matches the trip.",
  },
  carry_on: {
    introLabel: "Carry-on pages should help users decide whether to buy space, compress harder, or change airlines before they ever reach the gate.",
    scenarioCards: [
      {
        title: "This is really an enforcement page",
        body: "Carry-on pricing only matters because airlines differ wildly in whether they treat the bag as included, optional, or a gate-revenue target.",
      },
      {
        title: "Bag shape beats bag marketing",
        body: "A soft bag that actually compresses is often more valuable than a roller marketed with optimistic dimensions.",
      },
      {
        title: "Europe LCCs and US ULCCs are the key comparison set",
        body: "Ryanair, easyJet, Spirit, and Frontier teach users the real economics of cabin-bag access better than a neutral overview ever will.",
      },
    ],
    spotlightAirlines: [
      { slug: "spirit", reason: "Spirit is where the personal-item game determines whether the fare stays cheap." },
      { slug: "frontier", reason: "Frontier is useful because timing and bundle choice change the outcome fast." },
      { slug: "ryanair", reason: "Ryanair is one of the clearest examples of paid cabin-bag monetization." },
      { slug: "easyjet", reason: "easyJet matters because seat bundles can effectively include the larger bag." },
    ],
    toolLinks: [
      { href: "/sizer-rules", label: "Sizer rules", reason: "This is the most important tool bridge because enforcement reality is the story." },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide", reason: "Use this when the question is not just the size limit, but whether the airline is likely to enforce it." },
      { href: "/guides/basic-economy-traps#basic-economy-tool", label: "Basic Economy decision tool", reason: "Use this when the cheapest fare may restrict carry-on access or make a checked bag more likely." },
      { href: "/best-cards", label: "Free checked bag calculator", reason: "The card tool matters after the traveler decides a checked-bag strategy is more rational than trying to beat the sizer." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Carry-on restrictions are one of the main ways cheap fares become fake cheap." },
    ],
    bridgeText: "After the carry-on page, the most useful next step is usually the airline-specific page or the enforcement guide that shows how strict the rule is in practice.",
  },
  seat_selection: {
    introLabel: "Seat fees are usually about selling anxiety, convenience, or fake upgrade value. This hub should help users spot which is happening.",
    scenarioCards: [
      {
        title: "Preferred does not always mean better",
        body: "Many carriers price non-legroom seats as if they were a real upgrade simply because they are closer to the front or window/aisle inventory is thin.",
      },
      {
        title: "Entry fares weaponize seat discomfort",
        body: "Basic or stripped-down fares use seating uncertainty to push users back into the paid experience they thought they had skipped.",
      },
      {
        title: "The right benchmark is all-in comfort cost",
        body: "A fare that requires paid seat selection to feel tolerable should be compared against the next cabin or a different airline, not judged in isolation.",
      },
    ],
    spotlightAirlines: [
      { slug: "delta", reason: "Delta is a strong example of premium seat upsell logic hiding inside a polished product." },
      { slug: "united", reason: "United is useful because Basic and Preferred pricing can create a fast seat-fee stack." },
      { slug: "american", reason: "American highlights how preferred and extra-legroom products can blur together for the buyer." },
      { slug: "easyjet", reason: "easyJet is a good European comparison because seats and bag access can interact." },
    ],
    toolLinks: [
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "This is the natural next step because Basic restrictions are usually what make seat fees feel unavoidable." },
      { href: "/best-cards", label: "Free checked bag calculator", reason: "Cards are not a direct seat-fee solution, but they matter when bag benefits make a more flexible fare rational." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "If the traveler is paying to avoid discomfort, it often helps to also inspect whether they are carrying the wrong bag for that airline." },
    ],
    bridgeText: "After the seat-fee page, compare the airline page and the fare guide, because seat pricing rarely exists in isolation.",
  },
  change_cancellation: {
    introLabel: "This page should help users decide whether the cheapest fare is actually safe to buy when plans are unstable.",
    scenarioCards: [
      {
        title: "The real cost is often not the fee label",
        body: "A fare can say no change fee and still become expensive once fare difference, credits, or locked restrictions show up.",
      },
      {
        title: "Low-cost carriers monetize timing and rescue behavior",
        body: "Frontier, Ryanair, and easyJet are useful because they show how late changes and stripped fares turn flexibility into a paid product.",
      },
      {
        title: "Legacy carriers still use the cheapest fare as the trapdoor",
        body: "United, Delta, American, and JetBlue all show versions of the same pattern: the worst flexibility lives in the lowest fare family.",
      },
    ],
    spotlightAirlines: [
      { slug: "united", reason: "United is a clean example of non-Basic flexibility versus Basic lockout." },
      { slug: "delta", reason: "Delta shows how Basic can still carry meaningful change and cancellation pain even on a polished product." },
      { slug: "frontier", reason: "Frontier's timing ladder is one of the clearest examples of change policy as a pricing weapon." },
      { slug: "ryanair", reason: "Ryanair is a strong benchmark for airlines that still price flexibility like a premium add-on." },
    ],
    toolLinks: [
      { href: "/best-cards", label: "Free checked bag calculator", reason: "Cards do not solve change fees directly, but they matter when bag benefits make the better fare rational instead of the stripped fare." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "Trip rescue often becomes worse when the traveler is also trying to force the wrong bag strategy onto the new itinerary." },
      { href: "/guides/basic-economy-traps", label: "Basic Economy guide", reason: "Most flexibility mistakes start with buying the cheapest fare family without pricing the downside." },
    ],
    bridgeText: "After the change-fee page, compare the airline-specific fare page and the stripped-fare guide, because flexibility problems usually start before the fee is ever charged.",
  },
  overweight_baggage: {
    introLabel: "This page should help users decide when to repack, split the load, or switch bag strategy before the airport becomes the most expensive place to solve the problem.",
    scenarioCards: [
      {
        title: "Overweight fees are often the fastest way to turn a normal trip into a bad one",
        body: "The jump from a normal checked bag to a 51-pound bag is often more painful than the original bag fee itself.",
      },
      {
        title: "The right move is often weight-splitting, not fee acceptance",
        body: "Southwest, Alaska, and other airlines make it obvious that shifting weight between bags is often cheaper than paying an overweight penalty.",
      },
      {
        title: "Carry-on strategy can prevent the whole problem",
        body: "If the traveler can stay in a strict but workable personal-item or cabin-bag setup, the overweight conversation disappears before check-in.",
      },
    ],
    spotlightAirlines: [
      { slug: "southwest", reason: "Southwest matters because the free-bag benchmark makes overweight penalties feel especially irrational." },
      { slug: "delta", reason: "Delta is a good legacy benchmark for the standard 51-70 and 71-100 pound pain ladder." },
      { slug: "frontier", reason: "Frontier shows how overweight charges stack on top of already fragile bag math." },
      { slug: "spirit", reason: "Spirit is useful because the bag can go from cheap trip to fee stack the moment weight control breaks." },
    ],
    toolLinks: [
      { href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=51&size=62", label: "Overweight baggage calculator", reason: "Use this when the bag is just over a common weight threshold and you need trip-level math." },
      { href: "/best-cards", label: "Free checked bag calculator", reason: "The card tool matters when the traveler decides checked-bag math is unavoidable and wants to lower the recurring cost of the first bag." },
      { href: "/sizer-rules", label: "Sizer rules", reason: "The cleanest way to avoid overweight fees is often to avoid checking a bag at all when the airline's carry-on reality allows it." },
      { href: "/guides/carry-on-strictness-by-airline", label: "Carry-on strictness guide", reason: "Strictness and bag shape determine whether a lighter carry-on strategy is realistic before the airport." },
    ],
    bridgeText: "After the overweight-baggage page, the most useful next step is usually the airline page or carry-on guide, because the best solution often happens before the scale, not after it.",
  },
  oversize_baggage: {
    introLabel: "Use this page when the bag shape, not just the bag count, could trigger a separate airport charge.",
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
      { href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=50&size=63", label: "Oversize baggage calculator", reason: "Use this when the bag crosses a common linear-inch threshold and you need trip-level math." },
      { href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=70&size=70", label: "Heavy and oversized scenario", reason: "Use this to model the worse case where both weight and size may matter." },
      { href: "/fees/checked_baggage", label: "Checked baggage baseline", reason: "Oversize fees may be in addition to the normal checked-bag fee, not a replacement for it." },
      { href: "/guides/international-baggage-allowance", label: "International allowance explainer", reason: "International itineraries may move the problem into piece, weight, route, or aircraft handling rules." },
    ],
    bridgeText: "After the oversize-baggage page, use the excess-baggage calculator and the airline page together, because oversize acceptance can be more conditional than ordinary checked baggage.",
  },
};
