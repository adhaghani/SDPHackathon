import { MapPinIcon } from "lucide-react"

export function HandoverSpot({
  place,
  note = "a shared space, never a home address",
  walkingTime,
}: {
  place: string
  note?: string
  walkingTime?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] bg-paper p-4 text-ink">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white">
        <MapPinIcon className="size-5" strokeWidth={2} />
      </span>
      <p className="min-w-0 text-[15px] leading-[21px]">
        <strong>Hand over at {place}</strong>
        {walkingTime ? ` · ${walkingTime}` : ""}
        <span className="mt-0.5 block text-ink-soft">{note}</span>
      </p>
    </div>
  )
}
