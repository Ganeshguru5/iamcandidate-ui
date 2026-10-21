const DAY = 24 * 60 * 60 * 1000

/** ISO timestamp `days` from now (negative for the past), optionally at a given hour. */
export function daysFromNow(days: number, hour?: number, minute = 0): string {
  const date = new Date(Date.now() + days * DAY)
  if (hour !== undefined) date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export function isToday(iso?: string): boolean {
  return !!iso && isSameDay(new Date(iso), new Date())
}

/** True when the date is before today (ignores time of day). */
export function isOverdue(iso?: string): boolean {
  return !!iso && startOfDay(new Date(iso)) < startOfDay(new Date())
}

export function isWithinDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  const now = Date.now()
  return t >= startOfDay(new Date()).getTime() && t <= now + days * DAY
}

export function daysUntil(iso: string): number {
  return Math.round(
    (startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / DAY,
  )
}

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" })
const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short" })

export function formatDate(iso?: string, withYear = false): string {
  if (!iso) return "—"
  const date = new Date(iso)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return withYear || !sameYear ? longDate.format(date) : shortDate.format(date)
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

export function formatWeekday(iso: string): string {
  return weekdayFormat.format(new Date(iso))
}

/** "Today", "Tomorrow", "Yesterday", "in 3 days", "5 days ago", or a date. */
export function formatRelativeDay(iso?: string): string {
  if (!iso) return "—"
  const diff = daysUntil(iso)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  if (diff > 1 && diff < 7) return `In ${diff} days`
  if (diff < -1 && diff > -7) return `${-diff} days ago`
  return formatDate(iso)
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

export function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return "just now"
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour")
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), "day")
  return formatDate(iso)
}

/** Converts an ISO timestamp to the value expected by <input type="date">. */
export function toDateInput(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Converts an <input type="date"> value to ISO at local noon (avoids TZ drift). */
export function fromDateInput(value: string): string | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d, 12).toISOString()
}

export function toDateTimeInput(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${toDateInput(iso)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDateTimeInput(value: string): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

export function groupByDay<T>(items: T[], getDate: (item: T) => string): Array<{ day: string; items: T[] }> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = toDateInput(getDate(item))
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([day, list]) => ({ day, items: list }))
}
