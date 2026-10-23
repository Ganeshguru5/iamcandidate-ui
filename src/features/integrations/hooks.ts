"use client"

import { integrationService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { invalidateQueriesByPrefix, upsertItem, useMutation } from "@/lib/store/query"
import type { IntegrationId } from "@/lib/types"

export function useConnectIntegration() {
  return useMutation((id: IntegrationId) => integrationService.connect(id), {
    onSuccess: (integration) => {
      upsertItem(QK.integrations, integration)
      if (integration.id === "google_drive") invalidateQueriesByPrefix(QK.drive)
      // Detail pages cache their own status under "integration:<name>".
      invalidateQueriesByPrefix("integration")
    },
    success: (integration) => `${integration.name} connected successfully.`,
    error: "Connection failed",
  })
}

export function useDisconnectIntegration() {
  return useMutation((id: IntegrationId) => integrationService.disconnect(id), {
    onSuccess: (integration) => {
      upsertItem(QK.integrations, integration)
      if (integration.id === "google_drive") invalidateQueriesByPrefix(QK.drive)
      // Detail pages cache their own status under "integration:<name>".
      invalidateQueriesByPrefix("integration")
    },
    success: (integration) => `${integration.name} disconnected`,
    error: "Couldn't disconnect",
  })
}

export function useSyncIntegration() {
  return useMutation((id: IntegrationId) => integrationService.sync(id), {
    onSuccess: (integration) => {
      upsertItem(QK.integrations, integration)
      if (integration.id === "google_drive") invalidateQueriesByPrefix(QK.drive)
      // Detail pages cache their own status under "integration:<name>".
      invalidateQueriesByPrefix("integration")
    },
    success: (integration) => `${integration.name} synced`,
    error: "Sync failed",
  })
}
