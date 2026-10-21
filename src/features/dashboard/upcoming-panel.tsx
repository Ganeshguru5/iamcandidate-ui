"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClockIcon, CheckSquareIcon, ReplyIcon, VideoIcon } from "lucide-react"
import { cn } from "cn"

import { EmptyState } from "@/components/shared/empty-state"
import { FilterChips, PersonAvatar } from "@/components/shared/misc"
import { OptionBadge } from "@/components/shared/tone-badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { useToggleTask } from "@/features/tasks/hooks"
import { interviewType, taskPriority } from "@/lib/constants"
import {
  useApplications,
  useById,
  useCompanies,
  useContacts,
  useInterviews,
  useTasks,
} from "@/lib/store/queries"
import { formatRelativeDay, formatTime, isOverdue, isWithinDays } from "@/lib/utils/dates"

type Tab = "interviews" | "followups" | "tasks"

export function UpcomingPanel({ className, now }: { className?: string; now: Date }) {
  const [tab, setTab] = useState<Tab>("interviews")
  const interviews = useInterviews()
  const { data: applications = [] } = useApplications()
  const { data: contacts = [] } = useContacts()
  const tasks = useTasks()
  const { data: companies } = useCompanies()
  const companyById = useById(companies)
  const appById = useById(applications)
  const toggle = useToggleTask()

  const upcomingInterviews = (interviews.data ?? [])
    .filter((i) => i.status === "scheduled" && Date.parse(i.scheduledAt) >= now.getTime() - 3_600_000)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  const followUps = [
    ...applications
      .filter((a) => a.nextFollowUp && a.status !== "rejected" && (isOverdue(a.nextFollowUp) || isWithinDays(a.nextFollowUp, 7)))
      .map((a) => ({
        id: a.id,
        date: a.nextFollowUp as string,
        title: companyById.get(a.companyId)?.name ?? "Company",
        subtitle: a.role,
        href: `/career/applications/${a.id}`,
        person: false,
      })),
    ...contacts
      .filter((c) => c.nextFollowUp && (isOverdue(c.nextFollowUp) || isWithinDays(c.nextFollowUp, 7)))
      .map((c) => ({
        id: c.id,
        date: c.nextFollowUp as string,
        title: c.name,
        subtitle: c.role,
        href: `/career/contacts?contact=${c.id}`,
        person: true,
      })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const dueTasks = (tasks.data ?? [])
    .filter((t) => t.status !== "done" && t.dueDate && (isOverdue(t.dueDate) || isWithinDays(t.dueDate, 7)))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))

  const loading = interviews.isLoading || tasks.isLoading

  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold">Upcoming</h2>
        <FilterChips
          value={tab}
          onChange={setTab}
          options={[
            { value: "interviews", label: "Interviews", count: upcomingInterviews.length },
            { value: "followups", label: "Follow-ups", count: followUps.length },
            { value: "tasks", label: "Tasks", count: dueTasks.length },
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : tab === "interviews" ? (
        upcomingInterviews.length === 0 ? (
          <EmptyState compact icon={CalendarClockIcon} title="No interviews scheduled" description="Scheduled interviews will appear here." />
        ) : (
          <ul className="divide-y">
            {upcomingInterviews.slice(0, 5).map((interview) => {
              const app = appById.get(interview.applicationId)
              const company = app ? companyById.get(app.companyId)?.name : undefined
              return (
                <li key={interview.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border py-1 text-center">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {formatRelativeDay(interview.scheduledAt).replace(/^In /, "")}
                    </span>
                    <span className="text-xs font-semibold tabular-nums">{formatTime(interview.scheduledAt)}</span>
                  </div>
                  <Link href={app ? `/career/applications/${app.id}` : "/career/interviews"} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium hover:underline">{company} — {app?.role}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {interview.interviewers.join(", ")} · {interview.durationMinutes} min
                    </p>
                  </Link>
                  <OptionBadge option={interviewType(interview.type)} className="hidden sm:inline-flex" />
                  {interview.meetingUrl && (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-7 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground"
                      aria-label="Join meeting"
                    >
                      <VideoIcon className="size-3.5" />
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )
      ) : tab === "followups" ? (
        followUps.length === 0 ? (
          <EmptyState compact icon={ReplyIcon} title="No follow-ups due" description="You're on top of your outreach." />
        ) : (
          <ul className="divide-y">
            {followUps.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50">
                  {item.person ? (
                    <PersonAvatar name={item.title} />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full border">
                      <ReplyIcon className="size-3.5 text-muted-foreground" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>
                  <span className={cn("text-xs tabular-nums", isOverdue(item.date) ? "font-medium text-destructive" : "text-muted-foreground")}>
                    {isOverdue(item.date) ? `Overdue · ${formatRelativeDay(item.date)}` : formatRelativeDay(item.date)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : dueTasks.length === 0 ? (
        <EmptyState compact icon={CheckSquareIcon} title="No tasks due this week" />
      ) : (
        <ul className="divide-y">
          {dueTasks.slice(0, 6).map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={() => toggle.mutate(task.id)}
                aria-label={`Complete ${task.title}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{task.title}</p>
                {task.related && <p className="truncate text-xs text-muted-foreground">{task.related.label}</p>}
              </div>
              <OptionBadge option={taskPriority(task.priority)} className="hidden sm:inline-flex" />
              <span className={cn("w-20 text-right text-xs", isOverdue(task.dueDate) ? "font-medium text-destructive" : "text-muted-foreground")}>
                {formatRelativeDay(task.dueDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
