import Link from "next/link"
import { notFound } from "next/navigation"

import { GuestPassList, type GuestPassRow } from "@/components/guests/guest-pass-list"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

function formatDate(value?: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(value))
}

export default async function GuestPassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const result = await supabase.rpc("get_resident_guest_passes")
  if (result.error) throw new Error(result.error.message)
  const pass = ((Array.isArray(result.data) ? result.data : []) as GuestPassRow[]).find((row) => row.id === id)
  if (!pass) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        back={{ href: "/guests", label: "Guest passes" }}
        eyebrow="Guest access"
        title={pass.visitor_name}
        description={`${formatDate(pass.valid_from)} – ${formatDate(pass.valid_until)} · ${pass.is_inside ? "Inside now" : pass.status}`}
      />
      <GuestPassList passes={[pass]} />
      <Link href="/guests" className="w-fit text-sm font-bold underline underline-offset-4">Back to all passes</Link>
    </div>
  )
}
