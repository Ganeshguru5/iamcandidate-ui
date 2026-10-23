"use client"

import { Suspense, ViewTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import { navDirection } from "@/components/transitions/page-transition"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsAdmin, useIsAdminRole } from "@/lib/store/session"

import { isActive, NAV_GROUPS, visibleNavItems } from "./nav-config"

interface SidebarNavProps {
  collapsed?: boolean
  onNavigate?: () => void
  /** Glide the current-page pill between items (one sidebar per page only: the name must be unique). */
  pillMorph?: boolean
}

/** Active state depends on the URL, so it renders inside Suspense (static shell first). */
export function SidebarNav(props: SidebarNavProps) {
  return (
    <Suspense fallback={<NavList {...props} pathname="" />}>
      <SidebarNavWithPath {...props} />
    </Suspense>
  )
}

function SidebarNavWithPath(props: SidebarNavProps) {
  const pathname = usePathname()
  return <NavList {...props} pathname={pathname} />
}

function NavList({
  collapsed = false,
  onNavigate,
  pillMorph = false,
  pathname,
}: SidebarNavProps & { pathname: string }) {
  const isAdmin = useIsAdmin()
  const isAdminRole = useIsAdminRole()
  const admin = { api: isAdmin, any: isAdminRole }
  // Sidebar order gives navigation a direction (down or up the list).
  const order = NAV_GROUPS.flatMap((group) => visibleNavItems(group.items, admin)).map((item) => item.href)
  const currentIndex = order.findIndex((href) => isActive(pathname, href))

  return (
    <nav className="flex flex-col gap-4 px-2.5 pb-3" aria-label="Main">
      {NAV_GROUPS.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-px">
          {group.label &&
            (collapsed ? (
              <div className="mx-auto mb-1 h-px w-5 bg-foreground/10" />
            ) : (
              <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
                {group.label}
              </p>
            ))}
          {visibleNavItems(group.items, admin).map((item) => {
            const active = isActive(pathname, item.href)
            const pill = <span aria-hidden className="absolute inset-0 rounded-lg bg-sidebar-accent" />
            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                transitionTypes={navDirection(currentIndex, order.indexOf(item.href))}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-[color,background-color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring active:scale-[0.98]",
                  active
                    ? "font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/85 hover:bg-foreground/[0.04] hover:text-foreground dark:hover:bg-white/[0.05]",
                  collapsed && "justify-center px-0",
                )}
              >
                {active &&
                  (pillMorph ? (
                    // One named pill: React morphs it from the old item to the new one.
                    <ViewTransition name="sidebar-pill" share="pill-morph" default="none">
                      {pill}
                    </ViewTransition>
                  ) : (
                    pill
                  ))}
                <item.icon
                  className={cn(
                    "relative size-4 shrink-0 transition-colors",
                    active ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {!collapsed && <span className="relative truncate">{item.title}</span>}
              </Link>
            )
            if (!collapsed) return link
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
