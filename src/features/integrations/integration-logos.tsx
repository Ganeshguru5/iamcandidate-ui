import { CloudIcon, GitBranchIcon, MailIcon, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import type { IntegrationId } from "@/lib/types"

function DriveGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8.2 3h7.6l6.2 10.7-3.8 6.6L12 9.6Z" fill="#FBBC04" />
      <path d="M2 13.7 8.2 3l3.8 6.6-6.2 10.7Z" fill="#34A853" />
      <path d="M5.8 20.3 9.6 13.7H22l-3.8 6.6Z" fill="#4285F4" />
    </svg>
  )
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#fff" stroke="#4285F4" strokeWidth="1.6" />
      <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.6" />
      <text x="12" y="18.2" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4285F4" fontFamily="sans-serif">31</text>
    </svg>
  )
}

const ICONS: Partial<Record<IntegrationId, LucideIcon>> = {
  smtp: MailIcon,
  github: GitBranchIcon,
  aws: CloudIcon,
}

export function IntegrationLogo({ id, className }: { id: IntegrationId; className?: string }) {
  const Icon = ICONS[id]
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background", className)}>
      {id === "google_drive" ? (
        <DriveGlyph className="size-5" />
      ) : id === "google_calendar" ? (
        <CalendarGlyph className="size-5" />
      ) : id === "linkedin" ? (
        <LinkedInGlyph className="size-5 text-[#0A66C2]" />
      ) : Icon ? (
        <Icon className="size-5 text-foreground/80" />
      ) : null}
    </span>
  )
}

/** LinkedIn "in" mark (lucide has no brand icons). Uses currentColor. */
export function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.83v1.5h.05c.53-1 1.84-2.06 3.8-2.06 4.06 0 4.82 2.67 4.82 6.15v5.41h-4v-4.8c0-1.15-.02-2.62-1.6-2.62-1.6 0-1.84 1.25-1.84 2.54v4.88h-4v-11Z" />
    </svg>
  )
}

export { DriveGlyph }
