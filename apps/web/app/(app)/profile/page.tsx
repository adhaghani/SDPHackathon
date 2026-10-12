import Link from "next/link"

import { CalendarDaysIcon, ChevronRightIcon, HistoryIcon, PackageIcon, SettingsIcon } from "lucide-react"

import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { requireActiveMember } from "@/lib/data"
import { isFeatureEnabled } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { SwitchTownshipButton } from "@/components/profile/switch-township-button"
import { BadgeCard } from "@/components/rewards/badge-card"
import { SignOutButton } from "@/components/navigation/sign-out-button"

export default async function ProfilePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [badgesResult, lentResult, borrowedResult, townshipsResult] = await Promise.all([
    supabase.from("user_badges").select("id,earned_at,badges(name,description,icon)").eq("user_id", active.user.id).eq("township_id", active.townshipId),
    supabase.from("bookings").select("id").eq("lender_id", active.user.id).eq("status", "completed"),
    supabase.from("bookings").select("id").eq("borrower_id", active.user.id).eq("status", "completed"),
    supabase.from("townships").select("id,name").in("id", (active.memberships ?? []).map((row) => row.township_id)),
  ])
  const townshipNames = new Map((townshipsResult.data ?? []).map((township) => [township.id, township.name]))

  const name = active.profile?.display_name ?? "Neighbour"
  const role = active.membership?.role?.replace("_", " ") ?? "resident"
  const links = [
    { href: "/profile/settings", label: "Profile and comfort settings", icon: SettingsIcon },
    { href: "/borrow/mine", label: "Borrowing and lending", icon: PackageIcon },
    { href: "/events/mine", label: "Your events", icon: CalendarDaysIcon },
    { href: "/rewards/activity", label: "BetterPoints history", icon: HistoryIcon },
  ]

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <section className="bb-card flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-full bg-lilac font-display text-2xl font-extrabold text-ink">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow text-ink-muted">{active.membership.townships?.name ?? "Your township"}</p>
          <h1 className="text-display-lg mt-0.5 break-words text-ink">{name}</h1>
          <p className="mt-0.5 text-ink-muted capitalize">{role}</p>
        </div>
        <BetterPointsChip balance={active.points?.balance ?? 0} />
      </section>

      <dl className="grid grid-cols-2 gap-3">
        <div className="bb-card p-4">
          <dt className="text-sm text-ink-muted">Pinjam · Items lent</dt>
          <dd className="mt-1 font-display text-3xl font-extrabold text-ink tabular-nums">{lentResult.data?.length ?? 0}</dd>
        </div>
        <div className="bb-card p-4">
          <dt className="text-sm text-ink-muted">Pinjam · Borrows completed</dt>
          <dd className="mt-1 font-display text-3xl font-extrabold text-ink tabular-nums">{borrowedResult.data?.length ?? 0}</dd>
        </div>
      </dl>

      <nav aria-label="Your account">
        <ul className="bb-card divide-y divide-hairline">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-14 items-center gap-3 px-4 font-bold text-ink transition-colors duration-150 ease-out hover:bg-ground">
                <Icon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" strokeWidth={1.8} />
                <span className="flex-1">{label}</span>
                <ChevronRightIcon aria-hidden="true" className="size-4 text-ink-muted" />
              </Link>
            </li>
          ))}
          <li className="px-2 py-1.5">
            <SignOutButton className="w-full justify-start px-2 text-ink" />
          </li>
        </ul>
      </nav>

      {isFeatureEnabled("multi_township") ? (
        <section aria-labelledby="townships-heading">
          <h2 id="townships-heading" className="text-heading text-ink">Townships</h2>
          <p className="mt-1 text-sm text-ink-muted">Switch between your active memberships.</p>
          <ul className="bb-card mt-4 divide-y divide-hairline">
            {(active.memberships ?? []).filter((row) => row.status === "active").map((row) => (
              <li key={row.township_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{townshipNames.get(row.township_id) ?? "Township"}</p>
                  <p className="text-sm text-ink-muted capitalize">{row.role.replace("_", " ")}</p>
                </div>
                <SwitchTownshipButton townshipId={row.township_id} name={townshipNames.get(row.township_id) ?? "this township"} current={row.township_id === active.townshipId} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="badges-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="badges-heading" className="text-heading text-ink">Badges earned</h2>
          <Link href="/rewards" className="text-sm font-bold text-ink underline underline-offset-4">All badges</Link>
        </div>
        {(badgesResult.data ?? []).length ? (
          <ul className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-6 sm:gap-3">
            {badgesResult.data?.map((badge, index) => (
              <BadgeCard key={badge.id} index={index} name={badge.badges?.name ?? "Award"} description={badge.badges?.description ?? ""} icon={badge.badges?.icon ?? "award"} earned />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">No badges yet. Your first verified activity starts the route.</p>
        )}
      </section>
    </div>
  )
}
