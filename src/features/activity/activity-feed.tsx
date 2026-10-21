"use client"

import Link from "next/link"
import { ActivityIcon } from "lucide-react"
import { cn } from "cn"

import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { Activity } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"

import { ACTIVITY_META, activityHref } from "./activity-meta"

const TONE_ICON: Record<string, string> = {
  neutral: "text-muted-foreground",
  blue: "text-blue-600 dark:text-blue-400",
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
  teal: "text-teal-600 dark:text-teal-400",
  orange: "text-orange-600 dark:text-orange-400",
}

export function ActivityRow({ activity, last }: { activity: Activity; last?: boolean }) {
  const meta = ACTIVITY_META[activity.type]
  const href = activityHref(activity)
  const body = (
    <>
      <span className="relative flex flex-col items-center">
        <span className="z-10 flex size-7 items-center justify-center rounded-full border bg-background">
          <meta.icon className={cn("size-3.5", TONE_ICON[meta.tone])} />
        </span>
        {!last && <span className="absolute top-7 -bottom-3 w-px bg-border" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 pb-1">
        <span className="block truncate text-sm">{activity.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {activity.description ? `${activity.description} · ` : ""}
          {timeAgo(activity.date)}
        </span>
      </span>
    </>
  )
  return href ? (
    <Link href={href} className="-mx-2 flex gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
      {body}
    </Link>
  ) : (
    <div className="-mx-2 flex gap-3 px-2 py-1.5">{body}</div>
  )
}

export function ActivityFeed({
  activities,
  loading,
  limit,
}: {
  activities: Activity[] | undefined
  loading?: boolean
  limit?: number
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  const items = (activities ?? []).slice(0, limit)
  if (items.length === 0) {
    return <EmptyState compact icon={ActivityIcon} title="No activity yet" description="Actions you take will show up here." />
  }
  return (
    <div className="flex flex-col gap-1">
      {items.map((activity, index) => (
        <ActivityRow key={activity.id} activity={activity} last={index === items.length - 1} />
      ))}
    </div>
  )
}
