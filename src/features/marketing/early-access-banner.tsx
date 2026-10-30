"use client"

import { ArrowRightIcon } from "lucide-react"

import { RequestAccessButton } from "@/features/auth/request-access"

/** Strip above the marketing header: iamcandidate is in development, request access. */
export function EarlyAccessBanner() {
  return (
    <aside aria-label="Early access" className="pt-safe px-safe border-b bg-brand-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center sm:px-6">
        <p className="text-sm">
          <span className="font-semibold">iamcandidate is in development</span>
          <span aria-hidden className="mx-2 text-muted-foreground">|</span>
          <span className="text-muted-foreground">Accounts are invite-only while it&apos;s in early access.</span>
        </p>
        <RequestAccessButton size="sm" className="gap-1.5 rounded-full bg-brand px-3.5 text-brand-foreground hover:bg-brand/90">
          Request access <ArrowRightIcon />
        </RequestAccessButton>
      </div>
    </aside>
  )
}
