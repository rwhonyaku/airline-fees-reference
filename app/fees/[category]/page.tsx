import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAirlineBySlug, getAirlineSlugs } from "@/lib/data";
import { FEE_HUB_STRATEGY } from "@/lib/fee-hub-strategy";
import { CheckedBagCardMathCallout } from "@/components/CheckedBagCardMathCallout";
import { JsonLd } from "@/components/JsonLd";
import { canonical } from "@/lib/seo";
import { hasActiveStrategyPage } from "@/lib/airline-strategy";
import { getVerificationFreshness } from "@/lib/freshness";
import { FEE_CATEGORY_KEYS } from "@/content/fee-categories";

type PageProps = {
  params: Promise<{ category: string }>;
};

type Row = {
  slug: string;
  airlineName: string;
  iata?: string;
  amountText: string;
  appliesTo: string;
  regionOrRoute: string;
  timing: string;
  conditions: string;
  sourceUrl: string | null;
  lastVerified: string;
};

function safeText(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return "Not published";
}

function safeUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  try {
    return new URL(s).toString();
  } catch {
    return null;
  }
}

function safeDate(v: unknown): string {
  if (typeof v !== "string") return "Not published";
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "Not published";
}

function getLatestVerifiedDate(rows: Row[]): string {
  const dates = rows.map((row) => row.lastVerified).filter((date) => date !== "Not published");
  return dates.length ? dates.sort().at(-1)! : "Not published";
}

function getOldestVerifiedDate(rows: Row[]): string {
  const dates = rows.map((row) => row.lastVerified).filter((date) => date !== "Not published");
  return dates.length ? dates.sort().at(0)! : "Not published";
}

function getFeeFaq(category: string): Array<{ question: string; answer: string }> {
  switch (category) {
    case "checked_baggage":
      return [
        {
          question: "How much are checked baggage fees?",
          answer:
            "Checked baggage fees depend on airline, route, fare family, bag count, trip direction, and when the bag is purchased. Some fares include a first checked bag, while Basic, Light, or low-cost fares may charge separately.",
        },
        {
          question: "Are baggage fees round trip?",
          answer:
            "Usually no. Baggage fees are commonly charged per direction, so a roundtrip can mean paying the checked-bag fee once on the outbound flight and again on the return flight. Always check whether the airline lists the fee as one-way, per direction, or per segment.",
        },
        {
          question: "How should I compare airline baggage fees?",
          answer:
            "Compare the total trip cost, not only the first-bag row. Use airline, travelers, bags per traveler, one-way versus roundtrip, route, fare family, included allowance, and whether a card or status benefit removes the first checked bag.",
        },
        {
          question: "Why does a checked bag fee sometimes vary?",
          answer:
            "The price can vary because airlines separate domestic, transborder, and international routes, prepaid and airport purchase timing, fare families, and partner-operated itineraries.",
        },
        {
          question: "Can a credit card remove checked bag fees?",
          answer:
            "Some airline credit cards publish a first checked bag benefit for the cardholder and eligible companions. The exact coverage depends on airline, reservation, route, traveler count, and card-payment rules.",
        },
      ];
    case "carry_on":
      return [
        {
          question: "Do airlines charge for carry-on bags?",
          answer:
            "Some do. Many full-service fares include an overhead-bin carry-on, while ultra-low-cost and some Basic fares include only a smaller personal item. The airline, fare, route, bag size, and purchase timing determine the answer.",
        },
        {
          question: "Is a personal item the same as a carry-on bag?",
          answer:
            "No. A personal item normally must fit under the seat and has a smaller size limit. A full-size carry-on normally uses the overhead bin and may require a paid fare, bundle, seat product, or separate bag purchase.",
        },
        {
          question: "When is the cheapest time to buy a carry-on bag?",
          answer:
            "When the airline sells carry-on access separately, buying during the original booking is commonly safer than waiting until check-in, the airport, or the gate. Use the airline's live price because route and timing can change the amount.",
        },
        {
          question: "Can an oversized personal item be charged as a carry-on?",
          answer:
            "Yes. If the free personal item exceeds its published dimensions, the airline can treat it as a paid carry-on or checked bag. Gate pricing may be less forgiving than booking-time pricing.",
        },
      ];
    case "overweight_baggage":
      return [
        {
          question: "How much is the charge for overweight baggage?",
          answer:
            "There is no single universal overweight baggage charge. The fee depends on the airline, route, currency, cabin or fare allowance, and how far over the limit the checked bag is.",
        },
        {
          question: "When is a checked bag overweight?",
          answer:
            "Many airlines begin overweight treatment above 50 lb or 23 kg, but the exact threshold and maximum accepted weight depend on the airline, cabin, route, and baggage allowance.",
        },
        {
          question: "Can overweight baggage fees stack with checked bag fees?",
          answer:
            "Yes. The overweight charge may be added on top of the normal checked bag fee, especially when the bag is both a paid checked bag and over the standard weight limit.",
        },
      ];
    case "oversize_baggage":
      return [
        {
          question: "How much is the charge for oversized baggage?",
          answer:
            "Oversized baggage charges depend on airline, route, bag dimensions, special-item rules, and whether the oversize charge stacks with the normal checked-bag fee. Some very large items may need special handling instead of ordinary checked baggage.",
        },
        {
          question: "When is a checked bag oversized?",
          answer:
            "Many airlines screen oversize bags above 62 linear inches or 158 cm, but limits and acceptance rules vary by carrier, route, aircraft, and special-item category.",
        },
        {
          question: "Can a bag be both overweight and oversized?",
          answer:
            "Yes. A bag can cross both weight and size thresholds, and some airlines may charge both fees or refuse very large or heavy bags as ordinary checked baggage.",
        },
      ];
    case "sports_equipment":
      return [
        {
          question: "Does sports equipment count as a normal checked bag?",
          answer:
            "Sometimes. An airline may count eligible, correctly packed equipment within the normal checked-bag allowance, charge the standard bag price, sell a separate sports allowance, or apply an item-specific fee. Check the exact item and route rather than assuming all sports gear receives the same treatment.",
        },
        {
          question: "How much does it cost to fly with sports equipment?",
          answer:
            "There is no universal sports-equipment price. The cost can depend on the item, route, fare allowance, bag count, weight, dimensions, purchase timing, and whether the airline requires a separate sports-baggage product.",
        },
        {
          question: "Do I need to reserve sports equipment before flying?",
          answer:
            "Some airlines require or recommend advance registration, especially for bicycles, boards, bulky equipment, or flights with limited hold capacity. Use the airline source in the table to confirm the deadline and acceptance conditions.",
        },
        {
          question: "Can overweight or oversize charges apply to sports equipment?",
          answer:
            "Yes. Some published sports-equipment rules waive a particular oversize charge, while others apply normal excess-weight, excess-size, or extra-piece charges. A sports-item label alone does not prove that excess fees are waived.",
        },
      ];
    default:
      return [];
  }
}

