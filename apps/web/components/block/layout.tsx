import { cn } from "@workspace/ui/lib/utils"

export function LimeScreen({
  ground = "lime",
  className,
  children,
}: {
  ground?: "lime" | "sky" | "ink"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "min-h-[calc(100svh-2rem)] overflow-hidden text-ink",
        ground === "lime" && "bg-lime",
        ground === "sky" && "bg-sky",
        ground === "ink" && "bg-ink text-white",
        className
      )}
    >
      {children}
    </div>
  )
}

export function Sheet({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-t-[32px] bg-white px-5 pt-6 pb-8 text-ink", className)}>
      {children}
    </section>
  )
}
