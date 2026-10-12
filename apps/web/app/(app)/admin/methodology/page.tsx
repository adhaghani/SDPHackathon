import { PageBand } from "@/components/shared/page-band"

const definitions = [
  ["Monthly active residents", "Active residents with at least one meaningful verified action in the month: check-in, booking activity, completed help, redemption or hosted completed event."],
  ["Repeat event attendance", "Share of residents with a check-in in the last 90 days who have at least two distinct checked-in events."],
  ["Verified volunteer hours", "Sum of staff-verified volunteer hours."],
  ["Completed borrowing transactions", "Bookings that reached completed in the selected period."],
  ["Items reused", "Distinct items with at least one completed loan; reuse count equals completed loans."],
  ["Estimated purchases avoided", "Self-reported completed loans where the borrower said they would otherwise have bought or rented. Always estimated."],
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
