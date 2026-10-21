"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  CalendarIcon,
  ExternalLinkIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ReplyIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "cn"

import { Monogram } from "@/components/shared/misc"
import { toneDot } from "@/components/shared/tone-badge"
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
import { APPLICATION_STATUSES, priority, workMode } from "@/lib/constants"
import type { Application, ApplicationStatus, Company } from "@/lib/types"
import { formatDate, formatRelativeDay, isOverdue } from "@/lib/utils/dates"

export interface ApplicationActions {
  onEdit: (app: Application) => void
  onDelete: (app: Application) => void
  onMove: (app: Application, status: ApplicationStatus) => void
}

export function ApplicationMenu({
  app,
  actions,
  className,
}: {
  app: Application
  actions: ApplicationActions
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs" className={className} aria-label="Application actions" />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem render={<Link href={`/career/applications/${app.id}`} />}>
          <ArrowRightIcon /> Open details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.onEdit(app)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ReplyIcon /> Change status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {APPLICATION_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  disabled={status.value === app.status}
                  onClick={() => actions.onMove(app, status.value)}
                >
                  <span className={cn("size-2 rounded-full", toneDot(status.tone))} />
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {app.jobUrl && (
          <DropdownMenuItem render={<a href={app.jobUrl} target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon /> Open job posting
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(app)}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ApplicationCard({
  app,
  company,
  actions,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  app: Application
  company?: Company
  actions: ApplicationActions
  dragging?: boolean
  onDragStart?: (event: React.DragEvent) => void
  onDragEnd?: () => void
}) {
  const overdue = app.nextFollowUp && app.status !== "rejected" && isOverdue(app.nextFollowUp)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative cursor-grab rounded-lg border bg-card p-3 shadow-xs transition-[box-shadow,opacity,border-color] hover:border-foreground/15 hover:shadow-sm active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Monogram name={company?.name ?? "?"} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-medium text-muted-foreground">{company?.name ?? "Unknown"}</p>
            <span
              className={cn("size-1.5 shrink-0 rounded-full", toneDot(priority(app.priority).tone))}
              title={`${priority(app.priority).label} priority`}
            />
          </div>
          <Link
            href={`/career/applications/${app.id}`}
            className="line-clamp-2 text-sm leading-snug font-medium after:absolute after:inset-0 hover:underline"
            draggable={false}
          >
            {app.role}
          </Link>
        </div>
        <ApplicationMenu
          app={app}
          actions={actions}
          className="relative z-10 -mt-1 -mr-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPinIcon className="size-3" />
          {app.location.toLowerCase().includes(workMode(app.workMode).label.toLowerCase())
            ? app.location
            : `${app.location} · ${workMode(app.workMode).label}`}
        </span>
        {app.salary && <span className="tabular-nums">{app.salary}</span>}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t pt-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon className="size-3" />
          {app.appliedDate ? `Applied ${formatDate(app.appliedDate)}` : "Not applied"}
        </span>
        {app.nextFollowUp && app.status !== "rejected" && (
          <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-destructive")}>
            <ReplyIcon className="size-3" />
            {formatRelativeDay(app.nextFollowUp)}
          </span>
        )}
      </div>
    </div>
  )
}
