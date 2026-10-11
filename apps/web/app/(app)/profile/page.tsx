import Link from "next/link"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function ProfilePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [badgesResult, lentResult, borrowedResult] = await Promise.all([
    supabase.from("user_badges").select("id,earned_at,badges(name,description)").eq("user_id", active.user.id).eq("township_id", active.townshipId),
    supabase.from("bookings").select("id").eq("lender_id", active.user.id).eq("status", "completed"),
    supabase.from("bookings").select("id").eq("borrower_id", active.user.id).eq("status", "completed"),
  ])

  return (
    <div className="flex flex-col gap-7">
      <section className="border-y border-border py-6">
        <p className="text-sm font-medium text-line-borrow">Profile</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">{active.profile?.display_name ?? "Neighbour"}</h1>
        <p className="mt-2 text-muted-foreground">Your route, recognition and comfort preferences.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Balance</p><p className="mt-1 font-heading text-2xl font-semibold text-points-ink tabular-nums">{active.points?.balance ?? 0} BP</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Items lent</p><p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{lentResult.data?.length ?? 0}</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Borrows completed</p><p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{borrowedResult.data?.length ?? 0}</p></div>
        </div>
        <Button render={<Link href="/profile/settings" />} variant="outline" className="mt-6 h-11">Edit profile</Button>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold">Badges</h2>
        {(badgesResult.data ?? []).length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {badgesResult.data?.map((badge) => (
              <li key={badge.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium">{badge.badges?.name}</p><p className="mt-1 text-sm text-muted-foreground">{badge.badges?.description}</p></div>
                  <Badge variant="secondary" className="text-rimba-ink">Earned</Badge>
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
