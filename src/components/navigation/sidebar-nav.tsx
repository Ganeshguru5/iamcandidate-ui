"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsAdmin } from "@/lib/store/session"

import { isActive, NAV_GROUPS, visibleNavItems } from "./nav-config"

interface SidebarNavProps {
  collapsed?: boolean
  onNavigate?: () => void
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
  pathname,
}: SidebarNavProps & { pathname: string }) {
  const isAdmin = useIsAdmin()

  return (
    <nav className="flex flex-col gap-5 px-2.5 py-3" aria-label="Main">
      {NAV_GROUPS.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-0.5">
          {group.label &&
            (collapsed ? (
              <div className="mx-auto mb-1 h-px w-5 bg-sidebar-border" />
            ) : (
              <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                {group.label}
              </p>
            ))}
          {visibleNavItems(group.items, isAdmin).map((item) => {
            const active = isActive(pathname, item.href)
            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-brand" aria-hidden />
                )}
                <item.icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {!collapsed && <span className="truncate">{item.title}</span>}
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
