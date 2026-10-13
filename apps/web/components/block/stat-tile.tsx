export function StatTile({
  value,
  label,
}: {
  value: number | string
  label: string
}) {
  return (
    <div className="min-w-0 rounded-[16px] bg-ink p-4 text-white">
      <p className="font-display text-[24px] leading-[28px] font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-sm leading-[18px] text-on-dark-muted">{label}</p>
    </div>
  )
}
