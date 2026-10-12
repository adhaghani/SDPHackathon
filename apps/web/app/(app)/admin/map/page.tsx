import Link from "next/link"
import { redirect } from "next/navigation"

import { LazyNeighbourhoodMap } from "@/components/map/lazy-neighbourhood-map"
import { isFeatureEnabled } from "@/lib/env"
import { requireActiveMember } from "@/lib/data"

export default async function AdminMapPage() {
  if (!isFeatureEnabled("leaflet")) redirect("/admin")
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">Back to Township Pulse</Link>
      <h1 className="mt-5 font-display text-3xl font-bold">Neighbourhood map</h1>
      <p className="mt-2 text-muted-foreground">Approximate neighbourhood-level locations for planning. No resident addresses are stored or displayed.</p>
      <div className="mt-6"><LazyNeighbourhoodMap /></div>
      <section className="mt-6 bb-card bg-muted/40 p-5 text-sm text-muted-foreground">
        Map tiles use OpenStreetMap. This stretch view is intentionally neighbourhood-level to preserve privacy.
      </section>
    </div>
  )
}
