"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  CheckIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  Loader2Icon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  ReplyIcon,
  SearchXIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState } from "@/components/shared/empty-state"
import { SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, Monogram, PersonAvatar } from "@/components/shared/misc"
import { DetailList, DetailRow, Panel } from "@/components/shared/panel"
import { PageSkeleton } from "@/components/shared/skeletons"
import { OptionBadge, Tag } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { InterviewFormDialog } from "@/features/interviews/interview-form-dialog"
import {
  APPLICATION_STATUSES,
  companyStatus,
  interviewStatus,
  interviewType,
  priority,
  relationship,
  workMode,
} from "@/lib/constants"
import {
  useApplications,
  useById,
  useCompanies,
  useContacts,
  useEmails,
  useInterviews,
  useResumes,
} from "@/lib/store/queries"
import type { Application, ApplicationStatus, TimelineEventType } from "@/lib/types"
import {
  formatDate,
  formatDateTime,
  formatRelativeDay,
  fromDateInput,
  isOverdue,
  timeAgo,
  toDateInput,
} from "@/lib/utils/dates"
import { hostname } from "@/lib/utils/format"

import { ApplicationFormDialog } from "./application-form-dialog"
import {
  useAddTimelineEvent,
  useChangeApplicationStatus,
  useDeleteApplication,
  useUpdateApplication,
} from "./hooks"

const TIMELINE_ICONS: Record<TimelineEventType, LucideIcon> = {
  created: SparklesIcon,
  status: CircleDotIcon,
  email: MailIcon,
  interview: CalendarClockIcon,
  note: MessageSquareIcon,
  followup: ReplyIcon,
}

const dayFormat = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short" })

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: applications, isLoading } = useApplications()
  const app = applications?.find((a) => a.id === id)

  if (isLoading) return <PageSkeleton />
  if (!app) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Application not found"
        description="It may have been deleted."
        action={
          <Button variant="outline" onClick={() => router.push("/career/applications")}>
            <ArrowLeftIcon /> Back to applications
          </Button>
        }
      />
    )
  }
  return <ApplicationDetailView app={app} />
}

