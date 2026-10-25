"use client"

import { useMemo } from "react"

import { useLocalValue } from "@/lib/store/local-store"
import { useIsAdmin, useIsAdminRole } from "@/lib/store/session"

import { NAV_GROUPS, visibleNavItems, type NavGroup, type NavItem } from "./nav-config"

/** The phone tab bar always shows this many tabs. */
export const TAB_COUNT = 4

export const DEFAULT_TABS = ["/dashboard", "/career/applications", "/career/chat", "/workspace/tasks"]

const STORAGE_KEY = "pos:tab-bar"

/** Nav groups/items the signed-in user may see. */
export function useVisibleNav(): { groups: NavGroup[]; items: NavItem[] } {
  const isAdmin = useIsAdmin()
  const isAdminRole = useIsAdminRole()
  return useMemo(() => {
    const admin = { api: isAdmin, any: isAdminRole }
    const groups = NAV_GROUPS.map((group) => ({ ...group, items: visibleNavItems(group.items, admin) })).filter(
      (group) => group.items.length > 0,
    )
    return { groups, items: groups.flatMap((group) => group.items) }
  }, [isAdmin, isAdminRole])
}

/**
 * The tab bar's tabs, chosen in the control centre and remembered on this
 * device. Stored hrefs that no longer exist (or aren't visible to this user)
 * are dropped and the gaps filled from the defaults, so there are always
 * exactly TAB_COUNT tabs.
 */
export function useTabBar() {
  const { items: visible } = useVisibleNav()
  const [stored, setStored] = useLocalValue<string[] | null>(STORAGE_KEY, null)

  const tabs = useMemo(() => {
    const byHref = new Map(visible.map((item) => [item.href, item]))
    const hrefs: string[] = []
    for (const href of [...(Array.isArray(stored) ? stored : []), ...DEFAULT_TABS, ...visible.map((i) => i.href)]) {
      if (hrefs.length === TAB_COUNT) break
      if (byHref.has(href) && !hrefs.includes(href)) hrefs.push(href)
    }
    return hrefs.flatMap((href) => byHref.get(href) ?? [])
  }, [stored, visible])

  return {
    tabs,
    isCustom: Array.isArray(stored),
    setTabs: (hrefs: string[]) => setStored(hrefs.slice(0, TAB_COUNT)),
    reset: () => setStored(null),
  }
}
