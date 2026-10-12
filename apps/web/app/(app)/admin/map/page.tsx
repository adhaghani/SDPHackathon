import { redirect } from "next/navigation"
import { PageBand } from "@/components/shared/page-band"

import { LazyNeighbourhoodMap } from "@/components/map/lazy-neighbourhood-map"
import { isFeatureEnabled } from "@/lib/env"
import { requireActiveMember } from "@/lib/data"

export default async function AdminMapPage() {
  if (!isFeatureEnabled("leaflet")) redirect("/admin")
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")

  return (
    <div className="w-full">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Neighbourhood map"
        description="Approximate neighbourhood-level locations for planning. No resident addresses are stored or displayed."
      />
      <div className="mt-6"><LazyNeighbourhoodMap /></div>
      <section className="mt-6 bb-card bg-muted/40 p-5 text-sm text-muted-foreground">
        Map tiles use OpenStreetMap. This stretch view is intentionally neighbourhood-level to preserve privacy.
      </section>
    </div>
  )
}
