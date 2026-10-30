"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  DatabaseBackupIcon,
  ExternalLinkIcon,
  FolderOpenIcon,
  GitBranchIcon,
  Loader2Icon,
  RefreshCwIcon,
  SettingsIcon,
  UnplugIcon,
  UploadIcon,
} from "lucide-react"

import { ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { isApiMode } from "@/lib/api/config"
import { useIntegrations } from "@/lib/store/queries"
import type { Integration, IntegrationId } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"

import { ConnectDialog } from "./connect-dialog"
import { useDisconnectIntegration, useSyncIntegration } from "./hooks"
import { IntegrationLogo } from "./integration-logos"

export function StatusBadge({ integration }: { integration: Integration }) {
  if (integration.status === "connected") return <ToneBadge tone="green" dot>Connected</ToneBadge>
  if (integration.status === "coming_soon") return <ToneBadge tone="neutral">Coming soon</ToneBadge>
  return <ToneBadge tone="amber" dot>{integration.id === "linkedin" ? "Not imported" : "Disconnected"}</ToneBadge>
}

/** Each integration's own page (API mode). SMTP lives in Settings. */
const PAGES: Partial<Record<IntegrationId, string>> = {
  google_drive: "/integrations/google-drive",
  google_calendar: "/integrations/google-calendar",
  github: "/integrations/github",
  linkedin: "/integrations/linkedin",
  aws: "/integrations/aws-s3",
}

const LABELS: Partial<Record<IntegrationId, { account: string; synced: string }>> = {
  smtp: { account: "Server", synced: "Last tested" },
  github: { account: "Account", synced: "Connected" },
  linkedin: { account: "Imported", synced: "Last import" },
  aws: { account: "Bucket", synced: "Last backup" },
}

const DISCONNECT_TEXT: Partial<Record<IntegrationId, string>> = {
  smtp: "You won't be able to send emails until you reconnect.",
  google_drive: "Drive files will no longer be browsable or importable.",
  google_calendar: "IamCandidate stops updating your calendar. Events it already added stay; remove them from the Google Calendar page instead.",
  github: "IamCandidate forgets your token. Projects keep their repository links.",
  aws: "IamCandidate forgets the access key. Backups already in your bucket stay there.",
}

/** The main action for a connected integration, besides Disconnect. */
function ConnectedActions({ integration, syncing, onSync }: { integration: Integration; syncing: boolean; onSync: () => void }) {
  const page = PAGES[integration.id]
  const syncButton = (
    <Button variant="outline" size="sm" disabled={syncing} onClick={onSync}>
      {syncing ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
      {syncing ? "Syncing…" : "Sync"}
    </Button>
  )
  switch (integration.id) {
    case "smtp":
      return (
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/settings?tab=email" />}>
          <SettingsIcon /> Configure
        </Button>
      )
    case "google_drive":
      return (
        <>
          {syncButton}
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/integrations/google-drive" />}>
            <FolderOpenIcon /> Open Drive
          </Button>
        </>
      )
    case "google_calendar":
      return (
        <>
          {syncButton}
          {isApiMode && page && (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={page} />}>
              Details <ArrowRightIcon />
            </Button>
          )}
        </>
      )
    case "github":
      return isApiMode && page ? (
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={page} />}>
          <GitBranchIcon /> Repositories
        </Button>
      ) : null
    case "linkedin":
      return isApiMode && page ? (
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={page} />}>
          <UploadIcon /> Import more
        </Button>
      ) : null
    case "aws":
      return isApiMode && page ? (
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={page} />}>
          <DatabaseBackupIcon /> Back up
        </Button>
      ) : null
    default:
      return null
  }
}

export function IntegrationsView() {
  const { data: integrations, isLoading, error, refetch } = useIntegrations()
  const [connecting, setConnecting] = useState<Integration | null>(null)
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null)
  const sync = useSyncIntegration()
  const disconnect = useDisconnectIntegration()
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const doSync = async (integration: Integration) => {
    setSyncingId(integration.id)
    await sync.mutate(integration.id)
    setSyncingId(null)
  }

  const available = (integrations ?? []).filter((i) => i.status !== "coming_soon")
  const upcoming = (integrations ?? []).filter((i) => i.status === "coming_soon")

  return (
    <div>
      <PageHeader
        title="Integrations"
        description={
          isApiMode
            ? "Connect the services your workspace depends on."
            : "Connect the services your workspace depends on. Connections are simulated while the app runs on demo data."
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {available.map((integration) => {
                const connected = integration.status === "connected"
                const labels = LABELS[integration.id] ?? { account: "Account", synced: "Last synced" }
                const page = PAGES[integration.id]
                // In API mode everything but Drive connects on its own page (Drive uses the dialog's Google redirect).
                const setUpHref =
                  integration.id === "smtp" ? "/settings?tab=email" : integration.id !== "google_drive" ? page : undefined
                return (
                  <article key={integration.id} className="flex flex-col rounded-xl border bg-card p-5">
                    <div className="flex items-start gap-4">
                      <IntegrationLogo id={integration.id} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{integration.name}</h3>
                          <StatusBadge integration={integration} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-xs">
                      <div>
                        <dt className="text-muted-foreground">{labels.account}</dt>
                        <dd className="mt-0.5 truncate font-medium">{connected ? integration.account : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{labels.synced}</dt>
                        <dd className="mt-0.5 font-medium">
                          {connected && integration.lastSyncedAt ? timeAgo(integration.lastSyncedAt) : "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {connected ? (
                        <>
                          <ConnectedActions
                            integration={integration}
                            syncing={syncingId === integration.id}
                            onSync={() => void doSync(integration)}
                          />
                          {integration.id !== "linkedin" && (
                            <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => setDisconnecting(integration)}>
                              <UnplugIcon /> Disconnect
                            </Button>
                          )}
                        </>
                      ) : isApiMode && setUpHref ? (
                        <Button size="sm" nativeButton={false} render={<Link href={setUpHref} />}>
                          {integration.id === "linkedin" ? "Import" : "Set up"}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => setConnecting(integration)}>
                          Connect
                        </Button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold">Coming soon</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {upcoming.map((integration) => (
                  <article key={integration.id} className="rounded-xl border border-dashed bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <IntegrationLogo id={integration.id} className="opacity-80" />
                      <StatusBadge integration={integration} />
                    </div>
                    <h3 className="mt-3 text-sm font-medium">{integration.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{integration.description}</p>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {integration.category} <ExternalLinkIcon className="size-3 opacity-0" />
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {connecting && <ConnectDialog integration={connecting} onOpenChange={(open) => !open && setConnecting(null)} />}
      <ConfirmDialog
        open={!!disconnecting}
        onOpenChange={(open) => !open && setDisconnecting(null)}
        title={`Disconnect ${disconnecting?.name}?`}
        description={disconnecting ? DISCONNECT_TEXT[disconnecting.id] : undefined}
        confirmLabel="Disconnect"
        onConfirm={async () => {
          if (disconnecting) await disconnect.mutate(disconnecting.id)
        }}
      />
    </div>
  )
}