function breadcrumbJsonLd(title: string, href: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: canonical("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Fee categories",
        item: canonical("/fees"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: canonical(href),
      },
    ],
  };
}

function feePageJsonLd(params: {
  title: string;
  description: string;
  href: string;
  latestVerified: string;
  rows: Row[];
  faqs: Array<{ question: string; answer: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd(params.title, params.href),
      {
        "@type": "WebPage",
        "@id": canonical(params.href),
        url: canonical(params.href),
        name: `${params.title} fees by airline`,
        description: params.description,
        dateModified: params.latestVerified !== "Not published" ? params.latestVerified : undefined,
        about: {
          "@type": "Thing",
          name: `${params.title} airline fees`,
        },
        mainEntity: params.faqs.length
          ? {
              "@type": "FAQPage",
              mainEntity: params.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }
          : undefined,
      },
      {
        "@type": "ItemList",
        name: `${params.title} fee table`,
        numberOfItems: params.rows.length,
        itemListElement: params.rows.slice(0, 50).map((row, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Thing",
            name: `${row.airlineName}: ${row.amountText}`,
            description: [row.appliesTo, row.regionOrRoute, row.conditions].filter(Boolean).join(" · "),
            url: canonical(`/airlines/${row.slug}`),
          },
        })),
      },
    ],
  };
}

function formatAmount(amount: unknown, currency: unknown): string {
  const cur = typeof currency === "string" ? currency.trim() : "";

  if (typeof amount === "number" && Number.isFinite(amount)) {
    return cur ? `${amount.toFixed(0)} ${cur}` : `${amount.toFixed(0)}`;
  }

  if (typeof amount === "string" && amount.trim()) {
    const a = amount.trim();
    if (a.toLowerCase() === "not permitted") return "Not permitted";
    return cur ? `${a} ${cur}` : a;
  }

  return "Not published";
}

function formatContextualAmount(item: { amount: unknown; currency: unknown; category?: string; conditions?: string; applies_to?: string; region_or_route?: string; timing?: string }): string {
  if (typeof item.amount === "number" && Number.isFinite(item.amount)) return formatAmount(item.amount, item.currency);
  if (typeof item.amount !== "string" || !item.amount.trim()) return "Not published";

  const raw = item.amount.trim();
  if (raw.toLowerCase() !== "varies") return formatAmount(item.amount, item.currency);

  const text = [item.conditions, item.applies_to, item.region_or_route, item.timing]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (item.category === "checked_baggage" && (text.includes("additional") || text.includes("my bookings") || text.includes("purchase"))) {
    return "Shown during booking / manage booking";
  }
  if (item.category === "checked_baggage") return "Depends on route and fare";
  if (item.category === "carry_on" && text.includes("basic")) return "Basic fare add-on shown in booking";
  if (item.category === "carry_on") return "Depends on fare and purchase timing";
  if (item.category === "overweight_baggage") return "Airport-priced by route and weight";
  if (item.category === "oversize_baggage") return "Airport-priced by route and size";
  if (item.category === "seat_selection") return "Depends on route, fare, and seat type";
  if (item.category === "change_cancellation") return "Depends on fare conditions";
  if (item.category === "unaccompanied_minor") return "Depends on age and itinerary";

  return "Depends on route, fare, or timing";
}

