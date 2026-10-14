# Metrics

All metrics are aggregate-only and computed in `Asia/Kuala_Lumpur` unless noted. Residents' private activity is not exposed in dashboards.

| Metric | Definition |
| --- | --- |
| Monthly active residents | Active residents with at least one meaningful verified action in the month: check-in, booking activity, completed help, redemption or hosted completed event. |
| Repeat event attendance | Share of residents with a check-in in the last 90 days who have at least two distinct checked-in events. |
| Verified volunteer hours | Sum of staff-verified volunteer hours. |
| Completed borrowing transactions | Bookings that reached `completed` in the selected period. |
| Items reused | Distinct items with at least one completed loan; reuse count equals completed loans. |
| Estimated purchases avoided (RM) | Sum of estimated item value for completed loans where the borrower answered yes to "would you have bought or rented this?". Self-reported and always labelled estimated. |
| Reward redemption rate | Share of residents holding points who redeemed at least one reward in the period; also points issued versus redeemed. |
| Cost per active resident (RM) | Operator-funded reward cost plus admin-entered programme costs divided by monthly active residents. Sponsor-funded rewards are excluded. |
| Facility utilisation | Event-hours per facility divided by available hours. Underused means bottom-quartile and below the admin-set threshold. |
| Resident recycling estimate | Self-reported count or custom-kg estimates entered for the current date; counts use approximate kg-per-unit reference values and are never presented as weighed data. Optional photos are re-encoded to remove EXIF/GPS metadata and are not independent verification. |
| Recycling CO₂e avoided | Estimated recycled kilograms multiplied by each material's cited kg CO₂e-per-kg factor. Hidden while any contributing material lacks a factor or source. |
| Recycling energy saved | Estimated recycled kilograms multiplied by each material's cited kWh-per-kg factor. Displayed as kWh because watts measure power, not energy. |
| Township recycling goal progress | Aggregate estimated kilograms logged during the campaign period, divided by the admin-set target. Only aggregate progress is exposed. |
| Recycling goal reward | The configured reward-rule amount awarded idempotently once to each active campaign contributor when the target is first reached. |

Limitations: dashboards describe observed activity, not causation. Recycling estimates are self-reported and may differ from a scale. Breakdowns with fewer than five distinct residents are suppressed. No CO2e figures are displayed without a documented, cited emissions factor.

Recycling launch factors use the US EPA Waste Reduction Model v16 documentation and workbook: https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model. WARM values reported per short ton are converted to kg CO₂e/kg material and MMBtu values are converted to kWh/kg material (1 MMBtu = 293.07107 kWh). These are comparison estimates, not measured savings.

## Demand to supply

Searches count search-event rows, including zero-result searches, rather than summing results returned. Distinct demand counts authenticated residents in the separate private 30-day deduplication table and is suppressed below five. Legacy anonymous demo data cannot establish distinct demand. The category table attributes only searches with a selected category; uncategorised terms remain in the separate demand-gap list. Equipment supplied sums current hub inventory quantities. Completed hub loans count confirmed completed bookings in the last 30 days for stocked hub items. Listing utilisation is the share of stocked listings with a completion; quantity and time occupancy are different measures. Programme costs on Demand intelligence cover the current calendar month and are not category-level acquisition costs. None of these aggregates proves causation.

Recycling campaign progress is self-reported estimated kg. There is no measured collection stream; photos and custom-kg input do not change verification status. Staff weights, if introduced, need a separate evidence and correction trail and must never be summed with resident estimates.
