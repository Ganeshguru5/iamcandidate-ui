import { apiClient, uploadToPresignedUrl } from "@/lib/api/client"
import type { DocumentFile, DocumentInput, DriveItem, ID } from "@/lib/types"

import type { DocumentService, DriveService } from "../contracts"

const enc = encodeURIComponent

interface UploadTicket {
  documentId: string
  uploadKey: string
  uploadUrl: string
  headers: Record<string, string>
}

export class ApiDocumentService implements DocumentService {
  getDocuments(): Promise<DocumentFile[]> {
    return apiClient.get("/documents")
  }

  /**
   * Presigned upload: (1) ask the API for a short-lived S3 URL, (2) PUT the
   * file straight to S3 — it never passes through Lambda — then (3) save the
   * metadata, which the API verifies against the stored object.
   */
  async uploadDocument(
    input: DocumentInput,
    onProgress?: (percent: number) => void,
    file?: Blob,
  ): Promise<DocumentFile> {
    if (!file) throw new Error("Choose a file to upload.")
    const ticket = await apiClient.post<UploadTicket>("/documents/upload-url", {
      fileName: input.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    })
    await uploadToPresignedUrl(ticket.uploadUrl, file, ticket.headers, (percent) =>
      // Leave the last few percent for the metadata request.
      onProgress?.(Math.min(95, percent)),
    )
    const doc = await apiClient.post<DocumentFile>("/documents", { ...input, uploadKey: ticket.uploadKey })
    onProgress?.(100)
    return doc
  }

  renameDocument(id: ID, name: string): Promise<DocumentFile> {
    return apiClient.put(`/documents/${enc(id)}`, { name })
  }

  toggleStar(id: ID): Promise<DocumentFile> {
    return apiClient.post(`/documents/${enc(id)}/toggle-star`)
  }

  async getDownloadUrl(id: ID): Promise<string | null> {
    const { url } = await apiClient.get<{ url: string }>(`/documents/${enc(id)}/download-url`)
    return url
  }

  deleteDocument(id: ID): Promise<void> {
    return apiClient.delete(`/documents/${enc(id)}`)
  }
}

/** Real Google Drive (read-only) through the backend's OAuth connection. */
export class ApiDriveService implements DriveService {
  listItems(parentId: ID | null): Promise<DriveItem[]> {
    return apiClient.get("/integrations/google-drive/files", parentId ? { parentId } : undefined)
  }

  importToDocuments(id: ID): Promise<DocumentFile> {
    return apiClient.post("/integrations/google-drive/import", { fileId: id })
  }

  async getAuthUrl(): Promise<string> {
    const { url } = await apiClient.get<{ url: string }>("/integrations/google-drive/auth-url")
    return url
  }

  async completeConnect(code: string, state: string): Promise<void> {
    await apiClient.post("/integrations/google-drive/connect", { code, state })
  }
}
