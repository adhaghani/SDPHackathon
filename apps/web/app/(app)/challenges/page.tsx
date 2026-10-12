import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { formatEventDate } from "@/lib/format"
import { cn } from "@workspace/ui/lib/utils"
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

  const challenges = challengesResult.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        className="mb-0"
        eyebrow="Rimba · Shared goals"
        title="Challenges"
        description="Progress counts only verified activity: check-ins, completed loans and confirmed help. Never views or sign-ups."
      />
      {challenges.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => {
            const progress = progressMap.get(challenge.id)
            const contribution = progress?.contribution ?? 0
            const percent = Math.min(100, Math.round((contribution / challenge.target) * 100))
            const done = Boolean(progress?.completed_at)
            return (
              <li key={challenge.id} className={cn("bb-card flex flex-col p-5", done && "border-mint bg-mint-tint")}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-eyebrow text-ink-muted">{challenge.scope === "community" ? "Township goal" : "Personal goal"}</p>
                  <BetterPointsChip variant="earned" balance={challenge.reward_points} />
                </div>
                <h2 className="text-title mt-2 text-ink">{challenge.title}</h2>
                {challenge.description ? <p className="mt-1 text-sm text-ink-muted">{challenge.description}</p> : null}
                <div className="mt-auto pt-5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-bold text-ink tabular-nums">
                      {contribution.toLocaleString("en-MY")} of {challenge.target.toLocaleString("en-MY")}
                    </span>
                    <span className="text-ink-muted">{done ? "Completed" : `Ends ${formatEventDate(challenge.ends_at)}`}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${challenge.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-lilac-tint"
                  >
                    <div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty className="bb-card">
          <EmptyHeader>
            <EmptyTitle>No active challenges</EmptyTitle>
            <EmptyDescription>Shared goals appear here when the township office or a sponsor starts one.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
