interface TooltipEntry {
  value?: number | string | ReadonlyArray<number | string>
  name?: string | number
  color?: string
}

/** Shared Recharts tooltip: recessive card, text in ink colors, color only on the swatch. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: ReadonlyArray<TooltipEntry>
  label?: string | number
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-32 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-[3px]" style={{ background: entry.color }} />
          <span className="flex-1">{entry.name}</span>
          <span className="font-medium text-foreground tabular-nums">
            {String(entry.value)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  )
}
