"use client"

import { companyService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, upsertItem, useMutation } from "@/lib/store/query"
import type { CompanyInput, ID } from "@/lib/types"

export function useCreateCompany() {
  return useMutation((input: CompanyInput) => companyService.createCompany(input), {
    onSuccess: (company) => upsertItem(QK.companies, company),
    success: (company) => `${company.name} added`,
    error: "Couldn't add company",
  })
}

export function useUpdateCompany() {
  return useMutation((id: ID, patch: Partial<CompanyInput>) => companyService.updateCompany(id, patch), {
    onSuccess: (company) => upsertItem(QK.companies, company),
    success: "Company updated",
    error: "Couldn't update company",
  })
}

export function useDeleteCompany() {
  return useMutation((id: ID) => companyService.deleteCompany(id), {
    onSuccess: (_, id) => removeItem(QK.companies, id),
    success: "Company deleted",
    error: "Couldn't delete company",
  })
}
