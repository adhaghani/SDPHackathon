import { GuestAdminControls, type GateRow, type GuestSettings, type MemberRow } from "@/components/admin/guest-admin-controls"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

type Stats = {
  visitors_per_day?: Array<{ day: string; visitors: number | null; suppressed: boolean }>
  visitors_per_week?: Array<{ week_start: string; visitors: number | null; suppressed: boolean }>
  peak_hours?: Array<{ hour: number; visitors: number | null; suppressed: boolean }>
  passes_per_gate?: Array<{ name: string; passes: number | null; suppressed: boolean }>
  average_stay_seconds?: number | null
  overstay_count?: number | null
  walk_in_approval_rate?: number | null
  average_stay_suppressed?: boolean
  overstay_suppressed?: boolean
  walk_in_approval_suppressed?: boolean
}

function safeNumber(value: number | null | undefined): string {
  return value == null ? "Suppressed (<5)" : Math.round(value).toLocaleString("en-MY")
}

export default async function AdminGuestPassesPage() {
  const active = await requireActiveMember()
  if (!["township_admin", "organiser"].includes(active.membership.role)) redirect("/home")
  const supabase = await createClient()

  const [statsResult, gatesResult, settingsResult, membersResult] = await Promise.all([
    supabase.rpc("guest_pass_stats", { p_township_id: active.townshipId }),
    supabase.from("gates").select("id,name").eq("township_id", active.townshipId).eq("active", true).order("name"),
    supabase.rpc("get_guest_pass_settings", { p_township_id: active.townshipId }),
    supabase
      .from("township_members")
      .select("id,user_id,role,status")
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .order("created_at"),
  ])
  await supabase.rpc("run_guest_pass_lazy_purge")
  if (statsResult.error || gatesResult.error || settingsResult.error || membersResult.error) {
    throw new Error(statsResult.error?.message ?? gatesResult.error?.message ?? settingsResult.error?.message ?? membersResult.error?.message ?? "Guest-pass admin data could not be loaded.")
  }

  const memberRows = membersResult.data ?? []
  const profileResult = memberRows.length
    ? await supabase.from("profiles").select("id,display_name").in("id", memberRows.map((member) => member.user_id))
    : { data: [], error: null }
  if (profileResult.error) throw new Error(profileResult.error.message)
  const profileNames = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile.display_name]))

  const stats = (statsResult.data ?? {}) as Stats
  const settings = (settingsResult.data ?? {}) as GuestSettings
  const gates = ((gatesResult.data ?? []) as GateRow[]) ?? []
  const members = (memberRows.map((member) => ({
    id: member.id,
    role: member.role,
    display_name: profileNames.get(member.user_id) ?? "Neighbour",
  })) as MemberRow[]) ?? []

  return (
    <div className="flex flex-col gap-7">
      <PageBand
        back={{ href: active.membership.role === "township_admin" ? "/admin" : "/home", label: active.membership.role === "township_admin" ? "Township Pulse" : "Home" }}
        eyebrow="TOLONG · Guest access"
        title="Guest access administration"
        description="Assign township-scoped guards, manage gates and limits, and review aggregate-only visitor metrics."
      />

      <section aria-label="Guest access metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] bg-paper p-4"><p className="text-sm text-ink-soft">Average stay</p><p className="mt-1 font-display text-2xl font-extrabold">{stats.average_stay_seconds == null ? "—" : `${Math.round(stats.average_stay_seconds / 60)} min`}</p><p className="text-xs text-ink-soft">{stats.average_stay_suppressed ? "Suppressed below k=5" : "Aggregate only"}</p></div>
        <div className="rounded-[18px] bg-paper p-4"><p className="text-sm text-ink-soft">Overstays</p><p className="mt-1 font-display text-2xl font-extrabold">{safeNumber(stats.overstay_count)}</p><p className="text-xs text-ink-soft">{stats.overstay_suppressed ? "Below k=5" : "Aggregate count"}</p></div>
        <div className="rounded-[18px] bg-paper p-4"><p className="text-sm text-ink-soft">Walk-in approval</p><p className="mt-1 font-display text-2xl font-extrabold">{stats.walk_in_approval_rate == null ? "—" : `${stats.walk_in_approval_rate}%`}</p><p className="text-xs text-ink-soft">{stats.walk_in_approval_suppressed ? "Below k=5" : "Aggregate rate"}</p></div>
        <div className="rounded-[18px] bg-paper p-4"><p className="text-sm text-ink-soft">Peak hours</p><p className="mt-1 font-display text-2xl font-extrabold">{(stats.peak_hours ?? []).filter((row) => !row.suppressed).length} buckets</p><p className="text-xs text-ink-soft">Hour buckets below k=5 are hidden</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[22px] bg-white p-5">
          <h2 className="text-h2">Visitors by day</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {(stats.visitors_per_day ?? []).slice(-10).map((row) => <li key={row.day} className="flex justify-between text-sm"><span>{row.day}</span><strong>{safeNumber(row.visitors)}</strong></li>)}
          </ul>
        </div>
        <div className="rounded-[22px] bg-white p-5">
          <h2 className="text-h2">Passes by gate</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {(stats.passes_per_gate ?? []).map((row) => <li key={row.name} className="flex justify-between text-sm"><span>{row.name}</span><strong>{safeNumber(row.passes)}</strong></li>)}
          </ul>
        </div>
      </section>

      <GuestAdminControls settings={settings} gates={gates} members={members} />
    </div>
  )
}
