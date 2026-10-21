"use client"

import { emailService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { ComposeEmailInput, Email, ID } from "@/lib/types"

export function useSendEmail() {
  return useMutation((input: ComposeEmailInput, draftId?: ID) => emailService.sendEmail(input).then(async (email) => {
    if (draftId) await emailService.deleteEmail(draftId)
    return email
  }), {
    onSuccess: (email, _input, draftId) => {
      upsertItem(QK.emails, email)
      if (draftId) removeItem(QK.emails, draftId)
      invalidateQueries(QK.contacts, QK.templates)
    },
    success: "Email sent successfully",
    error: "Email not sent",
  })
}

export function useSaveDraft() {
  return useMutation(
    (input: ComposeEmailInput, draftId?: ID) => emailService.saveDraft(input, draftId),
    {
      onSuccess: (email) => upsertItem(QK.emails, email),
      success: "Draft saved",
      error: "Couldn't save draft",
    },
  )
}

export function useMarkEmailRead() {
  return useMutation((id: ID, read: boolean) => emailService.markRead(id, read), {
    onMutate: (id, read) =>
      setQueryData<Email[]>(QK.emails, (list) => list.map((e) => (e.id === id ? { ...e, read } : e))),
  })
}

export function useToggleEmailStar() {
  return useMutation((id: ID) => emailService.toggleStar(id), {
    onMutate: (id) =>
      setQueryData<Email[]>(QK.emails, (list) =>
        list.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)),
      ),
    onSuccess: (email) => upsertItem(QK.emails, email),
  })
}

export function useDeleteEmail() {
  return useMutation((id: ID) => emailService.deleteEmail(id), {
    onSuccess: (_, id) => removeItem(QK.emails, id),
    success: "Email deleted",
    error: "Couldn't delete email",
  })
}
