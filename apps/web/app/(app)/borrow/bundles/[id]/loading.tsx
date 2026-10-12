export default function BundleLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse" aria-busy="true" aria-label="Loading bundle">
      <div className="h-40 rounded-lg bg-surface" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="aspect-[3/4] rounded-lg bg-surface" />
          <div className="aspect-[3/4] rounded-lg bg-surface" />
        </div>
        <div className="h-80 rounded-lg bg-surface" />
      </div>
    </div>
  )
}
