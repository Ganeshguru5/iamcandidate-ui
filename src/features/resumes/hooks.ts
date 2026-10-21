"use client"

import { resumeService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { ID, Resume, ResumeInput } from "@/lib/types"

export function useCreateResume() {
  return useMutation((input: ResumeInput) => resumeService.createResume(input), {
    onSuccess: (resume) => upsertItem(QK.resumes, resume),
    success: "Resume created",
    error: "Couldn't create resume",
  })
}

export function useUpdateResume() {
  return useMutation((id: ID, patch: Partial<ResumeInput>) => resumeService.updateResume(id, patch), {
    onSuccess: (resume) => upsertItem(QK.resumes, resume),
    success: (resume) => `Saved ${resume.title} ${resume.version}`,
    error: "Couldn't save resume",
  })
}

export function useDuplicateResume() {
  return useMutation((id: ID) => resumeService.duplicateResume(id), {
    onSuccess: (resume) => upsertItem(QK.resumes, resume),
    success: (resume) => `Created "${resume.title}"`,
    error: "Couldn't duplicate resume",
  })
}

export function useSetDefaultResume() {
  return useMutation((id: ID) => resumeService.setDefaultResume(id), {
    onSuccess: (list) => setQueryData<Resume[]>(QK.resumes, () => list),
    success: "Default resume updated",
    error: "Couldn't set default",
  })
}

export function useDeleteResume() {
  return useMutation((id: ID) => resumeService.deleteResume(id), {
    onSuccess: (_, id) => removeItem(QK.resumes, id),
    success: "Resume deleted",
    error: "Couldn't delete resume",
  })
}
