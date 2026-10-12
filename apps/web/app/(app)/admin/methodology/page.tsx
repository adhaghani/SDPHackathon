import { PageBand } from "@/components/shared/page-band"

const definitions = [
  ["Monthly active residents", "Active residents with at least one meaningful verified action in the month: check-in, booking activity, completed help, redemption or hosted completed event."],
  ["Repeat event attendance", "Share of residents with a check-in in the last 90 days who have at least two distinct checked-in events."],
  ["Verified volunteer hours", "Sum of staff-verified volunteer hours."],
  ["Completed borrowing transactions", "Bookings that reached completed in the selected period."],
  ["Items reused", "Distinct items with at least one completed loan; reuse count equals completed loans."],
  ["Estimated purchases avoided", "Self-reported completed loans where the borrower said they would otherwise have bought or rented. Always estimated."],
  ["Estimated value shared", "Replacement value of every completed borrow: the item's estimated value, falling back to its category default. This describes value shared, not cash saved."],
  ["Trust score", "A 0–100 score from verified returns, on-time returns, active sharing months, open disputes and confirmed condition faults. Owners see only the tier."],
  ["Money saved on an item", "The same estimated item or category value shown beside completed borrows and item history. It is always labelled Estimated."],
  ["Sharing streak", "Consecutive calendar months in Asia/Kuala_Lumpur with at least one completed lend or borrow. The current month can keep a streak at risk until month end."],
  ["Neighbour of the month", "An organiser-approved resident who opted in, reached Trusted tier, had no open disputes and accumulated verified helpful actions in the previous month."],
  ["Township carbon goal", "Estimated CO₂e avoided from completed bookings using category factors and cited sources. Totals stay hidden while any contributing category factor is missing."],
  ["Demand gap", "Matching search events from the last 30 days plus open requests minus distinct available owners. Buckets with fewer than five search events are suppressed."],
  ["Predictive demand", "Eight-week category baseline from bookings, search events and open requests, multiplied by a reviewed festival uplift. Always labelled Forecast and never presented as causal."],
  ["Reward redemption rate", "Share of residents holding points who redeemed at least one reward in the period."],
  ["Cost per active resident", "Operator-funded reward cost plus admin-entered programme costs divided by monthly active residents."],
]

export default function MethodologyPage() {
  return (
    <div className="w-full">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Methodology"
        description="Every dashboard number uses the definitions below. Observed change is not proof of causation."
      />
      <ul className="mt-7 divide-y divide-border border-y border-border">
        {definitions.map(([term, definition]) => (
          <li key={term} className="py-5"><h2 className="font-display text-lg font-bold">{term}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{definition}</p></li>
        ))}
      </ul>
      <div className="mt-7 bb-card bg-muted/40 p-5 text-sm text-muted-foreground">
        Breakdowns with fewer than five residents are suppressed. No CO2e figure is shown without a documented, cited emissions factor.
      </div>
    </div>
  )
}