function titleCaseFromSlug(s: string): string {
  return s
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function belongsToPublicCategory(itemCategory: string, pageCategory: string): boolean {
  if (itemCategory === pageCategory) return true;
  return (
    pageCategory === "change_cancellation" &&
    (itemCategory === "same_day_change" || itemCategory === "same_day_standby")
  );
}

function getHubCopy(category: string) {
  switch (category) {
    case "checked_baggage":
      return {
        verdict:
          "Checked baggage fees are usually charged per direction, not once for the whole roundtrip. The useful answer is the trip total: airline, travelers, bags per traveler, one-way versus roundtrip, fare family, route, and whether the first checked bag is included or paid separately.",
        proTip:
          "Start with the exact trip: airline, travelers, bags per traveler, roundtrip or one-way, and whether the bag is being bought before the airport. That is the fastest way to turn a baggage-fee comparison into a useful estimate.",
        loophole:
          "The cleanest way to avoid checked bag fees is deciding early whether the trip works with a personal item, a carry-on plan, or a bag benefit that removes the first checked bag fee.",
        whatToWatch:
          "Watch prepaid versus airport pricing, one-way versus roundtrip math, included international allowances, Basic or Light fare limits, and whether the cheapest fare makes a checked bag more likely.",
      };
    case "carry_on":
      return {
        verdict:
          "Airlines do not all include a full-size carry-on. Many fares include an overhead-bin bag, but Frontier, Ryanair, easyJet, and some Basic fares separate the free under-seat personal item from paid cabin-bag access. Check entitlement, dimensions, weight, and purchase timing before comparing fares.",
        proTip:
          "Treat bag shape as part of the cost decision. Soft, compressible bags often outperform rigid rollers even when the claimed dimensions look similar.",
        loophole:
          "On some airlines, buying the right seat or bundle is actually a cheaper way to buy cabin-bag access than paying for the bag as a standalone add-on.",
        whatToWatch:
          "Check whether the fare includes a full cabin bag or only a personal item, whether a bundle or seat adds overhead access, and what happens if the bag is rejected at the gate.",
      };
    case "seat_selection":
      return {
        verdict:
          "A preferred seat may change location without adding legroom. Confirm the actual benefit before paying for the label.",
        proTip:
          "If you are going to pay for a seat, re-check inventory at online check-in. Booking-time seat pricing is often the worst moment to buy.",
        loophole:
          "Sometimes the right move is not to pay the seat fee. It is to buy out of the restrictive fare or switch airlines before the add-ons pile up.",
        whatToWatch:
          "Compare Basic versus non-Basic seat behavior, preferred versus legroom products, and whether seat selection also changes bag entitlement.",
      };
    case "change_cancellation":
      return {
        verdict:
          "No change fee is not the same as free flexibility. Fare differences and restricted entry fares are where the real cost hides.",
        proTip:
          "When your plans might move, compare the flexible fare against the likely change cost before choosing the cheapest fare.",
        loophole:
          "The real loophole is avoiding locked fares before you need them, not trying to rescue them after the trip changes.",
        whatToWatch:
          "Check 24-hour windows, whether credits are issued instead of refunds, and what Basic or stripped-down fares block.",
      };
    case "unaccompanied_minor":
      return {
        verdict:
          "Unaccompanied minor fees are a blunt, high-ticket charge, but the bigger issue is whether the service is required, optional, route-limited, or not offered at all.",
        proTip:
          "Confirm the age band and itinerary rules before price-comparing fares. A cheap connection can be useless if the airline only allows nonstop UM travel.",
        loophole:
          "The cheapest workaround is often itinerary design: nonstop routing or a different airline can beat paying a high service fee on the wrong itinerary.",
        whatToWatch:
          "Check age rules, nonstop-only restrictions, route carve-outs, and carriers that simply do not offer the service.",
      };
    case "overweight_baggage":
      return {
        verdict:
          "Overweight baggage fees usually start when a checked bag is above the airline's normal weight allowance, commonly 50 lb / 23 kg. The exact charge is airline- and route-specific, and very heavy bags may be refused or sent through cargo instead of priced as ordinary checked baggage.",
        proTip:
          "Weigh the bag before leaving home. If it is only slightly over the limit, moving a few pounds into another bag can be cheaper than accepting an airport overweight charge.",
        loophole:
          "The legitimate workaround is weight control: split items across bags, use an included carry-on or personal item when allowed, or buy the right baggage allowance before airport day if the airline sells it.",
        whatToWatch:
          "Watch the airline's standard allowance, higher weight bands, route or cabin exceptions, and maximum accepted checked-bag weight.",
      };
    default:
      return {
        verdict:
          "These fees can make a low fare more expensive than the alternative. Compare the fare plus the add-ons the trip actually needs.",
        proTip:
          "Check the airline page after this table to see how the rule behaves on your fare class and route.",
        loophole:
          "The best loophole is usually not cleverness. It is choosing a fare or airline that does not need rescuing.",
        whatToWatch:
          "Watch route carve-outs, fare-family differences, and whether the fee is really a disguised upsell.",
      };
  }
}

function getContextualBridge(category: string) {
  switch (category) {
    case "checked_baggage":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Some airline credit cards include a published first checked bag benefit for the primary
          cardholder and, in some cases, companions on the same reservation. Use the{" "}
          <Link href="/guides/airline-credit-card-baggage-benefits">airline credit card baggage benefits guide</Link>{" "}
          to understand benefit rules, use the{" "}
          <Link href="/tools/checked-baggage-calculator">checked baggage cost calculator</Link>{" "}
          to price the trip from traveler and bag inputs, use{" "}
          <Link href="/best-cards">the card break-even calculator</Link> when the question is whether
          recurring first-bag fees offset an annual fee, or use{" "}
          <Link href="/guides/international-baggage-allowance">the international baggage allowance explainer</Link>{" "}
          when the row depends on route, fare family, or piece-versus-weight concept. Use{" "}
          <Link href="/sizer-rules">Sizer rules</Link> if the better comparison is avoiding the
          checked bag entirely.
        </p>
      );
    case "carry_on":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Carry-on decisions get easier when you pair this page with the{" "}
          <Link href="/guides/carry-on-strictness-by-airline">carry-on strictness guide</Link>, then check{" "}
          <Link href="/airlines/frontier">Frontier</Link> and{" "}
          <Link href="/airlines/ryanair">Ryanair</Link> before using{" "}
          <Link href="/sizer-rules">Sizer rules</Link> to test whether your bag survives real enforcement.
        </p>
      );
    case "seat_selection":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Seat-fee pages are most useful when you compare the seat upsell against the stripped fare that created it, so use the{" "}
          <Link href="/guides/basic-economy-traps">Basic Economy guide</Link> alongside{" "}
          <Link href="/airlines/united">United</Link>, <Link href="/airlines/delta">Delta</Link>, and{" "}
          <Link href="/airlines/american">American</Link> before paying for a seat that may only fix a bad fare choice.
        </p>
      );
    case "change_cancellation":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Flexibility problems usually start with the wrong fare family, so pair this page with the{" "}
          <Link href="/guides/basic-economy-traps">Basic Economy guide</Link>, compare{" "}
          <Link href="/airlines/united">United</Link> and <Link href="/airlines/frontier">Frontier</Link>, and use the{" "}
          <Link href="/passenger-rights/us-dot-refund">U.S. DOT refund rules reference</Link> or{" "}
          <Link href="/passenger-rights/eu261">EU261 passenger rights reference</Link> when the disruption question is about refund rights rather than fare rules.
        </p>
      );
    case "overweight_baggage":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Overweight-bag decisions are usually fixed before the airport scale, so compare{" "}
          <Link href="/airlines/southwest">Southwest</Link> and <Link href="/airlines/frontier">Frontier</Link>, use the{" "}
          <Link href="/tools/excess-baggage-calculator">overweight and oversize baggage calculator</Link>, then check{" "}
          <Link href="/guides/carry-on-strictness-by-airline">carry-on strictness by airline</Link> and{" "}
          <Link href="/sizer-rules">Sizer rules</Link> if repacking into a carry-on plan is still realistic.
        </p>
      );
    case "oversize_baggage":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Oversize charges can be harder to rescue at the airport because the bag shape is already
          fixed. Use the{" "}
          <Link href="/tools/excess-baggage-calculator">overweight and oversize baggage calculator</Link>, compare{" "}
          <Link href="/airlines/american">American</Link>, <Link href="/airlines/delta">Delta</Link>, and{" "}
          <Link href="/airlines/southwest">Southwest</Link>, then check{" "}
          <Link href="/fees/checked_baggage">standard checked-bag fees</Link> because oversize charges may be in addition to the normal bag fee.
        </p>
      );
    case "unaccompanied_minor":
      return (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444" }}>
          Unaccompanied minor fees are rarely the whole story, so compare{" "}
          <Link href="/airlines/southwest">Southwest</Link>, <Link href="/airlines/alaska">Alaska</Link>, and{" "}
          <Link href="/airlines/ryanair">Ryanair</Link> after this page to see whether the trip is fee-based, route-limited, or not offered at all.
        </p>
      );
    default:
      return null;
  }
}

