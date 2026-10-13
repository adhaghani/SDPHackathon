import type { ReactNode } from "react"

import { SearchIcon } from "lucide-react"

import { searchBorrowItems } from "@/actions/borrow"
import { Button } from "@workspace/ui/components/button"

export function BorrowSearchForm({
  query,
  category,
  free,
  kind,
  naturalLanguage,
  showNaturalLanguage,
  filters,
}: {
  query: string
  category?: string
  free: boolean
  kind?: string
  naturalLanguage?: string
  showNaturalLanguage: boolean
  filters?: ReactNode
}) {
  return (
    <form
      className="flex flex-col gap-3"
      action={searchBorrowItems}
      role="search"
    >
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      {free ? <input type="hidden" name="free" value="true" /> : null}
      {kind ? <input type="hidden" name="kind" value={kind} /> : null}
      {naturalLanguage ? (
        <input type="hidden" name="nl" value={naturalLanguage} />
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="borrow-q">
            Search items
          </label>
          <div className="flex h-13 w-full items-center gap-3 rounded-lg border border-ink-muted bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
            <SearchIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-ink-muted"
              strokeWidth={1.8}
            />
            <input
              id="borrow-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search drills, tables, tents…"
              className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              Search
            </Button>
          </div>
        </div>
        {filters ? <div className="w-full sm:w-auto">{filters}</div> : null}
      </div>
      {showNaturalLanguage ? (
        <>
          <label className="text-sm font-bold text-ink" htmlFor="borrow-nl">
            Or describe what you need
          </label>
          <input
            id="borrow-nl"
            name="nl"
            defaultValue={naturalLanguage ?? ""}
            placeholder="Something for the kids this weekend"
            className="min-h-11 w-full rounded-lg border border-ink-muted bg-surface px-4 text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
        </>
      ) : null}
    </form>
  )
}
