import { cn } from "cn"

/**
 * A trefoil knot on a 24×24 grid: three open strands, each broken where it
 * passes under the next. One strand is drawn in teal to show the weave.
 * scripts/generate-pwa-assets.mjs keeps a copy.
 */
export const MARK_ACCENT =
  "M17.66 11.53C17.98 11.26 18.26 10.97 18.5 10.67C18.74 10.37 18.94 10.05 19.1 9.74C19.26 9.42 19.37 9.09 19.44 8.78C19.51 8.46 19.54 8.14 19.52 7.84C19.5 7.54 19.43 7.24 19.33 6.97C19.22 6.7 19.07 6.44 18.89 6.22C18.71 5.99 18.48 5.79 18.22 5.62C17.97 5.46 17.68 5.32 17.37 5.22C17.06 5.13 16.72 5.07 16.36 5.05C16.01 5.03 15.63 5.05 15.25 5.11C14.87 5.17 14.48 5.27 14.09 5.41C13.7 5.56 13.31 5.74 12.93 5.96C12.55 6.18 12.17 6.45 11.81 6.74C11.45 7.03 11.11 7.36 10.79 7.71C10.48 8.07 10.18 8.46 9.91 8.86C9.65 9.26 9.41 9.69 9.21 10.13"
export const MARK_BASE =
  "M8.46 15.18C8.53 15.59 8.64 15.98 8.78 16.34C8.92 16.7 9.09 17.04 9.28 17.33C9.48 17.63 9.7 17.89 9.94 18.11C10.18 18.33 10.45 18.52 10.72 18.65C10.99 18.79 11.28 18.88 11.57 18.93C11.86 18.97 12.15 18.97 12.44 18.93C12.73 18.88 13.02 18.78 13.29 18.65C13.56 18.51 13.82 18.33 14.06 18.11C14.3 17.89 14.53 17.62 14.72 17.32C14.92 17.03 15.09 16.69 15.23 16.33C15.36 15.97 15.47 15.58 15.54 15.17C15.61 14.76 15.65 14.32 15.65 13.88C15.65 13.44 15.61 12.98 15.54 12.53C15.46 12.07 15.35 11.61 15.2 11.15C15.05 10.7 14.86 10.25 14.64 9.82C14.43 9.39 14.17 8.97 13.89 8.57M9.89 5.41C9.5 5.26 9.1 5.16 8.72 5.1C8.34 5.04 7.96 5.03 7.61 5.05C7.26 5.07 6.92 5.13 6.61 5.23C6.3 5.33 6.01 5.47 5.75 5.64C5.5 5.8 5.28 6.01 5.1 6.24C4.91 6.46 4.76 6.72 4.66 6.99C4.56 7.27 4.5 7.56 4.48 7.87C4.46 8.17 4.49 8.49 4.56 8.81C4.64 9.13 4.76 9.46 4.92 9.77C5.08 10.09 5.28 10.41 5.53 10.7C5.77 11 6.06 11.29 6.38 11.56C6.7 11.82 7.06 12.07 7.44 12.29C7.82 12.51 8.24 12.71 8.67 12.87C9.1 13.03 9.57 13.16 10.03 13.26C10.5 13.36 10.98 13.42 11.47 13.45C11.95 13.47 12.44 13.46 12.92 13.42"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d={MARK_BASE} />
        {/* The tile inverts with the theme, so the accent takes the other theme's --brand. */}
        <path d={MARK_ACCENT} className="stroke-[oklch(0.76_0.12_180)] dark:stroke-[oklch(0.56_0.105_187)]" />
      </svg>
    </span>
  )
}

/** The wordmark: "Iam" in the theme teal, "Candidate" in ink. */
export function BrandName({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-brand">Iam</span>
      <span className="text-foreground">Candidate</span>
    </span>
  )
}

export function Brand({ collapsed = false, compact = false }: { collapsed?: boolean; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <BrandMark className="size-5 rounded-md [&_svg]:size-3" />
        <BrandName className="text-[13px] font-semibold tracking-tight" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      {!collapsed && (
        <div className="leading-tight">
          <BrandName className="block text-sm font-semibold tracking-tight" />
          <p className="text-[11px] text-muted-foreground">Command center</p>
        </div>
      )}
    </div>
  )
}
