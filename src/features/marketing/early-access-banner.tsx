import { ArrowRightIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

import { CONTACT_EMAIL } from "./site-chrome"

/** Strip above the marketing header: knot is in development, ask the admin for access. */
export function EarlyAccessBanner() {
  return (
    <aside aria-label="Early access" className="pt-safe px-safe border-b bg-brand-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center sm:px-6">
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
    </aside>
  )
}
