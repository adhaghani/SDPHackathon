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
  ["Resident recycling estimate", "Self-reported count or custom-kg estimates entered by a resident for the current date. Counts are converted with the township's approximate kg-per-unit reference values; optional photos are EXIF-stripped and are evidence context, not independent verification."],
  ["Recycling CO₂e equivalent", "Sum of estimated recycled kilograms multiplied by the material's kg CO₂e-per-kg factor. Every contributing material needs a cited factor and source before the total is shown."],
  ["Recycling energy equivalent", "Sum of estimated recycled kilograms multiplied by the material's kWh-per-kg factor. The app displays kWh because watts measure power, not energy; a LED-hours comparison is illustrative."],
  ["Township recycling goal", "Aggregate estimated kilograms logged during the active campaign dates. Progress is township-wide and does not expose individual resident activity."],
  ["Recycling goal reward", "The configured reward-rule amount for each active resident with at least one accepted log during the campaign when the target is first reached. The idempotent source key prevents duplicate awards."],
  ["Demand gap", "Count of matching searches in the last 30 days plus open requests minus available listings. Distinct residents are a separate suppressed metric; repeated searches are not unique demand. Legacy anonymous searches have no resident count."],
  ["Shared equipment utilisation", "Stocked hub listings with at least one confirmed completed loan in 30 days divided by all stocked hub listings. Current units supplied are inventory quantities; this is not time-based occupancy. Programme costs cover the current calendar month, not individual categories."],
  ["Measured recycling", "Not collected in this version. Campaign progress comes entirely from resident self-reported estimates, including custom kilograms and optional photos."],
  ["Predictive demand", "Eight-week category baseline from bookings, search events and open requests, multiplied by a reviewed festival uplift. Always labelled Forecast and never presented as causal."],
  ["Reward redemption rate", "Share of residents holding points who redeemed at least one reward in the period."],
  ["Cost per active resident", "Operator-funded reward cost plus admin-entered programme costs divided by monthly active residents."],
  ["Guest visitors", "Aggregate entry and exit activity for visitor passes. Buckets with fewer than five distinct visitors are suppressed and never expose visitor names, phones, plates or units."],
  ["Guest retention", "Visitor name, phone, plate, purpose and pass token data are deleted after the configured retention period (default 90 days). Anonymised log rows remain for aggregate statistics."],
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
        <p className="mt-2">
          Recycling launch factors use the{" "}
          <a
            href="https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model"
            className="font-bold text-ink underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            US EPA Waste Reduction Model v16 documentation
          </a>
          , converted from short tons to kg/kg and MMBtu to kWh/kg. Township offices can replace factors with a locally appropriate cited source.
        </p>
      </div>
    </div>
  )
}
