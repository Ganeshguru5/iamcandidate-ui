"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import {
  BriefcaseBusinessIcon,
  CheckSquareIcon,
  FolderKanbanIcon,
  MenuIcon,
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

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const palette = useCommandPalette()
  const { openDialog } = useAppDialogs()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:px-5">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <MenuIcon />
      </Button>

      <Suspense fallback={<div className="hidden md:block" />}>
        <Breadcrumb />
      </Suspense>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => palette.open("search")}
          className="flex h-8 items-center gap-2 rounded-lg border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:w-64"
        >
          <SearchIcon className="size-4" />
          <span className="hidden sm:inline">Search everything…</span>
          <kbd className="ml-auto hidden rounded border bg-background px-1.5 font-sans text-[10px] font-medium sm:inline">
            Ctrl K
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

function Breadcrumb() {
  const pathname = usePathname()
  const current = findNavItem(pathname)
  const group = NAV_GROUPS.find((g) => current && g.items.includes(current))
  return (
    <div className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      {group?.label && (
        <>
          <span className="text-muted-foreground">{group.label}</span>
          <span className="text-muted-foreground/50">/</span>
        </>
      )}
      <span className="truncate font-medium">{current?.title ?? "knot"}</span>
    </div>
  )
}
