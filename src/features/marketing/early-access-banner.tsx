"use client"

import { ArrowRightIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

import { CONTACT_EMAIL } from "./site-chrome"

const DISMISS_KEY = "knot-early-access-dismissed"

/** Runs before paint (root layout) so a dismissed banner never flashes in. Hidden via globals.css. */
export const earlyAccessInitScript = `(function(){try{if(localStorage.getItem("${DISMISS_KEY}")){document.documentElement.setAttribute("data-early-access","hidden")}}catch(e){}})();`

/** Strip above the marketing header: knot is in development, ask the admin for access. */
export function EarlyAccessBanner() {
  const dismiss = () => {
    document.documentElement.setAttribute("data-early-access", "hidden")
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // Storage blocked: the banner comes back on the next visit.
    }
  }

  return (
    <aside aria-label="Early access" className="early-access-banner pt-safe px-safe relative border-b bg-brand-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 py-2.5 pr-12 pl-4 text-center sm:px-12">
        <p className="text-sm">
          <span className="font-semibold">knot is in development</span>
          <span aria-hidden className="mx-2 text-muted-foreground">|</span>
          <span className="text-muted-foreground">Contact the admin at </span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline-offset-4 hover:underline">
            {CONTACT_EMAIL}
          </a>
          <span className="text-muted-foreground"> for early access.</span>
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("knot early access")}`}
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5 rounded-full bg-brand px-3.5 text-brand-foreground hover:bg-brand/90")}
        >
          Request access <ArrowRightIcon />
        </a>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 bottom-1.5 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground sm:right-4"
      >
        <XIcon className="size-4" />
      </button>
    </aside>
  )
}
