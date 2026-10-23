"use client"

import { useRef, useState } from "react"
import { CheckCircle2Icon, FileSpreadsheetIcon, Loader2Icon, PuzzleIcon, UploadIcon, XIcon } from "lucide-react"

import { ErrorState } from "@/components/shared/empty-state"
import { Panel } from "@/components/shared/panel"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { isApiMode } from "@/lib/api/config"
import { integrationsApi } from "@/lib/services/api/integrations"
import { QK } from "@/lib/store/queries"
import { invalidateQueries } from "@/lib/store/query"
import type { LinkedInExportKind, LinkedInImportResult } from "@/lib/types"
import { formatDate } from "@/lib/utils/dates"

import { ApiOnlyNotice, IntegrationPageHeader, IQK, useLinkedInStatus } from "./integration-page"

const EXPORT_URL = "https://www.linkedin.com/mypreferences/d/download-my-data"
const MAX_BYTES = 5 * 1024 * 1024

const KINDS: Record<LinkedInExportKind, { file: string; label: string; creates: string; refresh: string[] }> = {
  connections: { file: "Connections.csv", label: "Connections", creates: "contacts", refresh: [QK.contacts, QK.companies] },
  saved_jobs: { file: "Saved Jobs.csv", label: "Saved jobs", creates: "Wishlist applications", refresh: [QK.applications, QK.companies] },
  job_applications: {
    file: "Job Applications.csv",
    label: "Job applications",
    creates: "Applied applications",
    refresh: [QK.applications, QK.companies],
  },
}

interface Upload {
  id: string
  fileName: string
  csv: string
  state: "previewing" | "ready" | "importing" | "done" | "error"
  result?: LinkedInImportResult
  error?: string
}

const errorText = (caught: unknown) => (caught instanceof Error ? caught.message : "Something went wrong")

export function LinkedInView() {
  return (
    <div>
      <IntegrationPageHeader
        id="linkedin"
        title="LinkedIn"
        description="Bring your LinkedIn connections, saved jobs and job applications into knot from LinkedIn's data export."
      />
      {isApiMode ? <LinkedInImport /> : <ApiOnlyNotice name="LinkedIn import" />}
    </div>
  )
}

