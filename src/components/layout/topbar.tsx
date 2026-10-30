"use client"

import { Suspense, useSyncExternalStore, ViewTransition } from "react"
import { usePathname } from "next/navigation"
import {
  BriefcaseBusinessIcon,
  CheckSquareIcon,
  FolderKanbanIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  StickyNoteIcon,
  SunIcon,
  UploadIcon,
  UserPlusIcon,
} from "lucide-react"

import { useCommandPalette } from "@/components/navigation/command-palette"
import { findNavItem, NAV_GROUPS } from "@/components/navigation/nav-config"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/lib/store/theme"

import { useAppDialogs } from "./app-dialogs"
import { NotificationsPopover } from "./notifications"
import { UserMenu } from "./user-menu"

export function Topbar() {
  const palette = useCommandPalette()
  const { openDialog } = useAppDialogs()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    // Toolbar: translucent, page title on the left, controls on the right.
    <header className="pt-safe sticky top-0 z-30 box-content flex h-13 shrink-0 items-center gap-2 border-b border-foreground/[0.07] bg-background/75 px-3 backdrop-blur-xl backdrop-saturate-150 sm:px-5">
      <Suspense fallback={<div />}>
        <Breadcrumb />
      </Suspense>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => palette.open("search")}
          className="flex h-8 items-center gap-2 rounded-full border bg-card px-3 text-[13px] text-muted-foreground shadow-xs transition-colors hover:border-brand/40 hover:text-foreground sm:w-64"
        >
          <SearchIcon className="size-3.5" />
          <span className="hidden sm:inline">Search everything…</span>
          <kbd className="ml-auto hidden rounded-md bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline">
            <ShortcutLabel />
          </kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="sm" className="h-8 gap-1" />}>
            <PlusIcon />
            <span className="hidden sm:inline">New</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => openDialog({ kind: "application" })}>
              <BriefcaseBusinessIcon /> Application
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog({ kind: "contact" })}>
              <UserPlusIcon /> Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog({ kind: "task" })}>
              <CheckSquareIcon /> Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog({ kind: "note" })}>
              <StickyNoteIcon /> Note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog({ kind: "project" })}>
              <FolderKanbanIcon /> Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openDialog({ kind: "email" })}>
              <SendIcon /> Send email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog({ kind: "upload" })}>
              <UploadIcon /> Upload document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Button>
        <NotificationsPopover />
        <UserMenu />
      </div>
    </header>
  )
}

/** Page title, bold, with its section underneath. */
function Breadcrumb() {
  const pathname = usePathname()
  const current = findNavItem(pathname)
  const group = NAV_GROUPS.find((g) => current && g.items.includes(current))
  const title = current?.title ?? "iamcandidate"
  return (
    // Keyed by title: a new page's title swaps in with a short vertical slide.
    <ViewTransition key={title} enter="title-swap" exit="title-swap" default="none">
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[15px] font-semibold tracking-tight">{title}</span>
        {group?.label && (
          <span className="truncate text-[11px] text-muted-foreground">
            {group.label.charAt(0).toUpperCase() + group.label.slice(1).toLowerCase()}
          </span>
        )}
      </div>
    </ViewTransition>
  )
}

/** ⌘K on Apple devices, Ctrl K elsewhere (rendered after mount to avoid a hydration mismatch). */
function ShortcutLabel() {
  const isMac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  )
  return <>{isMac ? "⌘K" : "Ctrl K"}</>
}
