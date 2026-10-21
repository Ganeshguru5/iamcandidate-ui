"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CalendarClockIcon,
  CalendarPlusIcon,
  CheckIcon,
  ClockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog, FilterChips, Monogram } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { OptionBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { interviewStatus, interviewType } from "@/lib/constants"
import { useNow } from "@/lib/store/local-store"
import { useApplications, useById, useCompanies, useInterviews } from "@/lib/store/queries"
import type { Interview } from "@/lib/types"
import { formatRelativeDay, formatTime, groupByDay } from "@/lib/utils/dates"

import { useDeleteInterview, useUpdateInterview } from "./hooks"
import { InterviewFormDialog } from "./interview-form-dialog"

type Tab = "upcoming" | "past" | "all"
const dayHeading = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })

export function InterviewsView() {
  const now = useNow()
  const { data: interviews, isLoading, error, refetch } = useInterviews()
  const { data: applications } = useApplications()
  const { data: companies } = useCompanies()
  const appById = useById(applications)
  const companyById = useById(companies)
  const update = useUpdateInterview()
  const remove = useDeleteInterview()

  const [tab, setTab] = useState<Tab>("upcoming")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Interview | null>(null)
  const [deleting, setDeleting] = useState<Interview | null>(null)

  const isUpcoming = (i: Interview) =>
    i.status === "scheduled" && now !== null && Date.parse(i.scheduledAt) >= now - 3_600_000
  const all = interviews ?? []
  const upcoming = all.filter(isUpcoming)
  const past = all.filter((i) => !isUpcoming(i))
  const list = (tab === "upcoming" ? upcoming : tab === "past" ? past : all).sort((a, b) =>
    tab === "upcoming" ? a.scheduledAt.localeCompare(b.scheduledAt) : b.scheduledAt.localeCompare(a.scheduledAt),
  )
  const groups = groupByDay(list, (i) => i.scheduledAt)

  const menu = (interview: Interview) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Interview actions" />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {interview.status === "scheduled" && (
          <>
            <DropdownMenuItem onClick={() => void update.mutate(interview.id, { status: "completed" })}>
              <CheckIcon /> Mark completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void update.mutate(interview.id, { status: "cancelled" })}>
              <XIcon /> Cancel
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => setEditing(interview)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(interview)}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Your interview agenda across every application."
        actions={
          <Button onClick={() => setCreating(true)}>
            <CalendarPlusIcon /> Schedule interview
          </Button>
        }
      >
        <FilterChips
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: "Upcoming", count: upcoming.length },
            { value: "past", label: "Past & cancelled", count: past.length },
            { value: "all", label: "All", count: all.length },
          ]}
        />
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || now === null ? (
        <ListSkeleton rows={5} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={CalendarClockIcon}
          title={tab === "upcoming" ? "No upcoming interviews" : "Nothing here yet"}
          description="Schedule an interview from an application or here."
          action={<Button onClick={() => setCreating(true)}><CalendarPlusIcon /> Schedule interview</Button>}
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.day}>
              <h2 className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                {dayHeading.format(new Date(group.items[0].scheduledAt))}
                <span className="text-xs font-normal text-muted-foreground">{formatRelativeDay(group.items[0].scheduledAt)}</span>
              </h2>
              <ul className="divide-y rounded-xl border bg-card">
                {group.items.map((interview) => {
                  const app = appById.get(interview.applicationId)
                  const company = app ? companyById.get(app.companyId) : undefined
                  return (
                    <li key={interview.id} className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-center", interview.status === "cancelled" && "opacity-60")}>
                      <div className="flex w-24 shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums">
                        <ClockIcon className="size-3.5 text-muted-foreground" />
                        {formatTime(interview.scheduledAt)}
                      </div>
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <Monogram name={company?.name ?? "?"} />
                        <div className="min-w-0">
                          <Link href={app ? `/career/applications/${app.id}` : "#"} className="block truncate text-sm font-medium hover:underline">
                            {company?.name} — {app?.role ?? "Unknown application"}
                          </Link>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{interviewType(interview.type).label}</span>
                            <span>{interview.durationMinutes} min</span>
                            {interview.interviewers.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <UsersIcon className="size-3" /> {interview.interviewers.join(", ")}
                              </span>
                            )}
                          </p>
                          {interview.notes && <p className="mt-1.5 line-clamp-2 text-xs text-foreground/80">{interview.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <OptionBadge option={interviewStatus(interview.status)} />
                        {interview.meetingUrl && interview.status === "scheduled" && (
                          <Button variant="outline" size="sm" nativeButton={false} render={<a href={interview.meetingUrl} target="_blank" rel="noreferrer" />}>
                            <VideoIcon /> Join
                          </Button>
                        )}
                        {menu(interview)}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {creating && <InterviewFormDialog open onOpenChange={setCreating} />}
      {editing && <InterviewFormDialog key={editing.id} open interview={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete interview?"
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