function getDecisionToolCards(category: string): Array<{ href: string; label: string; body: string }> {
  switch (category) {
    case "checked_baggage":
      return [
        {
          href: "/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes",
          label: "Checked-bag cost calculator",
          body: "Turn travelers, bags, trip type, and annual trips into a baggage-cost estimate when the published fees include a usable price.",
        },
        {
          href: "/guides/international-baggage-allowance",
          label: "International allowance explainer",
          body: "Best when the price or allowance depends on route, fare family, cabin, or piece-versus-weight concept.",
        },
        {
          href: "/tools/excess-baggage-calculator",
          label: "Overweight and oversize calculator",
          body: "Use this after confirming the base allowance when weight or dimensions may create an additional charge.",
        },
      ];
    case "carry_on":
      return [
        {
          href: "/sizer-rules?height=22&width=14&depth=9",
          label: "Carry-on sizer comparison",
          body: "Compare a bag's outside dimensions against published carry-on and personal-item rules.",
        },
        {
          href: "/guides/carry-on-strictness-by-airline",
          label: "Carry-on strictness guide",
          body: "Decide whether the real issue is published dimensions, fare restrictions, or gate enforcement culture.",
        },
        {
          href: "/guides/basic-economy-traps#basic-economy-tool",
          label: "Basic Economy decision tool",
          body: "Check whether the cheapest fare is risky because it restricts carry-on access, seats, or flexibility.",
        },
      ];
    case "overweight_baggage":
      return [
        {
          href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=51&size=62",
          label: "Overweight baggage calculator",
          body: "Estimate the cost of crossing common weight thresholds when published numeric fees are available.",
        },
        {
          href: "/sizer-rules?height=22&width=14&depth=9",
          label: "Check a carry-on fallback",
          body: "Check whether moving weight out of a checked bag into a cabin setup is realistic for your airline.",
        },
        {
          href: "/fees/checked_baggage",
          label: "Standard checked-bag baseline",
          body: "Compare the normal checked-bag fee first, because overweight charges can stack on top of it.",
        },
      ];
    case "oversize_baggage":
      return [
        {
          href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=50&size=63",
          label: "Oversize baggage calculator",
          body: "Estimate oversize exposure when a bag crosses common linear-inch thresholds and numeric rows exist.",
        },
        {
          href: "/tools/excess-baggage-calculator?bags=1&directions=2&weight=70&size=70",
          label: "Heavy and oversized scenario",
          body: "Model the worse case where weight and size issues may both matter before airport day.",
        },
        {
          href: "/fees/checked_baggage",
          label: "Checked-bag fee baseline",
          body: "Check the normal checked-bag charge because oversize fees may not replace the base bag fee.",
        },
      ];
    default:
      return [];
  }
}

function checkedBagCalculatorHref(slug: string): string {
  return `/tools/checked-baggage-calculator?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&directions=2&trips=2&pay=yes`;
}

function cardCalculatorHref(slug: string): string {
  return `/best-cards?airline=${encodeURIComponent(slug)}&travelers=2&bags=1&trips=2&pay=yes`;
}

function sizerHref(): string {
  return "/sizer-rules?height=22&width=14&depth=9";
}

function basicEconomyHref(): string {
  return `/guides/basic-economy-traps#basic-economy-tool`;
}

