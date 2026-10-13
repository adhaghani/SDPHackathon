import { CreateGuestPassDialog } from "@/components/guests/create-guest-pass-dialog"
import { GuestPassList, type GuestPassRow } from "@/components/guests/guest-pass-list"
import { WalkInApprovals, type PendingWalkIn } from "@/components/guests/walk-in-approvals"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function GuestPassesPage() {
  const active = await requireActiveMember()
  if (active.membership.role === "guard") return <div className="p-6 text-ink">Guards use the gate screen.</div>

  const supabase = await createClient()
  const result = await supabase.rpc("get_resident_guest_passes")
  if (result.error) throw new Error(result.error.message)
  const passes = ((Array.isArray(result.data) ? result.data : []) as GuestPassRow[]) ?? []
  const walkInsResult = await supabase.rpc("get_walk_in_requests", {
    p_township_id: active.townshipId,
    p_only_pending: true,
  })
  if (walkInsResult.error) throw new Error(walkInsResult.error.message)
  const pendingWalkIns = ((walkInsResult.data ?? []) as PendingWalkIn[]) ?? []

  return (
    <div className="flex flex-col gap-7">
      <PageBand
        eyebrow="PINJAM · Guest access"
        title="Guest passes"
        description="Create a private visitor QR, share it with WhatsApp, and revoke it immediately if plans change."
        actions={<CreateGuestPassDialog />}
      />

      {pendingWalkIns.length ? <WalkInApprovals requests={pendingWalkIns} /> : null}
      {passes.length ? (
        <GuestPassList passes={passes} />
      ) : (
        <Empty className="rounded-[22px] bg-paper">
          <EmptyHeader>
            <EmptyTitle>No guest passes yet</EmptyTitle>
            <EmptyDescription>Create your first pass to welcome a visitor without sharing your unit publicly.</EmptyDescription>
          </EmptyHeader>
          <CreateGuestPassDialog />
        </Empty>
      )}
    </div>
  )
}
