import { redirect } from "next/navigation"
import { PageBand } from "@/components/shared/page-band"

import { HubForm, InventoryForm, CheckoutButton } from "@/components/hubs/hub-forms"
import { isFeatureEnabled } from "@/lib/env"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function AdminHubsPage() {
  if (!isFeatureEnabled("equipment_hubs")) redirect("/admin")
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const [hubsResult, itemsResult] = await Promise.all([
    supabase.from("equipment_hubs").select("id,name,location_text,active").eq("township_id", active.townshipId).order("name"),
    supabase.from("items").select("id,title").eq("township_id", active.townshipId).eq("owner_id", active.user.id).eq("status", "active"),
  ])
  if (hubsResult.error || itemsResult.error) throw new Error(hubsResult.error?.message ?? itemsResult.error?.message ?? "Could not load hubs.")
  const hubIds = (hubsResult.data ?? []).map((hub) => hub.id)
  const inventory = hubIds.length ? await supabase.from("hub_inventory").select("id,hub_id,quantity,checkout_status,items(title)").in("hub_id", hubIds) : { data: [], error: null }
  if (inventory.error) throw new Error(inventory.error.message)

  return (
    <div className="w-full">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Equipment hubs"
        description="Township-owned inventory with staff checkout. This stretch feature is behind a feature flag."
      />
      <section className="mt-6 bb-card p-5"><h2 className="font-display text-lg font-bold">Create a hub</h2><div className="mt-4"><HubForm /></div></section>
      {(hubsResult.data ?? []).length ? (
        <ul className="mt-6 flex flex-col gap-4">
          {hubsResult.data?.map((hub) => {
            const rows = (inventory.data ?? []).filter((row) => row.hub_id === hub.id)
            return (
              <li key={hub.id} className="bb-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{hub.name}</h2><p className="mt-1 text-sm text-muted-foreground">{hub.location_text}</p></div><Badge variant="outline">{hub.active ? "Active" : "Paused"}</Badge></div>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <InventoryForm hubId={hub.id} items={itemsResult.data ?? []} />
                  <div><h3 className="font-display text-base font-bold">Inventory</h3>{rows.length ? <ul className="mt-3 divide-y divide-border border-y border-border">{rows.map((row) => <li key={row.id} className="flex items-center justify-between gap-3 py-3"><span>{row.items?.title} × {row.quantity}</span>{row.checkout_status === "available" ? <CheckoutButton inventoryId={row.id} /> : <Badge variant="outline">{row.checkout_status.replace("_", " ")}</Badge>}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No inventory yet.</p>}</div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty className="mt-6"><EmptyHeader><EmptyTitle>No equipment hubs</EmptyTitle><EmptyDescription>Create a hub to begin township-owned inventory.</EmptyDescription></EmptyHeader></Empty>
      )}
    </div>
  )
}
