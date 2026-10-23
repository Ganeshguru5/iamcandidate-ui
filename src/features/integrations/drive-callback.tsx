"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2Icon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { driveService } from "@/lib/services"
import { integrationsApi } from "@/lib/services/api/integrations"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, invalidateQueriesByPrefix } from "@/lib/store/query"

type Purpose = "drive" | "calendar"

const TARGETS: Record<Purpose, { name: string; page: string; complete: (code: string, state: string) => Promise<unknown> }> = {
  drive: {
    name: "Google Drive",
    page: "/integrations/google-drive",
    complete: (code, state) => driveService.completeConnect(code, state),
  },
  calendar: {
    name: "Google Calendar",
    page: "/integrations/google-calendar",
    complete: (code, state) => integrationsApi.calendar.connect(code, state),
  },
}

/** The signed state's payload is plain JSON naming the integration (`p`); the server verifies it. */
function purposeOf(state: string | null): Purpose {
  try {
    const payload = state?.split(".")[0] ?? ""
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return (JSON.parse(json) as { p?: string }).p === "calendar" ? "calendar" : "drive"
  } catch {
    return "drive"
  }
}

/**
 * Google redirects here after the consent screen with `code` and `state`, for
 * both Drive and Calendar (one registered redirect URI). The backend verifies
 * the state, exchanges the code and stores the tokens.
 */
export function DriveCallback() {
  const router = useRouter()
  const params = useSearchParams()
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const started = useRef(false)

  const code = params.get("code")
  const state = params.get("state")
  const denied = params.get("error")
  const target = TARGETS[purposeOf(state)]
  const paramError = denied
    ? denied === "access_denied"
      ? `You cancelled the Google sign-in, so ${target.name} wasn't connected.`
      : `Google returned an error (${denied}). Try connecting again.`
    : !code || !state
      ? "Google didn't return a sign-in code. Try connecting again."
      : null
  const error = paramError ?? exchangeError

  useEffect(() => {
    if (paramError || !code || !state) return
    if (started.current) return // React dev mode runs effects twice; a code works only once.
    started.current = true
    target
      .complete(code, state)
      .then(() => {
        invalidateQueries(QK.integrations, QK.activities)
        invalidateQueriesByPrefix(QK.drive)
        toast.success(`${target.name} connected`)
        router.replace(target.page)
      })
      .catch((caught: unknown) =>
        setExchangeError(caught instanceof Error ? caught.message : `Couldn't connect ${target.name}`),
      )
  }, [code, state, paramError, router, target])

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <XCircleIcon className="size-10 text-destructive" />
        <h1 className="text-lg font-semibold">{target.name} wasn&apos;t connected</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button nativeButton={false} render={<Link href={target.page} />}>
          Back to {target.name}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <Loader2Icon className="size-8 animate-spin text-brand" />
      <p className="text-sm text-muted-foreground">Finishing Google sign-in…</p>
    </div>
  )
}
