"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLinkIcon, FolderOpenIcon, Loader2Icon, RefreshCwIcon, SettingsIcon, UnplugIcon } from "lucide-react"

import { ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { isApiMode } from "@/lib/api/config"
import { useIntegrations } from "@/lib/store/queries"
import type { Integration } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"

import { ConnectDialog } from "./connect-dialog"
import { useDisconnectIntegration, useSyncIntegration } from "./hooks"
import { IntegrationLogo } from "./integration-logos"

export function StatusBadge({ integration }: { integration: Integration }) {
  if (integration.status === "connected") return <ToneBadge tone="green" dot>Connected</ToneBadge>
  if (integration.status === "coming_soon") return <ToneBadge tone="neutral">Coming soon</ToneBadge>
  return <ToneBadge tone="amber" dot>Disconnected</ToneBadge>
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
      <PageHeader title="Integrations" description="Connect the services your workspace depends on. All connections are simulated in this prototype." />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold">Available</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {available.map((integration) => {
                const connected = integration.status === "connected"
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
                        <dt className="text-muted-foreground">{integration.id === "smtp" ? "Server" : "Account"}</dt>
                        <dd className="mt-0.5 truncate font-medium">{connected ? integration.account : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{integration.id === "smtp" ? "Last tested" : "Last synced"}</dt>
                        <dd className="mt-0.5 font-medium">
                          {connected && integration.lastSyncedAt ? timeAgo(integration.lastSyncedAt) : "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {connected ? (
                        <>
                          {integration.id === "google_drive" && (
                            <>
                              <Button variant="outline" size="sm" disabled={syncingId === integration.id} onClick={() => void doSync(integration)}>
                                {syncingId === integration.id ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
                                {syncingId === integration.id ? "Syncing…" : "Sync"}
                              </Button>
                              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/integrations/google-drive" />}>
                                <FolderOpenIcon /> Open Drive
                              </Button>
                            </>
                          )}
                          {integration.id === "smtp" && (
                            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/settings?tab=email" />}>
                              <SettingsIcon /> Configure
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => setDisconnecting(integration)}>
                            <UnplugIcon /> Disconnect
                          </Button>
                        </>
                      ) : integration.id === "smtp" && isApiMode ? (
                        <Button size="sm" nativeButton={false} render={<Link href="/settings?tab=email" />}>
                          Set up
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
        </div>
      )}

      {connecting && <ConnectDialog integration={connecting} onOpenChange={(open) => !open && setConnecting(null)} />}
      <ConfirmDialog
        open={!!disconnecting}
        onOpenChange={(open) => !open && setDisconnecting(null)}
        title={`Disconnect ${disconnecting?.name}?`}
        description={
          disconnecting?.id === "smtp"
            ? "You won't be able to send emails until you reconnect."
            : "Drive files will no longer be browsable or synced."
        }
        confirmLabel="Disconnect"
        onConfirm={async () => {
          if (disconnecting) await disconnect.mutate(disconnecting.id)
        }}
      />
    </div>
  )
}
