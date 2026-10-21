"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { ApplicationFormDialog } from "@/features/applications/application-form-dialog"
import { ContactFormDialog } from "@/features/contacts/contact-form-dialog"
import { UploadDocumentDialog } from "@/features/documents/upload-document-dialog"
import { ComposeEmailDialog, type ComposeDefaults } from "@/features/emails/compose-email-dialog"
import { NoteFormDialog } from "@/features/notes/note-form-dialog"
import { ProjectFormDialog } from "@/features/projects/project-form-dialog"
import { TaskFormDialog } from "@/features/tasks/task-form-dialog"

/**
 * App-wide "create" dialogs, reachable from the dashboard quick actions,
 * the top bar and the command palette.
 */
export type AppDialog =
  | { kind: "application" }
  | { kind: "contact" }
  | { kind: "task" }
  | { kind: "note" }
  | { kind: "project" }
  | { kind: "upload" }
  | { kind: "email"; defaults?: ComposeDefaults }

interface AppDialogsContextValue {
  openDialog: (dialog: AppDialog) => void
}

const AppDialogsContext = createContext<AppDialogsContextValue | null>(null)

export function useAppDialogs(): AppDialogsContextValue {
  const context = useContext(AppDialogsContext)
  if (!context) throw new Error("useAppDialogs must be used within AppDialogsProvider")
  return context
}

export function AppDialogsProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<AppDialog | null>(null)
  // Dialogs mount on first open (and stay mounted for their close animation),
  // so nothing form-related renders during prerender.
  const [mounted, setMounted] = useState<AppDialog["kind"] | null>(null)
  // Keeps a key per open so forms reset each time a dialog is reopened.
  const [openCount, setOpenCount] = useState(0)

  const openDialog = useCallback((next: AppDialog) => {
    setOpenCount((count) => count + 1)
    setMounted(next.kind)
    setDialog(next)
  }, [])

  const value = useMemo(() => ({ openDialog }), [openDialog])
  const close = (open: boolean) => {
    if (!open) setDialog(null)
  }
  const kind = dialog?.kind

  return (
    <AppDialogsContext.Provider value={value}>
      {children}
      {mounted === "application" && (
        <ApplicationFormDialog key={openCount} open={kind === "application"} onOpenChange={close} />
      )}
      {mounted === "contact" && (
        <ContactFormDialog key={openCount} open={kind === "contact"} onOpenChange={close} />
      )}
      {mounted === "task" && <TaskFormDialog key={openCount} open={kind === "task"} onOpenChange={close} />}
      {mounted === "note" && <NoteFormDialog key={openCount} open={kind === "note"} onOpenChange={close} />}
      {mounted === "project" && (
        <ProjectFormDialog key={openCount} open={kind === "project"} onOpenChange={close} />
      )}
      {mounted === "upload" && (
        <UploadDocumentDialog key={openCount} open={kind === "upload"} onOpenChange={close} />
      )}
      {mounted === "email" && (
        <ComposeEmailDialog
          key={openCount}
          open={kind === "email"}
          onOpenChange={close}
          defaults={dialog?.kind === "email" ? dialog.defaults : undefined}
        />
      )}
    </AppDialogsContext.Provider>
  )
}
