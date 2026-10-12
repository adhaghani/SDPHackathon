import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function ChallengesPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [challengesResult, progressResult] = await Promise.all([
    supabase
      .from("challenges")
      .select("id,title,description,scope,target,reward_points,status,ends_at")
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .order("ends_at"),
    supabase
      .from("challenge_progress")
      .select("challenge_id,contribution,completed_at")
      .eq("user_id", active.user.id),
  ])
  const progressMap = new Map((progressResult.data ?? []).map((row) => [row.challenge_id, row]))

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        eyebrow="Shared goals"
        title="Challenges"
        description="Progress comes only from verified activity, never from views or sign-ups."
      />
      {(challengesResult.data ?? []).length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {challengesResult.data?.map((challenge) => {
            const progress = progressMap.get(challenge.id)
            const percent = Math.min(100, Math.round(((progress?.contribution ?? 0) / challenge.target) * 100))
            return (
              <li key={challenge.id} className="bb-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline">{challenge.scope === "community" ? "Township goal" : "Personal goal"}</Badge>
                    <h2 className="mt-3 font-display text-lg">{challenge.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <span className="shrink-0 font-display text-lg text-ink tabular-nums">+{challenge.reward_points}</span>
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-sm"><span>{progress?.contribution ?? 0} / {challenge.target}</span><span className="text-muted-foreground">Ends {new Date(challenge.ends_at).toLocaleDateString("en-MY")}</span></div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-line-impact" style={{ width: `${percent}%` }} /></div>
                </div>
                {progress?.completed_at ? <p className="mt-3 text-sm font-bold text-ink">Completed</p> : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty>
          <EmptyHeader><EmptyTitle>No active challenges</EmptyTitle><EmptyDescription>Shared goals will appear here when the township office starts one.</EmptyDescription></EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
