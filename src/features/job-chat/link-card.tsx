"use client"

import Link from "next/link"
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PencilLineIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

/* Pieces shared by the chat's job and contact cards. */

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** Assistant-side message container. */
export function Bubble({ wide = false, children }: { wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl rounded-tl-md border bg-card p-4 shadow-xs", wide ? "w-full" : "w-fit max-w-full")}>
      {children}
    </div>
  )
}

export function LoadingCard({ url }: { url: string }) {
  return (
    <Bubble>
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Reading <span className="truncate font-medium text-foreground">{hostOf(url)}</span>…
      </div>
    </Bubble>
  )
}

export function ErrorCard({
  title,
  url,
  error,
  onRetry,
  onFillManually,
  onDismiss,
}: {
  title: string
  url: string
  error?: string
  onRetry: () => void
  onFillManually: () => void
  onDismiss: () => void
}) {
  return (
    <Bubble>
      <div className="flex gap-2.5">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="truncate text-xs text-muted-foreground">{url}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcwIcon /> Try again
            </Button>
            <Button size="sm" variant="outline" onClick={onFillManually}>
              <PencilLineIcon /> Fill in myself
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </Bubble>
  )
}

export function SavedCard({ title, href }: { title?: string; href: string }) {
  return (
    <Bubble>
      <div className="flex items-center gap-2.5 text-sm">
        <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="min-w-0 flex-1 truncate">
          Saved <span className="font-medium">{title}</span>
        </p>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          Open <ArrowUpRightIcon className="size-3.5" />
        </Link>
      </div>
    </Bubble>
  )
}

/** Amber "already in IamCandidate" notice with a link to the existing record. */
export function DuplicateNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0">{children}</p>
    </div>
  )
}
