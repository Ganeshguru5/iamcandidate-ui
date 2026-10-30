"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ActivityIcon,
  ExternalLinkIcon,
  FolderPlusIcon,
  GitBranchIcon,
  KeyRoundIcon,
  LinkIcon,
  Loader2Icon,
  LockIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  StarIcon,
  UnplugIcon,
} from "lucide-react"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field } from "@/components/shared/form"
import { ConfirmDialog, SearchInput } from "@/components/shared/misc"
import { Panel } from "@/components/shared/panel"
import { ListSkeleton } from "@/components/shared/skeletons"
import { Tag, ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useUpdateProject } from "@/features/projects/hooks"
import { isApiMode } from "@/lib/api/config"
import { integrationsApi } from "@/lib/services/api/integrations"
import { QK, useProjects } from "@/lib/store/queries"
import { invalidateQueries, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { GitHubRepo, GitHubStatus } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"

import { GitHubActivitySheet } from "./github-activity-sheet"
import { ApiOnlyNotice, IntegrationPageHeader, IQK, useGitHubRepos, useGitHubStatus } from "./integration-page"

const TOKEN_URL =
  "https://github.com/settings/personal-access-tokens/new?name=IamCandidate&description=Read+repositories+for+IamCandidate"

export function GitHubView() {
  if (!isApiMode) {
    return (
      <>
        <IntegrationPageHeader id="github" title="GitHub" description="Link repositories to projects and see recent commits and pull requests." />
        <ApiOnlyNotice name="GitHub" />
      </>
    )
  }
  return <GitHub />
}

function GitHub() {
  const { data: status, isLoading, error, refetch } = useGitHubStatus()
  const [disconnecting, setDisconnecting] = useState(false)

  const setStatus = (next: GitHubStatus) => {
    setQueryData<GitHubStatus>(IQK.github, () => next)
    invalidateQueries(QK.integrations)
  }
  const disconnect = useMutation(() => integrationsApi.github.disconnect(), {
    onSuccess: setStatus,
    success: "GitHub disconnected",
    error: "Couldn't disconnect",
  })

  return (
    <div>
      <IntegrationPageHeader
        id="github"
        title="GitHub"
        description="Link repositories to your projects, create projects from repositories, and see recent commits and pull requests."
        connected={status?.connected}
        actions={
          status?.connected ? (
            <Button variant="outline" onClick={() => setDisconnecting(true)}>
              <UnplugIcon /> Disconnect
            </Button>
          ) : undefined
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || !status ? (
        <ListSkeleton rows={4} />
      ) : status.connected ? (
        <RepoList status={status} />
      ) : (
        <ConnectForm onConnected={setStatus} />
      )}
      <ConfirmDialog
        open={disconnecting}
        onOpenChange={setDisconnecting}
        title="Disconnect GitHub?"
        description="IamCandidate forgets your token. Projects keep their repository links. Delete the token on GitHub too if you no longer need it."
        confirmLabel="Disconnect"
        onConfirm={() => disconnect.mutate()}
      />
    </div>
  )
}

function ConnectForm({ onConnected }: { onConnected: (s: GitHubStatus) => void }) {
  const [token, setToken] = useState("")
  const connect = useMutation((value: string) => integrationsApi.github.connect(value), {
    onSuccess: onConnected,
    success: (s) => `Connected as @${s.account}`,
    error: "Couldn't connect GitHub",
  })
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <Panel title="Connect with a personal access token">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (token.trim()) void connect.mutate(token.trim())
          }}
        >
          <Field label="Token" htmlFor="gh-token" hint="Stored encrypted on the IamCandidate server. Never shown again." error={connect.error ?? undefined}>
            <Input
              id="gh-token"
              type="password"
              autoComplete="off"
              placeholder="github_pat_…"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </Field>
          <Button type="submit" disabled={!token.trim() || connect.isPending}>
            {connect.isPending ? <Loader2Icon className="animate-spin" /> : <KeyRoundIcon />} Connect GitHub
          </Button>
        </form>
      </Panel>
      <Panel title="Create a token">
        <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
          <li>
            Open{" "}
            <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">
              GitHub → Fine-grained tokens
            </a>
            .
          </li>
          <li>Choose the repositories IamCandidate may see (all, or only some).</li>
          <li>
            Under Repository permissions, set <span className="text-foreground">Contents</span>,{" "}
            <span className="text-foreground">Metadata</span> and <span className="text-foreground">Pull requests</span> to Read-only.
          </li>
          <li>Generate the token and paste it here.</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">IamCandidate only reads. It never pushes code or changes your repositories.</p>
      </Panel>
    </div>
  )
}

