"use client"

import { useState } from "react"
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  UsersIcon,
  CheckIcon,
  GiftIcon,
  PackageIcon,
  RecycleIcon,
  NewspaperIcon,
  CupSodaIcon,
  CylinderIcon,
  BottleWineIcon,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import styles from "./brief.module.css"

export function Principles() {
  const [selected, setSelected] = useState<number | null>(null)
  const principles = [
    {
      label: "Reduce",
      detail: "Borrow before buying",
      description:
        "Use an existing item for the task, then return it for someone else to borrow.",
      Icon: PackageIcon,
    },
    {
      label: "Reuse",
      detail: "Give useful things a second home",
      description:
        "Pass something you no longer need to a neighbour who can use it.",
      Icon: GiftIcon,
    },
    {
      label: "Recycle",
      detail: "Sort, log and keep going",
      description:
        "Record self-reported recycling estimates and follow shared campaign goals.",
      Icon: RecycleIcon,
    },
  ]
  return (
    <div className={styles.pillars}>
      {principles.map(({ label, detail, Icon }, i) => (
        <button
          type="button"
          className={cn(styles.pillar, styles.interactive)}
          key={label}
          aria-pressed={selected === i}
          onClick={() => setSelected(i)}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <Icon aria-hidden="true" />
          <strong>{label}</strong>
          <span>{detail}</span>
        </button>
      ))}
      <p className={styles.interactionDetail} aria-live="polite">
        {selected === null
          ? "Three ways to use resources more carefully."
          : principles[selected]!.description}
      </p>
    </div>
  )
}

export function BorrowJourney() {
  const [selected, setSelected] = useState<number | null>(null)
  const steps = [
    {
      label: "Find & request",
      detail:
        "The borrower checks availability, chooses dates and sends a request.",
    },
    {
      label: "Owner approves",
      detail:
        "The owner reviews the request. Approval alone earns no BetterPoints.",
    },
    {
      label: "Both confirm handover",
      detail:
        "The borrower and owner each confirm collection. One confirmation leaves the booking waiting.",
    },
    {
      label: "Borrower returns",
      detail:
        "The borrower marks the item returned. The owner still needs to confirm.",
    },
    {
      label: "Owner confirms return",
      detail:
        "The owner records the condition and confirms return to complete the loan.",
    },
  ]
  return (
    <div>
      <ol className={styles.journey}>
        {steps.map(({ label }, i) => (
          <li key={label} style={{ animationDelay: `${i * 90}ms` }}>
            <button
              type="button"
              className={styles.interactive}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span>{i + 1}</span>
              <strong>{label}</strong>
              <ArrowUpRightIcon aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <p className={styles.interactionDetail} aria-live="polite">
        {selected === null
          ? "How borrowing works: follow each step from request to return."
          : steps[selected]!.detail}
      </p>
    </div>
  )
}

const recyclingMaterials = [
  { material: "Paper", Icon: NewspaperIcon },
  { material: "Plastic", Icon: CupSodaIcon },
  { material: "Metal", Icon: CylinderIcon },
  { material: "Glass", Icon: BottleWineIcon },
] as const

export function RecyclingMaterials() {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className={styles.materials}>
      {recyclingMaterials.map(({ material, Icon }, i) => (
        <button
          type="button"
          key={material}
          className={styles.interactive}
          aria-pressed={selected === material}
          onClick={() => setSelected(material)}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Icon aria-hidden="true" />
          <strong>{material}</strong>
        </button>
      ))}
      <p className={styles.interactionDetail} aria-live="polite">
        {selected
          ? `${selected}: record an estimate by item count or custom kilograms using the available units in the app.`
          : "Sort first. Record after recycling."}
      </p>
    </div>
  )
}

export function PilotMeasures() {
  const [selected, setSelected] = useState<number | null>(null)
  const measures = [
    {
      label: "Completed loans",
      detail:
        "Loans that reach a confirmed return, rather than requests alone.",
    },
    {
      label: "Giveaway handovers",
      detail: "Transfers confirmed by both the giver and the recipient.",
    },
    {
      label: "Recycling logs",
      detail:
        "Self-reported contributions, kept separate from measured collection weights.",
    },
    {
      label: "Repeat participation",
      detail: "Whether residents return for another action on a later day.",
    },
  ]
  return (
    <div>
      <ul className={styles.measures}>
        {measures.map(({ label }, i) => (
          <li key={label}>
            <button
              type="button"
              className={styles.interactive}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <CheckIcon aria-hidden="true" />
              {label}
              <ArrowUpRightIcon aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.interactionDetail} aria-live="polite">
        {selected === null
          ? "Plus resident feedback and staff effort."
          : measures[selected]!.detail}
      </p>
    </div>
  )
}

export function GiveawayRoles() {
  const [selected, setSelected] = useState<"giver" | "recipient" | null>(null)
  return (
    <div className={styles.transfer}>
      <button
        type="button"
        className={styles.interactive}
        aria-label="Explore the giver's role"
        aria-pressed={selected === "giver"}
        onClick={() => setSelected("giver")}
      >
        <UsersIcon aria-hidden="true" />
        <strong>
          A household
          <br />
          ready to give
        </strong>
      </button>
      <ArrowRightIcon className={styles.transferArrow} aria-hidden="true" />
      <button
        type="button"
        className={styles.interactive}
        aria-label="Explore the recipient's role"
        aria-pressed={selected === "recipient"}
        onClick={() => setSelected("recipient")}
      >
        <GiftIcon aria-hidden="true" />
        <strong>
          A neighbour
          <br />
          ready to reuse
        </strong>
      </button>
      <p className={styles.interactionDetail} aria-live="polite">
        {selected === "giver"
          ? "The giver lists the item, describes its condition and confirms handover."
          : selected === "recipient"
            ? "The recipient claims the item and confirms collection. No return is expected."
            : "Both confirm the handover before the giveaway is completed."}
      </p>
    </div>
  )
}
