"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  FolderIcon,
  FolderInputIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  RefreshCwIcon,
} from "lucide-react"
import { toast } from "sonner"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileKindIcon } from "@/features/documents/file-icon"
import { useImportFromDrive } from "@/features/documents/hooks"
import { isApiMode } from "@/lib/api/config"
import { useDocuments, useDriveFolder, useIntegrations } from "@/lib/store/queries"
import type { DriveItem, Integration } from "@/lib/types"
import { formatDate, timeAgo } from "@/lib/utils/dates"
import { formatBytes } from "@/lib/utils/format"

import { ConnectDialog } from "./connect-dialog"
import { useSyncIntegration } from "./hooks"
import { DriveGlyph } from "./integration-logos"
import { StatusBadge } from "./integrations-view"

export function DriveBrowser() {
  const { data: integrations } = useIntegrations()
  const drive = integrations?.find((i) => i.id === "google_drive")
  const [path, setPath] = useState<DriveItem[]>([])
  const folderId = path.at(-1)?.id ?? null
  // Folders load one at a time (a real Drive is too large to fetch whole).
  const { data: items, isLoading, isFetching, error, refetch } = useDriveFolder(
    folderId,
    drive?.status === "connected",
  )
  const { data: documents = [] } = useDocuments()
  const sync = useSyncIntegration()
  const importFile = useImportFromDrive()
  const [connecting, setConnecting] = useState<Integration | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)

  const children = [...(items ?? [])].sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1,
  )
  const fromDrive = documents.filter((d) => d.source === "drive")
  const importedIds = new Set(fromDrive.map((d) => d.driveFileId).filter(Boolean))
  const importedNames = new Set(fromDrive.map((d) => d.name))
  const isImported = (item: DriveItem) => importedIds.has(item.id) || importedNames.has(item.name)

  const doImport = async (item: DriveItem) => {
    setImportingId(item.id)
    await importFile.mutate(item.id)
    setImportingId(null)
  }

  const connected = drive?.status === "connected"

  return (
    <div className="space-y-6">
      <div>
        <Link href="/integrations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Integrations
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border bg-background">
              <DriveGlyph className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">Google Drive</h1>
                {drive && <StatusBadge integration={drive} />}
              </div>
              <p className="text-sm text-muted-foreground">
                {connected
                  ? isApiMode
                    ? `${drive?.account} · read-only access`
                    : `${drive?.account} · synced ${drive?.lastSyncedAt ? timeAgo(drive.lastSyncedAt) : "never"}`
                  : "Not connected"}
              </p>
            </div>
          </div>
          {connected && (
            <div className="flex gap-2">
              {isApiMode ? (
                <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
                  {isFetching ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
                  Refresh
                </Button>
              ) : (
                <Button variant="outline" disabled={sync.isPending} onClick={() => void sync.mutate("google_drive")}>
                  {sync.isPending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
                  {sync.isPending ? "Syncing…" : "Sync now"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  isApiMode
                    ? window.open(
                        `https://drive.google.com/drive/${folderId ? `folders/${encodeURIComponent(folderId)}` : "my-drive"}`,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    : toast.info("Opening Google Drive", { description: "Simulated — no external page is opened." })
                }
              >
                <ExternalLinkIcon /> Open Drive
              </Button>
            </div>
          )}
        </div>
      </div>

      {!connected && drive ? (
        <EmptyState
          icon={FolderIcon}
          title="Google Drive is disconnected"
          description="Connect your account to browse and import files."
          action={<Button onClick={() => setConnecting(drive)}>Connect Google Drive</Button>}
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <nav aria-label="Drive path" className="flex flex-wrap items-center gap-1 border-b px-4 py-3 text-sm">
            <button type="button" onClick={() => setPath([])} className={path.length ? "text-muted-foreground hover:text-foreground" : "font-medium"}>
              My Drive
            </button>
            {path.map((folder, index) => (
              <span key={folder.id} className="flex items-center gap-1">
                <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setPath(path.slice(0, index + 1))}
                  className={index === path.length - 1 ? "font-medium" : "text-muted-foreground hover:text-foreground"}
                >
                  {folder.name}
                </button>
              </span>
            ))}
            {isFetching && !isLoading && <Loader2Icon className="ml-auto size-4 animate-spin text-muted-foreground" />}
          </nav>
          {error ? (
            <div className="p-4"><ErrorState message={error} onRetry={refetch} /></div>
          ) : isLoading ? (
            <ListSkeleton rows={5} className="rounded-none border-0" />
          ) : children.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">This folder is empty.</p>
          ) : (
            <ul className="divide-y">
              {children.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  {item.type === "folder" ? (
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setPath([...path, item])}>
                      <span className="flex size-7 items-center justify-center rounded-lg bg-muted">
                        <FolderIcon className="size-3.5 fill-muted-foreground/30 text-muted-foreground" />
                      </span>
                      <span className="truncate text-sm font-medium hover:underline">{item.name}</span>
                    </button>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <FileKindIcon kind={item.kind ?? "pdf"} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{item.name}</span>
                        <span className="block text-xs text-muted-foreground sm:hidden">{formatBytes(item.sizeBytes ?? 0)}</span>
                      </span>
                    </div>
                  )}
                  <span className="hidden w-20 text-right text-xs text-muted-foreground tabular-nums sm:block">
                    {item.type === "file" ? formatBytes(item.sizeBytes ?? 0) : "—"}
                  </span>
                  <span className="hidden w-24 text-right text-xs text-muted-foreground md:block">{formatDate(item.modifiedAt)}</span>
                  {item.type === "file" ? (
                    isImported(item) ? (
                      <span className="w-28 text-right text-xs text-muted-foreground">In Documents</span>
                    ) : (
                      <Button variant="outline" size="xs" className="w-28" disabled={importingId === item.id} onClick={() => void doImport(item)}>
                        {importingId === item.id ? <Loader2Icon className="animate-spin" /> : <FolderInputIcon />}
                        {importingId === item.id ? "Importing…" : "Add to Docs"}
                      </Button>
                    )
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="ml-auto" aria-label="Folder actions" />}>
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => setPath([...path, item])}>Open</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {connecting && <ConnectDialog integration={connecting} onOpenChange={(open) => !open && setConnecting(null)} />}
    </div>
  )
}
