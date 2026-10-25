"use client"

import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

import { TAB_COUNT, useTabBar, useVisibleNav } from "./tab-bar"

/**
 * Control centre for the phone tab bar: tap a slot, then tap a page to put it
 * there (a page already in another slot swaps places). Changes apply at once
 * and are remembered on this device.
 */
export function TabBarEditor() {
  const { tabs, isCustom, setTabs, reset } = useTabBar()
  const { groups } = useVisibleNav()
  const [slot, setSlot] = useState(0)
  const hrefs = tabs.map((tab) => tab.href)
  const selected = Math.min(slot, tabs.length - 1)

  const place = (href: string) => {
    const next = [...hrefs]
    const from = next.indexOf(href)
    if (from === selected) return
    if (from >= 0) next[from] = next[selected]!
    next[selected] = href
    setTabs(next)
    // Move on to the next slot, so four taps fill the bar.
    setSlot((selected + 1) % TAB_COUNT)
  }

  const move = (by: -1 | 1) => {
    const to = selected + by
    if (to < 0 || to >= hrefs.length) return
    const next = [...hrefs]
    ;[next[selected], next[to]] = [next[to]!, next[selected]!]
    setTabs(next)
    setSlot(to)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <p className="text-xs text-muted-foreground">Tap a tab, then choose the page that goes there.</p>
        <div className="glass-bar grid grid-cols-4 gap-1 rounded-full p-1" role="radiogroup" aria-label="Tab slots">
          {tabs.map((tab, index) => (
            <button
              key={tab.href}
              type="button"
              role="radio"
              aria-checked={index === selected}
              aria-label={`Tab ${index + 1}: ${tab.title}`}
              onClick={() => setSlot(index)}
              className={cn(
                "flex h-13 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                index === selected
                  ? "bg-brand text-brand-foreground"
                  : "text-foreground/80 hover:bg-foreground/[0.06]",
              )}
            >
              <tab.icon className="size-5" strokeWidth={1.9} />
              <span className="max-w-full truncate text-[10px] font-medium">{tab.title}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-transparent"
              onClick={() => move(-1)}
              disabled={selected === 0}
              aria-label="Move tab left"
            >
              <ChevronLeftIcon /> Move
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-transparent"
              onClick={() => move(1)}
              disabled={selected === tabs.length - 1}
              aria-label="Move tab right"
            >
              Move <ChevronRightIcon />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={reset} disabled={!isCustom}>
            <RotateCcwIcon /> Reset
          </Button>
        </div>
      </div>

      {groups.map((group, index) => (
        <section key={group.label ?? index} className="space-y-1.5">
          {group.label && (
            <h3 className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{group.label}</h3>
          )}
          <div className="grid grid-cols-4 gap-1">
            {group.items.map((item) => {
              const position = hrefs.indexOf(item.href)
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => place(item.href)}
                  aria-label={
                    position >= 0
                      ? `${item.title}, tab ${position + 1}`
                      : `Put ${item.title} in tab ${selected + 1}`
                  }
                  className="group flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                >
                  <span
                    className={cn(
                      "relative flex size-12 items-center justify-center rounded-2xl transition-colors",
                      position >= 0
                        ? "bg-brand/15 text-brand ring-1 ring-brand/40"
                        : "bg-foreground/[0.06] text-foreground/80 group-hover:bg-foreground/[0.1] dark:bg-white/[0.08]",
                    )}
                  >
                    <item.icon className="size-[22px]" strokeWidth={1.8} />
                    {position >= 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                        {position + 1}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate text-[11px] text-foreground/85">{item.title}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
