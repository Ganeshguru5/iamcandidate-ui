import { buildDashboardSummary } from "@/lib/analytics/dashboard"
import { interviewType } from "@/lib/constants"
import type { AppNotification, DashboardSummary } from "@/lib/types"
import { isOverdue, isToday, isWithinDays } from "@/lib/utils/dates"
import { delay } from "@/lib/utils/delay"

import type { DashboardService, NotificationService } from "../contracts"
import { read } from "./db"

export class MockDashboardService implements DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    await delay(350)
    const activities = read("activities").sort((a, b) => b.date.localeCompare(a.date))
    return buildDashboardSummary(
      {
        applications: read("applications"),
        interviews: read("interviews"),
        tasks: read("tasks"),
        documents: read("documents"),
        recentActivity: activities.slice(0, 7),
      },
      new Date(),
    )
  }
}

/* ------------------------------------------------------------------ */

const SEEN_KEY = "pos:notifications-seen"

function readSeen(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

function writeSeen(ids: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
  } catch {
    // ignore (private mode, quota)
  }
}

/** Reminders derived from interviews, follow-ups and tasks, honoring preferences. */
function derive(): AppNotification[] {
  const prefs = read("notificationPreferences")
  const companies = new Map(read("companies").map((c) => [c.id, c.name]))
  const applications = read("applications")
  const appById = new Map(applications.map((a) => [a.id, a]))
  const seen = new Set(readSeen())
  const notices: Omit<AppNotification, "read">[] = []

  if (prefs.interviewReminders) {
    for (const interview of read("interviews")) {
      if (interview.status !== "scheduled" || !isWithinDays(interview.scheduledAt, 3)) continue
      const app = appById.get(interview.applicationId)
      notices.push({
        id: `int-${interview.id}`,
        kind: "interview",
        title: `${interviewType(interview.type).label} · ${app ? (companies.get(app.companyId) ?? "") : ""}`,
        date: interview.scheduledAt,
        href: "/career/interviews",
        urgent: isToday(interview.scheduledAt),
      })
    }
  }
  if (prefs.followUpReminders) {
    for (const app of applications) {
      if (!app.nextFollowUp || app.status === "rejected") continue
      if (!isToday(app.nextFollowUp) && !isOverdue(app.nextFollowUp)) continue
      notices.push({
        id: `fu-${app.id}`,
        kind: "follow_up",
        title: `Follow up with ${companies.get(app.companyId) ?? "company"}`,
        subtitle: app.role,
        date: app.nextFollowUp,
        href: `/career/applications/${app.id}`,
        urgent: isOverdue(app.nextFollowUp),
      })
    }
  }
  if (prefs.taskReminders) {
    for (const task of read("tasks")) {
      if (task.status === "done" || !task.dueDate) continue
      if (!isOverdue(task.dueDate) && !isToday(task.dueDate)) continue
      notices.push({
        id: `task-${task.id}`,
        kind: "task",
        title: task.title,
        date: task.dueDate,
        href: "/workspace/tasks",
        urgent: isOverdue(task.dueDate),
      })
    }
  }
  return notices.map((notice) => ({ ...notice, read: seen.has(notice.id) }))
}

export class MockNotificationService implements NotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    await delay(200)
    return derive()
  }

  async markRead(id: string): Promise<void> {
    const seen = readSeen()
    if (!seen.includes(id)) writeSeen([...seen, id])
  }

  async markAllRead(): Promise<AppNotification[]> {
    const notices = derive()
    writeSeen([...new Set([...readSeen(), ...notices.map((n) => n.id)])])
    return notices.map((notice) => ({ ...notice, read: true }))
  }
}
