import Link from "next/link"

import { GiveawayCard } from "@/components/giveaway/giveaway-card"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export default async function MyGiveawaysPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const result = await supabase
    .from("giveaways")
    .select(
      "id,title,description,condition,photo_path,handover_location,handover_notes,status,giver_id,taker_id,giver_confirmed_at,taker_confirmed_at,created_at,item_categories(name)"
    )
    .eq("township_id", active.townshipId)
    .or(`giver_id.eq.${active.user.id},taker_id.eq.${active.user.id}`)
    .order("created_at", { ascending: false })
    .limit(60)

  if (result.error) throw new Error(result.error.message)

  const rows = result.data ?? []
  const activeRows = rows.filter(
    (row) => row.status === "active" || row.status === "reserved"
  )
  const finishedRows = rows.filter(
    (row) => row.status === "completed" || row.status === "cancelled"
  )

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        back={{ href: "/giveaway", label: "Giveaway" }}
        eyebrow="Beri · Your activity"
        title="Your giveaways"
        description="Track the things you passed on and the things you claimed. Confirm the handover together to unlock both BP rewards."
        actions={
          <Button render={<Link href="/giveaway/new" />} variant="cta">
            List another
          </Button>
        }
      />

      <section aria-labelledby="active-giveaways-heading">
        <h2 id="active-giveaways-heading" className="text-heading text-ink">
          Open now
        </h2>
        {activeRows.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeRows.map((giveaway) => (
              <GiveawayCard
                key={giveaway.id}
                giveaway={giveaway}
                currentUserId={active.user.id}
              />
            ))}
          </div>
        ) : (
          <Empty className="mt-4 border border-hairline bg-surface">
            <EmptyHeader>
              <EmptyTitle>No open giveaways</EmptyTitle>
              <EmptyDescription>
                Your active listings and claims will appear here.
              </EmptyDescription>
            </EmptyHeader>
            <Button render={<Link href="/giveaway/new" />} variant="cta">
              List a giveaway
            </Button>
          </Empty>
        )}
      </section>

      {finishedRows.length ? (
        <section aria-labelledby="finished-giveaways-heading">
          <h2 id="finished-giveaways-heading" className="text-heading text-ink">
            Past activity
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {finishedRows.map((giveaway) => (
              <GiveawayCard
                key={giveaway.id}
                giveaway={giveaway}
                currentUserId={active.user.id}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
