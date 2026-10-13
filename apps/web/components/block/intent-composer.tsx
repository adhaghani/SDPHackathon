"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const suggestions = ["Drill", "Folding chairs", "Ride to the clinic"]

export function IntentComposer() {
  const router = useRouter()
  const [mode, setMode] = useState<"need" | "offer">("need")
  const [query, setQuery] = useState("")

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    const next = mode === "need"
      ? `/borrow?q=${encodeURIComponent(value)}`
      : `/borrow/new?title=${encodeURIComponent(value)}`
    router.push(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Post type"
        className="grid grid-cols-2 rounded-full bg-ink p-1"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
          event.preventDefault()
          setMode((value) => (value === "need" ? "offer" : "need"))
        }}
      >
        {([
          ["need", "I need…"],
          ["offer", "I can offer…"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            id={`intent-tab-${value}`}
            role="tab"
            aria-controls="intent-panel"
            aria-selected={mode === value}
            tabIndex={mode === value ? 0 : -1}
            onClick={() => setMode(value)}
            className={cn(
              "h-11 rounded-full text-base font-bold transition-colors duration-150 ease-out",
              mode === value ? "bg-lime text-ink" : "bg-transparent text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form id="intent-panel" role="tabpanel" aria-labelledby={`intent-tab-${mode}`} onSubmit={submit} className="flex min-h-[60px] items-center gap-2.5 rounded-[20px] bg-white py-2 pr-2 pl-[18px] shadow-[0_0_0_2px_#111111]">
        <label htmlFor="intent-query" className="sr-only">
          {mode === "need" ? "What do you need?" : "What can you offer?"}
        </label>
        <input
          id="intent-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={mode === "need" ? "a ladder for Saturday…" : "a drill I can share…"}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent text-[17px] font-medium text-ink outline-none placeholder:text-ink-soft/70"
        />
        <button
          type="submit"
          aria-label={mode === "need" ? "Ask the block" : "Offer to the block"}
          className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-tomato text-ink transition-transform duration-150 ease-out hover:scale-[1.03]"
        >
          <ArrowRightIcon aria-hidden="true" className="size-[22px]" strokeWidth={2.5} />
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuery(suggestion)}
            className="h-9 rounded-full border-2 border-ink bg-transparent px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
