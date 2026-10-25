"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRightIcon, CheckCircle2Icon, ChevronDownIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { Field, SimpleSelect } from "@/components/shared/form"
import { ButtonSpinner } from "@/components/shared/misc"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isApiMode } from "@/lib/api/config"
import { APPLICATION_STATUSES, applicationStatus, PRIORITIES, WORK_MODES } from "@/lib/constants"
import { useApplications, useCompanies } from "@/lib/store/queries"
import type { ApplicationInput, ApplicationStatus, ExtractedJob, Priority, WorkMode } from "@/lib/types"

import { useCreateApplication } from "../applications/hooks"
import type { JobItem } from "./chat-store"
import { Bubble, DuplicateNotice, ErrorCard, hostOf, LoadingCard, SavedCard } from "./link-card"
import { normName, normUrl } from "./links"

interface Draft {
  role: string
  company: string
  location: string
  workMode: WorkMode | ""
  salary: string
  status: ApplicationStatus
  priority: Priority
  jobId: string
  source: string
  description: string
}

const draftFrom = (job: ExtractedJob): Draft => ({
  role: job.role,
  company: job.company,
  location: job.location,
  workMode: job.workMode,
  salary: job.salary,
  // Links pasted here are usually jobs to look at later.
  status: "wishlist",
  priority: "medium",
  jobId: job.jobId,
  source: job.source,
  description: job.description,
})

/** One job link in the chat: loading → review & save → saved. */
export function JobReviewCard({
  item,
  onRetry,
  onFillManually,
  onDismiss,
  onSaved,
}: {
  item: JobItem
  onRetry: () => void
  onFillManually: () => void
  onDismiss: () => void
  onSaved: (id: string, title: string) => void
}) {
  if (item.status === "loading") return <LoadingCard url={item.url} />
  if (item.status === "error" || !item.extraction) {
    return (
      <ErrorCard
        title="Couldn't read that job"
        url={item.url}
        error={item.error}
        onRetry={onRetry}
        onFillManually={onFillManually}
        onDismiss={onDismiss}
      />
    )
  }
  if (item.savedId) {
    return <SavedCard title={item.savedTitle} href={`/career/applications/${encodeURIComponent(item.savedId)}`} />
  }

  return <ReviewForm item={item} onDismiss={onDismiss} onSaved={onSaved} />
}

