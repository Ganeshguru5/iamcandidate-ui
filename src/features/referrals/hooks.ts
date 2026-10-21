"use client"

import { referralService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { ID, Referral, ReferralInput, ReferralStatus } from "@/lib/types"
import { referralStatus } from "@/lib/constants"

export function useCreateReferral() {
  return useMutation((input: ReferralInput) => referralService.create(input), {
    onSuccess: (referral) => upsertItem(QK.referrals, referral),
    success: "Referral added",
    error: "Couldn't add referral",
  })
}

export function useUpdateReferral() {
  return useMutation((id: ID, patch: Partial<ReferralInput>) => referralService.update(id, patch), {
    onSuccess: (referral) => upsertItem(QK.referrals, referral),
    success: "Referral updated",
    error: "Couldn't update referral",
  })
}

export function useSetReferralStatus() {
  return useMutation(
    (id: ID, status: ReferralStatus) =>
      referralService.update(id, {
        status,
        ...(status === "request_sent" ? { requestDate: new Date().toISOString() } : {}),
      }),
    {
      onMutate: (id, status) =>
        setQueryData<Referral[]>(QK.referrals, (list) => list.map((r) => (r.id === id ? { ...r, status } : r))),
      onSuccess: (referral) => upsertItem(QK.referrals, referral),
      success: (referral) => `Marked as ${referralStatus(referral.status).label.toLowerCase()}`,
      error: "Couldn't update status",
    },
  )
}

export function useDeleteReferral() {
  return useMutation((id: ID) => referralService.remove(id), {
    onSuccess: (_, id) => removeItem(QK.referrals, id),
    success: "Referral deleted",
    error: "Couldn't delete referral",
  })
}
