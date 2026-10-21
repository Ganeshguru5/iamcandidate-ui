"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeftIcon, DownloadIcon, Loader2Icon, PlusIcon, SaveIcon, SearchXIcon, Trash2Icon, XIcon } from "lucide-react"
import { cn } from "cn"

import { EmptyState } from "@/components/shared/empty-state"
import { Field } from "@/components/shared/form"
import { Panel } from "@/components/shared/panel"
import { PageSkeleton } from "@/components/shared/skeletons"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useProfile, useResumes } from "@/lib/store/queries"
import type { Resume, ResumeEducation, ResumeExperience } from "@/lib/types"
import { createId } from "@/lib/utils/id"
import { timeAgo } from "@/lib/utils/dates"

import { useUpdateResume } from "./hooks"
import { LatexResumeEditor } from "./latex-resume-editor"
import { downloadResume, ResumePaper } from "./resume-paper"

export function ResumeEditor() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: resumes, isLoading } = useResumes()
  const resume = resumes?.find((r) => r.id === id)
  if (isLoading) return <PageSkeleton />
  if (!resume) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Resume not found"
        action={<Button variant="outline" onClick={() => router.push("/career/resumes")}><ArrowLeftIcon /> Back to resumes</Button>}
      />
    )
  }
  if (resume.format === "latex") return <LatexResumeEditor key={resume.id} resume={resume} />
  return <ResumeEditorForm key={resume.id} resume={resume} />
}

function ResumeEditorForm({ resume }: { resume: Resume }) {
  const { data: profile } = useProfile()
  const save = useUpdateResume()
  const [draft, setDraft] = useState<Resume>(resume)
  const [saved, setSaved] = useState<Resume>(resume)
  const [skillInput, setSkillInput] = useState("")
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit")

  const dirty = JSON.stringify({ ...draft, version: "", updatedAt: "" }) !== JSON.stringify({ ...saved, version: "", updatedAt: "" })
  const set = <K extends keyof Resume>(key: K, value: Resume[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const updateExperience = (id: string, patch: Partial<ResumeExperience>) =>
    set("experience", draft.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  const updateEducation = (id: string, patch: Partial<ResumeEducation>) =>
    set("education", draft.education.map((e) => (e.id === id ? { ...e, ...patch } : e)))

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !draft.skills.includes(skill)) set("skills", [...draft.skills, skill])
    setSkillInput("")
  }

  const onSave = async () => {
    const result = await save.mutate(resume.id, {
      title: draft.title,
      targetRole: draft.targetRole,
      summary: draft.summary,
      skills: draft.skills,
      experience: draft.experience,
      education: draft.education,
    })
    if (result) {
      setSaved(result)
      setDraft(result)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/career/resumes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Resumes
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{draft.title || "Untitled resume"}</h1>
              <ToneBadge tone="neutral">{saved.version}</ToneBadge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {dirty ? <span className="text-warning">Unsaved changes</span> : `Saved ${timeAgo(saved.updatedAt)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadResume(draft, profile)}>
              <DownloadIcon /> Download
            </Button>
            <Button variant="outline" disabled={!dirty || save.isPending} onClick={() => setDraft(saved)}>
              Discard
            </Button>
            <Button disabled={!dirty || save.isPending} onClick={onSave}>
              {save.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              {save.isPending ? "Saving…" : "Save new version"}
            </Button>
          </div>
        </div>
      </div>

      <div className="inline-flex rounded-lg border p-0.5 lg:hidden">
        {(["edit", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cn("h-7 rounded-md px-3 text-xs font-medium capitalize", mobileTab === tab ? "bg-muted" : "text-muted-foreground")}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cn("space-y-4", mobileTab === "preview" && "hidden lg:block")}>
          <Panel title="Basics">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Resume name" htmlFor="rs-title">
                  <Input id="rs-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
                </Field>
                <Field label="Target role" htmlFor="rs-role">
                  <Input id="rs-role" value={draft.targetRole} onChange={(e) => set("targetRole", e.target.value)} />
                </Field>
              </div>
              <Field label="Summary" htmlFor="rs-summary" hint={`${draft.summary.length}/400 characters`}>
                <Textarea id="rs-summary" rows={4} maxLength={400} value={draft.summary} onChange={(e) => set("summary", e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {draft.skills.map((skill) => (
                <span key={skill} className="inline-flex h-6 items-center gap-1 rounded-md border bg-muted/50 pr-1 pl-2 text-xs">
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => set("skills", draft.skills.filter((s) => s !== skill))}
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                addSkill()
              }}
            >
              <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill and press Enter" />
              <Button type="submit" variant="outline" disabled={!skillInput.trim()}>
                Add
              </Button>
            </form>
          </Panel>

          <Panel
            title="Experience"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  set("experience", [...draft.experience, { id: createId("exp"), company: "", title: "", period: "", highlights: [""] }])
                }
              >
                <PlusIcon /> Add role
              </Button>
            }
          >
            <div className="space-y-5">
              {draft.experience.length === 0 && <p className="text-sm text-muted-foreground">No roles added.</p>}
              {draft.experience.map((exp, index) => (
                <div key={exp.id} className={cn("grid grid-cols-1 gap-3", index > 0 && "border-t pt-5")}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
                    <Input aria-label="Title" placeholder="Title" value={exp.title} onChange={(e) => updateExperience(exp.id, { title: e.target.value })} />
                    <Input aria-label="Company" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} />
                    <Input aria-label="Period" placeholder="2023 — Present" value={exp.period} onChange={(e) => updateExperience(exp.id, { period: e.target.value })} />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove role"
                      onClick={() => set("experience", draft.experience.filter((e) => e.id !== exp.id))}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  <Textarea
                    aria-label="Highlights"
                    rows={3}
                    placeholder="One highlight per line"
                    value={exp.highlights.join("\n")}
                    onChange={(e) => updateExperience(exp.id, { highlights: e.target.value.split("\n") })}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Education"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => set("education", [...draft.education, { id: createId("edu"), school: "", degree: "", period: "" }])}
              >
                <PlusIcon /> Add
              </Button>
            }
          >
            <div className="space-y-3">
              {draft.education.map((edu) => (
                <div key={edu.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
                  <Input aria-label="Degree" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, { degree: e.target.value })} />
                  <Input aria-label="School" placeholder="School" value={edu.school} onChange={(e) => updateEducation(edu.id, { school: e.target.value })} />
                  <Input aria-label="Period" placeholder="2017 — 2021" value={edu.period} onChange={(e) => updateEducation(edu.id, { period: e.target.value })} />
                  <Button variant="ghost" size="icon" aria-label="Remove education" onClick={() => set("education", draft.education.filter((e) => e.id !== edu.id))}>
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className={cn("lg:sticky lg:top-20 lg:self-start", mobileTab === "edit" && "hidden lg:block")}>
          <div className="rounded-xl border bg-muted/40 p-3 sm:p-5">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Live preview</p>
            <ResumePaper resume={draft} profile={profile} />
          </div>
        </div>
      </div>
    </div>
  )
}
