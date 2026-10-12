export default function RequestsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse" aria-busy="true" aria-label="Loading requests">
      <div className="h-28 rounded-lg bg-surface" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="h-96 rounded-lg bg-surface" />
        <div className="flex flex-col gap-4">
          <div className="h-44 rounded-lg bg-surface" />
          <div className="h-44 rounded-lg bg-surface" />
        </div>
      </div>
    </div>
  )
}
