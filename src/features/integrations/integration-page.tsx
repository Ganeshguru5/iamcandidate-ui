"use client"

import Link from "next/link"
import { ArrowLeftIcon, ServerIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { useQuery } from "@/lib/store/query"
import { integrationsApi } from "@/lib/services/api/integrations"
import type { IntegrationId } from "@/lib/types"

import { IntegrationLogo } from "./integration-logos"

/** Query keys for the server-side integrations (prefix "integration:"). */
export const IQK = {
  calendar: "integration:google-calendar",
  github: "integration:github",
  githubRepos: "integration:github:repos",
  linkedin: "integration:linkedin",
  aws: "integration:aws",
} as const

const fetchers = {
  calendar: () => integrationsApi.calendar.status(),
  github: () => integrationsApi.github.status(),
  githubRepos: () => integrationsApi.github.repos(),
  linkedin: () => integrationsApi.linkedin.status(),
  aws: () => integrationsApi.aws.status(),
}

export const useCalendarStatus = () => useQuery(IQK.calendar, fetchers.calendar)
export const useGitHubStatus = () => useQuery(IQK.github, fetchers.github)
export const useLinkedInStatus = () => useQuery(IQK.linkedin, fetchers.linkedin)
export const useAwsStatus = () => useQuery(IQK.aws, fetchers.aws)

const noRepos = async () => []
/** Repositories load only once GitHub is connected. */
export function useGitHubRepos(enabled: boolean) {
  return useQuery(enabled ? IQK.githubRepos : `${IQK.githubRepos}:off`, enabled ? fetchers.githubRepos : noRepos)
}

export function IntegrationPageHeader({
  id,
  title,
  description,
  connected,
  actions,
}: {
  id: IntegrationId
  title: string
  description: string
  connected?: boolean
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <Button variant="ghost" size="sm" className="-ml-2 mb-3 text-muted-foreground" nativeButton={false} render={<Link href="/integrations" />}>
        <ArrowLeftIcon /> Integrations
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <IntegrationLogo id={id} className="size-12" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {connected !== undefined &&
                (connected ? (
                  <ToneBadge tone="green" dot>
                    Connected
                  </ToneBadge>
                ) : (
                  <ToneBadge tone="amber" dot>
                    Not connected
                  </ToneBadge>
                ))}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** Shown on server-backed integration pages when the app runs on mock data. */
export function ApiOnlyNotice({ name }: { name: string }) {
  return (
    <EmptyState
      icon={ServerIcon}
      title={`${name} needs the IamCandidate server`}
      description="This prototype is running on demo data. Set NEXT_PUBLIC_API_MODE=api and connect to iamcandidate-server to use this integration."
    />
  )
}
