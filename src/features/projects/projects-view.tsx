"use client"

import { useState } from "react"
import {
  CheckSquareIcon,
  ExternalLinkIcon,
  FolderKanbanIcon,
  GitBranchIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "cn"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog, FilterChips, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { OptionBadge, Tag, toneDot } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PROJECT_STATUSES, projectStatus } from "@/lib/constants"
import { useProjects, useTasks } from "@/lib/store/queries"
import type { Project, ProjectStatus } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"
import { hostname, matchesQuery } from "@/lib/utils/format"

import { useDeleteProject, useUpdateProject } from "./hooks"
import { ProjectFormDialog } from "./project-form-dialog"

export function ProjectsView() {
  const { openDialog } = useAppDialogs()
  const { data: projects, isLoading, error, refetch } = useProjects()
  const { data: tasks = [] } = useTasks()
  const update = useUpdateProject()
  const remove = useDeleteProject()
  const [status, setStatus] = useState<ProjectStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const list = (projects ?? [])
    .filter((p) => (status === "all" ? p.status !== "archived" : p.status === status))
    .filter((p) => matchesQuery(query, p.name, p.description, ...p.technologies))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Side projects and ideas, from first sketch to shipped."
        actions={
          <Button onClick={() => openDialog({ kind: "project" })}>
            <PlusIcon /> New project
          </Button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search projects or tech…" />
          <FilterChips
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "Active", count: projects?.filter((p) => p.status !== "archived").length },
              ...PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label, count: projects?.filter((p) => p.status === s.value).length })),
            ]}
          />
        </div>
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={FolderKanbanIcon}
          title="No projects here"
          description="Start tracking a side project or idea."
          action={<Button onClick={() => openDialog({ kind: "project" })}><PlusIcon /> New project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((project) => {
            const projectTasks = tasks.filter((t) => t.related?.type === "project" && t.related.id === project.id)
            const open = projectTasks.filter((t) => t.status !== "done").length
            return (
              <article key={project.id} className={cn("flex flex-col rounded-xl border bg-card p-5", project.status === "archived" && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{project.name}</h3>
                    <p className="text-xs text-muted-foreground">Updated {timeAgo(project.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <OptionBadge option={projectStatus(project.status)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${project.name}`} />}>
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setEditing(project)}>
                          <PencilIcon /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderKanbanIcon /> Change status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-40">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Status</DropdownMenuLabel>
                              {PROJECT_STATUSES.map((s) => (
                                <DropdownMenuItem
                                  key={s.value}
                                  disabled={s.value === project.status}
                                  onClick={() => void update.mutate(project.id, { status: s.value, ...(s.value === "completed" ? { progress: 100 } : {}) })}
                                >
                                  <span className={cn("size-2 rounded-full", toneDot(s.tone))} /> {s.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => openDialog({ kind: "task" })}>
                          <CheckSquareIcon /> Add task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(project)}>
                          <Trash2Icon /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium tabular-nums">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${project.name} progress`}>
                    <div className={cn("h-full rounded-full", project.progress === 100 ? "bg-success" : "bg-brand")} style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 mb-4 flex flex-wrap gap-1">
                  {project.technologies.map((tech) => (
                    <Tag key={tech}>{tech}</Tag>
                  ))}
                </div>

                <div className="mt-auto flex min-h-8 flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                  {!project.repository && !project.deployment && projectTasks.length === 0 && <span>No links yet</span>}
                  {project.repository && (
                    <a href={project.repository} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                      <GitBranchIcon className="size-3.5" /> {hostname(project.repository)}
                    </a>
                  )}
                  {project.deployment && (
                    <a href={project.deployment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                      <GlobeIcon className="size-3.5" /> {hostname(project.deployment)} <ExternalLinkIcon className="size-3" />
                    </a>
                  )}
                  {projectTasks.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <CheckSquareIcon className="size-3.5" /> {open} open task{open === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {editing && <ProjectFormDialog key={editing.id} open project={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "project"}?`}
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
