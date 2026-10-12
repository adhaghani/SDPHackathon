import { generateAdminSummary } from "@/lib/ai"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { isFeatureEnabled } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { redirect } from "next/navigation"

export default async function AiPage() {
  if (!isFeatureEnabled("ai_search")) redirect("/home")
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")

  const supabase = await createClient()
  const result = await supabase.rpc("township_pulse", {
    p_township_id: active.townshipId,
    p_days: 90,
  })
  if (result.error) throw new Error(result.error.message)
  const summary = await generateAdminSummary((result.data as { metrics?: Record<string, number | string> })?.metrics ?? {})

  return (
    <div className="mx-auto max-w-3xl">
      <PageBand
        eyebrow="AI-assisted planning"
        title="Weekly admin summary"
        description="Generated from aggregate metrics only. Resident-level data is never sent to the model."
      />
      <section className="bb-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg">Summary</h2>
          <Badge variant="outline">{summary.source === "ai" ? "AI generated" : "Deterministic fallback"}</Badge>
        </div>
        <p className="mt-4 leading-7">{summary.text}</p>
      </section>
    </div>
  )
}
