"use client"

import { useState } from "react"
import { CheckCircle2Icon, CheckIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react"

import { BrandMark } from "@/components/layout/brand"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { isApiMode } from "@/lib/api/config"
import { driveService } from "@/lib/services"
import type { Integration } from "@/lib/types"

import { useConnectIntegration } from "./hooks"
import { IntegrationLogo } from "./integration-logos"

type Step = "consent" | "connecting" | "done"

const SCOPES: Record<string, string[]> = {
  google_drive: isApiMode
    ? ["See and download files in your Google Drive (read-only)", "See your primary email address"]
    : ["See and download files in your Google Drive", "Create files in folders you choose", "See your primary email address"],
  smtp: ["Send email on your behalf using your SMTP server", "Verify the connection credentials"],
}

/**
 * Mock mode: simulated consent → connecting → connected. API mode (Google
 * Drive): "Continue" sends the browser to Google's real consent screen; Google
 * returns to /integrations/google-drive/callback.
 */
export function ConnectDialog({
  integration,
  onOpenChange,
}: {
  integration: Integration
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = useState<Step>("consent")
  const connect = useConnectIntegration()
  const isGoogle = integration.id.startsWith("google")

  const realGoogle = isApiMode && integration.id === "google_drive"
  const [redirectError, setRedirectError] = useState<string | null>(null)

  const allow = async () => {
    setStep("connecting")
    if (realGoogle) {
      try {
        window.location.assign(await driveService.getAuthUrl())
      } catch (error) {
        setRedirectError(error instanceof Error ? error.message : "Couldn't start Google sign-in")
        setStep("consent")
      }
      return
    }
    const result = await connect.mutate(integration.id)
    setStep(result ? "done" : "consent")
  }

  return (
    <Dialog open onOpenChange={(open) => step !== "connecting" && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        {step === "consent" && (
          <>
            <DialogHeader>
              <div className="mb-2 flex items-center gap-2">
                <BrandMark />
                <span className="text-muted-foreground">⇄</span>
                <IntegrationLogo id={integration.id} className="size-7 [&_svg]:size-4" />
              </div>
              <DialogTitle>{isGoogle ? "Sign in with Google" : `Connect ${integration.name}`}</DialogTitle>
              <DialogDescription>
                knot wants to access your {integration.name} account
                {isGoogle && !realGoogle && <> <span className="font-medium text-foreground">ganeshguru@example.com</span></>}.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 rounded-lg border p-3 text-sm">
              {(SCOPES[integration.id] ?? ["Read and write data for this integration"]).map((scope) => (
                <li key={scope} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
                  {scope}
                </li>
              ))}
            </ul>
            {redirectError && <p className="text-sm text-destructive">{redirectError}</p>}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" />
              {realGoogle
                ? "You'll choose your account and approve access on Google's own page."
                : "Mock OAuth — no real account is accessed."}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={allow}>{realGoogle ? "Continue to Google" : "Allow"}</Button>
            </DialogFooter>
          </>
        )}
        {step === "connecting" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2Icon className="size-8 animate-spin text-brand" />
            <DialogTitle>{realGoogle ? "Opening Google sign-in…" : `Connecting to ${integration.name}…`}</DialogTitle>
            <DialogDescription>
              {realGoogle ? "You'll come back here after approving access." : "Exchanging authorization code for tokens."}
            </DialogDescription>
          </div>
        )}
        {step === "done" && (
          <>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2Icon className="size-10 text-success" />
              <DialogTitle>{integration.name} connected successfully.</DialogTitle>
              <DialogDescription>Your files will sync automatically.</DialogDescription>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
