"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRightIcon, PlusIcon, SearchIcon } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { LazyBoundaryMap } from "./lazy-boundary-map"
import { boundarySchema } from "@/lib/validation/township"
import type { PlatformTownship } from "@/lib/platform"

export function TownshipDirectory({
  townships,
}: {
  townships: PlatformTownship[]
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const filtered = townships.filter(
    (t) =>
      (status === "all" || t.lifecycle === status) &&
      `${t.name} ${t.state} ${t.district}`
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  const mapped = filtered.map((t) => ({
    ...t,
    boundary: boundarySchema.safeParse(t.boundary).data ?? null,
  }))
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Townships, connected.
          </h1>
          <p className="mt-3 max-w-xl text-ink-muted">
            Set the place, appoint its people, and give each community room to
            grow.
          </p>
        </div>
        <Link
          href="/superadmin/townships/new"
          className={buttonVariants({ variant: "cta", size: "lg" })}
        >
          <PlusIcon aria-hidden="true" />
          Create township
        </Link>
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <section aria-label="Township directory" className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-40 flex-1">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-3 left-3 size-4"
              />
              <Input
                aria-label="Search townships"
                placeholder="Search name, state or district"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <NativeSelect
              aria-label="Filter township status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <NativeSelectOption value="all">All statuses</NativeSelectOption>
              {["draft", "active", "archived"].map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {s[0]!.toUpperCase() + s.slice(1)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <p className="mb-3 text-sm text-ink-muted" role="status">
            {filtered.length} {filtered.length === 1 ? "township" : "townships"}
          </p>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {filtered.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/superadmin/townships/${t.id}`}
                  className="group flex min-h-28 items-center justify-between gap-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${t.lifecycle === "active" ? "bg-lime text-ink" : "bg-muted text-ink"}`}
                      >
                        {t.lifecycle}
                      </span>
                      {!t.boundary ? (
                        <span className="text-xs text-ink-muted">
                          Boundary needed
                        </span>
                      ) : null}
                    </div>
                    <h2 className="font-display text-xl font-bold group-hover:underline">
                      {t.name}
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      {[t.district, t.state].filter(Boolean).join(", ") ||
                        "Location details needed"}{" "}
                      · {t.neighbourhoods.length} neighbourhoods
                    </p>
                  </div>
                  <ArrowUpRightIcon
                    aria-hidden="true"
                    className="size-5 shrink-0"
                  />
                </Link>
              </li>
            ))}
          </ul>
          {!filtered.length ? (
            <p className="py-10 text-ink-muted">
              {townships.length
                ? "No townships match. Try another search or status."
                : "Create your first township to start building its community."}
            </p>
          ) : null}
        </section>
        <section
          aria-label="Township boundary overview"
          className="min-w-0 lg:sticky lg:top-6"
        >
          <LazyBoundaryMap townships={mapped} />
          <p className="mt-3 text-sm text-ink-muted">
            Saved boundaries are planning areas. Resident locations are never
            plotted.
          </p>
        </section>
      </div>
    </div>
  )
}
