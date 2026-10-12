import { redirect } from "next/navigation"
import { PageBand } from "@/components/shared/page-band"

import { ProgrammeCostForm } from "@/components/admin/admin-forms"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

type BudgetPayload = {
  month?: string
  active_residents?: number
  programme_cost_rm?: number
  operator_reward_cost_rm?: number
  cost_per_active_resident_rm?: number
  allocation_note?: string
}

export default async function AdminBudgetPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const result = await supabase.rpc("admin_budget", { p_township_id: active.townshipId })
  if (result.error) throw new Error(result.error.message)
  const budget = (result.data ?? {}) as BudgetPayload
  const month = new Date().toISOString().slice(0, 10)

  return (
    <div className="w-full">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Budget planner"
        description="Enter programme costs to see an indicative cost per active resident."
      />
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Active residents</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{budget.active_residents ?? 0}</p></div>
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Programme cost</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">RM {Number(budget.programme_cost_rm ?? 0).toFixed(2)}</p></div>
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Cost per active resident</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">RM {Number(budget.cost_per_active_resident_rm ?? 0).toFixed(2)}</p></div>
      </section>
      <section className="mt-6 bb-card p-5">
        <h2 className="font-display text-lg font-bold">Add programme cost</h2>
        <div className="mt-4"><ProgrammeCostForm month={month} /></div>
      </section>
      <p className="mt-5 text-sm text-muted-foreground">{budget.allocation_note ?? "Indicative allocation only."}</p>
    </div>
  )
}
