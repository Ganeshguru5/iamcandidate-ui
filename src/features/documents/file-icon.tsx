import {
  FileArchiveIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileTypeIcon,
} from "lucide-react"
import { cn } from "cn"

import type { FileKind } from "@/lib/types"

const KIND_STYLES: Record<FileKind, { icon: typeof FileIcon; className: string; label: string }> = {
  pdf: { icon: FileTextIcon, className: "text-red-600 bg-red-500/10 dark:text-red-400", label: "PDF" },
  docx: { icon: FileTypeIcon, className: "text-blue-600 bg-blue-500/10 dark:text-blue-400", label: "DOCX" },
  image: { icon: FileImageIcon, className: "text-violet-600 bg-violet-500/10 dark:text-violet-400", label: "Image" },
  sheet: { icon: FileSpreadsheetIcon, className: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400", label: "Sheet" },
  zip: { icon: FileArchiveIcon, className: "text-amber-600 bg-amber-500/10 dark:text-amber-400", label: "Archive" },
  text: { icon: FileIcon, className: "text-muted-foreground bg-muted", label: "Text" },
}

export function fileKindLabel(kind: FileKind) {
  return KIND_STYLES[kind].label
}

export function kindFromName(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "pdf"
  if (["doc", "docx", "rtf", "odt"].includes(ext)) return "docx"
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image"
  if (["xls", "xlsx", "csv", "numbers"].includes(ext)) return "sheet"
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "zip"
  return "text"
}

export function FileKindIcon({
  kind,
  className,
  size = "md",
}: {
  kind: FileKind
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const { icon: Icon, className: tone } = KIND_STYLES[kind]
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        tone,
        size === "sm" && "size-7 [&_svg]:size-3.5",
        size === "md" && "size-9 [&_svg]:size-4",
        size === "lg" && "size-14 rounded-xl [&_svg]:size-6",
        className,
      )}
    >
      <Icon />
    </span>
  )
}
