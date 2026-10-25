"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckIcon, MenuIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { navDirection } from "@/components/transitions/page-transition"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"

import { isActive } from "./nav-config"
import { useTabBar, useVisibleNav } from "./tab-bar"
import { TabBarEditor } from "./tab-bar-editor"

/**
 * Phone / tablet navigation (below `lg`): a floating glass bar with the four
 * tabs chosen in the control centre, and a round menu button beside it that
 * opens everything else. Active state needs the URL, so it renders inside
 * Suspense (static shell first).
 */
export function MobileTabBar() {
  return (
    <Suspense fallback={<TabBar pathname="" />}>
      <TabBarWithPath />
    </Suspense>
  )
}

function TabBarWithPath() {
  return <TabBar pathname={usePathname()} />
}

function TabBar({ pathname }: { pathname: string }) {
  const { tabs } = useTabBar()
  const [menu, setMenu] = useState<"closed" | "menu" | "edit">("closed")
  const active = tabs.findIndex((tab) => isActive(pathname, tab.href))
  // Somewhere only the menu leads to: mark the menu button instead.
  const elsewhere = active < 0 && pathname !== ""

  return (
    <>
      <div
        data-tab-bar
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden",
          // Above the menu sheet's backdrop while it's open, so the button can close it.
          menu === "closed" ? "z-40" : "z-[60]",
        )}
      >
        <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2.5">
          <nav aria-label="Tabs" className="glass-bar relative h-15 flex-1 rounded-full p-1">
            <div className="relative grid h-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
              {/* The highlight slides between tabs. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-foreground/[0.07] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.3,1.3,0.5,1)] dark:bg-white/[0.1]",
                  active < 0 && "opacity-0",
                )}
                style={{
                  width: `${100 / Math.max(tabs.length, 1)}%`,
                  transform: `translateX(${Math.max(active, 0) * 100}%)`,
                }}
              />
              {tabs.map((tab, index) => {
                const current = index === active
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={current ? "page" : undefined}
                    transitionTypes={navDirection(active, index)}
                    className={cn(
                      "relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 outline-none transition-[color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                      current ? "text-brand" : "text-foreground/75",
                    )}
                  >
                    <tab.icon className="size-[22px]" strokeWidth={current ? 2.2 : 1.8} />
                    <span className={cn("max-w-full truncate text-[10.5px] leading-tight", current ? "font-semibold" : "font-medium")}>
                      {tab.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>

          <button
            type="button"
            onClick={() => setMenu(menu === "closed" ? "menu" : "closed")}
            aria-label={menu === "closed" ? "Open menu" : "Close menu"}
            aria-expanded={menu !== "closed"}
            className="glass-bar relative flex size-15 shrink-0 items-center justify-center rounded-full text-foreground/85 outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            {menu === "closed" ? <MenuIcon className="size-6" /> : <XIcon className="size-6" />}
            {elsewhere && menu === "closed" && (
              <span aria-hidden className="absolute top-3.5 right-3.5 size-2 rounded-full bg-brand ring-2 ring-background" />
            )}
          </button>
        </div>
      </div>

      <MenuSheet
        mode={menu}
        pathname={pathname}
        tabHrefs={tabs.map((tab) => tab.href)}
        onModeChange={setMenu}
      />
    </>
  )
}

function MenuSheet({
  mode,
  pathname,
  tabHrefs,
  onModeChange,
}: {
  mode: "closed" | "menu" | "edit"
  pathname: string
  tabHrefs: string[]
  onModeChange: (mode: "closed" | "menu" | "edit") => void
}) {
  const { groups } = useVisibleNav()
  const close = () => onModeChange("closed")
  const editing = mode === "edit"

  return (
    <Sheet open={mode !== "closed"} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-0 border-0! bg-transparent! px-2 pb-[calc(var(--bottom-nav)+0.25rem)] shadow-none! lg:hidden"
      >
        <div className="glass-bar mx-auto flex max-h-[min(70dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-[2rem]">
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold tracking-tight">{editing ? "Control centre" : "Menu"}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {editing ? "Choose the four tabs in your tab bar." : "Everything that isn't in your tab bar."}
              </SheetDescription>
            </div>
            {editing ? (
              <Button size="sm" onClick={() => onModeChange("menu")} className="rounded-full">
                <CheckIcon /> Done
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onModeChange("edit")} className="rounded-full bg-transparent">
                <SlidersHorizontalIcon /> Edit tabs
              </Button>
            )}
          </div>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
            {editing ? (
              <div className="px-2 pt-2">
                <TabBarEditor />
              </div>
            ) : (
              groups.map((group, index) => {
                const items = group.items.filter((item) => !tabHrefs.includes(item.href))
                if (!items.length) return null
                return (
                  <section key={group.label ?? index} className="pt-3">
                    {group.label && (
                      <h3 className="px-2 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                        {group.label}
                      </h3>
                    )}
                    <div className="grid grid-cols-4 gap-1">
                      {items.map((item) => {
                        const current = isActive(pathname, item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            aria-current={current ? "page" : undefined}
                            className="group flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                          >
                            <span
                              className={cn(
                                "flex size-12 items-center justify-center rounded-2xl transition-colors",
                                current
                                  ? "bg-brand text-brand-foreground"
                                  : "bg-foreground/[0.06] text-foreground/80 group-hover:bg-foreground/[0.1] dark:bg-white/[0.08]",
                              )}
                            >
                              <item.icon className="size-[22px]" strokeWidth={1.8} />
                            </span>
                            <span className={cn("max-w-full truncate text-[11px]", current ? "font-semibold text-brand" : "text-foreground/85")}>
                              {item.title}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                )
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
