export const CORE_10_SLUGS = [
  "united",
  "delta",
  "american",
  "southwest",
  "jetblue",
  "alaska",
  "spirit",
  "frontier",
  "ryanair",
  "easyjet",
] as const;

type StrategyGuide = {
  href: string;
  label: string;
};

type StrategyHighlight = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

type PlaybookSection = {
  id: string;
  title: string;
  body: string;
  tip: string;
};

type AirlineStrategy = {
  verdict: string;
  whyItWins: string;
  feeEngine: string;
  toolReason: string;
  relatedGuides: StrategyGuide[];
  relatedAirlines: string[];
  authorityHighlights?: StrategyHighlight[];
  playbookSections?: PlaybookSection[];
};

function playbookSections(sections: PlaybookSection[]): PlaybookSection[] {
  return sections;
}

function authorityHighlights(highlights: StrategyHighlight[]): StrategyHighlight[] {
  return highlights;
}

export const AIRLINE_STRATEGY: Record<string, AirlineStrategy> = {
  united: {
    verdict: "United is beatable if you manage bag timing, avoid Basic lockouts, and refuse airport pricing for predictable add-ons.",
    whyItWins: "United monetizes procrastination: airport bag payment, Basic Economy restrictions, and paid seat anxiety all punish travelers who wait.",
    feeEngine: "The main stack is Basic fare plus bag plus seat plus lost flexibility, with regional-jet edge cases making the carry-on story worse.",
    toolReason: "United is one of the clearest cases where bag-fee card break-even math can beat paying cash repeatedly.",
    relatedGuides: [
      { href: "/guides/basic-economy-traps", label: "Basic Economy traps" },
      { href: "/fees/checked_baggage", label: "Checked bag fee guide" },
      { href: "/fees/unaccompanied_minor", label: "Unaccompanied minor fees" },
    ],
    relatedAirlines: ["american", "delta"],
    authorityHighlights: authorityHighlights([
      { title: "Airport pricing is a designed penalty", body: "United is unusually clear about punishing the traveler who waits to pay for a checked bag, so timing is part of the product.", href: "/fees/checked_baggage", cta: "See bag timing" },
      { title: "Basic Economy is a lockout product", body: "United is one of the cleanest examples of an airline using Basic restrictions to force the traveler back into paid normality.", href: "/guides/basic-economy-traps", cta: "See Basic traps" },
      { title: "Regional aircraft details matter", body: "United Express edge cases change whether the bag plan works and whether under-seat space behaves like the website implies.", href: "/sizer-rules", cta: "Check enforcement" },
    ]),
  },
  delta: {
    verdict: "Delta feels cleaner than most carriers, but the real trap is paying polished premium pricing for comfort, seat position, and late-stage fixes that stop feeling optional.",
    whyItWins: "Delta's polish hides how fast seat, bag, and change costs stack when you book the cheapest fare and then try to travel normally.",
    feeEngine: "The pressure points are Basic restrictions, preferred seats, and overweight or oversize baggage surprises.",
    toolReason: "Delta travelers with recurring first-bag fees are ideal users for deterministic card math instead of vague card lists.",
    relatedGuides: [
      { href: "/guides/basic-economy-traps", label: "Basic Economy traps" },
      { href: "/fees/seat_selection", label: "Seat selection fees" },
      { href: "/fees/overweight_baggage", label: "Overweight baggage fees" },
    ],
    relatedAirlines: ["united", "american"],
    authorityHighlights: authorityHighlights([
      { title: "Premium feel does not mean low fee pressure", body: "Delta is strong at turning an orderly product into a reason to say yes to upsells that feel harmless in isolation.", href: "/fees/seat_selection", cta: "Inspect seat pricing" },
      { title: "Basic risk is flexibility risk", body: "Delta's entry fare looks more reasonable than many rivals until plans move and the real price gap appears in change behavior.", href: "/guides/basic-economy-traps", cta: "Compare Basic tradeoffs" },
      { title: "Bag shape still changes outcomes", body: "Delta's gate culture can reward soft, compressible bags over rigid rollers even when the published rule looks neutral.", href: "/sizer-rules", cta: "See sizer reality" },
    ]),
    playbookSections: playbookSections([
      { id: "bags", title: "1) Bags: Delta is straightforward until the trip stops being standard", body: "Delta's first-bag pricing is not the trap by itself. The trap is assuming Delta's polished brand means there is no fee-stack risk once the bag gets heavier, larger, or attached to the wrong fare.", tip: "Use Delta as a baseline airline. If another airline charges more for a normal first bag, compare all-in cost before assuming the cheaper ticket wins." },
      { id: "basic", title: "2) Basic Economy: the restriction is flexibility, not just comfort", body: "Delta Basic can still look manageable at booking, but the change and cancellation rules are where the real price gap shows up.", tip: "If the trip has any chance of moving, treat non-Basic Delta as insurance instead of optional comfort." },
      { id: "seats", title: "3) Seats: Delta monetizes polish well", body: "Preferred and nicer-position seats feel harmless on Delta because the product looks premium. That is exactly why the upsell works.", tip: "Pay for Delta seating only when the seat solves a real problem, not because the cabin map makes a normal seat feel scarce." },
      { id: "changes", title: "4) Changes: free can still be expensive", body: "Delta's no-change-fee language sounds generous, but fare difference still controls the real cost and Basic can still become the bad decision fast.", tip: "Make sure you bought the right fare before the schedule gets unstable." },
    ]),
  },
  american: {
    verdict: "American's biggest trap is operational, not just financial: regional gate-check reality and discretionary carry-on enforcement create hidden downside beyond the published fee table.",
    whyItWins: "American mixes standard legacy-carrier bag math with regional-fleet edge cases that can ruin the travel day if you treat every carry-on as equally safe.",
    feeEngine: "Bag fees, preferred seating, route-specific baggage pricing, and regional gate-check consequences are the biggest pain points.",
    toolReason: "American's first-bag pricing is a strong fit for card break-even analysis, especially for travelers who fly domestic routes several times a year.",
    relatedGuides: [
      { href: "/guides/basic-economy-traps", label: "Basic Economy traps" },
      { href: "/sizer-rules", label: "Sizer enforcement reality" },
      { href: "/fees/checked_baggage", label: "Checked bag fee guide" },
    ],
    relatedAirlines: ["delta", "united"],
    authorityHighlights: authorityHighlights([
      { title: "Regional flying changes the risk profile", body: "American Eagle edge cases make this airline more operationally hostile than the base fare table suggests, especially when the bag leaves your sight.", href: "/sizer-rules", cta: "Review carry-on reality" },
      { title: "Route-specific bag pricing matters", body: "American is a bad airline for casual baggage assumptions because region and route change the real price fast.", href: "/fees/checked_baggage", cta: "Compare baggage rows" },
      { title: "Seat products blur together by design", body: "Preferred and Main Cabin Extra can make the normal seat feel artificially low-value when the real difference is not always meaningful.", href: "/fees/seat_selection", cta: "Inspect seat fees" },
    ]),
    playbookSections: playbookSections([
      { id: "bags", title: "1) Bags: route context matters more on American than many travelers expect", body: "American's baggage pricing moves around by region more than the traveler expects. Domestic logic does not always survive a transatlantic or Latin America itinerary.", tip: "Never assume your last American bag fee is the right benchmark for the next route." },
      { id: "basic", title: "2) Basic Economy: cheap until you need normal travel behavior", body: "American Basic is another classic case where the published fare looks manageable until seat choice, change flexibility, and bag needs force you back into paid fixes.", tip: "If your trip needs a specific seat or any flexibility, compare against the next fare family before you lock in." },
      { id: "seats", title: "3) Seats: preferred and extra-legroom products blur together", body: "American can make a normal Main Cabin seat feel worse than it is by surrounding it with paid seat products that look like necessities.", tip: "Buy the seat only if you know which discomfort you are actually solving." },
      { id: "changes", title: "4) Changes: the financial rule is not the whole story", body: "On American, the hidden cost can be operational: if the flight involves a regional aircraft, bag and change stress combine fast.", tip: "Treat regional itineraries as higher-risk and keep essentials out of tagged bags." },
    ]),
  },
  southwest: {
    verdict: "Southwest still matters because free checked bags can reset the math, but the newer fare structure means travelers should stop treating old Southwest assumptions as universal truth.",
    whyItWins: "Southwest is the benchmark airline for bag value, yet its newer fare structure means users still need to read the fine print.",
    feeEngine: "You are trading bag savings against fare-family differences, seating or boarding changes, and same-day flexibility rules.",
    toolReason: "Southwest works as a benchmark airline users should compare against before paying annual fees elsewhere just to claw back bag costs.",
    relatedGuides: [{ href: "/fees/checked_baggage", label: "Checked bag fee guide" }, { href: "/fees/change_cancellation", label: "Change and cancellation guide" }, { href: "/guides/basic-economy-traps", label: "Basic Economy traps" }],
    relatedAirlines: ["jetblue", "alaska"],
    authorityHighlights: authorityHighlights([
      { title: "This is a benchmark page now", body: "Southwest helps users answer whether another airline's low fare is actually low once a normal bag enters the trip.", href: "/fees/checked_baggage", cta: "Compare bag economics" },
      { title: "The old free-bag story is not the whole story", body: "Southwest now needs closer reading by fare family and booking timing, which makes the airline strategically more interesting than its reputation suggests.", href: "/fees/change_cancellation", cta: "See fare flexibility" },
      { title: "Seat and boarding changes are the new friction zone", body: "As Southwest becomes more segmented, users need to compare it less as mythology and more as an all-in product.", href: "/fees/seat_selection", cta: "Inspect seat pressure" },
    ]),
    playbookSections: playbookSections([
      { id: "bags", title: "1) Bags: Southwest is now a benchmark, not a blanket free-bag assumption", body: "Southwest still matters because it changes what users think a fair all-in fare looks like. But the fee rows now make clear that not every new booking behaves like the old free-bag story.", tip: "Use Southwest as the comparison airline whenever another carrier's first-bag math starts looking silly." },
      { id: "basic", title: "2) Entry fares: the product is changing", body: "Southwest is less about classic Basic traps and more about the transition from the old open model into a more segmented fare system.", tip: "Do not rely on legacy Southwest expectations when the fare family or booking date changed." },
      { id: "seats", title: "3) Seats: this is the new friction point to watch", body: "Because Southwest historically stood apart on seating, any move toward paid seating becomes strategically important for users comparing all-in value.", tip: "If you are paying Southwest for seat certainty, compare that trip against airlines where the seat is already solved in the fare you want." },
      { id: "changes", title: "4) Changes: flexibility still matters here", body: "Southwest remains useful for travelers who value same-day movement and easier cancellation behavior, but those strengths should be read against the specific fare family.", tip: "This is one of the few airlines where flexibility can still be a real product advantage, not just marketing copy." },
    ]),
  },
  jetblue: {
    verdict: "JetBlue can feel customer-friendly until bag timing, fare-family restrictions, and seat upsells turn the booking flow into a soft fee stack.",
    whyItWins: "The trap is assuming JetBlue's brand tone means the add-on math is harmless.",
    feeEngine: "Fare family differences, bag timing, and Even More Space upsells are where the economics shift.",
    toolReason: "JetBlue card and bag comparisons only work when they stay deterministic, which makes the calculator a better bridge than a generic card roundup.",
    relatedGuides: [{ href: "/guides/basic-economy-traps", label: "Basic Economy traps" }, { href: "/fees/seat_selection", label: "Seat selection fees" }, { href: "/fees/checked_baggage", label: "Checked bag fee guide" }],
    relatedAirlines: ["alaska", "southwest"],
    authorityHighlights: authorityHighlights([
      { title: "Bag timing is more important than it looks", body: "JetBlue can punish late bag decisions in a way that makes a normal-feeling fare stop being normal.", href: "/fees/checked_baggage", cta: "Review bag timing" },
      { title: "Blue Basic is soft-spoken, not soft-priced", body: "The restrictions are presented more gently than on a ULCC, but the all-in math still punishes the traveler who expected a normal trip.", href: "/guides/basic-economy-traps", cta: "See Basic fare traps" },
      { title: "Seat upgrades need actual justification", body: "JetBlue's comfort branding makes premium seats sound rational. Sometimes they are. The trap is assuming every upsell is.", href: "/fees/seat_selection", cta: "Inspect seat options" },
    ]),
    playbookSections: playbookSections([
      { id: "bags", title: "1) Bags: timing is the JetBlue trap most people miss", body: "JetBlue's bag pricing can look normal until you discover the timing penalty near departure. That turns procrastination into a measurable surcharge.", tip: "If you know you will check, lock it in before the final 24 hours and compare the total against the next-best airline." },
      { id: "basic", title: "2) Blue Basic: the soft version of a hard trap", body: "JetBlue often packages restrictions more gently than an ultra-low-cost carrier, but the economics still punish the traveler who expects a normal trip from the cheapest fare.", tip: "Read Blue Basic as an optimization problem, not a default recommendation." },
      { id: "seats", title: "3) Seats: comfort branding can hide the upsell logic", body: "Even More Space sounds more rational than many seat products because it often is. The mistake is treating every seat upgrade inside JetBlue's flow as equally worthwhile.", tip: "Pay for extra space only when it solves a real comfort or schedule problem, not because the booking flow makes the standard seat feel bad." },
      { id: "changes", title: "4) Changes: flexibility depends on the bundle", body: "JetBlue's no-fee language is strongest on the better fare families. That means fare choice still determines whether the policy helps you.", tip: "Check the fare bundle before trusting the headline flexibility copy." },
    ]),
  },
  alaska: {
    verdict: "Alaska is relatively traveler-friendly, which makes it useful as a benchmark: when another airline's cheap fare needs multiple paid fixes, Alaska often wins on all-in value.",
    whyItWins: "Alaska's strength is not zero fees. It is that the tradeoffs are usually clearer and less punitive than the industry norm.",
    feeEngine: "Bag fees are straightforward, while route-specific perks and practical exceptions create the real decision edge.",
    toolReason: "Alaska is where users need hard math to decide when card benefits or bag-inclusive alternatives actually outperform paying a la carte.",
    relatedGuides: [{ href: "/fees/checked_baggage", label: "Checked bag fee guide" }, { href: "/fees/unaccompanied_minor", label: "Unaccompanied minor fees" }, { href: "/sizer-rules", label: "Sizer enforcement reality" }],
    relatedAirlines: ["jetblue", "southwest"],
    authorityHighlights: authorityHighlights([
      { title: "This page is useful as a benchmark", body: "Alaska often helps users spot when another airline's supposedly cheap fare only works after multiple paid repairs.", href: "/fees/checked_baggage", cta: "Compare bag economics" },
      { title: "The clearest product can still hide bad assumptions", body: "Alaska is easier to reason about than many rivals, which makes it easy for users to stop thinking too early.", href: "/fees/unaccompanied_minor", cta: "Inspect route carve-outs" },
      { title: "Perks and exceptions matter more here", body: "This is one of the airlines where practical exceptions can genuinely change the decision.", href: "/sizer-rules", cta: "Review enforcement context" },
    ]),
    playbookSections: playbookSections([
      { id: "bags", title: "1) Bags: Alaska is straightforward, which is exactly why it is useful", body: "Alaska's bag pricing is less about trickery and more about using a clean benchmark against worse airline behavior.", tip: "If another airline needs extra paid fixes to compete with Alaska, the cheaper ticket is often fake cheap." },
      { id: "basic", title: "2) Saver-style restrictions: lower drama, but still worth pricing correctly", body: "Alaska is not free of restrictions. The difference is that the product is usually easier to reason about than the average legacy or ULCC fare trap.", tip: "Use Alaska to compare clarity and all-in value, not just the first fare you see." },
      { id: "seats", title: "3) Seats: beware paying for certainty you may already have", body: "Because Alaska often starts from a more traveler-friendly position, the wrong move is overpaying for marginal seat improvements out of habit.", tip: "Make sure the seat fee is solving a real problem, not just a booking-flow prompt." },
      { id: "changes", title: "4) Changes: route and fare details still matter", body: "Alaska's policy language is clearer than many rivals, but post-booking flexibility still depends on exactly what was bought.", tip: "For uncertain trips, use Alaska's clarity as part of the value equation, not just the ticket price." },
    ]),
  },
  spirit: {
    verdict: "Spirit is not cheap by default. It is only cheap when you win the personal-item game and avoid every human-touchpoint surcharge in the funnel.",
    whyItWins: "On Spirit, fees are not side revenue. They are the product.",
    feeEngine: "Carry-on, checked bag timing, airport printing, and size enforcement are the main profit levers.",
    toolReason: "Spirit works best when travelers compare the total fee stack against a more normal airline and then use sizer logic before even thinking about a card.",
    relatedGuides: [{ href: "/sizer-rules", label: "Sizer enforcement reality" }, { href: "/fees/carry_on", label: "Carry-on fee guide" }, { href: "/fees/checked_baggage", label: "Checked bag fee guide" }],
    relatedAirlines: ["frontier", "ryanair"],
    authorityHighlights: authorityHighlights([
      { title: "This is a personal-item discipline airline", body: "Spirit only works when the bag stays out of the machine. Once the traveler loses the personal-item game, the headline fare stops mattering.", href: "/fees/carry_on", cta: "See carry-on logic" },
      { title: "Human touchpoints are part of the fee model", body: "Spirit makes money from extra decisions and avoidable friction, which is why the user journey matters more than the isolated fee row.", href: "/guides/basic-economy-traps", cta: "See stripped-fare logic" },
      { title: "Sizer culture is the product", body: "This airline is one of the clearest reasons the site needs enforcement pages and not just published dimensions.", href: "/sizer-rules", cta: "Review enforcement reality" },
    ]),
  },
  frontier: {
    verdict: "Frontier is a fee-logic airline: if you buy the wrong bundle at the wrong time, the fare that looked cheapest stops being a bargain very quickly.",
    whyItWins: "Frontier's revenue model depends on separating normal travel behavior into paid decisions.",
    feeEngine: "Carry-on, checked bags, change timing, and bundle pricing do most of the damage.",
    toolReason: "Frontier users need deterministic comparison paths more than affiliate-style recommendations, which makes the sizer and fee guides the right monetization bridge.",
    relatedGuides: [{ href: "/sizer-rules", label: "Sizer enforcement reality" }, { href: "/fees/carry_on", label: "Carry-on fee guide" }, { href: "/fees/change_cancellation", label: "Change and cancellation guide" }],
    relatedAirlines: ["spirit", "ryanair"],
    authorityHighlights: authorityHighlights([
      { title: "Bundle timing is the whole story", body: "Frontier's base fare tells you almost nothing by itself. The real decision is when and how you buy back normal travel behavior.", href: "/fees/carry_on", cta: "Review bag and bundle logic" },
      { title: "Late fixes are where the airline wins", body: "Frontier behaves like a timing ladder. The later the traveler solves the problem, the more likely the airline gets paid.", href: "/fees/change_cancellation", cta: "See timing pressure" },
      { title: "Seat pricing matters when it changes the bundle", body: "Seats are less about comfort here than about accidentally buying back normality through the wrong product path.", href: "/sizer-rules", cta: "Check the bag-first strategy" },
    ]),
  },
  ryanair: {
    verdict: "Ryanair only works in your favor when you treat baggage, currency selection, and airport behavior as part of the booking strategy, not an afterthought.",
    whyItWins: "Ryanair monetizes optionality aggressively, especially around cabin bags, timing, and airport handling.",
    feeEngine: "Priority boarding, cabin-bag access, checked bag timing, and change fees create the real trip price.",
    toolReason: "Ryanair is a strong use case for sizer-first advice because enforcement risk changes the cost equation before any other tool does.",
    relatedGuides: [{ href: "/sizer-rules", label: "Sizer enforcement reality" }, { href: "/fees/carry_on", label: "Carry-on fee guide" }, { href: "/guides/basic-economy-traps", label: "Basic fare traps" }],
    relatedAirlines: ["easyjet", "spirit"],
    authorityHighlights: authorityHighlights([
      { title: "This is a cabin-bag strategy page first", body: "Ryanair's rules make baggage the product, which means the authority page needs to orient the user before the fee table ever starts.", href: "/fees/carry_on", cta: "See cabin-bag economics" },
      { title: "Optionality is what gets monetized", body: "Ryanair makes money from unfinished bookings, uncertain seats, and late plan changes more aggressively than most carriers in this repo.", href: "/guides/basic-economy-traps", cta: "See stripped-fare traps" },
      { title: "Strict enforcement changes the whole decision", body: "This is one of the strongest cases for moving users into sizer and bag-shape logic immediately.", href: "/sizer-rules", cta: "Check enforcement reality" },
    ]),
  },
  easyjet: {
    verdict: "easyJet is less punitive than Ryanair in some flows, but cabin-bag and seat upsell logic still turn cheap fares into real fee stacks quickly.",
    whyItWins: "easyJet wins when you compare all-in cost, not when you compare the first number shown in search.",
    feeEngine: "Cabin bag entitlement, upfront seat choices, and route-specific extras drive the real spend.",
    toolReason: "easyJet users benefit most from enforcement and bag-shape guidance before they ever reach product recommendations.",
    relatedGuides: [{ href: "/sizer-rules", label: "Sizer enforcement reality" }, { href: "/fees/carry_on", label: "Carry-on fee guide" }, { href: "/fees/seat_selection", label: "Seat selection fees" }],
    relatedAirlines: ["ryanair", "jetblue"],
    authorityHighlights: authorityHighlights([
      { title: "Seat and bag logic are tied together here", body: "easyJet's larger cabin-bag path can depend on what seat or bundle you buy, which makes this more than a simple baggage page.", href: "/fees/carry_on", cta: "See cabin-bag paths" },
      { title: "It looks calmer than Ryanair, but the stack is still real", body: "easyJet often feels less hostile at first glance. The all-in economics still punish the traveler who does not plan the bag and seat path early.", href: "/fees/seat_selection", cta: "Inspect seat add-ons" },
      { title: "This is a compare-all-in airline", body: "easyJet is best understood next to Ryanair and a more traditional carrier, not as a stand-alone cheap fare.", href: "/sizer-rules", cta: "Check enforcement context" },
    ]),
  },
  zipair: {
    verdict: "ZIPAIR's low base fare stays low only when cabin weight, purchased baggage, and seat choices remain under control on a long-haul itinerary.",
    whyItWins: "ZIPAIR separates core trip costs more aggressively than a legacy carrier, so bag weight and optional extras shape the real price quickly.",
    feeEngine: "The main pressure points are the 7 kg combined cabin allowance, paid checked baggage by weight, optional seat fees, and fee-based changes.",
    toolReason: "ZIPAIR is most useful as a baggage-and-fee comparison case, especially against long-haul legacy pricing once add-ons are included.",
    relatedGuides: [
      { href: "/fees/carry_on", label: "Carry-on fee guide" },
      { href: "/fees/checked_baggage", label: "Checked bag fee guide" },
      { href: "/passenger-rights/eu261", label: "EU261 passenger rights reference" },
    ],
    relatedAirlines: ["frontier", "united"],
    authorityHighlights: authorityHighlights([
      { title: "Cabin weight is the first real decision point", body: "ZIPAIR's combined 7 kg cabin limit matters more than a generic carry-on allowance headline because heavy electronics and shopping can push the trip into paid baggage territory fast.", href: "/fees/carry_on", cta: "Review cabin limits" },
      { title: "Checked baggage is bought, not assumed", body: "ZIPAIR sells checked baggage by purchased allowance, which means the all-in comparison should happen before the ticket is treated as a bargain.", href: "/fees/checked_baggage", cta: "Compare bag math" },
      { title: "Flexibility is narrow on the cheapest path", body: "Changes can require both a fee and a fare difference, while cancellations are generally not permitted except where the airline expressly allows them.", href: "/passenger-rights/eu261", cta: "Review rights context" },
    ]),
    playbookSections: playbookSections([
      { id: "bags", title: "1) Bags: the cabin-weight rule is the first real ZIPAIR filter", body: "ZIPAIR's published carry-on rule includes one cabin bag and one personal item, but the combined limit is 7 kg. That makes cabin weight, not just bag count, the first place the cheap fare can break.", tip: "Use the 7 kg combined cabin rule as the first screening number before treating the base fare as comparable." },
      { id: "checked", title: "2) Checked baggage: buy the allowance into the comparison early", body: "ZIPAIR's checked baggage is not included by default and is purchased by allowance. On a long-haul trip, that can change the real fare comparison before seats or flexibility even enter the math.", tip: "If a checked bag is likely, compare ZIPAIR only after baggage has been added to the fare model." },
      { id: "seats", title: "3) Seats: optional does not mean irrelevant on a long-haul flight", body: "Seat selection is chargeable and varies by seat type and timing. That matters more on an overnight or long-haul trip than it does on a short domestic hop.", tip: "Treat paid seating as part of the trip baseline when the flight length makes seat location materially important." },
      { id: "changes", title: "4) Changes: flexibility is limited enough to price upfront", body: "ZIPAIR's published change rule permits changes with a fee plus fare difference, while cancellations are generally not permitted except where the airline explicitly allows them. That makes flexibility a real part of the purchase decision.", tip: "When the trip is uncertain, compare ZIPAIR against a more flexible airline with the likely bag cost already included." },
    ]),
  },
};

export function isCoreAirline(slug: string): boolean {
  return CORE_10_SLUGS.includes(slug as (typeof CORE_10_SLUGS)[number]);
}
