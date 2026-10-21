import { cn } from "cn"

import type { Option, Tone } from "@/lib/constants"

const TONES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-muted text-muted-foreground ring-border", dot: "bg-muted-foreground/60" },
  blue: { badge: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300", dot: "bg-blue-500" },
  violet: { badge: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300", dot: "bg-violet-500" },
  amber: { badge: "bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-300", dot: "bg-amber-500" },
  green: { badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300", dot: "bg-emerald-500" },
  red: { badge: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300", dot: "bg-red-500" },
  teal: { badge: "bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300", dot: "bg-teal-500" },
  orange: { badge: "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300", dot: "bg-orange-500" },
}

export function toneDot(tone: Tone) {
  return TONES[tone].dot
}

export function ToneBadge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone
  dot?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONES[tone].badge,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", TONES[tone].dot)} />}
      {children}
    </span>
  )
}

export function OptionBadge<T extends string>({
  option,
  dot = true,
  className,
}: {
  option: Option<T>
  dot?: boolean
  className?: string
}) {
  return (
    <ToneBadge tone={option.tone} dot={dot} className={className}>
      {option.label}
    </ToneBadge>
  )
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border bg-background px-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}
