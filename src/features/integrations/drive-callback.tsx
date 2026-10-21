"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2Icon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { driveService } from "@/lib/services"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, invalidateQueriesByPrefix } from "@/lib/store/query"

/**
 * Google redirects here after the consent screen with `code` and `state`.
 * The backend verifies the state, exchanges the code and stores the tokens.
 */
export function DriveCallback() {
  const router = useRouter()
  const params = useSearchParams()
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const started = useRef(false)

  const code = params.get("code")
  const state = params.get("state")
  const denied = params.get("error")
  const paramError = denied
    ? denied === "access_denied"
      ? "You cancelled the Google sign-in, so Drive wasn't connected."
      : `Google returned an error (${denied}). Try connecting again.`
    : !code || !state
      ? "Google didn't return a sign-in code. Try connecting again."
      : null
  const error = paramError ?? exchangeError

  useEffect(() => {
    if (paramError || !code || !state) return
    if (started.current) return // React dev mode runs effects twice; a code works only once.
    started.current = true
    driveService
      .completeConnect(code, state)
      .then(() => {
        invalidateQueries(QK.integrations, QK.activities)
        invalidateQueriesByPrefix(QK.drive)
        toast.success("Google Drive connected")
        router.replace("/integrations/google-drive")
      })
      .catch((caught: unknown) =>
        setExchangeError(caught instanceof Error ? caught.message : "Couldn't connect Google Drive"),
      )
  }, [code, state, paramError, router])

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <XCircleIcon className="size-10 text-destructive" />
        <h1 className="text-lg font-semibold">Google Drive wasn&apos;t connected</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button nativeButton={false} render={<Link href="/integrations/google-drive" />}>
          Back to Google Drive
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
