"use client"

import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/charts/chart-tooltip"
import { toneDot } from "@/components/shared/tone-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { applicationStatus } from "@/lib/constants"
import type { DashboardSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type ApplicationStats = DashboardSummary["applications"]

const weekLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

/** `YYYY-MM-DD` (local Monday) to "Oct 19". */
function formatWeek(weekStart: string) {
  const [y, m, d] = weekStart.split("-").map(Number)
  return weekLabel.format(new Date(y, m - 1, d))
}

function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ApplicationsOverTimeChart({
  stats,
  loading,
  className,
}: {
  stats: ApplicationStats | undefined
  loading: boolean
  className?: string
}) {
  const data = (stats?.overTime ?? []).map((point) => ({
    week: formatWeek(point.weekStart),
    applications: point.applications,
  }))
  const total = data.reduce((sum, d) => sum + d.applications, 0)
  return (
    <Panel
      title="Applications over time"
      description={`${total} submitted in the last 10 weeks`}
      className={className}
    >
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <div className="h-56 w-full" role="img" aria-label={`Weekly applications: ${data.map((d) => `${d.week} ${d.applications}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="appsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                stroke="var(--muted-foreground)"
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} payload={payload} label={`Week of ${label}`} />
                )}
              />
              <Area
                type="monotone"
                dataKey="applications"
                name="Applications"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#appsFill)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

export function StatusBreakdown({
  stats,
  loading,
  className,
}: {
  stats: ApplicationStats | undefined
  loading: boolean
  className?: string
}) {
  const rows = (stats?.byStatus ?? []).map((row) => ({
    ...row,
    label: applicationStatus(row.status).label,
  }))
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <Panel
      title="Applications by status"
      description={`${stats?.total ?? 0} total`}
      className={className}
      action={
        <Link href="/career/applications" className="text-xs text-muted-foreground hover:text-foreground">
          View board
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.status} className="grid grid-cols-[7.5rem_1fr_1.5rem] items-center gap-3 text-xs">
              <span className="flex items-center gap-2 truncate text-muted-foreground">
                <span className={cn("size-2 shrink-0 rounded-full", toneDot(applicationStatus(row.status).tone))} />
                {row.label}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-muted" title={`${row.label}: ${row.count}`}>
                <span
                  className="block h-full rounded-full bg-chart-1 transition-[width] duration-500"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

const EMPTY_FUNNEL: ApplicationStats["funnel"] = {
  stages: ["Applied", "Responded", "Interviewed", "Offer"].map((label) => ({ label, count: 0 })),
  responseRate: 0,
  interviewRate: 0,
  offerRate: 0,
}

export function ConversionFunnel({
  stats,
  loading,
  className,
}: {
  stats: ApplicationStats | undefined
  loading: boolean
  className?: string
}) {
  const { stages, interviewRate, offerRate } = stats?.funnel ?? EMPTY_FUNNEL
  const top = Math.max(1, stages[0].count)
  return (
    <Panel
      title="Interview conversion"
      description={`${Math.round(interviewRate * 100)}% reach interviews · ${Math.round(offerRate * 100)}% of those reach an offer`}
      className={className}
    >
      {loading ? (
        <Skeleton className="h-36 w-full" />
      ) : (
        <ol className="space-y-2">
          {stages.map((stage, index) => {
            const pct = Math.round((stage.count / top) * 100)
            return (
              <li key={stage.label} className="group">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stage.label}</span>
                  <span className="tabular-nums">
                    <span className="font-medium">{stage.count}</span>
                    {index > 0 && <span className="ml-1.5 text-muted-foreground">{pct}%</span>}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted/70">
                  <div
                    className="h-full rounded-full bg-chart-1 transition-[width] duration-500"
                    style={{ width: `${Math.max(pct, stage.count ? 3 : 0)}%`, opacity: 1 - index * 0.18 }}
                    title={`${stage.label}: ${stage.count} (${pct}%)`}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}

export function ResponseRate({
  stats,
  loading,
  className,
}: {
  stats: ApplicationStats | undefined
  loading: boolean
  className?: string
}) {
  const { stages, responseRate } = stats?.funnel ?? EMPTY_FUNNEL
  const pct = Math.round(responseRate * 100)
  const awaiting = stats?.awaitingReply ?? 0
  return (
    <Panel title="Response rate" description="Applications that heard back" className={className}>
      {loading ? (
        <Skeleton className="h-36 w-full" />
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {pct}
              <span className="text-xl text-muted-foreground">%</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stages[1].count} of {stages[0].count} submitted applications got a response
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Response rate">
              <div className="h-full rounded-full bg-chart-1" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{awaiting} awaiting reply</span>
              <span>Industry avg ~25%</span>
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}