function ReviewForm({
  item,
  onDismiss,
  onSaved,
}: {
  item: JobItem
  onDismiss: () => void
  onSaved: (id: string, title: string) => void
}) {
  const extraction = item.extraction!
  const [draft, setDraft] = useState<Draft>(() => draftFrom(extraction.job))
  const [showDescription, setShowDescription] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { data: companies = [] } = useCompanies()
  const { data: applications = [] } = useApplications()
  const create = useCreateApplication()

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const company = useMemo(() => {
    const key = normName(draft.company)
    return key ? companies.find((c) => normName(c.name) === key) : undefined
  }, [companies, draft.company])

  const duplicate = useMemo(() => {
    const url = normUrl(extraction.job.jobUrl || item.url)
    return applications.find(
      (a) =>
        (url && normUrl(a.jobUrl) === url) ||
        (draft.jobId && a.jobId === draft.jobId && (!company || a.companyId === company.id)),
    )
  }, [applications, company, draft.jobId, extraction.job.jobUrl, item.url])

  /** Fields the page didn't give us — flagged so they get a look. */
  const missing = (key: keyof ExtractedJob) => !extraction.job[key]
  const errors = {
    role: draft.role.trim().length < 2 ? "Role is required" : undefined,
    company: draft.company.trim().length < 2 ? "Company is required" : undefined,
    workMode: draft.workMode ? undefined : "Choose a work mode",
  }
  const hint = (key: keyof ExtractedJob) => (missing(key) ? "Not found on the page" : undefined)
  const error = (key: keyof typeof errors) => (submitted ? errors[key] : undefined)

  const save = async () => {
    setSubmitted(true)
    if (errors.role || errors.company || errors.workMode) return
    const input: ApplicationInput = {
      companyId: company?.id ?? "",
      role: draft.role.trim(),
      location: draft.location.trim(),
      workMode: draft.workMode as WorkMode,
      status: draft.status,
      priority: draft.priority,
      jobUrl: extraction.job.jobUrl || item.url,
      notes: "",
    }
    if (draft.salary.trim()) input.salary = draft.salary.trim()
    if (draft.jobId.trim()) input.jobId = draft.jobId.trim()
    if (draft.source.trim()) input.source = draft.source.trim()
    if (draft.description.trim()) input.description = draft.description.trim()
    const newCompany = company
      ? undefined
      : {
          name: draft.company.trim(),
          industry: "",
          website: "",
          location: "",
          size: "",
          status: "active" as const,
          description: "",
          notes: "",
        }
    const app = await create.mutate(input, newCompany)
    if (app) onSaved(app.id, `${app.role} at ${company?.name ?? draft.company.trim()}`)
  }

  const found = extraction.kind === "job"
  const readFrom = extraction.via === "api" ? `${extraction.site}'s job board` : extraction.site || hostOf(item.url)

  return (
    <Bubble wide>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {extraction.site && <ToneBadge tone="teal">{extraction.site}</ToneBadge>}
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
              >
                {hostOf(item.url)} <ArrowUpRightIcon className="size-3" />
              </a>
            </div>
            <p className="text-sm text-pretty">
              {found
                ? `Read from ${readFrom}. Check the details and save.`
                : isApiMode
                  ? "I couldn't find a job posting on that page. Fill in what you know and save."
                  : "Demo mode can't read pages, so only the link's details are filled in."}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1 text-muted-foreground" onClick={onDismiss} aria-label="Dismiss">
            <XIcon />
          </Button>
        </div>

        {duplicate && (
          <DuplicateNotice>
            Already in knot: {duplicate.role} ({applicationStatus(duplicate.status).label}).{" "}
            <Link
              href={`/career/applications/${encodeURIComponent(duplicate.id)}`}
              className="font-medium text-brand hover:underline"
            >
              Open it
            </Link>
          </DuplicateNotice>
        )}

        {/* content-start: a hint under one field mustn't push its neighbour down. */}
        <div className="grid grid-cols-1 gap-3 *:content-start sm:grid-cols-2">
          <Field label="Role" htmlFor={`${item.id}-role`} error={error("role")} hint={hint("role")} className="sm:col-span-2">
            <Input
              id={`${item.id}-role`}
              value={draft.role}
              onChange={(e) => set("role", e.target.value)}
              aria-invalid={Boolean(error("role"))}
            />
          </Field>
          <Field
            label="Company"
            htmlFor={`${item.id}-company`}
            error={error("company")}
            hint={
              draft.company.trim()
                ? company
                  ? `Matches ${company.name} in your companies`
                  : "New company — it'll be added to your companies"
                : hint("company")
            }
          >
            <Input
              id={`${item.id}-company`}
              value={draft.company}
              onChange={(e) => set("company", e.target.value)}
              aria-invalid={Boolean(error("company"))}
            />
          </Field>
          <Field label="Location" htmlFor={`${item.id}-location`} hint={hint("location")}>
            <Input id={`${item.id}-location`} value={draft.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Work mode" error={error("workMode")} hint={missing("workMode") ? "Not found — pick one" : undefined}>
            <SimpleSelect
              value={draft.workMode || undefined}
              onValueChange={(v) => set("workMode", v as WorkMode)}
              options={WORK_MODES}
              placeholder="Choose…"
              invalid={Boolean(error("workMode"))}
            />
          </Field>
          <Field label="Salary" htmlFor={`${item.id}-salary`} hint={hint("salary")}>
            <Input id={`${item.id}-salary`} value={draft.salary} onChange={(e) => set("salary", e.target.value)} />
          </Field>
          <Field label="Status">
            <SimpleSelect value={draft.status} onValueChange={(v) => set("status", v as ApplicationStatus)} options={APPLICATION_STATUSES} />
          </Field>
          <Field label="Priority">
            <SimpleSelect value={draft.priority} onValueChange={(v) => set("priority", v as Priority)} options={PRIORITIES} />
          </Field>
          <Field label="Job ID" htmlFor={`${item.id}-jobId`}>
            <Input id={`${item.id}-jobId`} value={draft.jobId} onChange={(e) => set("jobId", e.target.value)} />
          </Field>
          <Field label="Source" htmlFor={`${item.id}-source`}>
            <Input id={`${item.id}-source`} value={draft.source} onChange={(e) => set("source", e.target.value)} />
          </Field>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowDescription((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground"
            aria-expanded={showDescription}
          >
            <ChevronDownIcon className={cn("size-3.5 transition-transform", !showDescription && "-rotate-90")} />
            Job description
            <span className="font-normal text-muted-foreground">
              {draft.description ? `· ${draft.description.length.toLocaleString()} characters` : "· not found"}
            </span>
          </button>
          {showDescription && (
            <Textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              className="max-h-80 min-h-32 text-sm"
              aria-label="Job description"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
          <Button variant="ghost" onClick={onDismiss}>
            Discard
          </Button>
          <Button onClick={save} disabled={create.isPending}>
            <ButtonSpinner pending={create.isPending} icon={CheckCircle2Icon} />
            {duplicate ? "Save anyway" : "Save application"}
          </Button>
        </div>
      </div>
    </Bubble>
  )
}
