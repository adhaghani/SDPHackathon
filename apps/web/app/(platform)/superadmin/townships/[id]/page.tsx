import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePlatformAdmin, getPlatformTownships } from "@/lib/platform"
import { TownshipForm } from "@/components/platform/township-form"
import { ManagerPanel } from "@/components/platform/manager-panel"

export default async function TownshipDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; invitation?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const { supabase } = await requirePlatformAdmin()
  const townships = await getPlatformTownships()
  const township = townships.find((t) => t.id === id)
  if (!township) notFound()
  const [managers, activity] = await Promise.all([
    supabase
      .from("platform_manager_invitations")
      .select("*")
      .eq("township_id", id)
      .order("created_at"),
    supabase
      .from("platform_audit_log")
      .select("id,actor_id,action,created_at,details")
      .eq("township_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])
  if (managers.error || activity.error)
    throw new Error("Could not load township management details.")
  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/superadmin"
        className="w-fit text-sm font-bold underline underline-offset-4"
      >
        Back to townships
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            {township.name}
          </h1>
          <span className="rounded-full bg-lime px-3 py-1 text-sm font-bold capitalize">
            {township.lifecycle}
          </span>
        </div>
        <p className="mt-3 text-ink-muted">
          {[township.district, township.state].filter(Boolean).join(", ") ||
            "Add location details below"}{" "}
          · Join code:{" "}
          <strong className="text-ink">{township.join_code}</strong>
        </p>
      </div>
      {query.saved ? (
        <p
          role="status"
          className="rounded-xl border border-hairline bg-lime p-4 text-sm"
        >
          Township saved.{" "}
          {township.lifecycle === "draft"
            ? "Check the manager appointment, then change its status to Active in Review below."
            : "Your changes are ready."}
        </p>
      ) : null}
      {query.invitation === "failed" ? (
        <p
          role="alert"
          className="rounded-xl border border-hairline p-4 text-sm"
        >
          The township was created, but its first manager appointment needs
          attention. Check the manager section and retry.
        </p>
      ) : null}
      <ManagerPanel
        townshipId={id}
        invitations={managers.data}
        archived={township.lifecycle === "archived"}
      />
      <section
        aria-labelledby="edit-township-heading"
        className="border-t border-hairline pt-8"
      >
        <h2
          id="edit-township-heading"
          className="mb-5 font-display text-2xl font-bold"
        >
          Township details and boundary
        </h2>
        <TownshipForm
          key={JSON.stringify(township)}
          township={township}
          townships={townships}
        />
      </section>
      <section
        aria-labelledby="activity-heading"
        className="border-t border-hairline pt-7"
      >
        <h2 id="activity-heading" className="font-display text-2xl font-bold">
          Recent setup activity
        </h2>
        {activity.data.length ? (
          <ul className="mt-4 divide-y divide-hairline">
            {activity.data.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-bold capitalize">
                    {event.action.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs break-all text-ink-muted">
                    Account: {event.actor_id ?? "Deleted account"}
                  </p>
                </div>
                <time dateTime={event.created_at}>
                  {new Intl.DateTimeFormat("en-MY", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kuala_Lumpur",
                  }).format(new Date(event.created_at))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            No setup changes recorded yet.
          </p>
        )}
      </section>
    </div>
  )
}