function CheckedBaggageAnswerBlock() {
  return (
    <section
      style={{
        border: "1px solid #dbe1ea",
        borderRadius: 12,
        padding: 14,
        background: "#fff",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569" }}>
          Direct answer
        </div>
        <h2 style={{ margin: "6px 0 0", fontSize: 20 }}>What will the airline charge for a checked bag?</h2>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
        First determine whether your ticket already includes baggage. If it does not, the price can
        depend on the airline, route, fare, bag number, purchase timing, and currency. A published
        first-bag price should then be multiplied by travelers and directions—not treated as the
        price for the whole trip.
      </p>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
        On international itineraries, cabin and fare rules may include one or more bags before a fee
        applies. Additional, overweight, and oversized baggage can follow separate pricing rules, so
        the airline&apos;s itinerary-specific lookup may be the only reliable exact answer.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {[
          ["Fixed fee per direction", "A published first- or second-bag price is charged on each direction of travel."],
          ["Included by fare or cabin", "The ticket includes an allowance before additional-bag charges begin."],
          ["Route-priced baggage", "The airline calculates the price from the itinerary, market, fare, or purchase channel."],
          ["Excess baggage rules", "Extra pieces, excess weight, or excess size use a different charge from the standard bag."],
        ].map(([title, body]) => (
          <div key={title} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{title}</div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>{body}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Link
          href="/airlines/air-france"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Route or fare controls the price</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Air France is a useful example: included allowance and extra-bag pricing depend on the ticket and itinerary.
          </div>
        </Link>
        <Link
          href="/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Calculate the full trip</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Use this when you need the likely baggage bill for a party instead of one isolated fee.
          </div>
        </Link>
        <Link
          href="/guides/international-baggage-allowance"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Check included allowance first</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Use this when the airline uses route, cabin, fare family, piece concept, or weight concept rules.
          </div>
        </Link>
      </div>

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
        Useful comparisons: <Link href="/airlines/air-france">Air France baggage charges</Link>,{" "}
        <Link href="/airlines/air-canada">Air Canada checked bag fees</Link>,{" "}
        <Link href="/airlines/alaska">Alaska checked bag fees</Link>,{" "}
        <Link href="/airlines/zipair">ZIPAIR baggage policy</Link>, and{" "}
        <Link href="/fees/overweight_baggage">overweight baggage fees</Link>.
      </p>
    </section>
  );
}

function CheckedBaggageDecisionGuide() {
  return (
    <section
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 12,
        padding: 14,
        background: "#eff6ff",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1d4ed8" }}>
          Calculate the real trip cost
        </div>
        <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>Do not compare one-way, one-bag prices</h2>
      </div>

      <div style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 12, background: "#fff" }}>
        <div style={{ fontSize: 13, color: "#475569" }}>Round-trip checked-bag total</div>
        <div style={{ marginTop: 6, fontWeight: 800, color: "#0f172a", lineHeight: 1.5 }}>
          Fee per direction × travelers checking bags × 2 directions
        </div>
        <div style={{ marginTop: 6, fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
          Example: $45 × 2 travelers × 2 directions = <strong>$180 added to the trip</strong>.
          If each traveler checks two bags, add the first- and second-bag prices before multiplying.
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 12, background: "#fff" }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>1. Check what the fare includes</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            A fare with a bag included can beat a lower headline fare once every traveler and direction is counted.
          </div>
        </div>
        <div style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 12, background: "#fff" }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>2. Identify the pricing model</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Some airlines publish a fixed fee. Others price bags by route, fare, weight, currency, or purchase timing.
          </div>
        </div>
        <div style={{ border: "1px solid #dbeafe", borderRadius: 10, padding: 12, background: "#fff" }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>3. Test the excess-fee risk</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Overweight and oversize charges may stack with the base checked-bag fee rather than replace it.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, fontWeight: 700 }}>
        <Link href="/tools/true-trip-cost?v=1&t=2&d=2&b=2&a1=&a2=">
          Compare competing fares after bag fees
        </Link>
        <Link href="/tools/checked-baggage-calculator?travelers=2&bags=1&directions=2&trips=2&pay=yes">
          Calculate checked bags
        </Link>
        <Link href="/guides/international-baggage-allowance">Understand international allowances</Link>
        <Link href="/tools/excess-baggage-calculator?bags=1&directions=2&weight=51&size=62">
          Check excess-baggage risk
        </Link>
      </div>
    </section>
  );
}

function CarryOnAnswerBlock() {
  return (
    <section
      style={{
        border: "1px solid #dbe1ea",
        borderRadius: 12,
        padding: 14,
        background: "#fff",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569" }}>
          Direct answer
        </div>
        <h2 style={{ margin: "6px 0 0", fontSize: 20 }}>Is a carry-on included—or only a personal item?</h2>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
        Those are different allowances. A personal item must fit under the seat; a full-size carry-on normally uses the
        overhead bin. Many fares include both, but some Basic and low-cost fares include only the smaller personal item.
        Check the fare entitlement before comparing bag dimensions or advertised prices.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>1. Entitlement</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Confirm whether the exact fare includes an overhead bag, only an under-seat item, or neither.
          </div>
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>2. Outside dimensions</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Measure wheels, handles, and pockets. A product name such as “international carry-on” does not prove compliance.
          </div>
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>3. Weight limit</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            A dimension-compliant bag can still fail the rule when the airline also publishes a cabin-bag weight cap.
          </div>
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>4. Purchase timing</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            If cabin access is sold separately, compare the booking price with any bundle or seat that includes it before airport day.
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid #bfdbfe", borderRadius: 10, padding: 12, background: "#eff6ff" }}>
        <div style={{ fontWeight: 800, color: "#1e3a8a" }}>The cheapest-looking fare can lose on bag math</div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
          For a roundtrip, multiply any required cabin-bag charge by travelers and directions. Then compare that total with
          a fare, bundle, or competing airline that already includes the bag you need.
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, fontWeight: 700 }}>
        <Link href="/tools/true-trip-cost?v=1&t=2&d=2&b=0&a1=&a2=">Compare fares with paid carry-ons</Link>
        <Link href="/sizer-rules?height=22&width=14&depth=9">Compare actual bag dimensions</Link>
        <Link href="/guides/carry-on-strictness-by-airline">Check enforcement context</Link>
        <Link href="/guides/basic-economy-traps#basic-economy-tool">Compare a restricted fare</Link>
        <Link href="/recommended-carry-on-luggage">See dimension-verified bag options</Link>
      </div>
    </section>
  );
}

function SportsEquipmentAnswerBlock() {
  return (
    <section
      style={{
        border: "1px solid #dbe1ea",
        borderRadius: 12,
        padding: 14,
        background: "#fff",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569" }}>
          Direct answer
        </div>
        <h2 style={{ margin: "6px 0 0", fontSize: 20 }}>What will the airline charge for sports equipment?</h2>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
        First identify the exact item. Airlines may treat eligible sports equipment as a normal checked bag, sell a separate
        sports allowance, apply an item-specific handling fee, or require approval before accepting it. Weight, dimensions,
        packing, route, aircraft capacity, and purchase timing can all change the answer.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          ["Normal allowance", "The item can use an included or paid checked-bag allowance when it meets the airline's published conditions."],
          ["Standard bag price", "The airline charges its ordinary checked-bag price but may publish different excess-size treatment for approved equipment."],
          ["Separate sports product", "A sports-baggage allowance or handling charge must be purchased in addition to, or instead of, ordinary baggage."],
          ["Approval or special handling", "Large or unusual equipment may need advance notice, route confirmation, secure packing, or cargo handling."],
        ].map(([title, body]) => (
          <div key={title} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{title}</div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>{body}</div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #bfdbfe", borderRadius: 10, padding: 12, background: "#eff6ff" }}>
        <div style={{ fontWeight: 800, color: "#1e3a8a" }}>A $0 or “within allowance” record is conditional</div>
        <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
          It means the item can qualify under the stated rule—not that every bicycle, board, golf bag, ski bag, or piece of
          diving equipment travels free. Packaging, piece count, weight, size, route, and operating-carrier conditions still apply.
        </div>
      </div>

      <div>
        <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Check these four things before booking</h3>
        <ol style={{ margin: "10px 0 0", paddingLeft: 20, display: "grid", gap: 7, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
          <li><strong>Item definition:</strong> confirm that the airline lists your equipment type and required case or packing method.</li>
          <li><strong>Allowance treatment:</strong> determine whether it replaces a checked bag, consumes the allowance, or uses a separate product.</li>
          <li><strong>Acceptance limits:</strong> check weight, outside dimensions, piece count, route, aircraft, and embargo conditions.</li>
          <li><strong>Advance action:</strong> confirm whether registration or prepayment is required and whether airport pricing differs.</li>
        </ol>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, fontWeight: 700 }}>
        <Link href="/fees/checked_baggage">Check the standard bag baseline</Link>
        <Link href="/fees/overweight_baggage">Review overweight charges</Link>
        <Link href="/fees/oversize_baggage">Review oversize charges</Link>
        <Link href="/tools/excess-baggage-calculator?bags=1&directions=2&weight=50&size=63">Model excess-baggage risk</Link>
      </div>
    </section>
  );
}

function OverweightBaggageAnswerBlock() {
  return (
    <section
      style={{
        border: "1px solid #dbe1ea",
        borderRadius: 12,
        padding: 14,
        background: "#fff",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569" }}>
          Direct answer
        </div>
        <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>How much is the charge for overweight baggage?</h2>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
        There is no single universal overweight baggage charge. Many airlines start overweight
        treatment above 50 lb / 23 kg, then price the charge by airline, route, currency, cabin or
        fare allowance, and how far over the limit the bag is. If the bag is beyond the airline&apos;s
        maximum accepted checked-bag weight, the issue may become cargo handling or refusal rather
        than a simple airport fee.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Link
          href="/tools/excess-baggage-calculator?bags=1&directions=2&weight=51&size=62"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Bag is just over 50 lb</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Estimate a common just-over-the-limit scenario when the airline publishes usable fees.
          </div>
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?bags=1&directions=2&weight=70&size=62"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Bag is heavy but checkable</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Model a heavier checked-bag case before you reach the counter.
          </div>
        </Link>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 800 }}>Bag may exceed the airline maximum</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Check the airline page first. Very heavy bags may not be accepted as ordinary checked
            baggage even if you are willing to pay.
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
        Useful comparisons: <Link href="/airlines/air-france">Air France baggage fees</Link>,{" "}
        <Link href="/airlines/air-canada">Air Canada baggage fees</Link>,{" "}
        <Link href="/airlines/zipair">ZIPAIR baggage fees</Link>,{" "}
        <Link href="/airlines/alaska">Alaska baggage fees</Link>, and the{" "}
        <Link href="/guides/international-baggage-allowance">international baggage allowance explainer</Link>.
      </p>
    </section>
  );
}

function OversizeBaggageAnswerBlock() {
  return (
    <section
      style={{
        border: "1px solid #dbe1ea",
        borderRadius: 12,
        padding: 14,
        background: "#fff",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569" }}>
          Direct answer
        </div>
        <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>How much is the charge for oversized baggage?</h2>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
        Oversized baggage does not have one universal airline charge. Many airlines start oversize
        screening above 62 linear inches / 158 cm, but the actual fee depends on the airline, route,
        bag shape, special-item category, airport handling limits, and whether the oversize charge
        is added on top of the normal checked-bag fee.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Link
          href="/tools/excess-baggage-calculator?bags=1&directions=2&weight=50&size=63"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Bag is just over 62 inches</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Estimate a common oversize scenario when the airline publishes a usable numeric fee.
          </div>
        </Link>
        <Link
          href="/tools/excess-baggage-calculator?bags=1&directions=2&weight=70&size=70"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Bag is heavy and oversized</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Check the combined-risk case where weight and size charges may both matter.
          </div>
        </Link>
        <Link
          href="/fees/checked_baggage"
          style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", textDecoration: "none" }}
        >
          <div style={{ fontWeight: 800, textDecoration: "underline" }}>Check the base bag fee</div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
            Oversize fees may stack with, not replace, the normal checked-bag charge.
          </div>
        </Link>
      </div>

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
        Useful comparisons: <Link href="/airlines/american">American baggage fees</Link>,{" "}
        <Link href="/airlines/delta">Delta baggage fees</Link>,{" "}
        <Link href="/airlines/southwest">Southwest baggage fees</Link>,{" "}
        <Link href="/airlines/air-france">Air France baggage charges</Link>, and the{" "}
        <Link href="/guides/international-baggage-allowance">international baggage allowance explainer</Link>.
      </p>
    </section>
  );
}

function getFeeMetadataCopy(category: string): Metadata {
  const href = `/fees/${category}`;
  switch (category) {
    case "overweight_baggage":
      return {
        title: "Overweight Baggage Fees by Airline | Charges and Calculator",
        description:
          "Compare overweight baggage fees by airline and learn why the charge depends on route, weight band, allowance, currency, and airport handling rules.",
        alternates: { canonical: canonical(href) },
      };
    case "oversize_baggage":
      return {
        title: "Oversize Baggage Fees by Airline | Size Charges and Calculator",
        description:
          "Compare oversized baggage fees by airline and learn when size charges stack with checked-bag or overweight fees.",
        alternates: { canonical: canonical(href) },
      };
    case "checked_baggage":
      return {
        title: "Checked Baggage Fees by Airline | Costs, Comparison, Calculator",
        description:
          "Compare checked baggage fees by airline, learn whether baggage fees are round trip, and use the checked bag fee calculator to estimate total bag costs.",
        alternates: { canonical: canonical(href) },
      };
    case "carry_on":
      return {
        title: "Carry-On Bag Fees by Airline | Personal Item vs Carry-On",
        description:
          "See which airline fares include a carry-on, when only a personal item is free, and how bag size, bundles, purchase timing, and gate enforcement change the cost.",
        alternates: { canonical: canonical(href) },
      };
    case "sports_equipment":
      return {
        title: "Sports Equipment Baggage Fees by Airline | Bikes, Skis, Golf",
        description:
          "Compare official airline sports-equipment baggage rules, including normal allowance treatment, special fees, packing, advance notice, weight, and size conditions.",
        alternates: { canonical: canonical(href) },
      };
    case "seat_selection":
      return {
        title: "Airline Seat Selection Fees | Standard, Preferred, and Fare Rules",
        description:
          "Compare airline seat-selection fees, fare inclusions, standard versus preferred seating, purchase timing, and the conditions that change the price.",
        alternates: { canonical: canonical(href) },
      };
    case "change_cancellation":
      return {
        title: "Airline Change and Cancellation Fees | Fare and Timing Rules",
        description:
          "Compare published airline change and cancellation rules, including fare restrictions, route limits, timing, and when only a fare difference applies.",
        alternates: { canonical: canonical(href) },
      };
    case "unaccompanied_minor":
      return {
        title: "Unaccompanied Minor Fees by Airline | Ages and Route Rules",
        description:
          "Compare published unaccompanied-minor service fees, eligible ages, route restrictions, required procedures, and official airline sources.",
        alternates: { canonical: canonical(href) },
      };
    default:
      return {
        title: `${titleCaseFromSlug(category)} fees by airline (2026)`,
        description:
          "Compare published airline fees across carriers and use the related airline pages, guides, and tools to understand how the fee applies.",
        alternates: { canonical: canonical(href) },
      };
  }
}

export function generateStaticParams() {
  return FEE_CATEGORY_KEYS.map((category) => ({ category }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  return getFeeMetadataCopy(category);
}

export default async function FeeCategoryHubPage({ params }: PageProps) {
  const { category } = await params;
  const cat = decodeURIComponent(category || "").trim();
  if (!cat) notFound();

  const hub = getHubCopy(cat);
  const strategy = FEE_HUB_STRATEGY[cat];

  const rows: Row[] = [];
  for (const slug of getAirlineSlugs()) {
    if (slug === "spirit") continue;
    const airline = getAirlineBySlug(slug);
    if (!airline) continue;

    for (const item of airline.fees ?? []) {
      if (!belongsToPublicCategory(item.category, cat)) continue;

      rows.push({
        slug,
        airlineName: safeText(airline.name),
        iata: airline.iata,
        amountText: formatContextualAmount(item),
        appliesTo: item.applies_to ?? "—",
        regionOrRoute: item.region_or_route ?? "—",
        timing: item.timing ?? "—",
        conditions: item.conditions ?? "—",
        sourceUrl: safeUrl(item.source_url),
        lastVerified: safeDate(item.last_verified),
      });
    }
  }

  if (!rows.length) notFound();

  rows.sort((a, b) => b.lastVerified.localeCompare(a.lastVerified));
  const latestVerified = getLatestVerifiedDate(rows);
  const oldestVerified = getOldestVerifiedDate(rows);
  const coverageFreshness = getVerificationFreshness(oldestVerified);
  const officialSourceCount = new Set(rows.map((row) => row.sourceUrl).filter(Boolean)).size;
  const needsRecheckCount = rows.filter(
    (row) => getVerificationFreshness(row.lastVerified).label === "Needs recheck",
  ).length;
  const contextualBridge = getContextualBridge(cat);
  const decisionToolCards = getDecisionToolCards(cat);

  const title = titleCaseFromSlug(cat);
  const feeFaqs = getFeeFaq(cat);
  const pageHref = `/fees/${encodeURIComponent(cat)}`;
  const pageDescription = `${title} fees by airline, with published amounts, official source links, conditions, route limits, and last checked dates.`;
  const spotlightAirlines = (strategy?.spotlightAirlines ?? [])
    .map((entry) => {
      const airline = getAirlineBySlug(entry.slug);
      if (!airline) return null;
      return { ...entry, airline };
    })
    .filter(Boolean);

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <JsonLd
        data={feePageJsonLd({
          title,
          description: pageDescription,
          href: pageHref,
          latestVerified,
          rows,
          faqs: feeFaqs,
        })}
      />
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>
            {cat === "checked_baggage"
              ? "Checked baggage fees and allowances by airline"
              : cat === "carry_on"
                ? "Carry-on bag fees and personal-item rules by airline"
                : cat === "sports_equipment"
                  ? "Sports equipment baggage fees and rules by airline"
                : `${title} fees by airline`}
          </h1>
          <span style={{ fontSize: 12, color: "#555" }}>Latest source check: {latestVerified}</span>
        </div>

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          <Link href="/fees">All fee categories</Link>
          <Link href="/airlines">All airlines</Link>
          <Link href="/compare">Comparison tables</Link>
          <Link href="/methodology">Methodology</Link>
        </nav>

        {cat === "checked_baggage" ? <CheckedBaggageAnswerBlock /> : null}
        {cat === "checked_baggage" ? <CheckedBaggageDecisionGuide /> : null}
        {cat === "carry_on" ? <CarryOnAnswerBlock /> : null}
        {cat === "sports_equipment" ? <SportsEquipmentAnswerBlock /> : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#334155" }}>
          <span style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "5px 10px", background: "#fff" }}>
            {officialSourceCount} official source{officialSourceCount === 1 ? "" : "s"}
          </span>
          <span style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "5px 10px", background: "#fff" }} title={coverageFreshness.detail}>
            Coverage status: {coverageFreshness.label}
          </span>
          {needsRecheckCount > 0 ? (
            <span style={{ border: "1px solid #fca5a5", borderRadius: 999, padding: "5px 10px", background: "#fff1f2", color: "#881337" }}>
              {needsRecheckCount} record{needsRecheckCount === 1 ? "" : "s"} need recheck
            </span>
          ) : null}
          <Link href="/methodology" style={{ padding: "5px 2px", fontWeight: 700 }}>How verification works</Link>
        </div>

        <section style={{ display: "grid", gap: 8, fontSize: 14, lineHeight: 1.6, color: "#333" }}>
          {cat !== "checked_baggage" && cat !== "carry_on" && cat !== "sports_equipment" ? <div>{hub.verdict}</div> : null}

          {strategy && cat !== "checked_baggage" && cat !== "carry_on" ? (
            <div style={{ border: "1px solid #dbe1ea", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
              <strong>Best for:</strong> {strategy.introLabel}
            </div>
          ) : null}

          {cat !== "checked_baggage" && cat !== "carry_on" && cat !== "sports_equipment" ? (
            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
              <strong>Quick check:</strong> {hub.proTip}
            </div>
          ) : null}

          {cat !== "carry_on" && cat !== "sports_equipment" ? (
            <>
              <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
                <strong>Common way to avoid the fee:</strong> {hub.loophole}
              </div>

              <div style={{ fontSize: 13, color: "#444" }}>
                <strong>What to watch:</strong> {hub.whatToWatch}
              </div>
            </>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, color: "#444" }}>
            <span>
              Published fees on this page: <strong>{rows.length}</strong>
            </span>
          </div>
        </section>
      </header>

      {decisionToolCards.length > 0 && cat !== "checked_baggage" && cat !== "carry_on" ? (
        <section
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: 14,
            background: "#eff6ff",
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1d4ed8" }}>
              Decision tools
            </div>
            <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>Choose the next step for this fee</h2>
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {decisionToolCards.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fff",
                  color: "#1e3a8a",
                  textDecoration: "none",
                }}
              >
                <div style={{ fontWeight: 800, textDecoration: "underline" }}>{tool.label}</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#334155" }}>{tool.body}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {cat === "overweight_baggage" ? <OverweightBaggageAnswerBlock /> : null}
      {cat === "oversize_baggage" ? <OversizeBaggageAnswerBlock /> : null}

      {cat === "checked_baggage" ? <CheckedBagCardMathCallout /> : null}

      {strategy && cat !== "checked_baggage" && cat !== "carry_on" && (
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Common situations</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {strategy.scenarioCards.map((card) => (
              <div key={card.title} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>{card.body}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cat !== "checked_baggage" && cat !== "carry_on" && spotlightAirlines.length > 0 && (
        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Airline pages to compare next</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {spotlightAirlines.map((entry) => (
              <div key={entry!.slug} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>
                  <Link href={`/airlines/${entry!.slug}`} style={{ textDecoration: "underline" }}>
                    {entry!.airline.name}
                  </Link>
                </div>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>{entry!.reason}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, fontSize: 13 }}>
                  <Link href={`/airlines/${entry!.slug}`} style={{ textDecoration: "underline" }}>
                    Fee page
                  </Link>
                  {hasActiveStrategyPage(entry!.slug) ? (
                    <Link href={`/airlines/${entry!.slug}/how-to-beat-fees`} style={{ textDecoration: "underline" }}>
                      Fee guide
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: "grid", gap: 10 }}>
        <h2 id="published-fees" style={{ margin: 0, fontSize: 16 }}>
          {cat === "checked_baggage"
            ? "Official checked-baggage records"
            : cat === "carry_on"
              ? "Official carry-on and personal-item records"
              : cat === "sports_equipment"
                ? "Official sports-equipment records"
              : "Published fees and sources"}
        </h2>

        {cat === "checked_baggage" ? (
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
            This is a source registry, not a universal price chart. Read the route, fare, timing, and conditions columns
            together; a number shown for one itinerary may not apply to another.
          </p>
        ) : null}

        {cat === "carry_on" ? (
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
            Read the fare, route, dimensions, weight, and timing together. A zero amount means the stated allowance is
            included for that record; it does not prove that every fare on the airline includes an overhead bag.
          </p>
        ) : null}

        {cat === "sports_equipment" ? (
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
            Read each record as an item- and itinerary-specific rule, not a universal fee. “Within allowance,” a zero amount,
            or a standard bag price applies only when the equipment meets the stated packing, weight, size, route, and timing conditions.
          </p>
        ) : null}

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ minWidth: 1180 }}>
            <caption style={{ padding: 8, textAlign: "left", fontSize: 13, color: "#444" }}>
              {title} details by airline, including amount, route, timing, conditions, source, and last checked date.
            </caption>
            <thead>
              <tr>
                <th scope="col">Airline</th>
                <th scope="col">Amount</th>
                <th scope="col">Applies to</th>
                <th scope="col">Region / route</th>
                <th scope="col">Timing</th>
                <th scope="col">Conditions</th>
                <th scope="col">Source</th>
                <th scope="col">Last checked</th>
                <th scope="col">Next step</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.slug}-${idx}`}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/airlines/${encodeURIComponent(row.slug)}`} style={{ textDecoration: "underline" }}>
                      {row.airlineName}
                    </Link>
                    {row.iata ? <span style={{ color: "#666" }}> ({row.iata})</span> : null}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{row.amountText}</td>
                  <td>{row.appliesTo}</td>
                  <td>{row.regionOrRoute}</td>
                  <td>{row.timing}</td>
                  <td style={{ minWidth: 320 }}>{row.conditions}</td>
                  <td>
                    {row.sourceUrl ? (
                      <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                        Source
                      </a>
                    ) : (
                      "Not published"
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }} title={getVerificationFreshness(row.lastVerified).detail}>
                    {row.lastVerified}
                    <div style={{ marginTop: 4, fontSize: 11, color: getVerificationFreshness(row.lastVerified).tone === "red" ? "#be123c" : "#64748b" }}>
                      {getVerificationFreshness(row.lastVerified).label}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6, minWidth: 150 }}>
                      {cat === "checked_baggage" ? (
                        <>
                          <Link href={checkedBagCalculatorHref(row.slug)} style={{ textDecoration: "underline" }}>
                            Price bags
                          </Link>
                          <Link href={cardCalculatorHref(row.slug)} style={{ textDecoration: "underline" }}>
                            Card break-even
                          </Link>
                        </>
                      ) : null}
                      {cat === "carry_on" ? (
                        <>
                          <Link href={sizerHref()} style={{ textDecoration: "underline" }}>
                            Check sizer
                          </Link>
                          <Link href={basicEconomyHref()} style={{ textDecoration: "underline" }}>
                            Basic fare risk
                          </Link>
                        </>
                      ) : null}
                      {cat === "seat_selection" ? (
                        <Link href={basicEconomyHref()} style={{ textDecoration: "underline" }}>
                          Basic fare risk
                        </Link>
                      ) : null}
                      {hasActiveStrategyPage(row.slug) ? (
                        <Link href={`/airlines/${encodeURIComponent(row.slug)}/how-to-beat-fees`} style={{ textDecoration: "underline" }}>
                          Fee guide
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
          The <strong>Next step</strong> column moves from the fee row into the relevant calculator or airline-specific guide.
          For checked baggage, <strong>Price bags</strong> estimates the cash bill and <strong>Card break-even</strong> tests
          whether repeat first-bag fees can justify an eligible card on bag savings alone. For carry-on and seat rows,
          the next question is usually whether the fare restriction changes the real trip cost.
        </div>

        {cat !== "carry_on" ? contextualBridge : null}
      </section>

      {strategy && cat !== "checked_baggage" && cat !== "carry_on" && (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            background: "#fafafa",
            display: "grid",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>Related references</h2>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#444" }}>{strategy.bridgeText}</div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {strategy.toolLinks.map((tool) => (
              <div key={tool.href} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>
                  <Link href={tool.href} style={{ textDecoration: "underline" }}>
                    {tool.label}
                  </Link>
                </div>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#444" }}>{tool.reason}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {feeFaqs.length ? (
        <section style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Common questions</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {feeFaqs.map((faq) => (
              <div key={faq.question} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{faq.question}</h3>
                <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "#444" }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
