"use client"

import { useRef } from "react"

import { applicationService, companyService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { Application, ApplicationInput, ApplicationStatus, CompanyInput, ID, TimelineEvent } from "@/lib/types"
import { applicationStatus } from "@/lib/constants"

export function useCreateApplication() {
  return useMutation(
    async (input: ApplicationInput, newCompany?: CompanyInput) => {
      let companyId = input.companyId
      if (newCompany) {
        const company = await companyService.createCompany(newCompany)
        upsertItem(QK.companies, company)
        companyId = company.id
      }
      return applicationService.createApplication({ ...input, companyId })
    },
    {
      onSuccess: (app) => upsertItem(QK.applications, app),
      success: (app) => `Application added — ${app.role}`,
      error: "Couldn't create application",
    },
  )
}

export function useUpdateApplication() {
  return useMutation(
    (id: ID, patch: Partial<ApplicationInput>) => applicationService.updateApplication(id, patch),
    {
      onSuccess: (app) => upsertItem(QK.applications, app),
      success: "Application updated",
      error: "Couldn't update application",
    },
  )
}

/** Optimistic status change — the Kanban card moves immediately. */
export function useChangeApplicationStatus() {
  const previous = useRef<Application[] | undefined>(undefined)
  return useMutation(
    (id: ID, status: ApplicationStatus) => applicationService.changeStatus(id, status),
    {
      onMutate: (id, status) => {
        setQueryData<Application[]>(QK.applications, (list) => {
          previous.current = list
          return list.map((app) => (app.id === id ? { ...app, status } : app))
        })
      },
      onSuccess: (app) => upsertItem(QK.applications, app),
      onError: () => {
        const snapshot = previous.current
        if (snapshot) {
          setQueryData<Application[]>(QK.applications, () => snapshot)
        }
      },
      success: (app) => `Moved to ${applicationStatus(app.status).label}`,
      error: "Couldn't change status",
    },
  )
}

export function useDeleteApplication() {
  return useMutation((id: ID) => applicationService.deleteApplication(id), {
    onSuccess: (_, id) => removeItem(QK.applications, id),
    success: "Application deleted",
    error: "Couldn't delete application",
  })
}

export function useAddTimelineEvent() {
  return useMutation(
    (id: ID, event: Omit<TimelineEvent, "id">) => applicationService.addTimelineEvent(id, event),
    {
      onSuccess: (app) => upsertItem(QK.applications, app),
      success: "Added to timeline",
    },
  )
}
