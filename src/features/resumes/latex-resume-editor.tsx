"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileUpIcon,
  Loader2Icon,
  PlayIcon,
  SaveIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { isApiMode } from "@/lib/api/config"
import { documentService, resumeService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, upsertItem } from "@/lib/store/query"
import type { Resume } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"
import { formatBytes } from "@/lib/utils/format"

import { useUpdateResume } from "./hooks"
import { LatexCodeEditor, type LatexCodeEditorHandle } from "./latex-code-editor"

type CompileState =
  | { kind: "idle" }
  | { kind: "compiling" }
  | { kind: "ok"; ms: number; sizeBytes: number }
  | { kind: "error"; message: string; line?: number; log?: string }

function toCompileError(error: unknown): CompileState {
  if (error instanceof ApiError) {
    const details = error.details as { log?: string; line?: number } | undefined
    return { kind: "error", message: error.message, line: details?.line, log: details?.log }
  }
  return { kind: "error", message: error instanceof Error ? error.message : "Compilation failed" }
}

/** Code editor (left) and live PDF preview (right) for a LaTeX resume. */
export function LatexResumeEditor({ resume }: { resume: Resume }) {
  const save = useUpdateResume()
  const editor = useRef<LatexCodeEditorHandle>(null)

  const [source, setSource] = useState(resume.latexSource ?? "")
  const [title, setTitle] = useState(resume.title)
  const [saved, setSaved] = useState({ source: resume.latexSource ?? "", title: resume.title })
  const [version, setVersion] = useState(resume.version)
  const [updatedAt, setUpdatedAt] = useState(resume.updatedAt)

  const [pdf, setPdf] = useState<{ blob: Blob; url: string; source: string } | null>(null)
  const [status, setStatus] = useState<CompileState>(isApiMode ? { kind: "compiling" } : { kind: "idle" })
  const [showLog, setShowLog] = useState(false)
  const [savingPdf, setSavingPdf] = useState(false)
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit")

  const dirty = source !== saved.source || title !== saved.title

  /** Compiles and shows the PDF; keeps the last good PDF on errors. */
  const runCompile = useCallback((src: string) => {
    const started = performance.now()
    return resumeService.compileLatex(src).then(
      (blob) => {
        const url = URL.createObjectURL(blob)
        setPdf((previous) => {
          if (previous) URL.revokeObjectURL(previous.url)
          return { blob, url, source: src }
        })
        setStatus({ kind: "ok", ms: Math.round(performance.now() - started), sizeBytes: blob.size })
        return blob
      },
      (error: unknown) => {
        setStatus(toCompileError(error))
        return null
      },
    )
  }, [])

  const compile = useCallback(
    (src: string) => {
      if (!isApiMode) return Promise.resolve(null)
      setStatus({ kind: "compiling" })
      return runCompile(src)
    },
    [runCompile],
  )

  // Render the saved document once on open (React dev mode mounts effects twice).
  const initialSource = useRef(source)
  const compiledOnOpen = useRef(false)
  useEffect(() => {
    if (compiledOnOpen.current) return
    compiledOnOpen.current = true
    if (isApiMode && initialSource.current.trim()) void runCompile(initialSource.current)
  }, [runCompile])

  // Release the last PDF URL on unmount.
  const pdfUrl = useRef<string | null>(null)
  useEffect(() => {
    pdfUrl.current = pdf?.url ?? null
  }, [pdf])
  useEffect(() => () => {
    if (pdfUrl.current) URL.revokeObjectURL(pdfUrl.current)
  }, [])

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const saveAndCompile = useCallback(async () => {
    if (source !== saved.source || title !== saved.title) {
      const result = await save.mutate(resume.id, {
        ...(source !== saved.source ? { latexSource: source } : {}),
        ...(title !== saved.title ? { title: title.trim() || "Untitled resume" } : {}),
      })
      if (!result) return
      setSaved({ source, title: result.title })
      setVersion(result.version)
      setUpdatedAt(result.updatedAt)
    }
    void compile(source)
  }, [compile, resume.id, save, saved, source, title])

  /** Compiles the current source and stores the PDF in Documents, linked to this resume. */
  const savePdfToDocuments = async () => {
    setSavingPdf(true)
    try {
      const blob = pdf && pdf.source === source ? pdf.blob : await compile(source)
      if (!blob) return
      const name = `${(title.trim() || "Resume").replace(/[\\/:*?"<>|]+/g, " ")} ${version}.pdf`
      const file = new File([blob], name, { type: "application/pdf" })
      const doc = await documentService.uploadDocument(
        { name, category: "resume", kind: "pdf", sizeBytes: file.size, description: `LaTeX resume: ${title}` },
        undefined,
        file,
      )
      const updated = await resumeService.updateResume(resume.id, { documentId: doc.id, version })
      upsertItem(QK.resumes, updated)
      upsertItem(QK.documents, doc)
      invalidateQueries(QK.activities)
      toast.success("PDF saved to Documents", { description: name })
    } catch (error) {
      toast.error("Couldn't save the PDF", { description: error instanceof Error ? error.message : undefined })
    } finally {
      setSavingPdf(false)
    }
  }

  const compiling = status.kind === "compiling"

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[560px] flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/career/resumes" />} aria-label="Back to resumes">
            <ArrowLeftIcon />
          </Button>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Resume title"
            className="h-8 max-w-xs font-medium"
          />
          <ToneBadge tone="violet">LaTeX</ToneBadge>
          <span className="hidden text-xs whitespace-nowrap text-muted-foreground sm:inline">
            {version} · {dirty ? "Unsaved changes" : `saved ${timeAgo(updatedAt)}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!isApiMode || compiling} onClick={() => void compile(source)}>
            {compiling ? <Loader2Icon className="animate-spin" /> : <PlayIcon />} Compile
          </Button>
          <Button size="sm" disabled={save.isPending} onClick={() => void saveAndCompile()}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} Save
            <kbd className="ml-1 hidden rounded border px-1 text-[10px] opacity-70 sm:inline">Ctrl S</kbd>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!pdf}
            nativeButton={false}
            render={<a href={pdf?.url} download={`${title.trim() || "resume"}.pdf`} />}
          >
            <DownloadIcon /> Download PDF
          </Button>
          <Button variant="outline" size="sm" disabled={!isApiMode || savingPdf} onClick={() => void savePdfToDocuments()}>
            {savingPdf ? <Loader2Icon className="animate-spin" /> : <FileUpIcon />} Save PDF to Documents
          </Button>
        </div>
      </div>

      {!isApiMode && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          You can edit and save LaTeX here, but compiling to PDF needs the API backend (NEXT_PUBLIC_API_MODE=api).
        </p>
      )}

      {/* Mobile tabs */}
      <div className="flex gap-1 lg:hidden">
        {(["edit", "preview"] as const).map((tab) => (
          <Button key={tab} size="sm" variant={mobileTab === tab ? "secondary" : "ghost"} onClick={() => setMobileTab(tab)}>
            {tab === "edit" ? "Source" : "PDF"}
          </Button>
        ))}
      </div>

      {/* Editor + preview */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <section className={cn("min-h-0 overflow-hidden rounded-xl border", mobileTab !== "edit" && "hidden lg:block")}>
          <LatexCodeEditor ref={editor} value={source} onChange={setSource} onSave={() => void saveAndCompile()} />
        </section>

        <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/40", mobileTab !== "preview" && "hidden lg:flex")}>
          <div className="flex items-center gap-2 border-b bg-card px-3 py-2 text-xs">
            {status.kind === "compiling" && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" /> Compiling… (the first compile can take a few minutes while LaTeX packages download)
              </span>
            )}
            {status.kind === "ok" && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2Icon className="size-3.5 text-success" /> Compiled in {(status.ms / 1000).toFixed(1)} s · {formatBytes(status.sizeBytes)}
                {pdf && pdf.source !== source && " · source changed since"}
              </span>
            )}
            {status.kind === "idle" && <span className="text-muted-foreground">Preview</span>}
            {status.kind === "error" && (
              <span className="flex min-w-0 items-center gap-1.5 text-destructive">
                <AlertTriangleIcon className="size-3.5 shrink-0" />
                <span className="truncate">{status.message}</span>
              </span>
            )}
            {status.kind === "error" && (
              <span className="ml-auto flex shrink-0 gap-1">
                {status.line && (
                  <Button variant="outline" size="xs" onClick={() => editor.current?.goToLine(status.line as number)}>
                    Go to line {status.line}
                  </Button>
                )}
                {status.log && (
                  <Button variant="ghost" size="xs" onClick={() => setShowLog(!showLog)}>
                    {showLog ? "Hide log" : "Show log"}
                  </Button>
                )}
              </span>
            )}
          </div>
          {status.kind === "error" && showLog && status.log && (
            <pre className="max-h-48 overflow-auto border-b bg-card px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {status.log}
            </pre>
          )}
          <div className="min-h-0 flex-1">
            {pdf ? (
              <iframe title="Resume PDF preview" src={pdf.url} className="size-full border-0 bg-white" />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {status.kind === "compiling"
                  ? "Rendering your resume…"
                  : isApiMode
                    ? "Compile to see the PDF here."
                    : "The PDF preview is available in API mode."}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
