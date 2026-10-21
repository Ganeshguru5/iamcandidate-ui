"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CheckSquareIcon,
  CircleDotIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, FilterChips, StatCard } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { OptionBadge, toneDot } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { TASK_PRIORITIES, taskPriority, taskStatus } from "@/lib/constants"
import { useNow } from "@/lib/store/local-store"
import { useTasks } from "@/lib/store/queries"
import type { RelatedItem, Task, TaskPriority } from "@/lib/types"
import { formatDate, formatRelativeDay, isOverdue, isToday } from "@/lib/utils/dates"

import { useCreateTask, useDeleteTask, useToggleTask, useUpdateTask } from "./hooks"
import { TaskFormDialog } from "./task-form-dialog"

type View = "today" | "upcoming" | "overdue" | "completed" | "all"
const PRIORITY_RANK: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

function relatedHref(related: RelatedItem) {
  switch (related.type) {
    case "application":
      return `/career/applications/${related.id}`
    case "company":
      return `/career/companies/${related.id}`
    case "contact":
      return `/career/contacts?contact=${related.id}`
    case "project":
      return "/workspace/projects"
  }
}

export function TasksView() {
  const now = useNow()
  const { data: tasks, isLoading, error, refetch } = useTasks()
  const toggle = useToggleTask()
  const update = useUpdateTask()
  const remove = useDeleteTask()
  const create = useCreateTask()

  const [view, setView] = useState<View>("today")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [quickTitle, setQuickTitle] = useState("")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)

  const all = tasks ?? []
  const open = all.filter((t) => t.status !== "done")
  const buckets: Record<View, Task[]> = {
    today: open.filter((t) => isToday(t.dueDate) || isOverdue(t.dueDate)),
    upcoming: open.filter((t) => !t.dueDate || (!isToday(t.dueDate) && !isOverdue(t.dueDate))),
    overdue: open.filter((t) => isOverdue(t.dueDate)),
    completed: all.filter((t) => t.status === "done"),
    all,
  }
  const completedThisWeek =
    now === null ? 0 : buckets.completed.filter((t) => t.completedAt && Date.parse(t.completedAt) > now - 7 * 86_400_000).length

  const list = buckets[view]
    .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
    .sort((a, b) =>
      view === "completed"
        ? (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
        : (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) ||
          (a.dueDate ?? "9999").slice(0, 10).localeCompare((b.dueDate ?? "9999").slice(0, 10)) ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    )

  const quickAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = quickTitle.trim()
    if (!title) return
    const due = view === "upcoming" ? new Date(Date.now() + 86_400_000).toISOString() : new Date().toISOString()
    const result = await create.mutate({ title, description: "", priority: "medium", status: "todo", dueDate: due })
    if (result) setQuickTitle("")
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Everything you need to do across applications, projects and people."
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> New task
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={isLoading ? "—" : open.length} icon={CircleDotIcon} />
        <StatCard label="Due today" value={isLoading ? "—" : open.filter((t) => isToday(t.dueDate)).length} icon={SunIcon} />
        <StatCard label="Overdue" value={isLoading ? "—" : buckets.overdue.length} icon={AlertTriangleIcon} className={buckets.overdue.length ? "border-destructive/30" : undefined} />
        <StatCard label="Done this week" value={isLoading ? "—" : completedThisWeek} icon={CheckCircle2Icon} />
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <FilterChips
          value={view}
          onChange={setView}
          options={[
            { value: "today", label: "Today", count: buckets.today.length },
            { value: "upcoming", label: "Upcoming", count: buckets.upcoming.length },
            { value: "overdue", label: "Overdue", count: buckets.overdue.length },
            { value: "completed", label: "Completed", count: buckets.completed.length },
            { value: "all", label: "All", count: all.length },
          ]}
        />
        <SimpleSelect
          value={priorityFilter}
          onValueChange={setPriorityFilter}
          options={[{ value: "all", label: "All priorities" }, ...TASK_PRIORITIES]}
          className="md:ml-auto md:w-40"
        />
      </div>

      {view !== "completed" && (
        <form onSubmit={quickAdd} className="mb-3 flex gap-2">
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={`Quick add a task ${view === "upcoming" ? "for tomorrow" : "for today"} — press Enter`}
            className="h-9"
            aria-label="Quick add task"
          />
          <Button type="submit" variant="outline" className="h-9" disabled={!quickTitle.trim() || create.isPending}>
            {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />} Add
          </Button>
        </form>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || now === null ? (
        <ListSkeleton rows={6} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={view === "completed" ? CheckCircle2Icon : CheckSquareIcon}
          title={view === "overdue" ? "Nothing overdue" : view === "today" ? "You're clear for today" : "No tasks here"}
          description={view === "overdue" || view === "today" ? "Nice work — enjoy the calm." : undefined}
        />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {list.map((task) => {
            const overdue = task.status !== "done" && isOverdue(task.dueDate)
            return (
              <li key={task.id} className="group flex items-start gap-3 px-4 py-3">
                <Checkbox
                  className="mt-0.5"
                  checked={task.status === "done"}
                  onCheckedChange={() => void toggle.mutate(task.id)}
                  aria-label={task.status === "done" ? `Reopen ${task.title}` : `Complete ${task.title}`}
                />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setEditing(task)}
                    className={cn("text-left text-sm hover:underline", task.status === "done" && "text-muted-foreground line-through")}
                  >
                    {task.title}
                  </button>
                  {task.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {task.status === "in_progress" && <OptionBadge option={taskStatus(task.status)} />}
                    <span className="inline-flex items-center gap-1.5 sm:hidden">
                      <span className={cn("size-1.5 rounded-full", toneDot(taskPriority(task.priority).tone))} />
                      {taskPriority(task.priority).label}
                    </span>
                    {task.related && (
                      <Link href={relatedHref(task.related)} className="truncate hover:text-foreground hover:underline">
                        ↳ {task.related.label}
                      </Link>
                    )}
                  </div>
                </div>
                <OptionBadge option={taskPriority(task.priority)} className="hidden sm:inline-flex" />
                <span
                  className={cn("inline-flex w-24 shrink-0 items-center justify-end gap-1 text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}
                  title={task.dueDate ? formatDate(task.dueDate, true) : undefined}
                >
                  <CalendarDaysIcon className="size-3" />
                  {task.status === "done" && task.completedAt ? `Done ${formatRelativeDay(task.completedAt).toLowerCase()}` : formatRelativeDay(task.dueDate)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${task.title}`} />}>
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setEditing(task)}>
                      <PencilIcon /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void update.mutate(task.id, { dueDate: new Date(Date.now() + 86_400_000).toISOString() })}
                    >
                      <CalendarDaysIcon /> Snooze to tomorrow
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      {TASK_PRIORITIES.map((p) => (
                        <DropdownMenuItem key={p.value} disabled={p.value === task.priority} onClick={() => void update.mutate(task.id, { priority: p.value })}>
                          <span className={cn("size-2 rounded-full", toneDot(p.tone))} /> {p.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(task)}>
                      <Trash2Icon /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}
        </ul>
      )}

      {creating && <TaskFormDialog open onOpenChange={setCreating} />}
      {editing && <TaskFormDialog key={editing.id} open task={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete task?"
        description={deleting?.title}
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