function ApplicationDetailView({ app }: { app: Application }) {
  const router = useRouter()
  const { openDialog } = useAppDialogs()
  const { data: companies } = useCompanies()
  const { data: contacts } = useContacts()
  const { data: resumes } = useResumes()
  const { data: emails = [] } = useEmails()
  const { data: interviews = [] } = useInterviews()
  const companyById = useById(companies)
  const contactById = useById(contacts)
  const resumeById = useById(resumes)

  const company = companyById.get(app.companyId)
  const recruiter = app.recruiterId ? contactById.get(app.recruiterId) : undefined
  const resume = app.resumeId ? resumeById.get(app.resumeId) : undefined
  const appEmails = emails.filter((e) => e.applicationId === app.id).sort((a, b) => b.date.localeCompare(a.date))
  const appInterviews = interviews.filter((i) => i.applicationId === app.id).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const companyContacts = (contacts ?? []).filter((c) => c.companyId === app.companyId && c.id !== app.recruiterId)

  const changeStatus = useChangeApplicationStatus()
  const update = useUpdateApplication()
  const addEvent = useAddTimelineEvent()
  const remove = useDeleteApplication()

  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [notes, setNotes] = useState(app.notes)
  const [noteDraft, setNoteDraft] = useState("")
  const [followUp, setFollowUp] = useState(toDateInput(app.nextFollowUp))

  const compose = () =>
    openDialog({
      kind: "email",
      defaults: {
        to: recruiter ? [recruiter.email] : [],
        contactId: recruiter?.id,
        applicationId: app.id,
        templateId: "tpl_followup",
        subject: `Following up — ${app.role}`,
        body: recruiter
          ? `Hi ${recruiter.name.split(" ")[0]},\n\nI wanted to follow up on my application for the ${app.role} role at ${company?.name ?? "your company"}.\n\nBest,\nGaneshguru`
          : "",
      },
    })

  const timeline = [...app.timeline].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/career/applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Applications
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Monogram name={company?.name ?? "?"} size="lg" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {company ? (
                  <Link href={`/career/companies/${company.id}`} className="hover:text-foreground hover:underline">
                    {company.name}
                  </Link>
                ) : (
                  "Unknown company"
                )}
                {" · "}
                {app.location} · {workMode(app.workMode).label}
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{app.role}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <OptionBadge option={priority(app.priority)} className="capitalize" />
                {app.salary && <Tag>{app.salary}</Tag>}
                {app.jobId && <Tag>{app.jobId}</Tag>}
                {app.source && <Tag>via {app.source}</Tag>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              {changeStatus.isPending && <Loader2Icon className="size-4 animate-spin text-muted-foreground" />}
              <SimpleSelect
                value={app.status}
                onValueChange={(status) => void changeStatus.mutate(app.id, status as ApplicationStatus)}
                options={APPLICATION_STATUSES}
                className="w-48"
              />
            </div>
            <Button variant="outline" onClick={compose}>
              <SendIcon /> Email
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilIcon /> Edit
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete application" onClick={() => setDeleting(true)}>
              <Trash2Icon />
            </Button>
          </div>
        </div>
      </div>

      {/* Stage progress */}
      <ol className="grid grid-cols-3 gap-1 sm:grid-cols-6" aria-label="Pipeline progress">
        {APPLICATION_STATUSES.filter((s) => s.value !== "rejected").map((stage, index, stages) => {
          const current = stages.findIndex((s) => s.value === app.status)
          const reached = app.status !== "rejected" && index <= current
          return (
            <li key={stage.value} className="space-y-1.5">
              <div className={cn("h-1.5 rounded-full", reached ? "bg-brand" : "bg-muted")} />
              <p className={cn("text-[11px]", reached ? "font-medium text-foreground" : "text-muted-foreground")}>
                {stage.label}
              </p>
            </li>
          )
        })}
      </ol>
      {app.status === "rejected" && (
        <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          This application was closed. Move it back to an active stage if things change.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Overview">
            <DetailList className="sm:grid-cols-2">
              <DetailRow label="Applied">{formatDate(app.appliedDate, true)}</DetailRow>
              <DetailRow label="Last updated">{timeAgo(app.updatedAt)}</DetailRow>
              <DetailRow label="Work mode">{workMode(app.workMode).label}</DetailRow>
              <DetailRow label="Salary">{app.salary ?? "—"}</DetailRow>
              <DetailRow label="Job ID">{app.jobId ?? "—"}</DetailRow>
              <DetailRow label="Job posting">
                {app.jobUrl ? (
                  <a href={app.jobUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                    {hostname(app.jobUrl)} <ExternalLinkIcon className="size-3" />
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
            </DetailList>
          </Panel>

          <Panel title="Job details">
            {app.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{app.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No job description saved.{" "}
                <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={() => setEditing(true)}>
                  Add one
                </button>
              </p>
            )}
          </Panel>

          <Panel
            title="Timeline"
            description={`${app.timeline.length} events`}
          >
            <form
              className="mb-5 flex gap-2"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!noteDraft.trim()) return
                const result = await addEvent.mutate(app.id, {
                  date: new Date().toISOString(),
                  title: noteDraft.trim(),
                  type: "note",
                })
                if (result) setNoteDraft("")
              }}
            >
              <Input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Log an update, e.g. “Recruiter called back”" />
              <Button type="submit" variant="outline" disabled={addEvent.isPending || !noteDraft.trim()}>
                {addEvent.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
                Log
              </Button>
            </form>
            <ol className="relative">
              {timeline.map((event, index) => {
                const Icon = TIMELINE_ICONS[event.type]
                return (
                  <li key={event.id} className="grid grid-cols-[3.25rem_1.75rem_1fr] gap-x-3">
                    <time className="pt-1 text-right text-xs font-medium text-muted-foreground tabular-nums" dateTime={event.date}>
                      {dayFormat.format(new Date(event.date))}
                    </time>
                    <div className="relative flex justify-center">
                      <span className="z-10 flex size-7 items-center justify-center rounded-full border bg-card">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </span>
                      {index < timeline.length - 1 && <span className="absolute top-7 bottom-0 w-px bg-border" />}
                    </div>
                    <div className="pb-5">
                      <p className="pt-1 text-sm">{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </Panel>

          <Panel
            title="Interviews"
            action={
              <Button variant="outline" size="sm" onClick={() => setScheduling(true)}>
                <CalendarPlusIcon /> Schedule
              </Button>
            }
            bodyClassName={appInterviews.length ? "p-0" : undefined}
          >
            {appInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interviews yet.</p>
            ) : (
              <ul className="divide-y">
                {appInterviews.map((interview) => (
                  <li key={interview.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <CalendarClockIcon className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{interviewType(interview.type).label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(interview.scheduledAt)} · {interview.durationMinutes} min · {interview.interviewers.join(", ")}
                      </p>
                    </div>
                    <OptionBadge option={interviewStatus(interview.status)} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Emails"
            action={
              <Button variant="outline" size="sm" onClick={compose}>
                <SendIcon /> Compose
              </Button>
            }
            bodyClassName={appEmails.length ? "p-0" : undefined}
          >
            {appEmails.length === 0 ? (
              <p className="text-sm text-muted-foreground">No emails linked to this application.</p>
            ) : (
              <ul className="divide-y">
                {appEmails.map((email) => (
                  <li key={email.id}>
                    <Link
                      href={`/communication/email?folder=${email.folder}&email=${email.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <MailIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{email.subject}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {email.folder === "sent" ? `To ${email.to.join(", ")}` : `From ${email.from.name}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(email.date)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Notes"
            action={
              notes !== app.notes && (
                <Button size="sm" disabled={update.isPending} onClick={() => void update.mutate(app.id, { notes })}>
                  {update.isPending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                  Save notes
                </Button>
              )
            }
          >
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Prep notes, questions to ask, compensation details…"
              className="resize-y"
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Follow-up">
            <div className="space-y-3">
              <p className={cn("text-sm", app.nextFollowUp && isOverdue(app.nextFollowUp) && "font-medium text-destructive")}>
                {app.nextFollowUp ? `Next follow-up ${formatRelativeDay(app.nextFollowUp).toLowerCase()}` : "No follow-up scheduled"}
              </p>
              <div className="flex gap-2">
                <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} aria-label="Next follow-up date" />
                <Button
                  variant="outline"
                  disabled={update.isPending || followUp === toDateInput(app.nextFollowUp)}
                  onClick={() => void update.mutate(app.id, { nextFollowUp: fromDateInput(followUp) })}
                >
                  Set
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[3, 7, 14].map((days) => (
                  <Button
                    key={days}
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      const date = new Date(Date.now() + days * 86_400_000).toISOString()
                      setFollowUp(toDateInput(date))
                      void update.mutate(app.id, { nextFollowUp: date })
                    }}
                  >
                    +{days} days
                  </Button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Company">
            {company ? (
              <div className="space-y-3">
                <Link href={`/career/companies/${company.id}`} className="flex items-center gap-3 hover:underline">
                  <Monogram name={company.name} />
                  <div>
                    <p className="text-sm font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.industry}</p>
                  </div>
                </Link>
                <p className="text-sm text-muted-foreground">{company.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <OptionBadge option={companyStatus(company.status)} />
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <GlobeIcon className="size-3" /> {hostname(company.website)}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No company linked.</p>
            )}
          </Panel>

          <Panel title="Recruiter">
            {recruiter ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={recruiter.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{recruiter.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{recruiter.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OptionBadge option={relationship(recruiter.relationship)} />
                  {recruiter.lastContacted && <Tag>Contacted {formatRelativeDay(recruiter.lastContacted).toLowerCase()}</Tag>}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={compose}>
                  <MailIcon /> {recruiter.email}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recruiter linked.{" "}
                <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={() => setEditing(true)}>
                  Link a contact
                </button>
              </p>
            )}
            {companyContacts.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="mb-2 text-xs text-muted-foreground">Other contacts at {company?.name}</p>
                <ul className="space-y-2">
                  {companyContacts.map((contact) => (
                    <li key={contact.id}>
                      <Link href={`/career/contacts?contact=${contact.id}`} className="flex items-center gap-2 text-sm hover:underline">
                        <PersonAvatar name={contact.name} className="size-6 text-[10px]" />
                        {contact.name}
                        <span className="text-xs text-muted-foreground">· {relationship(contact.relationship).label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel title="Resume used">
            {resume ? (
              <Link href={`/career/resumes/${resume.id}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                <FileTextIcon className="size-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{resume.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {resume.version} · updated {formatDate(resume.updatedAt)}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">No resume linked.</p>
            )}
          </Panel>
        </div>
      </div>

      {editing && <ApplicationFormDialog open application={app} onOpenChange={setEditing} />}
      {scheduling && <InterviewFormDialog open applicationId={app.id} onOpenChange={setScheduling} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete application?"
        description={`${company?.name ?? ""} — ${app.role} and its timeline will be removed.`}
        onConfirm={async () => {
          await remove.mutate(app.id)
          router.push("/career/applications")
        }}
      />
    </div>
  )
}
