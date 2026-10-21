import type { DocumentFile, DocumentInput, DriveItem, ID } from "@/lib/types"
import { delay } from "@/lib/utils/delay"
import { createId } from "@/lib/utils/id"

import type { DocumentService, DriveService } from "../contracts"
import { collection, logActivity, NotFoundError, read } from "./db"

const documents = collection("documents")
const drive = collection("driveItems")

export class MockDocumentService implements DocumentService {
  async getDocuments(): Promise<DocumentFile[]> {
    await delay(400)
    return documents.all()
  }

  async uploadDocument(
    input: DocumentInput,
    onProgress?: (percent: number) => void,
  ): Promise<DocumentFile> {
    // Simulate a chunked upload so the UI can render real progress.
    for (const step of [8, 22, 41, 63, 78, 92, 100]) {
      await delay(180)
      onProgress?.(step)
    }
    const now = new Date().toISOString()
    const doc = documents.insert({
      ...input,
      id: createId("doc"),
      starred: false,
      source: "local",
      uploadedAt: now,
      updatedAt: now,
    })
    logActivity({
      type: "document_uploaded",
      title: "Document uploaded",
      description: doc.name,
      entity: { type: "document", id: doc.id },
    })
    return doc
  }

  async renameDocument(id: ID, name: string): Promise<DocumentFile> {
    await delay(400)
    return documents.patch(id, { name, updatedAt: new Date().toISOString() })
  }

  async toggleStar(id: ID): Promise<DocumentFile> {
    await delay(200)
    const existing = documents.find(id)
    if (!existing) throw new NotFoundError("Document", id)
    return documents.patch(id, { starred: !existing.starred })
  }

  async getDownloadUrl(): Promise<string | null> {
    await delay(600)
    return null // mock documents have no stored file
  }

  async deleteDocument(id: ID): Promise<void> {
    await delay(500)
    const existing = documents.find(id)
    documents.remove(id)
    if (existing) {
      logActivity({ type: "document_deleted", title: "Document deleted", description: existing.name })
    }
  }
}

export class MockDriveService implements DriveService {
  async listItems(parentId: ID | null): Promise<DriveItem[]> {
    await delay(500)
    const integration = read("integrations").find((i) => i.id === "google_drive")
    if (integration?.status !== "connected") return []
    return drive.all().filter((item) => item.parentId === parentId)
  }

  async getAuthUrl(): Promise<string> {
    throw new Error("Mock mode connects without leaving the app.")
  }

  async completeConnect(): Promise<void> {
    throw new Error("Mock mode connects without leaving the app.")
  }

  async importToDocuments(id: ID): Promise<DocumentFile> {
    await delay(800)
    const item = drive.find(id)
    if (!item || item.type !== "file") throw new NotFoundError("Drive file", id)
    const now = new Date().toISOString()
    const doc = documents.insert({
      id: createId("doc"),
      name: item.name,
      category: /resume/i.test(item.name)
        ? "resume"
        : /cert/i.test(item.name)
          ? "certificates"
          : "other",
      kind: item.kind ?? "pdf",
      sizeBytes: item.sizeBytes ?? 0,
      starred: false,
      source: "drive",
      uploadedAt: now,
      updatedAt: now,
    })
    logActivity({
      type: "document_uploaded",
      title: "Imported from Google Drive",
      description: doc.name,
      entity: { type: "document", id: doc.id },
    })
    return doc
  }
}
