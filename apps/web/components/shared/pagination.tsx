import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
  pageParam = "page",
}: {
  page: number
  totalPages: number
  basePath: string
  searchParams?: Record<string, string | undefined>
  pageParam?: string
}) {
  if (totalPages <= 1) return null

  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (value) params.set(key, value)
    }
    params.set(pageParam, String(nextPage))
    return `${basePath}?${params.toString()}`
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      <Button
        render={<Link href={hrefFor(page - 1)} />}
        variant="outline"
        className="min-w-28"
        disabled={page <= 1}
        aria-disabled={page <= 1}
      >
        <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
        Previous
      </Button>
      <span className="text-sm font-medium text-ink-muted tabular-nums" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <Button
        render={<Link href={hrefFor(page + 1)} />}
        variant="outline"
        className="min-w-28"
        disabled={page >= totalPages}
        aria-disabled={page >= totalPages}
      >
        Next
        <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
      </Button>
    </nav>
  )
}
