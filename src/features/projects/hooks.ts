"use client"

import { projectService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, upsertItem, useMutation } from "@/lib/store/query"
import type { ID, ProjectInput } from "@/lib/types"

export function useCreateProject() {
  return useMutation((input: ProjectInput) => projectService.create(input), {
    onSuccess: (project) => upsertItem(QK.projects, project),
    success: (project) => `Project "${project.name}" created`,
    error: "Couldn't create project",
  })
}

export function useUpdateProject() {
  return useMutation((id: ID, patch: Partial<ProjectInput>) => projectService.update(id, patch), {
    onSuccess: (project) => upsertItem(QK.projects, project),
    success: "Project updated",
    error: "Couldn't update project",
  })
}

export function useDeleteProject() {
  return useMutation((id: ID) => projectService.remove(id), {
    onSuccess: (_, id) => removeItem(QK.projects, id),
    success: "Project deleted",
    error: "Couldn't delete project",
  })
}
