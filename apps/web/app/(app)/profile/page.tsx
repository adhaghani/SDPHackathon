import Link from "next/link"

import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { isFeatureEnabled } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { SwitchTownshipButton } from "@/components/profile/switch-township-button"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function ProfilePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [badgesResult, lentResult, borrowedResult, townshipsResult] = await Promise.all([
    supabase.from("user_badges").select("id,earned_at,badges(name,description)").eq("user_id", active.user.id).eq("township_id", active.townshipId),
    supabase.from("bookings").select("id").eq("lender_id", active.user.id).eq("status", "completed"),
    supabase.from("bookings").select("id").eq("borrower_id", active.user.id).eq("status", "completed"),
    supabase.from("townships").select("id,name").in("id", (active.memberships ?? []).map((row) => row.township_id)),
  ])
  const townshipNames = new Map((townshipsResult.data ?? []).map((township) => [township.id, township.name]))

  return (
    <div className="flex flex-col gap-7">
      <PageBand
        eyebrow="Profile"
        title={active.profile?.display_name ?? "Neighbour"}
        description="Your route, recognition and comfort preferences."
        actions={<Button render={<Link href="/profile/settings" />} variant="outline">Edit profile</Button>}
      >
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-white/10 p-4 text-white"><p className="text-sm text-band-eyebrow">Balance</p><p className="mt-1 font-display text-2xl tabular-nums">{active.points?.balance ?? 0} BP</p></div>
          <div className="rounded-md bg-white/10 p-4 text-white"><p className="text-sm text-band-eyebrow">Items lent</p><p className="mt-1 font-display text-2xl tabular-nums">{lentResult.data?.length ?? 0}</p></div>
          <div className="rounded-md bg-white/10 p-4 text-white"><p className="text-sm text-band-eyebrow">Borrows completed</p><p className="mt-1 font-display text-2xl tabular-nums">{borrowedResult.data?.length ?? 0}</p></div>
        </div>
      </PageBand>

      {isFeatureEnabled("multi_township") ? (
      <section>
        <h2 className="font-display text-lg">Townships</h2>
        <p className="mt-1 text-sm text-muted-foreground">Switch between your active memberships.</p>
        <ul className="mt-4 flex flex-col gap-3">
          {(active.memberships ?? []).filter((row) => row.status === "active").map((row) => (
            <li key={row.township_id} className="bb-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{townshipNames.get(row.township_id) ?? "Township"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{row.role.replace("_", " ")}</p>
              </div>
              <SwitchTownshipButton townshipId={row.township_id} name={townshipNames.get(row.township_id) ?? "this township"} current={row.township_id === active.townshipId} />
            </li>
          ))}
        </ul>
      </section>
      ) : null}

      <section>
        <h2 className="font-display text-lg">Badges</h2>
        {(badgesResult.data ?? []).length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {badgesResult.data?.map((badge) => (
              <li key={badge.id} className="bb-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium">{badge.badges?.name}</p><p className="mt-1 text-sm text-muted-foreground">{badge.badges?.description}</p></div>
                  <Badge variant="secondary" className="text-ink">Earned</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No badges yet. Your first verified activity starts the route.</p>
        )}
      </section>
    </div>
  )
}
