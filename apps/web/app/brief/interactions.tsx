"use client"

import Image from "next/image"
import {
  ArrowRightIcon,
  CheckIcon,
  UsersIcon,
  GiftIcon,
  PackageIcon,
  RecycleIcon,
  NewspaperIcon,
  CupSodaIcon,
  CylinderIcon,
  BottleWineIcon,
  LeafIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClipboardListIcon,
  MessageCircleIcon,
  Repeat2Icon,
  HandshakeIcon,
  ScaleIcon,
  ListFilterIcon,
  ZapIcon,
  CloudIcon,
  SearchIcon,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { cn } from "@workspace/ui/lib/utils"
import type { BriefBeat, BriefScene } from "./scenes"
import styles from "./brief.module.css"
import { MobileApp, isMobileAppScene } from "./mobile-app"

const objects = [
  {
    name: "Reduce",
    asset: "pressure-washer-photo",
    caption: "Borrow before buying",
    Icon: PackageIcon,
  },
  {
    name: "Reuse",
    asset: "reuse-chair",
    caption: "Pass useful things on",
    Icon: GiftIcon,
  },
  {
    name: "Recycle",
    asset: "recycle-bottles",
    caption: "Recycle responsibly",
    Icon: RecycleIcon,
  },
]
const supportingObjects = [
  { name: "Reduce", asset: "borrow-tools", caption: "Borrow tools for a task" },
  {
    name: "Reuse",
    asset: "reuse-books-plant",
    caption: "Pass useful things on",
  },
  {
    name: "Recycle",
    asset: "recycling-paper-cans",
    caption: "Sort paper and metal",
  },
]
const materials = [
  { name: "Paper", Icon: NewspaperIcon },
  { name: "Plastic", Icon: CupSodaIcon },
  { name: "Metal", Icon: CylinderIcon },
  { name: "Glass", Icon: BottleWineIcon },
]
function ObjectImage({
  asset,
  alt,
  className,
}: {
  asset: string
  alt: string
  className?: string
}) {
  return (
    <div className={cn(styles.beatImage, className)}>
      <Image
        src={`/images/brief/${asset}.png`}
        alt={alt}
        fill
        sizes="(max-width: 700px) 280px, 40vw"
      />
    </div>
  )
}
function ObjectRecap({
  focus,
  onBeat,
  selectable = false,
}: {
  focus: number
  onBeat: (beat: number) => void
  selectable?: boolean
}) {
  return (
    <div className={styles.objectRecap}>
      <BrandLogo />
      <div className={styles.recapObjects}>
        {supportingObjects.map(({ name, asset, caption }, i) => (
          <button
            type="button"
            key={name}
            className={styles.objectChoice}
            aria-pressed={focus === i || focus === 3}
            data-dim={focus < 3 && focus !== i}
            onClick={() => selectable && onBeat(i)}
            disabled={!selectable}
          >
            <ObjectImage asset={asset} alt={caption} />
            <strong>{name}</strong>
            <span>{caption}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
function Flow({
  scene,
  focus,
  onBeat,
}: {
  scene: BriefScene
  focus: number
  onBeat: (beat: number) => void
}) {
  const chair = scene.visual === "flow-chair"
  const offset = scene.id === "reuse-purpose" ? 1 : 0
  return (
    <div className={styles.flowDiagram}>
      <ObjectImage
        asset={chair ? "reuse-books-plant" : "pressure-washer-photo"}
        alt={
          chair
            ? "Books and a plant finding a new owner"
            : "A shared pressure washer"
        }
      />
      <ol>
        {scene.items!.map((label, i) => (
          <li key={label} data-past={i < focus} data-active={i === focus}>
            <button
              type="button"
              aria-pressed={i === focus}
              onClick={() => onBeat(i + offset)}
            >
              <span>
                {i < focus ? <CheckIcon aria-hidden="true" /> : i + 1}
              </span>
              <strong>{label}</strong>
              {i === focus && <ArrowRightIcon aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ol>
      <p className={styles.visualNote}>
        How it works · presentation illustration
      </p>
    </div>
  )
}

export function SlideVisual({
  scene,
  beat,
  beatIndex,
  onBeat,
}: {
  scene: BriefScene
  beat: BriefBeat
  beatIndex: number
  onBeat: (beat: number) => void
}) {
  const focus = beat.focus
  if (isMobileAppScene(scene.id)) {
    return (
      <MobileApp
        scene={{ ...scene, id: scene.id }}
        beatIndex={beatIndex}
        onBeat={onBeat}
      />
    )
  }
  switch (scene.visual) {
    case "garden":
      return (
        <div className={styles.garden}>
          <Image
            src="/images/township-garden.webp"
            alt="A green garden surrounded by township homes"
            fill
            priority
            sizes="60vw"
          />
          <div className={styles.photoCaption}>
            <LeafIcon aria-hidden="true" />
            Caring for the planet, close to home.
          </div>
        </div>
      )
    case "scenarios":
      return (
        <div className={styles.scenarios}>
          {objects.map(({ asset }, i) => (
            <button
              type="button"
              className={styles.interactive}
              key={asset}
              aria-pressed={focus === i}
              data-dim={focus < 3 && focus !== i}
              onClick={() => onBeat(i)}
            >
              <div className={styles.scenarioMedia}>
                <Image
                  src={`/images/brief/${asset}.png`}
                  alt={
                    [
                      "A pressure washer used once.",
                      "A chair nobody needs anymore.",
                      "Bottles waiting to be sorted.",
                    ][i]!
                  }
                  fill
                  sizes="28vw"
                />
              </div>
              <strong>
                {
                  [
                    "A pressure washer used once.",
                    "A chair nobody needs anymore.",
                    "Bottles waiting to be sorted.",
                  ][i]
                }
              </strong>
            </button>
          ))}
          <button
            type="button"
            className={styles.scenarioSummary}
            aria-pressed={focus === 3}
            onClick={() => onBeat(3)}
          >
            <span>Three opportunities to choose differently.</span>
            <ArrowRightIcon aria-hidden="true" />
          </button>
        </div>
      )
    case "pillars":
      return (
        <div className={styles.pillars}>
          {objects.map(({ name, caption, Icon }, i) => (
            <button
              type="button"
              className={cn(styles.pillar, styles.interactive)}
              aria-pressed={focus === i}
              key={name}
              onClick={() => onBeat(i)}
            >
              <Icon aria-hidden="true" />
              <strong>{name}</strong>
              <span>{caption}</span>
            </button>
          ))}
        </div>
      )
    case "recap":
      return (
        <ObjectRecap
          focus={focus}
          onBeat={onBeat}
          selectable={scene.id === "recap"}
        />
      )
    case "washer":
    case "chair":
      return (
        <div className={styles.singleObject} data-active={focus > 0}>
          <ObjectImage
            asset={
              scene.visual === "washer"
                ? "pressure-washer-photo"
                : "reuse-books-plant"
            }
            alt={
              scene.visual === "washer"
                ? "Pressure washer with reuse arrows"
                : "Books and a plant ready for another household"
            }
          />
          <div className={styles.objectRoute}>
            <span>
              {scene.visual === "washer" ? "Nearby item" : "One household"}
            </span>
            <ArrowRightIcon aria-hidden="true" />
            <strong>
              {focus > 0
                ? scene.visual === "washer"
                  ? "Borrow for the task"
                  : "Another household"
                : scene.visual === "washer"
                  ? "Occasional task"
                  : "Still useful"}
            </strong>
          </div>
        </div>
      )
    case "flow-washer":
    case "flow-chair":
      return <Flow scene={scene} focus={focus} onBeat={onBeat} />
    case "aim":
      return (
        <div className={styles.aimDiagram}>
          <ObjectImage
            asset="borrow-tools"
            alt="A drill and stepladder available to share"
          />
          <div className={styles.aimChoices}>
            <span data-active={focus === 0}>Occasional need</span>
            <ArrowRightIcon aria-hidden="true" />
            <span data-active={focus === 1}>Existing item</span>
          </div>
          <p className={styles.evidenceQuestion} data-active={focus === 2}>
            <SearchIcon aria-hidden="true" />
            Did it replace a purchase?
            <small>To assess in a proposed pilot</small>
          </p>
        </div>
      )
    case "handover":
      return (
        <div className={styles.handoverStory}>
          <div className={styles.chairTrack} data-complete={focus >= 2}>
            <span>Giver</span>
            <span>Recipient</span>
            <div className={styles.movingChair}>
              <Image
                src="/images/brief/reuse-books-plant.png"
                alt="Books and a plant moving to their next owner"
                fill
                sizes="25vw"
              />
            </div>
            <ArrowRightIcon aria-hidden="true" />
          </div>
          <div className={styles.confirmationPair}>
            {["Giver confirms", "Recipient confirms"].map((label) => (
              <span key={label} data-confirmed={focus >= 2}>
                {focus >= 2 ? (
                  <CheckIcon aria-hidden="true" />
                ) : (
                  <UsersIcon aria-hidden="true" />
                )}
                {label}
              </span>
            ))}
          </div>
          <strong className={styles.handoverOutcome}>
            {focus >= 3
              ? "A permanent transfer"
              : focus >= 2
                ? "Both confirmed · Completed"
                : "Both confirmations are required"}
          </strong>
          <p className={styles.visualNote}>
            Handover illustration · no live transaction
          </p>
        </div>
      )
    case "materials":
      return (
        <div className={styles.materialStory}>
          <div className={styles.materialGrid}>
            {materials.map(({ name, Icon }) => (
              <div key={name}>
                <Icon aria-hidden="true" />
                <strong>{name}</strong>
              </div>
            ))}
          </div>
          <div className={styles.objectRoute}>
            <span>Sort & recycle</span>
            <ArrowRightIcon aria-hidden="true" />
            <strong data-active={focus > 0}>Record contribution</strong>
          </div>
          <p className={styles.visualNote}>Self-reported estimates</p>
        </div>
      )
    case "estimate":
      return (
        <div className={styles.conversionStory}>
          <div className={styles.formula}>
            <span>Item count</span>
            <strong>×</strong>
            <span>Weight per unit</span>
            <ArrowRightIcon aria-hidden="true" />
            <strong>Estimated kg</strong>
          </div>
          <div className={styles.materialBreakdown} data-active={focus > 0}>
            <ListFilterIcon aria-hidden="true" />
            <strong>By material</strong>
            {materials.map(({ name, Icon }) => (
              <span key={name}>
                <Icon aria-hidden="true" />
                {name}
              </span>
            ))}
          </div>
          <p className={styles.visualNote}>
            A method illustration, without invented quantities.
          </p>
        </div>
      )
    case "equivalents":
      return (
        <div className={styles.factorStory}>
          <div className={styles.factorSource}>
            <ClipboardListIcon aria-hidden="true" />
            <strong>Documented material factors</strong>
          </div>
          <ArrowRightIcon className={styles.factorArrow} aria-hidden="true" />
          <div className={styles.equivalentPair}>
            <div>
              <CloudIcon aria-hidden="true" />
              <strong>Estimated CO₂e</strong>
            </div>
            <div>
              <ZapIcon aria-hidden="true" />
              <strong>Estimated kWh</strong>
            </div>
          </div>
          <p className={styles.visualNote}>
            Shown only where supported by documented factors.
          </p>
        </div>
      )
    case "honesty":
      return (
        <div className={styles.honestyStory}>
          <div data-active={focus === 0}>
            <ScaleIcon aria-hidden="true" />
            <strong>Self-reported estimates</strong>
            <span>Collection weights are not independently measured.</span>
          </div>
          <div data-active={focus === 1}>
            <RecycleIcon aria-hidden="true" />
            <strong>Physical recycling</strong>
            <span>The app records contributions after the action.</span>
          </div>
        </div>
      )
    case "goal":
      return (
        <div className={styles.goalStory}>
          <div className={styles.neighbourNodes} data-connected={focus > 0}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i}>
                <UsersIcon aria-hidden="true" />
              </span>
            ))}
          </div>
          <div className={styles.goalConnection} data-active={focus > 0}>
            <RecycleIcon aria-hidden="true" />
            <strong>
              {focus > 0
                ? "Individual logs → Collective progress"
                : "A shared recycling goal"}
            </strong>
          </div>
          <p>
            {focus > 0
              ? "Visible when a campaign is active"
              : "Set by the township team"}
          </p>
          <p className={styles.visualNote}>
            Campaign capability · self-reported estimates · no progress values
            shown
          </p>
        </div>
      )
    case "recognition":
      return (
        <div className={styles.recognitionStory}>
          <LeafIcon aria-hidden="true" />
          <strong>BetterPoints</strong>
          <div className={styles.recognitionSources}>
            <span data-active={focus === 0}>
              <HandshakeIcon aria-hidden="true" />
              Eligible completed activities
            </span>
            <span data-active={focus === 1}>
              <RecycleIcon aria-hidden="true" />
              Recycling campaign goals
            </span>
          </div>
          <p data-active={focus === 2}>
            Participation rewards.
            <br />
            Environmental evidence is separate.
          </p>
        </div>
      )
    case "pilot":
      return (
        <div className={styles.pilotStory}>
          <MapPinIcon aria-hidden="true" />
          <strong>One township</strong>
          <div>
            <UsersIcon aria-hidden="true" />
            <span>A small resident group</span>
          </div>
          <div className={styles.pilotRs}>
            {objects.map(({ name, Icon }) => (
              <span key={name}>
                <Icon aria-hidden="true" />
                {name}
              </span>
            ))}
          </div>
          <p className={styles.visualNote}>
            Proposed pilot · no results claimed
          </p>
        </div>
      )
    case "measures": {
      const measures = [
        { label: "Completed loans", Icon: PackageIcon },
        { label: "Giveaway handovers", Icon: GiftIcon },
        { label: "Recycling logs", Icon: RecycleIcon },
        { label: "Repeat participation", Icon: Repeat2Icon },
        { label: "Resident feedback", Icon: MessageCircleIcon },
        { label: "Staff effort", Icon: CalendarDaysIcon },
      ]
      return (
        <div className={styles.measureStory}>
          {measures.map(({ label, Icon }, i) => (
            <button
              type="button"
              className={styles.interactive}
              key={label}
              aria-pressed={focus === i}
              onClick={() => onBeat(i)}
            >
              <Icon aria-hidden="true" />
              <strong>{label}</strong>
              {focus === i && <ArrowRightIcon aria-hidden="true" />}
            </button>
          ))}
          <p className={styles.visualNote}>
            Proposed tracking · no pilot results
          </p>
        </div>
      )
    }
    case "learning":
      return (
        <div className={styles.learningStory}>
          <div data-active={focus === 0}>
            <UsersIcon aria-hidden="true" />
            <strong>What residents use</strong>
            <span>Participation and feedback</span>
          </div>
          <ArrowRightIcon aria-hidden="true" />
          <div data-active={focus === 1}>
            <SearchIcon aria-hidden="true" />
            <strong>What we still need to learn</strong>
            <span>Evidence of environmental outcomes</span>
          </div>
        </div>
      )
    case "closing":
      return (
        <div className={styles.closing}>
          <ObjectRecap focus={3} onBeat={onBeat} />
          <span>
            {beatIndex === 2
              ? "Share more. Connect more. Live better."
              : "Caring for the planet starts close to home."}
          </span>
        </div>
      )
  }
}
