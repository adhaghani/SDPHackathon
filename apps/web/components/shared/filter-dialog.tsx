"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, ListFilterIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

type HiddenField = {
  name: string
  value?: string
}

type FilterOption = {
  value: string
  label: string
}

type FilterDialogProps = {
  action: string
  title: string
  description: string
  activeCount?: number
  hiddenFields?: HiddenField[]
  resetHref?: string
  triggerClassName?: string
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function FilterDialog({
  action,
  title,
  description,
  activeCount = 0,
  hiddenFields = [],
  resetHref,
  triggerClassName,
  onOpenChange,
  children,
}: FilterDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const next = new URLSearchParams()

    for (const [name, value] of formData.entries()) {
      if (typeof value !== "string" || !value || value === "all") continue
      next.set(name, value)
    }

    const query = next.toString()
    handleOpenChange(false)
    router.push(query ? `${action}?${query}` : action)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-haspopup="dialog"
            className={cn(
              "h-13 w-full justify-between gap-3 px-4 sm:w-auto",
              triggerClassName
            )}
          >
            <span className="flex items-center gap-2">
              <ListFilterIcon aria-hidden="true" data-icon="inline-start" />
              Filter
            </span>
            {activeCount ? (
              <span className="grid min-w-6 place-items-center rounded-full bg-ink px-1.5 py-0.5 text-xs font-bold text-surface tabular-nums">
                {activeCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={action} method="get" onSubmit={handleSubmit}>
          {hiddenFields.map((field) =>
            field.value ? (
              <input
                key={field.name}
                type="hidden"
                name={field.name}
                value={field.value}
              />
            ) : null
          )}

          <div className="max-h-[min(62svh,28rem)] space-y-5 overflow-y-auto pr-1">
            {children}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <div>
              {activeCount && resetHref ? (
                <Button
                  render={<Link href={resetHref} />}
                  variant="ghost"
                  className="px-0"
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" variant="cta">
                Apply
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type FilterGroupProps = {
  legend: string
  name: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  columns?: 1 | 2
}

function FilterGroup({
  legend,
  name,
  options,
  value,
  onChange,
  columns = 1,
}: FilterGroupProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-extrabold text-ink">{legend}</legend>
      <div className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2")}>
        {options.map((option) => {
          const checked = option.value === value

          return (
            <label
              key={option.value || "all"}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-bold transition-colors duration-150 ease-out focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
                checked
                  ? "border-ink bg-ink text-surface"
                  : "border-hairline bg-surface text-ink hover:border-ink-muted"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 rounded-full border",
                  checked
                    ? "border-surface bg-surface"
                    : "border-ink-muted bg-transparent"
                )}
              />
              <span className="min-w-0">{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

type EventFilterDialogProps = {
  categories: Array<{ id: string; slug: string; name: string }>
  activeCategory?: string
  query?: string
}

export function EventFilterDialog({
  categories,
  activeCategory,
  query,
}: EventFilterDialogProps) {
  const normalizedCategory =
    activeCategory && activeCategory !== "all" ? activeCategory : undefined
  const [category, setCategory] = React.useState(normalizedCategory ?? "all")

  const resetParams = new URLSearchParams()
  if (query) resetParams.set("q", query)
  const resetQuery = resetParams.toString()

  return (
    <FilterDialog
      action="/events"
      title="Filter events"
      description="Choose one category to narrow the list."
      activeCount={normalizedCategory ? 1 : 0}
      hiddenFields={[{ name: "q", value: query }]}
      resetHref={resetQuery ? `/events?${resetQuery}` : "/events"}
      onOpenChange={(open) => {
        if (open) setCategory(normalizedCategory ?? "all")
      }}
    >
      <FilterGroup
        legend="Category"
        name="category"
        value={category}
        onChange={setCategory}
        columns={2}
        options={[
          { value: "all", label: "All categories" },
          ...categories.map((item) => ({ value: item.slug, label: item.name })),
        ]}
      />
    </FilterDialog>
  )
}

type BorrowCategory = {
  id: string
  slug: string
  name: string
  kind?: string | null
}

type BorrowFilterDialogProps = {
  categories: BorrowCategory[]
  activeCategory?: string
  activeKind?: string
  freeOnly?: boolean
  query?: string
  naturalLanguage?: string
}

export function BorrowFilterDialog({
  categories,
  activeCategory,
  activeKind,
  freeOnly,
  query,
  naturalLanguage,
}: BorrowFilterDialogProps) {
  const normalizedKind =
    activeKind === "item" || activeKind === "skill" ? activeKind : "all"
  const normalizedCategory =
    activeCategory && activeCategory !== "all" ? activeCategory : undefined
  const [kind, setKind] = React.useState(normalizedKind)
  const [category, setCategory] = React.useState(normalizedCategory ?? "all")
  const [free, setFree] = React.useState(freeOnly ?? false)

  const visibleCategories = categories.filter((item) =>
    kind === "skill" ? item.kind === "skill" : item.kind !== "skill"
  )

  const handleKindChange = (nextKind: string) => {
    setKind(nextKind)
    const nextCategories = categories.filter((item) =>
      nextKind === "skill" ? item.kind === "skill" : item.kind !== "skill"
    )
    if (!nextCategories.some((item) => item.slug === category))
      setCategory("all")
  }

  const resetParams = new URLSearchParams()
  if (query) resetParams.set("q", query)
  if (naturalLanguage) resetParams.set("nl", naturalLanguage)
  const resetQuery = resetParams.toString()

  const activeCount =
    (normalizedKind !== "all" ? 1 : 0) +
    (normalizedCategory ? 1 : 0) +
    (freeOnly ? 1 : 0)

  return (
    <FilterDialog
      action="/borrow"
      title="Filter borrow listings"
      description="Choose a listing type, category, or price filter."
      activeCount={activeCount}
      hiddenFields={[
        { name: "q", value: query },
        { name: "nl", value: naturalLanguage },
      ]}
      resetHref={resetQuery ? `/borrow?${resetQuery}` : "/borrow"}
      onOpenChange={(open) => {
        if (!open) return
        setKind(normalizedKind)
        setCategory(normalizedCategory ?? "all")
        setFree(freeOnly ?? false)
      }}
    >
      <FilterGroup
        legend="Listing type"
        name="kind"
        value={kind}
        onChange={handleKindChange}
        options={[
          { value: "all", label: "All types" },
          { value: "item", label: "Items" },
          { value: "skill", label: "Skills" },
        ]}
      />

      <FilterGroup
        legend="Category"
        name="category"
        value={category}
        onChange={setCategory}
        columns={2}
        options={[
          { value: "all", label: "All categories" },
          ...visibleCategories.map((item) => ({
            value: item.slug,
            label: item.name,
          })),
        ]}
      />

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-extrabold text-ink">Price</legend>
        <label
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-bold transition-colors duration-150 ease-out focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
            free
              ? "border-ink bg-ink text-surface"
              : "border-hairline bg-surface text-ink hover:border-ink-muted"
          )}
        >
          <input
            type="checkbox"
            name="free"
            value="true"
            checked={free}
            onChange={(event) => setFree(event.target.checked)}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded border",
              free
                ? "border-surface bg-surface text-ink"
                : "border-ink-muted bg-transparent"
            )}
          >
            {free ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
          </span>
          <span>Free to borrow</span>
        </label>
      </fieldset>
    </FilterDialog>
  )
}
