"use client"

import { useState } from "react"
import { ActivityIcon } from "lucide-react"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { FilterChips, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { useNow } from "@/lib/store/local-store"
import { useActivities } from "@/lib/store/queries"
import { formatRelativeDay, groupByDay } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"

import { ActivityRow } from "./activity-feed"
import { ACTIVITY_META } from "./activity-meta"

const dayHeading = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })

export function ActivityView() {
  const now = useNow()
  const { data: activities, isLoading, error, refetch } = useActivities()
  const [query, setQuery] = useState("")
  const [area, setArea] = useState("all")

  const all = activities ?? []
  const areas = [...new Set(all.map((a) => ACTIVITY_META[a.type].label))].sort()
  const list = all
    .filter((a) => area === "all" || ACTIVITY_META[a.type].label === area)
    .filter((a) => matchesQuery(query, a.title, a.description))
  const groups = groupByDay(list, (a) => a.date)

  return (
    <div className="max-w-3xl">
      <PageHeader title="Activity" description="Everything that happened across your workspace, newest first.">
        <div className="flex flex-col gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search activity…" />
          <FilterChips
            value={area}
            onChange={setArea}
            options={[
              { value: "all", label: "All", count: all.length },
              ...areas.map((label) => ({ value: label, label, count: all.filter((a) => ACTIVITY_META[a.type].label === label).length })),
            ]}
          />
        </div>
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || now === null ? (
        <ListSkeleton rows={8} />
      ) : groups.length === 0 ? (
        <EmptyState icon={ActivityIcon} title="No activity found" description="Try a different filter." />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.day}>
              <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold">
                {formatRelativeDay(group.items[0].date) === "Today" || formatRelativeDay(group.items[0].date) === "Yesterday"
                  ? formatRelativeDay(group.items[0].date)
                  : dayHeading.format(new Date(group.items[0].date))}
                <span className="text-xs font-normal text-muted-foreground">{group.items.length} events</span>
              </h2>
              <div className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3">
                {group.items.map((activity, index) => (
                  <ActivityRow key={activity.id} activity={activity} last={index === group.items.length - 1} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
