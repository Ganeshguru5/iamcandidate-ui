"use client"

import { interviewService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, removeItem, upsertItem, useMutation } from "@/lib/store/query"
import type { ID, InterviewInput } from "@/lib/types"

export function useCreateInterview() {
  return useMutation((input: InterviewInput) => interviewService.create(input), {
    onSuccess: (interview) => {
      upsertItem(QK.interviews, interview)
      invalidateQueries(QK.applications) // timeline gets a new entry
    },
    success: "Interview scheduled",
    error: "Couldn't schedule interview",
  })
}

export function useUpdateInterview() {
  return useMutation((id: ID, patch: Partial<InterviewInput>) => interviewService.update(id, patch), {
    onSuccess: (interview) => upsertItem(QK.interviews, interview),
    success: "Interview updated",
    error: "Couldn't update interview",
  })
}

export function useDeleteInterview() {
  return useMutation((id: ID) => interviewService.remove(id), {
    onSuccess: (_, id) => removeItem(QK.interviews, id),
    success: "Interview removed",
    error: "Couldn't remove interview",
  })
}
