"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CompassIcon,
} from "lucide-react"
import { judgeRoles } from "@/lib/judges/config"
import { getDemoJourney } from "@/lib/judges/journey"
import type { PreviewState } from "@/lib/judges/seed"
import styles from "./judges.module.css"

export function DemoJourney({
  state,
  onOpenTask,
}: {
  state: PreviewState
  onOpenTask: (href: string) => void
}) {
  const steps = getDemoJourney(state)
  const completed = steps.filter((step) => step.done).length
  const next = steps.find((step) => !step.done)
  return (
    <section className={styles.journey} aria-label="Guided demo progress">
      <div className={styles.journeyTop}>
        <div className={styles.journeyHeading}>
          <CompassIcon size={22} aria-hidden="true" />
          <div>
            <h2>Your demo route</h2>
            <p>
              {completed === steps.length
                ? "You’ve explored every perspective. Keep looking around or reset for another run."
                : "Follow one connected story, or explore the roles in any order."}
            </p>
          </div>
        </div>
        {next ? (
          <Link
            href={next.href}
            className={styles.journeyNext}
            onNavigate={() => onOpenTask(next.href)}
          >
            Next: {next.title}
            <ArrowRightIcon size={17} aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href="/preview/resident?task=rewards"
            onNavigate={() => onOpenTask("/preview/resident?task=rewards")}
            className={styles.journeyNext}
          >
            Explore sample rewards{" "}
            <ArrowRightIcon size={17} aria-hidden="true" />
          </Link>
        )}
      </div>
      <details className={styles.journeyDetails}>
        <summary>
          <span>
            <strong>
              {completed} of {steps.length}
            </strong>{" "}
            demo steps complete
          </span>
          <span>
            View route <ChevronDownIcon size={16} aria-hidden="true" />
          </span>
        </summary>
        <progress
          max={steps.length}
          value={completed}
          aria-label="Guided demo completion"
          className={styles.journeyProgress}
        />
        <ol>
          {steps.map((step, index) => (
            <li key={step.id}>
              <span
                className={
                  step.done ? styles.journeyDone : styles.journeyNumber
                }
              >
                {step.done ? (
                  <CheckIcon size={16} aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <div>
                <Link href={step.href} onNavigate={() => onOpenTask(step.href)}>
                  {step.title}
                  <ArrowRightIcon size={15} aria-hidden="true" />
                </Link>
                <p>{step.detail}</p>
              </div>
              <span className={styles.journeyState}>
                {step.done ? "Complete" : "To try"}
              </span>
            </li>
          ))}
        </ol>
        <p className={styles.small}>
          Suggested time: 3–5 minutes. Progress reflects sample actions in this
          tab, not real township activity.
        </p>
      </details>
    </section>
  )
}

export function DemoActivityLog({ state }: { state: PreviewState }) {
  if (state.activity.length === 0) return null
  return (
    <section
      className={styles.activityLog}
      aria-labelledby="demo-activity-title"
    >
      <div className={styles.sectionTop}>
        <div>
          <h2 id="demo-activity-title">What changed in this demo.</h2>
          <p>Recent actions across all four perspectives · This tab only</p>
        </div>
        <span className={styles.status}>Local simulation</span>
      </div>
      <ol>
        {state.activity.map((entry) => (
          <li key={entry.id}>
            <CheckIcon size={16} aria-hidden="true" />
            <div>
              <p>{entry.message}</p>
              <span>
                {judgeRoles.find((role) => role.id === entry.role)?.name}{" "}
                perspective
              </span>
            </div>
            <time dateTime={new Date(entry.at).toISOString()}>
              {new Intl.DateTimeFormat("en-MY", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Kuala_Lumpur",
              }).format(entry.at)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  )
}
