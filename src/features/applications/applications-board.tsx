"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BriefcaseBusinessIcon, KanbanIcon, ListIcon, PlusIcon } from "lucide-react"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, Monogram, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { OptionBadge, toneDot } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { APPLICATION_STATUSES, applicationStatus, PRIORITIES, WORK_MODES } from "@/lib/constants"
import { useLocalValue } from "@/lib/store/local-store"
import { useApplications, useById, useCompanies } from "@/lib/store/queries"
import type { Application, ApplicationStatus } from "@/lib/types"
import { formatDate, formatRelativeDay, isOverdue } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"

import { ApplicationCard, ApplicationMenu, type ApplicationActions } from "./application-card"
import { ApplicationFormDialog } from "./application-form-dialog"
import { useChangeApplicationStatus, useDeleteApplication } from "./hooks"

type SortKey = "updated" | "applied" | "company" | "priority" | "followup"
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "updated", label: "Recently updated" },
  { value: "applied", label: "Applied date" },
  { value: "followup", label: "Next follow-up" },
  { value: "priority", label: "Priority" },
  { value: "company", label: "Company A–Z" },
]

export function ApplicationsBoard() {
  const { data: applications, isLoading, error, refetch } = useApplications()
  const { data: companies } = useCompanies()
  const companyById = useById(companies)
  const changeStatus = useChangeApplicationStatus()
  const deleteApp = useDeleteApplication()

  const [view, setView] = useLocalValue<"board" | "list">("pos:applications-view", "board")
  const [query, setQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [modeFilter, setModeFilter] = useState("all")
  const [sort, setSort] = useState<SortKey>("updated")

  const [editing, setEditing] = useState<Application | null>(null)
  const [creatingIn, setCreatingIn] = useState<ApplicationStatus | null>(null)
  const [deleting, setDeleting] = useState<Application | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<ApplicationStatus | null>(null)

  const filtered = useMemo(() => {
    const list = (applications ?? []).filter((app) => {
      const company = companyById.get(app.companyId)?.name
      return (
        matchesQuery(query, app.role, company, app.location, app.jobId, app.source) &&
        (priorityFilter === "all" || app.priority === priorityFilter) &&
        (modeFilter === "all" || app.workMode === modeFilter)
      )
    })
    const by = {
      updated: (a: Application, b: Application) => b.updatedAt.localeCompare(a.updatedAt),
      applied: (a: Application, b: Application) => (b.appliedDate ?? "").localeCompare(a.appliedDate ?? ""),
      followup: (a: Application, b: Application) =>
        (a.nextFollowUp ?? "9999").localeCompare(b.nextFollowUp ?? "9999"),
      priority: (a: Application, b: Application) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
      company: (a: Application, b: Application) =>
        (companyById.get(a.companyId)?.name ?? "").localeCompare(companyById.get(b.companyId)?.name ?? ""),
    }[sort]
    return [...list].sort(by)
  }, [applications, companyById, query, priorityFilter, modeFilter, sort])

  const actions: ApplicationActions = {
    onEdit: setEditing,
    onDelete: setDeleting,
    onMove: (app, status) => void changeStatus.mutate(app.id, status),
  }

  const onDrop = (status: ApplicationStatus) => {
    const app = filtered.find((a) => a.id === dragId)
    setDropTarget(null)
    setDragId(null)
    if (app && app.status !== status) void changeStatus.mutate(app.id, status)
  }

  const hasFilters = query || priorityFilter !== "all" || modeFilter !== "all"

  return (
    <div className="flex min-h-0 flex-col">
      <PageHeader
        title="Applications"
        description="Track every role from wishlist to offer. Drag cards between columns to update status."
        actions={
          <Button onClick={() => setCreatingIn("applied")}>
            <PlusIcon /> Add application
          </Button>
        }
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search role, company, job ID…" className="lg:w-72" />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <SimpleSelect
              value={priorityFilter}
              onValueChange={setPriorityFilter}
              options={[{ value: "all", label: "All priorities" }, ...PRIORITIES]}
              className="sm:w-36"
            />
            <SimpleSelect
              value={modeFilter}
              onValueChange={setModeFilter}
              options={[{ value: "all", label: "Any work mode" }, ...WORK_MODES]}
              className="sm:w-36"
            />
            <SimpleSelect
              value={sort}
              onValueChange={(v) => setSort(v as SortKey)}
              options={SORT_OPTIONS}
              className="col-span-2 sm:w-44"
            />
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("")
                  setPriorityFilter("all")
                  setModeFilter("all")
                }}
              >
                Clear filters
              </Button>
            )}
            <div className="inline-flex rounded-lg border p-0.5" role="radiogroup" aria-label="View">
              {(["board", "list"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium capitalize transition-colors",
                    view === v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v === "board" ? <KanbanIcon className="size-3.5" /> : <ListIcon className="size-3.5" />}
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-2 rounded-xl bg-muted/40 p-2">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 3 - (i % 2) }, (_, j) => (
                <Skeleton key={j} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : (applications ?? []).length === 0 ? (
        <EmptyState
          icon={BriefcaseBusinessIcon}
          title="No applications yet"
          description="Add the first role you're interested in — it'll show up on the board."
          action={
            <Button onClick={() => setCreatingIn("wishlist")}>
              <PlusIcon /> Add application
            </Button>
          }
        />
      ) : view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex snap-x snap-mandatory gap-3 sm:snap-none">
            {APPLICATION_STATUSES.map((status) => {
              const items = filtered.filter((a) => a.status === status.value)
              return (
                <section
                  key={status.value}
                  aria-label={status.label}
                  onDragOver={(event) => {
                    if (!dragId) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = "move"
                    if (dropTarget !== status.value) setDropTarget(status.value)
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    onDrop(status.value)
                  }}
                  className={cn(
                    "flex w-[min(18rem,82vw)] shrink-0 snap-start flex-col rounded-xl border border-transparent bg-muted/40 p-2 transition-colors",
                    dropTarget === status.value && "border-brand/40 bg-brand-soft/40",
                  )}
                >
                  <header className="mb-2 flex items-center gap-2 px-1.5 pt-0.5">
                    <span className={cn("size-2 rounded-full", toneDot(status.tone))} />
                    <h2 className="text-xs font-semibold">{status.label}</h2>
                    <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-auto"
                      aria-label={`Add to ${status.label}`}
                      onClick={() => setCreatingIn(status.value)}
                    >
                      <PlusIcon />
                    </Button>
                  </header>
                  <div className="flex min-h-24 flex-col gap-2">
                    {items.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        app={app}
                        company={companyById.get(app.companyId)}
                        actions={actions}
                        dragging={dragId === app.id}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move"
                          event.dataTransfer.setData("text/plain", app.id)
                          setDragId(app.id)
                        }}
                        onDragEnd={() => {
                          setDragId(null)
                          setDropTarget(null)
                        }}
                      />
                    ))}
                    {items.length === 0 && (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                        {dragId ? "Drop here" : hasFilters ? "No matches" : "No applications"}
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BriefcaseBusinessIcon} title="No applications match your filters" />
      ) : (
        <ApplicationsList applications={filtered} actions={actions} companyName={(id) => companyById.get(id)?.name ?? "—"} />
      )}

      {creatingIn && (
        <ApplicationFormDialog
          open
          initialStatus={creatingIn}
          onOpenChange={(open) => !open && setCreatingIn(null)}
        />
      )}
      {editing && (
        <ApplicationFormDialog key={editing.id} open application={editing} onOpenChange={(open) => !open && setEditing(null)} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete application?"
        description={deleting ? `${companyById.get(deleting.companyId)?.name} — ${deleting.role} will be removed with its timeline.` : undefined}
        onConfirm={async () => {
          if (deleting) await deleteApp.mutate(deleting.id)
        }}
      />
    </div>
  )
}

function ApplicationsList({
  applications,
  actions,
  companyName,
}: {
  applications: Application[]
  actions: ApplicationActions
  companyName: (id: string) => string
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Company & role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="pl-4">
                  <Link href={`/career/applications/${app.id}`} className="flex items-center gap-3">
                    <Monogram name={companyName(app.companyId)} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium hover:underline">{app.role}</span>
                      <span className="block text-xs text-muted-foreground">{companyName(app.companyId)}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <OptionBadge option={applicationStatus(app.status)} />
                </TableCell>
                <TableCell className="text-muted-foreground">{app.location}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{app.salary ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(app.appliedDate)}</TableCell>
                <TableCell
                  className={cn(
                    "text-muted-foreground",
                    app.nextFollowUp && app.status !== "rejected" && isOverdue(app.nextFollowUp) && "font-medium text-destructive",
                  )}
                >
                  {app.nextFollowUp ? formatRelativeDay(app.nextFollowUp) : "—"}
                </TableCell>
                <TableCell>
                  <ApplicationMenu app={app} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid grid-cols-1 gap-2 md:hidden">
        {applications.map((app) => (
          <li key={app.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
            <Monogram name={companyName(app.companyId)} size="sm" className="mt-0.5" />
            <Link href={`/career/applications/${app.id}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{app.role}</p>
              <p className="truncate text-xs text-muted-foreground">
                {companyName(app.companyId)} · {app.location}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <OptionBadge option={applicationStatus(app.status)} />
                {app.nextFollowUp && app.status !== "rejected" && (
                  <span className="text-xs text-muted-foreground">Follow up {formatRelativeDay(app.nextFollowUp)}</span>
                )}
              </div>
            </Link>
            <ApplicationMenu app={app} actions={actions} />
          </li>
        ))}
      </ul>
    </>
  )
}
