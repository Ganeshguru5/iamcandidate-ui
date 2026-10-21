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
import { useSession } from "@/lib/store/session"

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

  // While hydrating (`pending`) we still render the shell so routes prerender
  // into the static shell; only a confirmed signed-out state is gated.
  if (session === null) {
    return <ShellSkeleton />
  }

  return (
    <AppDialogsProvider>
      <CommandPaletteProvider>
        <div className="flex min-h-dvh w-full">
          <aside
            className={cn(
              "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex",
              collapsed ? "w-[60px]" : "w-60",
            )}
          >
            <div className={cn("flex h-14 items-center border-b px-3.5", collapsed && "justify-center px-0")}>
              <Brand collapsed={collapsed} />
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              <SidebarNav collapsed={collapsed} />
            </div>
            <div className={cn("border-t p-2", collapsed && "flex justify-center")}>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className={cn("text-muted-foreground", !collapsed && "w-full justify-start")}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
                {!collapsed && "Collapse"}
              </Button>
            </div>
          </aside>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
              <div className="flex h-14 items-center border-b px-4">
                <Brand />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
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
    <div className="flex min-h-dvh w-full">
      <aside className="hidden w-60 shrink-0 flex-col gap-3 border-r bg-sidebar p-4 lg:flex">
        <Skeleton className="h-7 w-32" />
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </aside>
      <div className="flex-1">
        <div className="h-14 border-b" />
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <PageSkeleton />
        </div>
      </div>
    </div>
  )
}
