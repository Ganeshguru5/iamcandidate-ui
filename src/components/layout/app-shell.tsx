"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { EyeIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"
import { cn } from "cn"

import { CommandPaletteProvider } from "@/components/navigation/command-palette"
import { MobileTabBar } from "@/components/navigation/mobile-tab-bar"
import { SidebarNav } from "@/components/navigation/sidebar-nav"
import { PageSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RequestAccessButton } from "@/features/auth/request-access"
import { useLocalValue } from "@/lib/store/local-store"
import { refreshSessionIfStale, SESSION_PENDING, useIsReadOnly, useSession } from "@/lib/store/session"

import { AppDialogsProvider } from "./app-dialogs"
import { Brand } from "./brand"
import { Topbar } from "./topbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useSession()
  const [collapsed, setCollapsed] = useLocalValue<boolean>("pos:sidebar-collapsed", false)

  useEffect(() => {
    if (session === null) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
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

          {/* Bottom padding: the phone tab bar, or the home indicator. */}
          <div className="flex min-w-0 flex-1 flex-col bg-background pb-[max(var(--bottom-nav),env(safe-area-inset-bottom))] lg:ml-2.5 lg:border-l">
            <Topbar />
            <ReadOnlyNotice />
            <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </main>
          </div>
        </div>
        <MobileTabBar />
      </CommandPaletteProvider>
    </AppDialogsProvider>
  )
}

/** Shown to the demo account: it can browse everything, but the API rejects changes. */
function ReadOnlyNotice() {
  const readOnly = useIsReadOnly()
  if (!readOnly) return null
  return (
    <div role="status" className="border-b bg-brand-soft px-4 py-2 text-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex min-w-0 flex-1 items-start gap-2">
          <EyeIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>
            <span className="font-medium">Demo account · read-only.</span>{" "}
            <span className="text-muted-foreground">
              You can look around, but changes won&apos;t be saved. Want your own workspace?
            </span>
          </span>
        </p>
        <RequestAccessButton size="sm" className="rounded-full bg-brand px-3.5 text-brand-foreground hover:bg-brand/90" />
      </div>
    </div>
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
