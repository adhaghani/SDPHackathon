"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  Building2Icon,
  CalendarDaysIcon,
  DatabaseIcon,
  HouseIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { judgeRoles, type JudgeRole } from "@/lib/judges/config"
import { usePreviewSession } from "./session"
import { ResidentView } from "./resident"
import { ManagerView, GuardView, EventView } from "./team-views"
import styles from "./judges.module.css"

const icons = {
  resident: HouseIcon,
  manager: Building2Icon,
  guard: ShieldCheckIcon,
  event: CalendarDaysIcon,
}

export function PreviewApp({ role }: { role: JudgeRole }) {
  const session = usePreviewSession()
  const [resetOpen, setResetOpen] = useState(false)
  const current = judgeRoles.find((item) => item.id === role)!
  return (
    <div className={styles.world}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <div className={styles.demoBar}>
        <span>
          <DatabaseIcon size={15} aria-hidden="true" />
          <strong>Seeded demo data</strong>
          <span> · No database connection</span>
        </span>
        <Link href="/">
          Judges overview <ArrowUpRightIcon size={14} aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.appGrid}>
        <aside className={styles.sidebar}>
          <Link href="/" aria-label="BorrowLah judges overview">
            <BrandLogo variant="dark" />
          </Link>
          <p className={styles.sidebarTown}>
            Harmoni Heights
            <br />
            <span>Fictional demo township</span>
          </p>
          <nav aria-label="Demo perspectives">
            <p>Explore a perspective</p>
            {judgeRoles.map((item) => {
              const Icon = icons[item.id]
              return (
                <Link
                  href={`/preview/${item.id}`}
                  key={item.id}
                  aria-current={role === item.id ? "page" : undefined}
                >
                  <Icon size={19} aria-hidden="true" />
                  {item.name}
                  <ArrowRightIcon size={16} aria-hidden="true" />
                </Link>
              )
            })}
          </nav>
          <div className={styles.sidebarBottom}>
            <div className={styles.avatar}>
              <UsersIcon size={21} aria-hidden="true" />
            </div>
            <div>
              <strong>{current.person}</strong>
              <span>Demo {current.name.toLowerCase()}</span>
            </div>
          </div>
          <Link href="/" className={styles.backLink}>
            <ArrowLeftIcon size={16} aria-hidden="true" />
            Back to overview
          </Link>
        </aside>
        <div className={styles.appBody}>
          <header className={styles.appHeader}>
            <span>{current.name} perspective</span>
            <div>
              <a href="https://borrowlah.my" target="_blank" rel="noreferrer">
                Live app <ArrowUpRightIcon size={15} aria-hidden="true" />
              </a>
              <button
                className={styles.resetButton}
                onClick={() => setResetOpen(!resetOpen)}
                aria-expanded={resetOpen}
              >
                <RotateCcwIcon size={15} aria-hidden="true" />
                Reset demo
              </button>
            </div>
          </header>
          {resetOpen && (
            <div className={styles.resetPrompt}>
              <p>
                Restore all four perspectives to their seeded starting state?
              </p>
              <div>
                <button
                  className={styles.button}
                  onClick={() => {
                    session.reset()
                    setResetOpen(false)
                  }}
                >
                  Reset all demo data
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setResetOpen(false)}
                >
                  Keep exploring
                </button>
              </div>
            </div>
          )}
          <main id="main" className={styles.appMain}>
            {!session.ready ? (
              <p role="status">Loading seeded demo…</p>
            ) : (
              <>
                {role === "resident" && <ResidentView session={session} />}
                {role === "manager" && <ManagerView session={session} />}
                {role === "guard" && <GuardView session={session} />}
                {role === "event" && <EventView session={session} />}
              </>
            )}
          </main>
          <footer className={styles.appFooter}>
            Interactive simulation · Fictional people and sample figures ·
            Changes stay in this tab
          </footer>
        </div>
      </div>
    </div>
  )
}
