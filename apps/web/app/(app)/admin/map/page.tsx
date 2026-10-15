import { redirect } from "next/navigation"
import { PageBand } from "@/components/shared/page-band"

import { LazyNeighbourhoodMap } from "@/components/map/lazy-neighbourhood-map"
import { isFeatureEnabled } from "@/lib/env"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { LazyBoundaryMap } from "@/components/platform/lazy-boundary-map"
import { boundarySchema } from "@/lib/validation/township"

export default async function AdminMapPage() {
  if (!isFeatureEnabled("leaflet")) redirect("/admin")
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const { data: township, error } = await supabase
    .from("townships")
    .select("boundary,is_demo")
    .eq("id", active.townshipId)
    .single()
  if (error) throw new Error("Could not load the township boundary.")
  const boundary = boundarySchema.safeParse(township.boundary).data

  return (
    <div className="w-full">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Neighbourhood map"
        description="Approximate neighbourhood-level locations for planning. No resident addresses are stored or displayed."
      />
      <div className="mt-6">
        {boundary ? (
          <LazyBoundaryMap initialBoundary={boundary} />
        ) : township.is_demo ? (
          <LazyNeighbourhoodMap />
        ) : (
          <p className="bb-card p-5">
            Ask your superadmin to add this township’s boundary.
          </p>
        )}
      </div>
      <section className="bb-card mt-6 bg-muted/40 p-5 text-sm text-muted-foreground">
        Map tiles use OpenStreetMap. This stretch view is intentionally
        neighbourhood-level to preserve privacy.
      </section>
    </div>
  )
}
