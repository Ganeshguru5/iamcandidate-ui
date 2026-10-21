"use client"

import { useRef, useState } from "react"
import { CheckCircle2Icon, Loader2Icon, UploadCloudIcon } from "lucide-react"
import { cn } from "cn"

import { Field, SimpleSelect } from "@/components/shared/form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { isApiMode } from "@/lib/api/config"
import { DOCUMENT_CATEGORIES } from "@/lib/constants"
import type { DocumentCategory, DocumentFile } from "@/lib/types"
import { formatBytes } from "@/lib/utils/format"

import { FileKindIcon, kindFromName } from "./file-icon"
import { useUploadDocument } from "./hooks"

type Phase = "select" | "uploading" | "done"

interface PickedFile {
  name: string
  sizeBytes: number
  /** The real file; absent for the mock-mode sample. */
  blob?: File
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  defaultCategory = "resume",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCategory?: DocumentCategory
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<PickedFile | null>(null)
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory)
  const [phase, setPhase] = useState<Phase>("select")
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [uploaded, setUploaded] = useState<DocumentFile | null>(null)
  const upload = useUploadDocument(setProgress)

  const pick = (picked: File | undefined) => {
    if (picked) setFile({ name: picked.name, sizeBytes: picked.size, blob: picked })
  }

  const start = async () => {
    if (!file) return
    setPhase("uploading")
    setProgress(0)
    // Mock mode only uses the metadata; API mode uploads the file to S3.
    const doc = await upload.mutate(
      {
        name: file.name,
        sizeBytes: file.sizeBytes,
        kind: kindFromName(file.name),
        category,
      },
      file.blob,
    )
    if (doc) {
      setUploaded(doc)
      setPhase("done")
    } else {
      setPhase("select")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => phase !== "uploading" && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>
            {isApiMode
              ? "Files are uploaded privately to your document storage."
              : "Simulated upload — files stay on your device in this prototype."}
          </DialogDescription>
        </DialogHeader>

        {phase === "done" && uploaded ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2Icon className="size-10 text-success" />
            <div>
              <p className="font-medium">Uploaded successfully</p>
              <p className="mt-1 text-sm break-all text-muted-foreground">{uploaded.name}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              disabled={phase === "uploading"}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                pick(event.dataTransfer.files[0])
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
                dragging ? "border-brand bg-brand-soft/40" : "hover:bg-muted/50",
              )}
            >
              <UploadCloudIcon className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">Drop a file or click to browse</span>
              <span className="text-xs text-muted-foreground">PDF, DOCX, images, sheets — up to 25 MB</span>
            </button>
            <Input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(event) => pick(event.target.files?.[0])}
            />
            {!file && !isApiMode && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                onClick={() => setFile({ name: "Ganeshguru_Frontend_Resume_v4.pdf", sizeBytes: 188_200 })}
              >
                Use a sample file instead
              </button>
            )}

            {file && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <FileKindIcon kind={kindFromName(file.name)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {phase === "uploading" ? `Uploading… ${progress}%` : formatBytes(file.sizeBytes)}
                  </p>
                  {phase === "uploading" && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand transition-[width] duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <Field label="Category">
              <SimpleSelect
                value={category}
                onValueChange={(value) => setCategory(value as DocumentCategory)}
                options={DOCUMENT_CATEGORIES}
              />
            </Field>
          </div>
        )}

        <DialogFooter>
          {phase === "done" ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setUploaded(null)
                  setPhase("select")
                }}
              >
                Upload another
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" disabled={phase === "uploading"} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!file || phase === "uploading"} onClick={start}>
                {phase === "uploading" ? <Loader2Icon className="animate-spin" /> : <UploadCloudIcon />}
                {phase === "uploading" ? "Uploading…" : "Upload"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
