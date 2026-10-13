import { cn } from "@workspace/ui/lib/utils"

export function ActionDock({
  title,
  subtitle,
  actionLabel,
  disabled = false,
  pending = false,
  formId,
  className,
}: {
  title: string
  subtitle: string
  actionLabel: string
  disabled?: boolean
  pending?: boolean
  formId?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "on-dark fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+18px)] left-4 z-50 flex items-center gap-3 rounded-[26px] bg-ink py-2 pr-2 pl-5 text-white shadow-dock md:right-8 md:left-auto md:w-[460px]",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] leading-5 font-bold">{title}</div>
        <div className="truncate text-[13px] leading-[18px] text-on-dark-muted">{subtitle}</div>
      </div>
      <button
        type="submit"
        form={formId}
        disabled={disabled || pending}
        className="h-[52px] shrink-0 rounded-[20px] bg-tomato px-[22px] text-base font-bold text-ink disabled:cursor-not-allowed disabled:bg-ink-raised disabled:text-on-dark-muted"
      >
        {pending ? "Sending…" : actionLabel}
      </button>
    </div>
  )
}