function RepoList({ status }: { status: GitHubStatus }) {
  const { data: repos, isLoading, isFetching, error, refetch } = useGitHubRepos(true)
  const { data: projects = [] } = useProjects()
  const updateProject = useUpdateProject()
  const [query, setQuery] = useState("")
  const [activity, setActivity] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  const importRepo = useMutation((repo: string) => integrationsApi.github.importRepo(repo), {
    onSuccess: (project, repo) => {
      upsertItem(QK.projects, project)
      setQueryData<GitHubRepo[]>(IQK.githubRepos, (list) =>
        list.map((r) => (r.fullName === repo ? { ...r, projectId: project.id } : r)),
      )
    },
    success: (project) => `Project “${project.name}” created`,
    error: "Couldn't create the project",
    invalidates: [QK.projects],
  })

  const link = async (repo: GitHubRepo, projectId: string) => {
    const result = await updateProject.mutate(projectId, { repository: repo.url })
    if (result) {
      setQueryData<GitHubRepo[]>(IQK.githubRepos, (list) =>
        list.map((r) => (r.fullName === repo.fullName ? { ...r, projectId } : r.projectId === projectId ? { ...r, projectId: undefined } : r)),
      )
    }
  }

  const unlinkedProjects = projects.filter((p) => !p.repository)
  const list = (repos ?? []).filter((r) => matchesQuery(query, r.fullName, r.description, r.language ?? "", ...r.topics))

  return (
    <Panel
      title={`Repositories for @${status.account}`}
      description="Most recently pushed first."
      action={
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Filter repositories…" />
          <Button variant="outline" size="icon" aria-label="Refresh" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          </Button>
        </div>
      }
      bodyClassName="p-0"
    >
      {error ? (
        <div className="p-4">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      ) : isLoading ? (
        <div className="p-4">
          <ListSkeleton rows={5} />
        </div>
      ) : list.length === 0 ? (
        <EmptyState compact icon={GitBranchIcon} title={query ? "No matching repositories" : "No repositories"} description={query ? undefined : "Your token can't see any repositories. Give it access to some on GitHub."} />
      ) : (
        <ul className="divide-y">
          {list.map((repo) => {
            const project = projects.find((p) => p.id === repo.projectId)
            return (
              <li key={repo.fullName} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={repo.url} target="_blank" rel="noreferrer" className="truncate font-medium hover:underline">
                      {repo.fullName}
                    </a>
                    {repo.private && (
                      <ToneBadge tone="neutral">
                        <LockIcon className="size-3" /> Private
                      </ToneBadge>
                    )}
                    {repo.archived && <ToneBadge tone="amber">Archived</ToneBadge>}
                    {repo.fork && <ToneBadge tone="neutral">Fork</ToneBadge>}
                  </div>
                  {repo.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{repo.description}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {repo.language && <Tag>{repo.language}</Tag>}
                    <span className="inline-flex items-center gap-1">
                      <StarIcon className="size-3" /> {repo.stars}
                    </span>
                    {repo.pushedAt && <span>Pushed {timeAgo(repo.pushedAt)}</span>}
                    {project && (
                      <Link href="/workspace/projects" className="inline-flex items-center gap-1 text-foreground hover:underline">
                        <LinkIcon className="size-3" /> {project.name}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActivity(repo.fullName)}>
                    <ActivityIcon /> Activity
                  </Button>
                  {!project && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button size="sm" disabled={importing === repo.fullName} />}>
                        {importing === repo.fullName ? <Loader2Icon className="animate-spin" /> : <FolderPlusIcon />} Add to projects
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuItem
                          onClick={async () => {
                            setImporting(repo.fullName)
                            await importRepo.mutate(repo.fullName)
                            setImporting(null)
                          }}
                        >
                          <FolderPlusIcon /> Create a new project
                        </DropdownMenuItem>
                        {unlinkedProjects.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Link to an existing project</DropdownMenuLabel>
                              {unlinkedProjects.map((p) => (
                                <DropdownMenuItem key={p.id} onClick={() => void link(repo, p.id)}>
                                  <LinkIcon /> {p.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuGroup>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`More for ${repo.fullName}`} />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<a href={repo.url} target="_blank" rel="noreferrer" />}>
                        <ExternalLinkIcon /> Open on GitHub
                      </DropdownMenuItem>
                      {repo.homepage && (
                        <DropdownMenuItem render={<a href={repo.homepage} target="_blank" rel="noreferrer" />}>
                          <ExternalLinkIcon /> Open website
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {activity && <GitHubActivitySheet repo={activity} onClose={() => setActivity(null)} />}
    </Panel>
  )
}
