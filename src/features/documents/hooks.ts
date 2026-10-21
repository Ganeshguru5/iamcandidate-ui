"use client"

import { documentService, driveService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { removeItem, setQueryData, upsertItem, useMutation } from "@/lib/store/query"
import type { DocumentFile, DocumentInput, ID } from "@/lib/types"

export function useUploadDocument(onProgress: (percent: number) => void) {
  return useMutation(
    (input: DocumentInput, file?: Blob) => documentService.uploadDocument(input, onProgress, file),
    {
      onSuccess: (doc) => upsertItem(QK.documents, doc),
      error: "Upload failed",
    },
  )
}

export function useRenameDocument() {
  return useMutation((id: ID, name: string) => documentService.renameDocument(id, name), {
    onSuccess: (doc) => upsertItem(QK.documents, doc),
    success: "Document renamed",
    error: "Couldn't rename document",
  })
}

export function useToggleDocumentStar() {
  return useMutation((id: ID) => documentService.toggleStar(id), {
    onMutate: (id) =>
      setQueryData<DocumentFile[]>(QK.documents, (list) =>
        list.map((d) => (d.id === id ? { ...d, starred: !d.starred } : d)),
      ),
    onSuccess: (doc) => upsertItem(QK.documents, doc),
  })
}

export function useDeleteDocument() {
  return useMutation((id: ID) => documentService.deleteDocument(id), {
    onSuccess: (_, id) => removeItem(QK.documents, id),
    success: "Document deleted",
    error: "Couldn't delete document",
  })
}

export function useImportFromDrive() {
  return useMutation((id: ID) => driveService.importToDocuments(id), {
    onSuccess: (doc) => upsertItem(QK.documents, doc),
    success: (doc) => `${doc.name} added to Documents`,
    error: "Import failed",
  })
}
