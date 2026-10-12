import { Skeleton } from "@workspace/ui/components/skeleton"

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-5 w-full max-w-xs" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
