"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  FolderIcon,
  FolderOpenIcon,
  LayoutGridIcon,
  ListIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
  UploadIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field, SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { OptionBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DOCUMENT_CATEGORIES, documentCategory } from "@/lib/constants"
import { documentService } from "@/lib/services"
import { useLocalValue } from "@/lib/store/local-store"
import { useDocuments } from "@/lib/store/queries"
import type { DocumentCategory, DocumentFile } from "@/lib/types"
import { formatDate } from "@/lib/utils/dates"
import { formatBytes, matchesQuery } from "@/lib/utils/format"

import { DocumentPreviewSheet } from "./document-preview"
import { FileKindIcon } from "./file-icon"
import { useDeleteDocument, useRenameDocument, useToggleDocumentStar } from "./hooks"
import { UploadDocumentDialog } from "./upload-document-dialog"

type Folder = "all" | "starred" | "recent" | DocumentCategory
type SortKey = "recent" | "name" | "size"

export function DocumentsView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const previewId = params.get("file")

  const { data: documents, isLoading, error, refetch } = useDocuments()
  const toggleStar = useToggleDocumentStar()
  const rename = useRenameDocument()
  const remove = useDeleteDocument()

  const [folder, setFolder] = useState<Folder>("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("recent")
  const [view, setView] = useLocalValue<"grid" | "list">("pos:documents-view", "grid")
  const [uploading, setUploading] = useState(false)
  const [renaming, setRenaming] = useState<DocumentFile | null>(null)
  const [newName, setNewName] = useState("")
  const [deleting, setDeleting] = useState<DocumentFile | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const all = useMemo(() => documents ?? [], [documents])
  const recentCutoff = useMemo(() => {
    const sorted = [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return new Set(sorted.slice(0, 6).map((d) => d.id))
  }, [all])

  const folders: Array<{ value: Folder; label: string; icon: LucideIcon; count: number }> = [
    { value: "all", label: "All files", icon: FolderOpenIcon, count: all.length },
    { value: "starred", label: "Starred", icon: StarIcon, count: all.filter((d) => d.starred).length },
    { value: "recent", label: "Recent", icon: ClockIcon, count: recentCutoff.size },
    ...DOCUMENT_CATEGORIES.map((c) => ({
      value: c.value as Folder,
      label: c.label,
      icon: FolderIcon,
      count: all.filter((d) => d.category === c.value).length,
    })),
  ]

  const visible = all
    .filter((d) => {
      if (folder === "starred" && !d.starred) return false
      if (folder === "recent" && !recentCutoff.has(d.id)) return false
      if (folder !== "all" && folder !== "starred" && folder !== "recent" && d.category !== folder) return false
      return matchesQuery(query, d.name, d.description)
    })
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "size" ? b.sizeBytes - a.sizeBytes : b.updatedAt.localeCompare(a.updatedAt),
    )

  const preview = all.find((d) => d.id === previewId)
  const setPreview = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set("file", id)
    else next.delete("file")
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }

  const download = async (doc: DocumentFile) => {
    setDownloadingId(doc.id)
    const id = toast.loading(`Downloading ${doc.name}…`)
    try {
      const url = await documentService.getDownloadUrl(doc.id)
      if (url) {
        // Short-lived presigned URL; the browser downloads straight from storage.
        window.location.assign(url)
        toast.success("Download started", { id, description: doc.name })
      } else {
        toast.success("Downloaded", { id, description: `${doc.name} (simulated — no file is written)` })
      }
    } catch (error) {
      toast.error("Download failed", {
        id,
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const startRename = (doc: DocumentFile) => {
    setRenaming(doc)
    setNewName(doc.name)
  }

  const currentFolder = folders.find((f) => f.value === folder)

  const menu = (doc: DocumentFile) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${doc.name}`} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setPreview(doc.id)}>
          <EyeIcon /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void download(doc)}>
          <DownloadIcon /> Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => startRename(doc)}>
          <PencilIcon /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void toggleStar.mutate(doc.id)}>
          <StarIcon /> {doc.starred ? "Unstar" : "Star"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(doc)}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const starButton = (doc: DocumentFile) => (
    <button
      type="button"
      onClick={() => void toggleStar.mutate(doc.id)}
      aria-label={doc.starred ? `Unstar ${doc.name}` : `Star ${doc.name}`}
      aria-pressed={doc.starred}
      className="rounded p-1 text-muted-foreground transition-colors hover:text-amber-500"
    >
      <StarIcon className={cn("size-4", doc.starred && "fill-amber-400 text-amber-400")} />
    </button>
  )

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Resumes, certificates, letters and project files in one place."
        actions={
          <Button onClick={() => setUploading(true)}>
            <UploadIcon /> Upload
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Folders" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {folders.map((f, index) => (
            <div key={f.value} className="contents">
              {index === 3 && <p className="hidden px-2 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase lg:block">Folders</p>}
              <button
                type="button"
                onClick={() => setFolder(f.value)}
                aria-current={folder === f.value ? "true" : undefined}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-sm whitespace-nowrap transition-colors",
                  folder === f.value ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <f.icon className={cn("size-4", f.value === "starred" && folder === f.value && "fill-amber-400 text-amber-400")} />
                <span className="flex-1 text-left">{f.label}</span>
                <span className="text-xs tabular-nums opacity-70">{f.count}</span>
              </button>
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground sm:mr-auto">
              Documents <span className="text-muted-foreground/60">/</span>{" "}
              <span className="font-medium text-foreground">{currentFolder?.label}</span>
            </p>
            <SearchInput value={query} onChange={setQuery} placeholder="Search files…" className="sm:w-56" />
            <div className="flex gap-2">
              <SimpleSelect
                value={sort}
                onValueChange={(v) => setSort(v as SortKey)}
                options={[
                  { value: "recent", label: "Last modified" },
                  { value: "name", label: "Name" },
                  { value: "size", label: "Size" },
                ]}
                className="flex-1 sm:w-36"
              />
              <div className="inline-flex rounded-lg border p-0.5">
                {(["grid", "list"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={`${v} view`}
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={cn("flex size-7 items-center justify-center rounded-md", view === v ? "bg-muted" : "text-muted-foreground hover:text-foreground")}
                  >
                    {v === "grid" ? <LayoutGridIcon className="size-4" /> : <ListIcon className="size-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : isLoading ? (
            <CardGridSkeleton count={8} className="sm:grid-cols-2 xl:grid-cols-4" />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={FolderOpenIcon}
              title={query ? "No files match your search" : folder === "starred" ? "No starred files" : "This folder is empty"}
              description={query ? undefined : "Upload a document to get started."}
              action={
                !query && (
                  <Button variant="outline" onClick={() => setUploading(true)}>
                    <UploadIcon /> Upload
                  </Button>
                )
              }
            />
          ) : view === "grid" ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((doc) => (
                <li key={doc.id} className="group relative flex flex-col rounded-xl border bg-card transition-shadow hover:shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPreview(doc.id)}
                    className="flex h-24 items-center justify-center rounded-t-xl border-b bg-muted/40"
                    aria-label={`Preview ${doc.name}`}
                  >
                    <FileKindIcon kind={doc.kind} size="lg" />
                  </button>
                  <div className="flex items-start gap-1 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={doc.name}>{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.sizeBytes)} · {formatDate(doc.updatedAt)}
                      </p>
                    </div>
                    {downloadingId === doc.id ? <Loader2Icon className="m-1 size-4 animate-spin text-muted-foreground" /> : menu(doc)}
                  </div>
                  <div className="absolute top-1.5 right-1.5">{starButton(doc)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8 pl-3" />
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Size</TableHead>
                    <TableHead className="hidden md:table-cell">Modified</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="pl-3">{starButton(doc)}</TableCell>
                      <TableCell className="max-w-0">
                        <button type="button" className="flex w-full min-w-0 items-center gap-3 text-left" onClick={() => setPreview(doc.id)}>
                          <FileKindIcon kind={doc.kind} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:underline">{doc.name}</span>
                            <span className="block text-xs text-muted-foreground md:hidden">
                              {formatBytes(doc.sizeBytes)} · {formatDate(doc.updatedAt)}
                            </span>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <OptionBadge option={documentCategory(doc.category)} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">{formatBytes(doc.sizeBytes)}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(doc.updatedAt)}</TableCell>
                      <TableCell>{menu(doc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewSheet
        doc={preview}
        onOpenChange={(open) => !open && setPreview(null)}
        onDownload={(doc) => void download(doc)}
        onRename={startRename}
        onStar={(doc) => void toggleStar.mutate(doc.id)}
        onDelete={setDeleting}
      />

      {uploading && (
        <UploadDocumentDialog
          open
          onOpenChange={setUploading}
          defaultCategory={DOCUMENT_CATEGORIES.some((c) => c.value === folder) ? (folder as DocumentCategory) : "resume"}
        />
      )}

      <Dialog open={!!renaming} onOpenChange={(open) => !open && !rename.isPending && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <form
            className="grid grid-cols-1 gap-4"
            onSubmit={async (event) => {
              event.preventDefault()
              if (!renaming || !newName.trim()) return
              const result = await rename.mutate(renaming.id, newName.trim())
              if (result) setRenaming(null)
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename file</DialogTitle>
            </DialogHeader>
            <Field label="File name" htmlFor="rename">
              <Input id="rename" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(null)} disabled={rename.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={rename.isPending || !newName.trim() || newName === renaming?.name}>
                {rename.isPending && <Loader2Icon className="animate-spin" />} Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete file?"
        description={deleting ? `"${deleting.name}" will be permanently removed.` : undefined}
        onConfirm={async () => {
          if (!deleting) return
          if (deleting.id === previewId) setPreview(null)
          await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
