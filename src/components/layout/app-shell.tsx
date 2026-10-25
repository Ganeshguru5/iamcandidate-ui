"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"
import { cn } from "cn"

import { CommandPaletteProvider } from "@/components/navigation/command-palette"
import { SidebarNav } from "@/components/navigation/sidebar-nav"
import { PageSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocalValue } from "@/lib/store/local-store"
import { refreshSessionIfStale, SESSION_PENDING, useSession } from "@/lib/store/session"

import { AppDialogsProvider } from "./app-dialogs"
import { Brand } from "./brand"
import { Topbar } from "./topbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useSession()
  const [collapsed, setCollapsed] = useLocalValue<boolean>("pos:sidebar-collapsed", false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (session === null) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [session, router])

  // Keep the session rolling: on load and whenever the tab comes back into view.
  useEffect(() => {
    if (session === null || session === SESSION_PENDING) return
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshSessionIfStale(session)
    }
    refresh()
    document.addEventListener("visibilitychange", refresh)
    return () => document.removeEventListener("visibilitychange", refresh)
  }, [session])

  // While hydrating (`pending`) we still render the shell so routes prerender
  // into the static shell; only a confirmed signed-out state is gated.
  if (session === null) {
    return <ShellSkeleton />
  }

  return (
    <AppDialogsProvider>
      <CommandPaletteProvider>
        {/* Floating sidebar card on a soft canvas; content sits beside it. */}
        <div className="px-safe flex min-h-dvh w-full bg-[var(--window)]">
          <aside
            className={cn(
              "sticky top-0 hidden h-dvh shrink-0 p-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] pr-0 pb-[calc(0.625rem+env(safe-area-inset-bottom))] transition-[width] duration-200 lg:block",
              collapsed ? "w-[76px]" : "w-64",
            )}
          >
            <div className="glass flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.16)]">
              <div className={cn("flex h-14 shrink-0 items-center px-4", collapsed && "justify-center px-0")}>
                <Brand collapsed={collapsed} />
              </div>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
                <SidebarNav collapsed={collapsed} pillMorph />
              </div>
              <div className={cn("flex items-center gap-2 border-t p-2.5", collapsed ? "justify-center" : "justify-end")}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => setCollapsed(!collapsed)}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
                </Button>
              </div>
            </div>
          </aside>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="glass w-72 gap-0 p-0 pt-safe pb-safe">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
              <div className="flex h-13 items-center px-4">
                <Brand />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="pb-safe flex min-w-0 flex-1 flex-col bg-background lg:ml-2.5 lg:border-l">
            <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
            <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </AppDialogsProvider>
  )
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh w-full bg-[var(--window)]">
      <aside className="hidden h-dvh w-64 shrink-0 p-2.5 pr-0 lg:block">
        <div className="glass flex h-full flex-col gap-3 rounded-2xl border p-4">
          <Skeleton className="h-7 w-28" />
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex-1 bg-background lg:ml-2.5 lg:border-l">
        <div className="h-13 border-b" />
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <PageSkeleton />
        </div>
      </div>
    </div>
  )
}
