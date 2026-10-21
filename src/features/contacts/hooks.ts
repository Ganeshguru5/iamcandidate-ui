"use client"

import { contactService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, upsertItem, useMutation } from "@/lib/store/query"
import type { ContactInput, ID } from "@/lib/types"

export function useCreateContact() {
  return useMutation((input: ContactInput) => contactService.createContact(input), {
    onSuccess: (contact) => upsertItem(QK.contacts, contact),
    success: (contact) => `${contact.name} added to contacts`,
    error: "Couldn't add contact",
  })
}

export function useUpdateContact() {
  return useMutation(
    (id: ID, patch: Partial<ContactInput>) => contactService.updateContact(id, patch),
    {
      onSuccess: (contact) => upsertItem(QK.contacts, contact),
      success: "Contact updated",
      error: "Couldn't update contact",
    },
  )
}

export function useDeleteContact() {
  return useMutation((id: ID) => contactService.deleteContact(id), {
    onSuccess: (_, id) => removeItem(QK.contacts, id),
    success: "Contact deleted",
    error: "Couldn't delete contact",
  })
}
