"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronDownIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SquarePenIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { Tag, ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsPortfolioOwner } from "@/features/portfolio/owner"
import { documentService } from "@/lib/services"
import { useApplications, usePortfolio, useProfile, useResumes } from "@/lib/store/queries"
import type { Resume } from "@/lib/types"
import { delay } from "@/lib/utils/delay"
import { formatDate, timeAgo } from "@/lib/utils/dates"

import {
  useCreateResume,
  useDeleteResume,
  useDuplicateResume,
  useSetDefaultResume,
  useSyncResumeToPortfolio,
} from "./hooks"
import { starterLatexResume } from "./latex-template"
import { downloadResume, ResumePaper } from "./resume-paper"

const isLatex = (resume: Resume) => resume.format === "latex"

export function ResumesView() {
  const router = useRouter()
  const { data: resumes, isLoading, error, refetch } = useResumes()
  const { data: applications = [] } = useApplications()
  const { data: profile } = useProfile()
  const duplicate = useDuplicateResume()
  const setDefault = useSetDefaultResume()
  const remove = useDeleteResume()
  const create = useCreateResume()
  const isOwner = useIsPortfolioOwner()
  const { data: portfolio } = usePortfolio()
  const syncToPortfolio = useSyncResumeToPortfolio()

  const [previewing, setPreviewing] = useState<Resume | null>(null)
  const [deleting, setDeleting] = useState<Resume | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const usage = (id: string) => applications.filter((a) => a.resumeId === id).length
  const onPortfolio = (resume: Resume) => portfolio?.resume?.resumeId === resume.id

  // The portfolio serves a PDF, so only resumes with one saved to Documents can go there.
  const sync = (resume: Resume) => {
    if (!resume.documentId) {
      toast.info("No saved PDF yet", {
        description: isLatex(resume)
          ? "Open the resume and use “Save PDF to Documents”, then sync again."
          : "Only resumes with a saved PDF can go on the portfolio.",
      })
      return
    }
    void syncToPortfolio.mutate(resume.id)
  }

  const download = async (resume: Resume) => {
    if (isLatex(resume)) {
      // LaTeX resumes download the PDF saved to Documents from the editor.
      if (!resume.documentId) {
        toast.info("No saved PDF yet", { description: "Open the resume and use “Save PDF to Documents”." })
        return
      }
      setDownloading(resume.id)
      try {
        const url = await documentService.getDownloadUrl(resume.documentId)
        if (url) window.location.assign(url)
        else toast.info("This PDF has no stored file")
      } catch (error) {
        toast.error("Download failed", { description: error instanceof Error ? error.message : undefined })
      } finally {
        setDownloading(null)
      }
      return
    }
    setDownloading(resume.id)
    const id = toast.loading(`Preparing ${resume.title} ${resume.version}…`)
    await delay(900)
    downloadResume(resume, profile)
    toast.success("Download started", { id })
    setDownloading(null)
  }

  const createNew = async () => {
    const base = resumes?.find((r) => r.isDefault)
    const resume = await create.mutate({
      title: "Untitled resume",
      targetRole: base?.targetRole ?? "Software Engineer",
      version: "v1.0",
      isDefault: false,
      summary: base?.summary ?? "",
      skills: base?.skills ?? [],
      experience: base?.experience ?? [],
      education: base?.education ?? [],
    })
    if (resume) router.push(`/career/resumes/${resume.id}`)
  }

  const createLatex = async () => {
    const resume = await create.mutate({
      title: "LaTeX resume",
      targetRole: resumes?.find((r) => r.isDefault)?.targetRole ?? "Software Engineer",
      version: "v1.0",
      isDefault: false,
      summary: "",
      skills: [],
      experience: [],
      education: [],
      format: "latex",
      latexSource: starterLatexResume(profile),
    })
    if (resume) router.push(`/career/resumes/${resume.id}`)
  }

  const sorted = [...(resumes ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div>
      <PageHeader
        title="Resumes"
        description="Role-specific versions of your resume, and where each one is used."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button disabled={create.isPending} />}>
              {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
              New resume
              <ChevronDownIcon className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onClick={() => void createNew()}>
                <SquarePenIcon />
                <span className="flex flex-col">
                  <span>Form-based resume</span>
                  <span className="text-xs text-muted-foreground">Fill in sections, styled for you</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void createLatex()}>
                <CodeIcon />
                <span className="flex flex-col">
                  <span>LaTeX resume</span>
                  <span className="text-xs text-muted-foreground">Write LaTeX, live PDF preview</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton count={4} className="xl:grid-cols-2 2xl:grid-cols-4" />
      ) : sorted.length === 0 ? (
        <EmptyState icon={FileTextIcon} title="No resumes yet" action={<Button onClick={createNew}><PlusIcon /> New resume</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {sorted.map((resume) => (
            <article key={resume.id} className="group flex flex-col rounded-xl border bg-card transition-shadow hover:shadow-sm">
              <button
                type="button"
                onClick={() => (isLatex(resume) ? router.push(`/career/resumes/${resume.id}`) : setPreviewing(resume))}
                className="relative h-36 overflow-hidden rounded-t-xl border-b bg-muted/50 text-left"
                aria-label={isLatex(resume) ? `Open ${resume.title}` : `Preview ${resume.title}`}
              >
                {isLatex(resume) ? (
                  <pre className="pointer-events-none absolute inset-0 overflow-hidden p-3 font-mono text-[9px] leading-snug text-muted-foreground">
                    {(resume.latexSource ?? "").split("\n").slice(0, 16).join("\n")}
                  </pre>
                ) : (
                  <div className="pointer-events-none absolute top-4 left-1/2 w-[560px] origin-top -translate-x-1/2 scale-[0.42]">
                    <ResumePaper resume={resume} profile={profile} />
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium">
                    <EyeIcon className="size-3.5" /> Preview
                  </span>
                </span>
              </button>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/career/resumes/${resume.id}`} className="truncate font-medium hover:underline">
                        {resume.title}
                      </Link>
                      {resume.isDefault && (
                        <ToneBadge tone="blue">
                          <StarIcon className="size-3 fill-current" /> Default
                        </ToneBadge>
                      )}
                      {isLatex(resume) && <ToneBadge tone="violet">LaTeX</ToneBadge>}
                      {onPortfolio(resume) && (
                        <ToneBadge tone="green">
                          <GlobeIcon className="size-3" /> Portfolio
                        </ToneBadge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Target: {resume.targetRole}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Resume actions" />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {!isLatex(resume) && (
                        <DropdownMenuItem onClick={() => setPreviewing(resume)}>
                          <EyeIcon /> View
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => router.push(`/career/resumes/${resume.id}`)}>
                        <PencilIcon /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void duplicate.mutate(resume.id)}>
                        <CopyIcon /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void download(resume)}>
                        <DownloadIcon /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={resume.isDefault} onClick={() => void setDefault.mutate(resume.id)}>
                        <StarIcon /> Set as default
                      </DropdownMenuItem>
                      {isOwner && (
                        <DropdownMenuItem disabled={syncToPortfolio.isPending} onClick={() => sync(resume)}>
                          <GlobeIcon /> {onPortfolio(resume) ? "Re-sync to portfolio" : "Sync to portfolio"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" disabled={resume.isDefault} onClick={() => setDeleting(resume)}>
                        <Trash2Icon /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1">
                  {resume.skills.slice(0, 4).map((skill) => (
                    <Tag key={skill}>{skill}</Tag>
                  ))}
                  {resume.skills.length > 4 && <Tag>+{resume.skills.length - 4}</Tag>}
                </div>
                <dl className="mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="font-medium tabular-nums">{resume.version}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="font-medium" title={formatDate(resume.updatedAt, true)}>{timeAgo(resume.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Used in</dt>
                    <dd className="font-medium tabular-nums">{usage(resume.id)} apps</dd>
                  </div>
                </dl>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" render={<Link href={`/career/resumes/${resume.id}`} />} nativeButton={false}>
                    <PencilIcon /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" disabled={downloading === resume.id} onClick={() => void download(resume)}>
                    {downloading === resume.id ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />} Download
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>{previewing?.title}</DialogTitle>
            <DialogDescription>
              {previewing?.version} · updated {previewing && formatDate(previewing.updatedAt, true)}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70dvh] overflow-y-auto bg-muted/50 p-4 sm:p-6">
            {previewing && <ResumePaper resume={previewing} profile={profile} />}
          </div>
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            {previewing && (
              <>
                <Button variant="outline" onClick={() => void download(previewing)}>
                  <DownloadIcon /> Download
                </Button>
                <Button render={<Link href={`/career/resumes/${previewing.id}`} />} nativeButton={false}>
                  <PencilIcon /> Edit
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.title}"?`}
        description={deleting && usage(deleting.id) ? `It's linked to ${usage(deleting.id)} applications.` : undefined}
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