function LinkedInImport() {
  const { data: status, error, refetch } = useLinkedInStatus()
  const [uploads, setUploads] = useState<Upload[]>([])
  const input = useRef<HTMLInputElement>(null)

  const patch = (id: string, next: Partial<Upload>) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...next } : u)))

  const addFiles = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`
      if (file.size > MAX_BYTES) {
        setUploads((list) => [...list, { id, fileName: file.name, csv: "", state: "error", error: "Files must be 5 MB or smaller." }])
        continue
      }
      const csv = await file.text()
      setUploads((list) => [...list, { id, fileName: file.name, csv, state: "previewing" }])
      try {
        patch(id, { state: "ready", result: await integrationsApi.linkedin.import(csv, true) })
      } catch (caught) {
        patch(id, { state: "error", error: errorText(caught) })
      }
    }
    if (input.current) input.current.value = ""
  }

  const runImport = async (upload: Upload) => {
    patch(upload.id, { state: "importing" })
    try {
      const result = await integrationsApi.linkedin.import(upload.csv, false)
      patch(upload.id, { state: "done", result, csv: "" })
      invalidateQueries(...KINDS[result.kind].refresh, QK.integrations, QK.activities, QK.dashboard, IQK.linkedin)
    } catch (caught) {
      patch(upload.id, { state: "error", error: errorText(caught) })
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <Panel
          title="Import files"
          description="Choose one or more CSV files from your LinkedIn export. You'll see what will be added before anything is imported."
        >
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors hover:bg-muted/40"
          >
            <UploadIcon className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">Choose CSV files</span>
            <span className="text-xs text-muted-foreground">Connections.csv, Saved Jobs.csv or Job Applications.csv</span>
          </button>
          <input ref={input} type="file" accept=".csv,text/csv" multiple hidden onChange={(e) => void addFiles(e.target.files)} />
        </Panel>

        {uploads.map((upload) => (
          <UploadCard
            key={upload.id}
            upload={upload}
            onImport={() => void runImport(upload)}
            onRemove={() => setUploads((list) => list.filter((u) => u.id !== upload.id))}
          />
        ))}
      </div>

      <div className="space-y-4">
        <Panel title="Get your LinkedIn export">
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Open{" "}
              <a href={EXPORT_URL} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">
                LinkedIn → Get a copy of your data
              </a>
              .
            </li>
            <li>
              Pick <span className="text-foreground">Connections</span> and <span className="text-foreground">Jobs</span> (or the full archive) and request it.
            </li>
            <li>LinkedIn emails you a download link, usually within minutes for these files.</li>
            <li>Unzip it and choose the CSV files here.</li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            LinkedIn doesn&apos;t let other apps read your connections or saved jobs directly, so the export is the way in. Importing again skips anything already in knot.
          </p>
        </Panel>
        <Panel title="Imported so far">
          {error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : (
            <ul className="space-y-2 text-sm">
              {(Object.keys(KINDS) as LinkedInExportKind[]).map((kind) => {
                const done = status?.imports[kind]
                return (
                  <li key={kind} className="flex items-center justify-between gap-2">
                    <span>{KINDS[kind].label}</span>
                    <span className="text-xs text-muted-foreground">{done ? `${done.created} · ${formatDate(done.at)}` : "—"}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
        <Panel>
          <div className="flex gap-3">
            <PuzzleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              For live capture, use the <span className="text-foreground">knot browser extension</span>: save the job you&apos;re viewing, or add someone as a referral straight from their LinkedIn profile.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function UploadCard({ upload, onImport, onRemove }: { upload: Upload; onImport: () => void; onRemove: () => void }) {
  const { result } = upload
  const kind = result ? KINDS[result.kind] : undefined
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <FileSpreadsheetIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{upload.fileName}</p>
            {kind && <ToneBadge tone="blue">{kind.label}</ToneBadge>}
          </div>
          {upload.state === "previewing" && <p className="mt-1 text-sm text-muted-foreground">Reading the file…</p>}
          {upload.state === "error" && <p className="mt-1 text-sm text-destructive">{upload.error}</p>}
          {result && kind && (
            <>
              <p className="mt-1 text-sm">
                {upload.state === "done" ? (
                  <span className="inline-flex items-center gap-1.5 text-success">
                    <CheckCircle2Icon className="size-4" /> Imported {result.created} {kind.creates}
                  </span>
                ) : result.created === 0 ? (
                  <span className="text-muted-foreground">Nothing new to import — everything here is already in knot.</span>
                ) : (
                  <>
                    Will add <span className="font-medium">{result.created}</span> {kind.creates}
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {result.rows} row{result.rows === 1 ? "" : "s"}
                {result.skipped > 0 && ` · ${result.skipped} already in knot`}
                {result.invalid > 0 && ` · ${result.invalid} incomplete`}
                {result.companiesCreated > 0 && ` · ${result.companiesCreated} new compan${result.companiesCreated === 1 ? "y" : "ies"}`}
              </p>
              {upload.state !== "done" && result.sample.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {result.sample.map((line) => (
                    <li key={line} className="truncate">
                      • {line}
                    </li>
                  ))}
                  {result.created > result.sample.length && <li>…and {result.created - result.sample.length} more</li>}
                </ul>
              )}
              {upload.state !== "done" && result.kind !== "connections" && result.created > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">LinkedIn&apos;s export has no work mode or location, so they&apos;re set to On-site and empty. Edit them in knot if needed.</p>
              )}
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {(upload.state === "ready" || upload.state === "importing") && result && result.created > 0 && (
            <Button size="sm" disabled={upload.state === "importing"} onClick={onImport}>
              {upload.state === "importing" && <Loader2Icon className="animate-spin" />} Import
            </Button>
          )}
          {upload.state !== "importing" && upload.state !== "previewing" && (
            <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={onRemove}>
              <XIcon />
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
