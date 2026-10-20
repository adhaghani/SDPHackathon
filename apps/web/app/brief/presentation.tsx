"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MaximizeIcon,
  MinimizeIcon,
  RotateCcwIcon,
  VideoIcon,
} from "lucide-react"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { scenes, sceneIndex, timeline, timelineIndex } from "./scenes"
import styles from "./brief.module.css"
import { SlideVisual } from "./interactions"

export function BriefPresentation({
  initialScene,
  initialClean,
  initialBeat = 0,
}: {
  initialScene: number
  initialClean: boolean
  initialBeat?: number
}) {
  const [position, setPosition] = useState(() =>
    timelineIndex(initialScene, initialBeat)
  )
  const [clean, setClean] = useState(initialClean)
  const [replay, setReplay] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [message, setMessage] = useState("")
  const root = useRef<HTMLDivElement>(null)
  const hideButton = useRef<HTMLButtonElement>(null)
  const current = timeline[position]!
  const index = current.sceneIndex
  const beatIndex = current.beatIndex
  const scene = scenes[index]!
  const beat = current.beat
  const next = timeline[position + 1]

  const move = useCallback((next: number) => {
    setPosition(Math.min(timeline.length - 1, Math.max(0, next)))
  }, [])
  const goScene = useCallback((next: number) => {
    setPosition(timelineIndex(next))
  }, [])
  const goBeat = (next: number) => setPosition(timelineIndex(index, next))
  const restart = () => {
    setPosition(timelineIndex(index))
    setReplay((value) => value + 1)
  }

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
    if (clean) {
      root.current?.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    }
  }, [clean])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("scene", scenes[index]!.id)
    url.searchParams.set("beat", String(beatIndex + 1))
    if (clean) url.searchParams.set("clean", "1")
    else url.searchParams.delete("clean")
    window.history.replaceState(null, "", url)
  }, [index, beatIndex, clean])

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search)
      setPosition(
        timelineIndex(
          sceneIndex(params.get("scene") ?? undefined),
          Number(params.get("beat") ?? "1") - 1
        )
      )
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
          if (event.shiftKey) goScene(index + 1)
          else move(position + 1)
          break
        case "arrowleft":
        case "pageup":
          event.preventDefault()
          if (event.shiftKey) goScene(index - 1)
          else move(position - 1)
          break
        case "home":
          event.preventDefault()
          move(0)
          break
        case "end":
          event.preventDefault()
          move(timeline.length - 1)
          break
        case "r":
          event.preventDefault()
          setPosition(timelineIndex(index))
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
  }, [move, goScene, position, index, toggleFullscreen])

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
          data-beat={beatIndex + 1}
          data-visual={scene.visual}
        >
          <div className={styles.sceneHeader}>
            <BrandLogo variant={scene.tone === "ink" ? "dark" : "light"} />
            <span>Reduce. Reuse. Recycle.</span>
          </div>
          <div className={styles.composition}>
            <div
              className={styles.words}
              key={`${scene.id}-${beatIndex}-words`}
            >
              <h1 id="scene-title">{beat.title}</h1>
              <p>{beat.body}</p>
            </div>
            <div className={styles.visual}>
              <SlideVisual
                scene={scene}
                beat={beat}
                beatIndex={beatIndex}
                onBeat={goBeat}
              />
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
        Slide {index + 1} of {scenes.length}, beat {beatIndex + 1} of{" "}
        {scene.beats.length}: {beat.title.replaceAll("\n", " ")}.{" "}
        {clean
          ? "Controls hidden. Press H or Escape to restore."
          : "Controls visible."}
      </span>
      {!clean && (
        <aside
          className={styles.editor}
          aria-label="Presenter script and controls"
        >
          <div className={styles.navigation}>
            <div className={styles.selectGroup}>
              <label htmlFor="brief-scene">Jump to slide</label>
              <select
                id="brief-scene"
                value={index}
                onChange={(event) => goScene(Number(event.target.value))}
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
                aria-label="Previous beat"
                disabled={position === 0}
                onClick={() => move(position - 1)}
              >
                <ArrowLeftIcon />
              </Button>
              <span className={styles.counter}>
                Slide {index + 1}/{scenes.length} · Beat {beatIndex + 1}/
                {scene.beats.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next beat"
                disabled={position === timeline.length - 1}
                onClick={() => move(position + 1)}
              >
                <ArrowRightIcon />
              </Button>
              <Button variant="outline" size="sm" onClick={restart}>
                <RotateCcwIcon data-icon="inline-start" />
                Restart slide
              </Button>
            </div>
          </div>
          <div className={styles.cue}>
            <div>
              <strong>Member {scene.member} · current narration</strong>
              <p>
                {beat.speech
                  ? `“${beat.speech}”`
                  : "Opening hold before narration."}
              </p>
              <span>{scene.note}</span>
            </div>
            {scene.route && (
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
          <section className={styles.transitionCue} aria-label="Transition cue">
            <div>
              <strong>
                {position === 0
                  ? "Start Member 1, then press Right as this line begins"
                  : next
                    ? "Press Right / Page Down after this line"
                    : "Finish after this line, then hold"}
              </strong>
              <p>“{position === 0 ? timeline[1]!.beat.speech : beat.speech}”</p>
            </div>
            <span>
              {next
                ? `Next: ${next.beat.title.replaceAll("\n", " ")} ${next.sceneIndex === index ? `(beat ${next.beatIndex + 1})` : `(slide ${next.sceneIndex + 1})`}`
                : "End of presentation"}
            </span>
          </section>
          <p className={styles.help}>
            ← / Page Up: previous beat · → / Page Down: next beat · Shift +
            arrows: jump slides · R: restart slide · H: hide / show controls ·
            F: fullscreen · Esc: show controls. All visual changes follow the
            keys. Recording mode hides the cursor.
          </p>
          {message && (
            <p role="status" className={styles.help}>
              {message}
            </p>
          )}
        </aside>
      )}
    </div>
  )
}
