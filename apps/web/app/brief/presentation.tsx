"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GiftIcon,
  LeafIcon,
  MaximizeIcon,
  MinimizeIcon,
  RecycleIcon,
  RotateCcwIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { scenes, sceneIndex, type BriefScene } from "./scenes"
import styles from "./brief.module.css"
import {
  Principles,
  GiveawayRoles,
  BorrowJourney,
  RecyclingMaterials,
  PilotMeasures,
} from "./interactions"

function Visual({ scene }: { scene: BriefScene }) {
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
            <LeafIcon aria-hidden="true" /> Caring for the planet, close to
            home.
          </div>
        </div>
      )
    case "pillars":
      return <Principles />
    case "washer":
      return (
        <div className={styles.itemVisual}>
          <Image
            src="/images/brief/pressure-washer-photo.png"
            alt="Edited photo of a yellow Kärcher pressure washer with illustrated reuse arrows and leaves"
            width={1536}
            height={1024}
            sizes="(max-width: 700px) 270px, 45vw"
            priority
          />
          <span className={styles.itemCaption}>
            An afternoon&apos;s task.
            <br />A neighbour&apos;s useful tool.
          </span>
        </div>
      )
    case "borrow":
      return <BorrowJourney />
    case "give":
      return (
        <div className={styles.giftVisual}>
          <div className={styles.giftOrbit}>
            <GiftIcon aria-hidden="true" />
          </div>
          <div className={styles.giftLabel}>
            Still useful.
            <br />
            <strong>Just not yours anymore.</strong>
          </div>
        </div>
      )
    case "handover":
      return <GiveawayRoles />
    case "materials":
      return <RecyclingMaterials />
    case "estimate":
      return (
        <div className={styles.estimate}>
          <div>
            <strong>Count items</strong>
            <span>or enter custom kg</span>
          </div>
          <ArrowRightIcon aria-hidden="true" />
          <div>
            <strong>Estimated kg</strong>
            <span>broken down by material</span>
          </div>
          <p>
            Self-reported estimates.
            <br />
            Logging does not itself recycle the material.
          </p>
        </div>
      )
    case "goal":
      return (
        <div className={styles.collective}>
          <div className={styles.people}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 100}ms` }}>
                <UsersIcon aria-hidden="true" />
              </span>
            ))}
          </div>
          <div className={styles.joinLine} />
          <RecycleIcon className={styles.goalIcon} aria-hidden="true" />
          <strong>
            Individual contributions.
            <br />
            Collective participation.
          </strong>
          <p>Campaign progress uses self-reported estimates.</p>
        </div>
      )
    case "recognition":
      return (
        <div className={styles.recognition}>
          <LeafIcon aria-hidden="true" />
          <strong>BetterPoints</strong>
          <span>
            Recognise contributions.
            <br />
            Encourage the next action.
          </span>
          <p>Participation rewards, not a carbon score.</p>
        </div>
      )
    case "pilot":
      return <PilotMeasures />
    case "closing":
      return (
        <div className={styles.closing}>
          <BrandLogo />
          <div className={styles.closingMark}>
            <LeafIcon aria-hidden="true" />
          </div>
          <span>Caring for the planet starts close to home.</span>
        </div>
      )
  }
}

export function BriefPresentation({
  initialScene,
  initialClean,
}: {
  initialScene: number
  initialClean: boolean
}) {
  const [index, setIndex] = useState(initialScene)
  const [clean, setClean] = useState(initialClean)
  const [replay, setReplay] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [message, setMessage] = useState("")
  const root = useRef<HTMLDivElement>(null)
  const hideButton = useRef<HTMLButtonElement>(null)
  const scene = scenes[index]!

  const go = useCallback((next: number) => {
    setIndex(Math.min(scenes.length - 1, Math.max(0, next)))
    setReplay((value) => value + 1)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (root.current?.requestFullscreen)
        await root.current.requestFullscreen()
      else
        setMessage(
          "Fullscreen is unavailable in this browser. Hide controls and record the presentation area instead."
        )
    } catch {
      setMessage(
        "Fullscreen could not start. Hide controls and record the presentation area instead."
      )
    }
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("scene", scenes[index]!.id)
    if (clean) url.searchParams.set("clean", "1")
    else url.searchParams.delete("clean")
    window.history.replaceState(null, "", url)
  }, [index, clean])

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search)
      setIndex(sceneIndex(params.get("scene") ?? undefined))
      setClean(params.get("clean") === "1")
    }
    window.addEventListener("popstate", sync)
    const onFullscreen = () =>
      setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFullscreen)
    return () => {
      window.removeEventListener("popstate", sync)
      document.removeEventListener("fullscreenchange", onFullscreen)
    }
  }, [])

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, select, textarea, [contenteditable=true]"))
        return
      // Leave native button/link activation to the browser.
      if (
        (event.key === " " || event.key === "Enter") &&
        target?.closest("button, a")
      )
        return
      switch (event.key.toLowerCase()) {
        case "arrowright":
        case "pagedown":
        case " ":
          event.preventDefault()
          go(index + 1)
          break
        case "arrowleft":
        case "pageup":
          event.preventDefault()
          go(index - 1)
          break
        case "home":
          event.preventDefault()
          go(0)
          break
        case "end":
          event.preventDefault()
          go(scenes.length - 1)
          break
        case "r":
          event.preventDefault()
          setReplay((value) => value + 1)
          break
        case "h":
          event.preventDefault()
          setClean((value) => !value)
          break
        case "f":
          event.preventDefault()
          void toggleFullscreen()
          break
        case "escape":
          setClean(false)
          requestAnimationFrame(() => hideButton.current?.focus())
          break
      }
    }
    window.addEventListener("keydown", keydown)
    return () => window.removeEventListener("keydown", keydown)
  }, [go, index, toggleFullscreen])

  return (
    <div
      ref={root}
      tabIndex={-1}
      className={cn(styles.workspace, clean && styles.clean)}
    >
      {!clean && (
        <header className={styles.toolbar}>
          <a href="/" aria-label="BorrowLah home">
            <BrandLogo />
          </a>
          <span className={styles.toolbarTitle}>3R pitch brief</span>
          <div className={styles.toolbarActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? (
                <MinimizeIcon data-icon="inline-start" />
              ) : (
                <MaximizeIcon data-icon="inline-start" />
              )}
              <span>{fullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
            </Button>
            <Button
              ref={hideButton}
              size="sm"
              onClick={() => {
                setClean(true)
                root.current?.focus()
              }}
            >
              <VideoIcon data-icon="inline-start" />
              Hide controls
            </Button>
          </div>
        </header>
      )}
      <main
        className={styles.stageArea}
        aria-label="Pitch presentation"
        tabIndex={-1}
        onDoubleClick={(event) => {
          if (clean && !(event.target as HTMLElement).closest("button, a"))
            setClean(false)
        }}
      >
        <article
          className={cn(styles.stage, styles[scene.tone])}
          key={`${scene.id}-${replay}`}
          aria-labelledby="scene-title"
          data-scene={scene.id}
        >
          <div className={styles.sceneHeader}>
            <BrandLogo variant={scene.tone === "ink" ? "dark" : "light"} />
            <span>Reduce. Reuse. Recycle.</span>
          </div>
          <div className={styles.composition}>
            <div className={styles.words}>
              <h1 id="scene-title">{scene.title}</h1>
              <p>{scene.body}</p>
            </div>
            <div className={styles.visual}>
              <Visual scene={scene} />
            </div>
          </div>
          <div className={styles.townshipLine} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </article>
      </main>
      {clean && (
        <Button
          className="sr-only focus:not-sr-only"
          onClick={() => setClean(false)}
        >
          Show presentation controls
        </Button>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Scene {index + 1} of {scenes.length}: {scene.chapter}.{" "}
        {clean
          ? "Controls hidden. Press H or Escape to restore."
          : "Controls visible."}
      </span>
      {!clean && (
        <footer className={styles.editor}>
          <div className={styles.navigation}>
            <div className={styles.selectGroup}>
              <label htmlFor="brief-scene">Jump to scene</label>
              <select
                id="brief-scene"
                value={index}
                onChange={(event) => go(Number(event.target.value))}
              >
                {scenes.map((item, i) => (
                  <option value={i} key={item.id}>
                    {String(i + 1).padStart(2, "0")} · Member {item.member} ·{" "}
                    {item.chapter}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.navButtons}>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous scene"
                disabled={index === 0}
                onClick={() => go(index - 1)}
              >
                <ArrowLeftIcon />
              </Button>
              <span className={styles.counter}>
                {index + 1} / {scenes.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next scene"
                disabled={index === scenes.length - 1}
                onClick={() => go(index + 1)}
              >
                <ArrowRightIcon />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplay((value) => value + 1)}
              >
                <RotateCcwIcon data-icon="inline-start" />
                Replay
              </Button>
            </div>
          </div>
          <div className={styles.cue}>
            <div>
              <strong>Member {scene.member} · narration cue</strong>
              <p>“{scene.cue}”</p>
              <span>{scene.note}</span>
            </div>
            {"route" in scene && (
              <a
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                href={scene.route}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open app screen <ArrowRightIcon data-icon="inline-end" />
              </a>
            )}
          </div>
          <p className={styles.help}>
            ← → scenes · R replay · H hide / show controls · F fullscreen · Esc
            or double-click the scene to restore controls. Manual advance: every
            animation settles and holds. Click the principles, borrowing steps,
            materials and pilot measures to explore. Record app workflows
            separately.
          </p>
          {message && (
            <p role="status" className={styles.help}>
              {message}
            </p>
          )}
        </footer>
      )}
    </div>
  )
}
