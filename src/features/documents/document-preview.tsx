"use client"

import { DownloadIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { DetailList, DetailRow } from "@/components/shared/panel"
import { OptionBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { documentCategory } from "@/lib/constants"
import type { DocumentFile } from "@/lib/types"
import { formatDateTime } from "@/lib/utils/dates"
import { formatBytes } from "@/lib/utils/format"

import { FileKindIcon, fileKindLabel } from "./file-icon"

function MockPreview({ doc }: { doc: DocumentFile }) {
  if (doc.kind === "image") {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px]">
        <FileKindIcon kind="image" size="lg" />
      </div>
    )
  }
  if (doc.kind === "pdf" || doc.kind === "docx" || doc.kind === "text") {
    return (
      <div className="rounded-lg bg-muted/60 p-4">
        <div className="mx-auto aspect-[1/1.3] max-w-[260px] rounded bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="h-2.5 w-2/3 rounded bg-zinc-800" />
          <div className="mt-1.5 h-1.5 w-1/3 rounded bg-zinc-400" />
          <div className="mt-4 space-y-1.5">
            {[100, 92, 96, 70, 0, 100, 88, 94, 60, 0, 100, 90, 76].map((w, i) =>
              w === 0 ? <div key={i} className="h-2" /> : <div key={i} className="h-1.5 rounded bg-zinc-200" style={{ width: `${w}%` }} />,
            )}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted/60">
      <FileKindIcon kind={doc.kind} size="lg" />
    </div>
  )
}

export function DocumentPreviewSheet({
  doc,
  onOpenChange,
  onDownload,
  onRename,
  onStar,
  onDelete,
}: {
  doc: DocumentFile | undefined
  onOpenChange: (open: boolean) => void
  onDownload: (doc: DocumentFile) => void
  onRename: (doc: DocumentFile) => void
  onStar: (doc: DocumentFile) => void
  onDelete: (doc: DocumentFile) => void
}) {
  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {doc && (
          <>
            <SheetHeader className="border-b p-5">
              <div className="flex items-start gap-3 pr-8">
                <FileKindIcon kind={doc.kind} />
                <div className="min-w-0">
                  <SheetTitle className="text-base break-all">{doc.name}</SheetTitle>
                  <SheetDescription>
                    {fileKindLabel(doc.kind)} · {formatBytes(doc.sizeBytes)}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="space-y-5 p-5">
              <MockPreview doc={doc} />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => onDownload(doc)}>
                  <DownloadIcon /> Download
                </Button>
                <Button variant="outline" onClick={() => onStar(doc)}>
                  <StarIcon className={cn(doc.starred && "fill-amber-400 text-amber-400")} />
                  {doc.starred ? "Starred" : "Star"}
                </Button>
                <Button variant="outline" onClick={() => onRename(doc)}>
                  <PencilIcon /> Rename
                </Button>
                <Button variant="destructive" onClick={() => onDelete(doc)}>
                  <Trash2Icon /> Delete
                </Button>
              </div>
              <DetailList>
                <DetailRow label="Category">
                  <OptionBadge option={documentCategory(doc.category)} />
                </DetailRow>
                <DetailRow label="Source">{doc.source === "drive" ? "Google Drive" : "Uploaded"}</DetailRow>
                <DetailRow label="Uploaded">{formatDateTime(doc.uploadedAt)}</DetailRow>
                <DetailRow label="Modified">{formatDateTime(doc.updatedAt)}</DetailRow>
                {doc.description && <DetailRow label="Description">{doc.description}</DetailRow>}
              </DetailList>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
