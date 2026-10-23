"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  CheckSquareIcon,
  FileIcon,
  FolderKanbanIcon,
  MailIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  StickyNoteIcon,
  SunIcon,
  UploadIcon,
  UserIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react"

import { useAppDialogs, type AppDialog } from "@/components/layout/app-dialogs"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import {
  useApplications,
  useById,
  useCompanies,
  useContacts,
  useDocuments,
  useEmails,
  useNotes,
  useProjects,
  useTasks,
} from "@/lib/store/queries"
import { useIsAdmin, useIsAdminRole } from "@/lib/store/session"
import { useTheme } from "@/lib/store/theme"
import { applicationStatus, taskPriority } from "@/lib/constants"

import { NAV_ITEMS, visibleNavItems } from "./nav-config"

type Mode = "all" | "search"

interface PaletteContextValue {
  open: (mode?: Mode) => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

export function useCommandPalette() {
  const ctx = useContext(PaletteContext)
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  return ctx
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("all")

  const open = useCallback((next: Mode = "all") => {
    setMode(next)
    setOpen(true)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setMode("all")
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const value = useMemo(() => ({ open }), [open])

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="top-[15%] translate-y-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <DialogDescription className="sr-only">Search everything or run a command</DialogDescription>
          {isOpen && (
            <PaletteBody mode={mode} setMode={setMode} close={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </PaletteContext.Provider>
  )
}

interface ResultItem {
  id: string
  label: string
  hint?: string
  href: string
  keywords: string[]
}

const RESULT_LIMIT = 6

function PaletteBody({
  mode,
  setMode,
  close,
}: {
  mode: Mode
  setMode: (mode: Mode) => void
  close: () => void
}) {
  const router = useRouter()
  const { openDialog } = useAppDialogs()
  const { resolvedTheme, setTheme } = useTheme()
  const isAdmin = useIsAdmin()
  const isAdminRole = useIsAdminRole()
  const [search, setSearch] = useState("")

  const { data: applications = [] } = useApplications()
  const { data: companies = [] } = useCompanies()
  const { data: contacts = [] } = useContacts()
  const { data: documents = [] } = useDocuments()
  const { data: emails = [] } = useEmails()
  const { data: notes = [] } = useNotes()
  const { data: projects = [] } = useProjects()
  const { data: tasks = [] } = useTasks()
  const companyById = useById(companies)

  const showResults = mode === "search" || search.trim().length > 0

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filter = (items: ResultItem[]) =>
      items
        .filter((item) => !q || [item.label, item.hint ?? "", ...item.keywords].some((f) => f.toLowerCase().includes(q)))
        .slice(0, RESULT_LIMIT)

    const result: Array<{ heading: string; icon: LucideIcon; items: ResultItem[] }> = [
      {
        heading: "Applications",
        icon: BriefcaseBusinessIcon,
        items: filter(
          applications.map((a) => {
            const company = companyById.get(a.companyId)?.name ?? ""
            return {
              id: a.id,
              label: `${company} — ${a.role}`,
              hint: applicationStatus(a.status).label,
              href: `/career/applications/${a.id}`,
              keywords: [company, a.role, a.location, a.jobId ?? ""],
            }
          }),
        ),
      },
      {
        heading: "Documents",
        icon: FileIcon,
        items: filter(
          documents.map((d) => ({ id: d.id, label: d.name, href: `/documents?file=${d.id}`, keywords: [d.category] })),
        ),
      },
      {
        heading: "Companies",
        icon: Building2Icon,
        items: filter(
          companies.map((c) => ({
            id: c.id,
            label: c.name,
            hint: c.industry,
            href: `/career/companies/${c.id}`,
            keywords: [c.industry, c.location],
          })),
        ),
      },
      {
        heading: "Contacts",
        icon: UserIcon,
        items: filter(
          contacts.map((c) => ({
            id: c.id,
            label: c.name,
            hint: c.role,
            href: `/career/contacts?contact=${c.id}`,
            keywords: [c.email, c.role, c.companyId ? (companyById.get(c.companyId)?.name ?? "") : ""],
          })),
        ),
      },
      {
        heading: "Emails",
        icon: MailIcon,
        items: filter(
          emails.map((e) => ({
            id: e.id,
            label: e.subject,
            hint: e.folder === "sent" ? `To ${e.to[0] ?? ""}` : e.from.name,
            href: `/communication/email?folder=${e.folder}&email=${e.id}`,
            keywords: [e.from.name, e.from.email, ...e.to],
          })),
        ),
      },
      {
        heading: "Notes",
        icon: StickyNoteIcon,
        items: filter(
          notes.map((n) => ({ id: n.id, label: n.title, href: `/workspace/notes?note=${n.id}`, keywords: n.tags })),
        ),
      },
      {
        heading: "Projects",
        icon: FolderKanbanIcon,
        items: filter(
          projects.map((p) => ({ id: p.id, label: p.name, href: `/workspace/projects`, keywords: p.technologies })),
        ),
      },
      {
        heading: "Tasks",
        icon: CheckSquareIcon,
        items: filter(
          tasks.map((t) => ({
            id: t.id,
            label: t.title,
            hint: taskPriority(t.priority).label,
            href: `/workspace/tasks`,
            keywords: [t.description],
          })),
        ),
      },
    ]
    return result.filter((group) => group.items.length > 0)
  }, [search, applications, documents, companies, contacts, emails, notes, projects, tasks, companyById])

  const run = (action: () => void) => {
    close()
    action()
  }
  const create = (dialog: AppDialog) => run(() => openDialog(dialog))

  const commands: Array<{ label: string; icon: LucideIcon; action: () => void; shortcut?: string }> = [
    { label: "Create application", icon: BriefcaseBusinessIcon, action: () => create({ kind: "application" }) },
    { label: "Create contact", icon: UserPlusIcon, action: () => create({ kind: "contact" }) },
    { label: "Create task", icon: CheckSquareIcon, action: () => create({ kind: "task" }) },
    { label: "Create note", icon: StickyNoteIcon, action: () => create({ kind: "note" }) },
    { label: "Send email", icon: SendIcon, action: () => create({ kind: "email" }) },
    { label: "Upload document", icon: UploadIcon, action: () => create({ kind: "upload" }) },
    { label: "Create project", icon: FolderKanbanIcon, action: () => create({ kind: "project" }) },
    { label: "Search everything", icon: SearchIcon, action: () => setMode("search") },
    {
      label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      icon: resolvedTheme === "dark" ? SunIcon : MoonIcon,
      action: () => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark")),
    },
  ]

  const q = search.trim().toLowerCase()
  const matchingCommands = commands.filter((c) => c.label.toLowerCase().includes(q))
  const matchingNav = visibleNavItems(NAV_ITEMS, { api: isAdmin, any: isAdminRole }).filter((item) => item.title.toLowerCase().includes(q))

  return (
    <Command shouldFilter={false} className="rounded-none! p-0">
      <div className="border-b p-1.5">
        <CommandInput
          autoFocus
          value={search}
          onValueChange={setSearch}
          placeholder={mode === "search" ? "Search applications, documents, contacts, notes…" : "Type a command or search…"}
          className="h-9"
        />
      </div>
      <CommandList className="max-h-[min(60dvh,420px)] p-1">
        <CommandEmpty>No results for &ldquo;{search}&rdquo;</CommandEmpty>

        {showResults &&
          groups.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem key={item.id} value={`${group.heading}-${item.id}`} onSelect={() => run(() => router.push(item.href))}>
                  <group.icon className="text-muted-foreground" />
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="ml-auto truncate text-xs text-muted-foreground">{item.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

        {mode === "all" && (
          <>
            {showResults && groups.length > 0 && matchingCommands.length + matchingNav.length > 0 && (
              <CommandSeparator className="my-1" />
            )}
            {matchingCommands.length > 0 && (
              <CommandGroup heading="Commands">
                {matchingCommands.map((command) => (
                  <CommandItem key={command.label} value={command.label} onSelect={command.action}>
                    <command.icon className="text-muted-foreground" />
                    {command.label}
                    {command.label.startsWith("Create") && (
                      <CommandShortcut>
                        <PlusIcon className="size-3" />
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchingNav.length > 0 && (
              <CommandGroup heading="Go to">
                {matchingNav.map((item) => (
                  <CommandItem key={item.href} value={`nav-${item.href}`} onSelect={() => run(() => router.push(item.href))}>
                    <item.icon className="text-muted-foreground" />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground">
        <span>
          <kbd className="font-sans">↑↓</kbd> navigate · <kbd className="font-sans">↵</kbd> open · <kbd className="font-sans">esc</kbd> close
        </span>
        {mode === "search" && (
          <button type="button" className="hover:text-foreground" onClick={() => setMode("all")}>
            Show commands
          </button>
        )}
      </div>
    </Command>
  )
}
