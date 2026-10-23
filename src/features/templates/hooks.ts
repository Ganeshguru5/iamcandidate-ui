"use client"

import { templateService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { EmailTemplateInput, ID } from "@/lib/types"

export function useCreateTemplate() {
  return useMutation((input: EmailTemplateInput) => templateService.create(input), {
    onSuccess: (template) => upsertItem(QK.templates, template),
    success: "Template created",
    error: "Couldn't create template",
  })
}

export function useUpdateTemplate() {
  return useMutation((id: ID, patch: Partial<EmailTemplateInput>) => templateService.update(id, patch), {
    onSuccess: (template) => upsertItem(QK.templates, template),
    success: "Template saved",
    error: "Couldn't save template",
  })
}

export function useDuplicateTemplate() {
  return useMutation((id: ID) => templateService.duplicate(id), {
    onSuccess: (template) => upsertItem(QK.templates, template),
    success: (template) => `Created "${template.name}"`,
    error: "Couldn't duplicate template",
  })
}

export function useRestoreDefaultTemplates() {
  return useMutation(() => templateService.restoreDefaults(), {
    onSuccess: ({ templates }) => setQueryData(QK.templates, () => templates),
    success: ({ added }) =>
      added === 0 ? "All default templates are already here" : `Restored ${added} default template${added === 1 ? "" : "s"}`,
    error: "Couldn't restore the default templates",
  })
}

export function useDeleteTemplate() {
  return useMutation((id: ID) => templateService.remove(id), {
    onSuccess: (_, id) => removeItem(QK.templates, id),
    success: "Template deleted",
    error: "Couldn't delete template",
  })
}
