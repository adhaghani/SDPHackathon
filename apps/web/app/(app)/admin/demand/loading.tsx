export default function DemandLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse" aria-busy="true" aria-label="Loading demand intelligence">
      <div className="h-32 rounded-lg bg-surface" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-lg bg-surface" />
        <div className="h-96 rounded-lg bg-surface" />
      </div>
    </div>
  )
}
