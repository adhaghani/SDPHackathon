"use client"

import Image from "next/image"
import { ArrowRightIcon, CheckIcon } from "lucide-react"
import type { BriefScene } from "./scenes"
import styles from "./brief.module.css"

const appSequences = {
  "find-request": {
    product: "pressure-washer-photo",
    productAlt: "Illustrated pressure washer",
    screens: ["borrow-find", "borrow-availability", "borrow-request"],
    labels: ["Find the item", "Check availability", "Choose dates & request"],
    descriptions: [
      "Actual mobile app: pressure washer details with an illustrated product photo",
      "Actual mobile app: borrowing availability calendar",
      "Actual mobile app: selected dates and the Request button",
    ],
    note: "Sample dates · request ready to send",
  },
  "giveaway-listing": {
    product: "reuse-books-plant",
    productAlt: "Illustrated books and a potted plant",
    screens: ["giveaway-listing", "giveaway-condition", "giveaway-handover"],
    labels: [
      "List the item",
      "Describe its condition",
      "Choose a shared location",
    ],
    descriptions: [
      "Actual mobile app: sample giveaway listing with illustrated books and a plant",
      "Actual mobile app: giveaway description and condition in an unsaved draft",
      "Actual mobile app: shared handover location in an unsaved giveaway draft",
    ],
    note: "Sample listing & unsaved draft",
  },
  "recycling-entry": {
    product: "recycling-paper-cans",
    productAlt: "Illustrated paper and metal cans",
    screens: ["recycling-count", "recycling-weight"],
    labels: ["Count items", "Custom kg"],
    descriptions: [
      "Actual mobile app: Count items method with a sample bottle count",
      "Actual mobile app: Custom kg method with a sample paper weight",
    ],
    note: "Self-reported estimates · sample inputs",
  },
} as const

export type MobileAppScene = keyof typeof appSequences

export function isMobileAppScene(id: string): id is MobileAppScene {
  return Object.hasOwn(appSequences, id)
}

export function MobileApp({
  scene,
  beatIndex,
  onBeat,
}: {
  scene: BriefScene & { id: MobileAppScene }
  beatIndex: number
  onBeat: (beat: number) => void
}) {
  const sequence = appSequences[scene.id]
  return (
    <div className={styles.mobileDemo} data-app-scene={scene.id}>
      <div
        className={styles.phoneFrame}
        role="img"
        aria-label={sequence.descriptions[beatIndex]}
      >
        {sequence.screens.map((screen, i) => (
          <Image
            key={screen}
            src={`/images/brief/app/${screen}.png`}
            alt=""
            aria-hidden="true"
            width={390}
            height={760}
            unoptimized
            loading="eager"
            className={styles.appCapture}
            data-active={i === beatIndex}
          />
        ))}
      </div>
      <div className={styles.appStory}>
        <div className={styles.appProduct}>
          <Image
            src={`/images/brief/${sequence.product}.png`}
            alt={sequence.productAlt}
            fill
            sizes="(max-width: 700px) 120px, 16vw"
          />
        </div>
        <ol className={styles.appSteps}>
          {sequence.labels.map((label, i) => (
            <li
              key={label}
              data-past={i < beatIndex}
              data-active={i === beatIndex}
            >
              <button
                type="button"
                aria-pressed={i === beatIndex}
                onClick={() => onBeat(i)}
              >
                <span aria-hidden="true">
                  {i < beatIndex ? <CheckIcon /> : i + 1}
                </span>
                <strong>{label}</strong>
                {i === beatIndex && <ArrowRightIcon aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ol>
        <p className={styles.appCaption}>Actual app UI · sample data</p>
        <p className={styles.appDisclaimer}>{sequence.note}</p>
      </div>
    </div>
  )
}
