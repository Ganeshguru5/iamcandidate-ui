"use client"

import Link from "next/link"
import {
  BriefcaseBusinessIcon,
  CalendarClockIcon,
  CheckSquareIcon,
  FolderOpenIcon,
  SendIcon,
  StickyNoteIcon,
  UploadIcon,
  UserPlusIcon,
} from "lucide-react"

import { useAppDialogs, type AppDialog } from "@/components/layout/app-dialogs"
import { StatCard } from "@/components/shared/misc"
import { Button } from "@/components/ui/button"
import { ActivityFeed } from "@/features/activity/activity-feed"
import { useDashboard, useProfile } from "@/lib/store/queries"

import { ApplicationsOverTimeChart, ConversionFunnel, ResponseRate, StatusBreakdown } from "./career-charts"
import { UpcomingPanel } from "./upcoming-panel"

const QUICK_ACTIONS: Array<{ label: string; icon: typeof BriefcaseBusinessIcon; dialog: AppDialog }> = [
  { label: "Application", icon: BriefcaseBusinessIcon, dialog: { kind: "application" } },
  { label: "Contact", icon: UserPlusIcon, dialog: { kind: "contact" } },
  { label: "Task", icon: CheckSquareIcon, dialog: { kind: "task" } },
  { label: "Note", icon: StickyNoteIcon, dialog: { kind: "note" } },
  { label: "Send Email", icon: SendIcon, dialog: { kind: "email" } },
  { label: "Upload Document", icon: UploadIcon, dialog: { kind: "upload" } },
]

function greeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

const todayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })

export function DashboardView({ now }: { now: Date }) {
  const { openDialog } = useAppDialogs()
  const { data: profile } = useProfile()
  // One request: counts, chart series and recent activity come pre-aggregated.
  const dashboard = useDashboard()
  const summary = dashboard.data
  const loading = dashboard.isLoading
  const thisWeek = summary?.applications.appliedThisWeek ?? 0
  const nextInterview = summary?.interviews.next
  const dueToday = summary?.tasks.dueToday ?? 0
  const overdue = summary?.tasks.overdue ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{todayFormat.format(now)}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting(now)}, {profile?.name ?? "Alex Morgan"}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your personal workspace.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {QUICK_ACTIONS.map((action) => (
            <Button key={action.label} variant="outline" size="sm" className="justify-start" onClick={() => openDialog(action.dialog)}>
              <action.icon className="text-muted-foreground" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Link href="/career/applications" className="rounded-xl transition-shadow hover:shadow-sm">
          <StatCard
            label="Applications"
            icon={BriefcaseBusinessIcon}
            value={loading ? "—" : (summary?.applications.total ?? 0)}
            trend={thisWeek > 0 ? { value: `+${thisWeek} this week`, positive: true } : undefined}
            hint={`${summary?.applications.active ?? 0} active in pipeline`}
          />
        </Link>
        <Link href="/career/interviews" className="rounded-xl transition-shadow hover:shadow-sm">
          <StatCard
            label="Interviews"
            icon={CalendarClockIcon}
            value={loading ? "—" : (summary?.interviews.upcoming ?? 0)}
            hint={nextInterview ? `Next: ${new Date(nextInterview.scheduledAt).toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}` : "Nothing scheduled"}
          />
        </Link>
        <Link href="/workspace/tasks" className="rounded-xl transition-shadow hover:shadow-sm">
          <StatCard
            label="Open tasks"
            icon={CheckSquareIcon}
            value={loading ? "—" : (summary?.tasks.open ?? 0)}
            hint={`${dueToday} due today${overdue ? ` · ${overdue} overdue` : ""}`}
          />
        </Link>
        <Link href="/documents" className="rounded-xl transition-shadow hover:shadow-sm">
          <StatCard
            label="Documents"
            icon={FolderOpenIcon}
            value={loading ? "—" : (summary?.documents.total ?? 0)}
            hint={`${summary?.documents.resumes ?? 0} resumes · ${summary?.documents.starred ?? 0} starred`}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ApplicationsOverTimeChart stats={summary?.applications} loading={loading} className="lg:col-span-2" />
        <StatusBreakdown stats={summary?.applications} loading={loading} />
        <ConversionFunnel stats={summary?.applications} loading={loading} className="lg:col-span-2" />
        <ResponseRate stats={summary?.applications} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <UpcomingPanel className="lg:col-span-3" now={now} />
        <section className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link href="/activity" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <ActivityFeed activities={summary?.recentActivity} loading={loading} limit={7} />
        </section>
      </div>
    </div>
  )
}
