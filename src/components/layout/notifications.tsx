"use client"

import Link from "next/link"
import { BellIcon, CalendarClockIcon, CheckSquareIcon, ReplyIcon, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { notificationService } from "@/lib/services"
import { QK, useNotifications } from "@/lib/store/queries"
import { setQueryData, useMutation } from "@/lib/store/query"
import type { AppNotification, NotificationKind } from "@/lib/types"
import { formatDateTime, formatRelativeDay } from "@/lib/utils/dates"

const ICONS: Record<NotificationKind, LucideIcon> = {
  interview: CalendarClockIcon,
  follow_up: ReplyIcon,
  task: CheckSquareIcon,
}

function describe(notice: AppNotification): string {
  if (notice.kind === "interview") return formatDateTime(notice.date)
  if (notice.kind === "follow_up") return `${notice.subtitle ?? ""} · ${formatRelativeDay(notice.date)}`
  return notice.urgent ? "Overdue" : "Due today"
}

function markLocally(ids: string[] | "all") {
  setQueryData<AppNotification[]>(QK.notifications, (list) =>
    list.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, read: true } : n)),
  )
}

/** Reminders come from the notification service (derived from interviews, follow-ups and tasks). */
export function NotificationsPopover() {
  const { data: notices = [] } = useNotifications()
  const markRead = useMutation((id: string) => notificationService.markRead(id), {
    onMutate: (id) => markLocally([id]),
  })
  const markAllRead = useMutation(() => notificationService.markAllRead(), {
    onMutate: () => markLocally("all"),
  })
  const unread = notices.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`} />}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground tabular-nums">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => void markAllRead.mutate()}
            >
              Mark all read
            </button>
          )}
        </div>
        {notices.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {notices.map((notice) => {
              const isUnread = !notice.read
              const Icon = ICONS[notice.kind]
              return (
                <li key={notice.id}>
                  <Link
                    href={notice.href}
                    onClick={() => isUnread && void markRead.mutate(notice.id)}
                    className="flex gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border",
                        notice.urgent && "border-destructive/30 bg-destructive/5 text-destructive",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm", isUnread && "font-medium")}>{notice.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{describe(notice)}</span>
                    </span>
                    {isUnread && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
