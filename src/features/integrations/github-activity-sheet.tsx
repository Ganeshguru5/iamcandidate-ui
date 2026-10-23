"use client"

import { useCallback } from "react"
import Link from "next/link"
import { ExternalLinkIcon, GitCommitHorizontalIcon, GitPullRequestIcon, StarIcon } from "lucide-react"

import { ErrorState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/skeletons"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { integrationsApi } from "@/lib/services/api/integrations"
import { useQuery } from "@/lib/store/query"
import type { GitHubPullRequest } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"

const PR_TONE: Record<GitHubPullRequest["state"], "green" | "violet" | "neutral"> = {
  open: "green",
  merged: "violet",
  closed: "neutral",
}

/** Recent commits and pull requests for one repository ("owner/name"). */
export function GitHubActivitySheet({ repo, onClose }: { repo: string; onClose: () => void }) {
  const fetcher = useCallback(() => integrationsApi.github.activity(repo), [repo])
  const { data, isLoading, error, refetch } = useQuery(`integration:github:activity:${repo}`, fetcher)

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <a href={`https://github.com/${repo}`} target="_blank" rel="noreferrer" className="hover:underline">
              {repo}
            </a>
            <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
          </SheetTitle>
          <SheetDescription>
            {data ? (
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                {data.repo.language && <span>{data.repo.language}</span>}
                <span className="inline-flex items-center gap-1">
                  <StarIcon className="size-3" /> {data.repo.stars}
                </span>
                {data.repo.pushedAt && <span>Pushed {timeAgo(data.repo.pushedAt)}</span>}
                {data.repo.private && <span>Private</span>}
              </span>
            ) : (
              "Recent activity on GitHub"
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-4">
          {error && /connect github/i.test(error) ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">Connect GitHub to see commits and pull requests here.</p>
              <Button size="sm" nativeButton={false} render={<Link href="/integrations/github" />}>
                Connect GitHub
              </Button>
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : isLoading || !data ? (
            <ListSkeleton rows={6} />
          ) : (
            <>
              <section>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pull requests</h3>
                {data.pullRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pull requests yet.</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {data.pullRequests.map((pr) => (
                      <li key={pr.number}>
                        <a href={pr.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 hover:bg-muted/50">
                          <GitPullRequestIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{pr.title}</p>
                            <p className="text-xs text-muted-foreground">
                              #{pr.number} · {pr.author} · {timeAgo(pr.updatedAt)}
                            </p>
                          </div>
                          <ToneBadge tone={PR_TONE[pr.state]} className="capitalize">
                            {pr.state}
                          </ToneBadge>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Commits on {data.repo.defaultBranch}
                </h3>
                {data.commits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No commits yet.</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {data.commits.map((commit) => (
                      <li key={commit.sha}>
                        <a href={commit.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 hover:bg-muted/50">
                          <GitCommitHorizontalIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{commit.message}</p>
                            <p className="text-xs text-muted-foreground">
                              <code>{commit.sha}</code> · {commit.author}
                              {commit.date && <> · {timeAgo(commit.date)}</>}
                            </p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** "owner/name" from a GitHub repository URL, if it is one. */
export function githubRepoFromUrl(value?: string): string | undefined {
  const match = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i.exec(value?.trim() ?? "")
  return match ? `${match[1]}/${match[2]}` : undefined
}
