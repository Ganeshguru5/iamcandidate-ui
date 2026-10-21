import { APPLICATION_STATUSES, INTERVIEW_STAGE_STATUSES, RESPONDED_STATUSES } from "@/lib/constants"
import type {
  Activity,
  Application,
  DashboardSummary,
  DocumentFile,
  Interview,
  Task,
} from "@/lib/types"
import { isOverdue, isToday, startOfDay, toDateInput } from "@/lib/utils/dates"

/**
 * Dashboard aggregation for mock mode. The API backend computes the same
 * summary server-side (knot-server `dashboard.service.ts`).
 */
const DAY = 86_400_000
const CHART_WEEKS = 10

function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const offset = (d.getDay() + 6) % 7 // Monday-based weeks
  return new Date(d.getTime() - offset * DAY)
}

function applicationsOverTime(apps: Application[], now: Date) {
  const current = startOfWeek(now).getTime()
  const points = Array.from({ length: CHART_WEEKS }, (_, i) => ({
    weekStart: toDateInput(new Date(current - (CHART_WEEKS - 1 - i) * 7 * DAY).toISOString()),
    applications: 0,
  }))
  for (const app of apps) {
    if (!app.appliedDate) continue
    const index =
      CHART_WEEKS - 1 - Math.round((current - startOfWeek(new Date(app.appliedDate)).getTime()) / (7 * DAY))
    if (index >= 0 && index < CHART_WEEKS) points[index].applications++
  }
  return points
}

function reachedRecruiter(app: Application) {
  return app.timeline.some((e) => /recruiter/i.test(e.title))
}

function funnel(apps: Application[], interviews: Interview[]) {
  const submitted = apps.filter((a) => a.status !== "wishlist")
  const interviewedIds = new Set(interviews.map((i) => i.applicationId))
  const responded = submitted.filter(
    (a) => RESPONDED_STATUSES.includes(a.status) || (a.status === "rejected" && reachedRecruiter(a)),
  )
  const interviewed = submitted.filter(
    (a) => INTERVIEW_STAGE_STATUSES.includes(a.status) || interviewedIds.has(a.id),
  )
  const offers = submitted.filter((a) => a.status === "offer")
  return {
    stages: [
      { label: "Applied", count: submitted.length },
      { label: "Responded", count: responded.length },
      { label: "Interviewed", count: interviewed.length },
      { label: "Offer", count: offers.length },
    ],
    responseRate: submitted.length ? responded.length / submitted.length : 0,
    interviewRate: submitted.length ? interviewed.length / submitted.length : 0,
    offerRate: interviewed.length ? offers.length / interviewed.length : 0,
  }
}

export function buildDashboardSummary(
  data: {
    applications: Application[]
    interviews: Interview[]
    tasks: Task[]
    documents: DocumentFile[]
    recentActivity: Activity[]
  },
  now: Date,
): DashboardSummary {
  const { applications, interviews, tasks, documents } = data
  const upcoming = interviews
    .filter((i) => i.status === "scheduled" && Date.parse(i.scheduledAt) >= now.getTime())
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const next = upcoming[0]
  const openTasks = tasks.filter((t) => t.status !== "done")

  return {
    applications: {
      total: applications.length,
      active: applications.filter((a) => !["wishlist", "rejected"].includes(a.status)).length,
      appliedThisWeek: applications.filter(
        (a) => a.appliedDate && Date.parse(a.appliedDate) > now.getTime() - 7 * DAY,
      ).length,
      awaitingReply: applications.filter((a) => a.status === "applied").length,
      byStatus: APPLICATION_STATUSES.map((status) => ({
        status: status.value,
        count: applications.filter((a) => a.status === status.value).length,
      })),
      overTime: applicationsOverTime(applications, now),
      funnel: funnel(applications, interviews),
    },
    interviews: {
      upcoming: upcoming.length,
      next: next && {
        id: next.id,
        applicationId: next.applicationId,
        type: next.type,
        scheduledAt: next.scheduledAt,
      },
    },
    tasks: {
      open: openTasks.length,
      dueToday: openTasks.filter((t) => isToday(t.dueDate)).length,
      overdue: openTasks.filter((t) => isOverdue(t.dueDate)).length,
    },
    documents: {
      total: documents.length,
      resumes: documents.filter((d) => d.category === "resume").length,
      starred: documents.filter((d) => d.starred).length,
    },
    recentActivity: data.recentActivity,
  }
}
