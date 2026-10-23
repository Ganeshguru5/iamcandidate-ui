"use client"

import { useState } from "react"
import Link from "next/link"
import { CopyIcon, ExternalLinkIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Field, SimpleSelect } from "@/components/shared/form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useApplications, useById, useCompanies, useProfile, useTemplates } from "@/lib/store/queries"
import type { Contact, EmailTemplate, TemplateCategory } from "@/lib/types"
import { copyText, fillTemplate, LINKEDIN_NOTE_LIMIT, templateChannel } from "@/lib/utils/template"

export interface LinkedInJob {
  companyId?: string
  role?: string
  jobId?: string
  jobUrl?: string
}

/**
 * Fills a LinkedIn template for one person (and optionally a job), lets you
 * tweak it, then copies it and opens their LinkedIn profile. LinkedIn has no
 * API for sending messages, so the last step is a paste.
 */
export function LinkedInMessageDialog({
  contact,
  job,
  preferCategory = "referral",
  onOpenChange,
  onCopied,
}: {
  contact: Contact
  job?: LinkedInJob
  preferCategory?: TemplateCategory
  onOpenChange: (open: boolean) => void
  /** Called after the message is copied (e.g. to mark a referral as requested). */
  onCopied?: () => void
}) {
  const { data: templates = [] } = useTemplates()
  const { data: applications = [] } = useApplications()
  const { data: companies } = useCompanies()
  const { data: profile } = useProfile()
  const companyById = useById(companies)

  const linkedinTemplates = templates.filter((t) => templateChannel(t) === "linkedin")
  const initialTemplate =
    linkedinTemplates.find((t) => t.category === preferCategory) ?? linkedinTemplates[0]
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "")
  const [applicationId, setApplicationId] = useState("")

  const app = applications.find((a) => a.id === applicationId)
  const target: LinkedInJob = app
    ? { companyId: app.companyId, role: app.role, jobId: app.jobId, jobUrl: app.jobUrl }
    : (job ?? {})
  const companyId = target.companyId ?? contact.companyId
  const values = {
    name: contact.name.split(" ")[0],
    company: companyId ? companyById.get(companyId)?.name : undefined,
    role: target.role,
    jobId: target.jobId,
    jobUrl: target.jobUrl,
    senderName: profile?.name,
  }

  const fill = (template: EmailTemplate | undefined) => (template ? fillTemplate(template.body, values) : "")
  const template = linkedinTemplates.find((t) => t.id === templateId)
  // `null` = follow the template; a string = the user edited the text.
  const [edited, setEdited] = useState<string | null>(null)
  const message = edited ?? fill(template)
  const unfilled = /\{\{\s*\w+\s*\}\}/.test(message)
  const overNote = message.length > LINKEDIN_NOTE_LIMIT

  const copy = async (openProfile: boolean) => {
    try {
      await copyText(message)
    } catch {
      toast.error("Couldn't copy. Select the text and copy it yourself.")
      return
    }
    toast.success(openProfile ? "Copied. Paste it into LinkedIn." : "Message copied")
    onCopied?.()
    if (openProfile && contact.linkedin) window.open(contact.linkedin, "_blank", "noopener,noreferrer")
    onOpenChange(false)
  }

  // Applications at this person's company first.
  const applicationOptions = [...applications]
    .sort((a, b) => Number(b.companyId === contact.companyId) - Number(a.companyId === contact.companyId) || b.updatedAt.localeCompare(a.updatedAt))
    .map((a) => ({ value: a.id, label: `${a.role} — ${companyById.get(a.companyId)?.name ?? "Unknown company"}` }))

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>LinkedIn message to {contact.name}</DialogTitle>
          <DialogDescription>Pick a template, check the text, then copy it into LinkedIn.</DialogDescription>
        </DialogHeader>

        {linkedinTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any LinkedIn templates yet.{" "}
            <Link href="/communication/templates?channel=linkedin" className="text-foreground underline underline-offset-2">
              Add one
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Template">
                <SimpleSelect
                  value={templateId || undefined}
                  onValueChange={(id) => {
                    setTemplateId(id)
                    setEdited(null)
                  }}
                  options={linkedinTemplates.map((t) => ({ value: t.id, label: t.name }))}
                />
              </Field>
              {!job?.role && applicationOptions.length > 0 && (
                <Field label="About the job">
                  <SimpleSelect
                    value={applicationId || undefined}
                    placeholder="Pick an application (optional)"
                    onValueChange={(id) => {
                      setApplicationId(id)
                      setEdited(null)
                    }}
                    options={applicationOptions}
                  />
                </Field>
              )}
            </div>
            <Field label="Message">
              <Textarea value={message} onChange={(e) => setEdited(e.target.value)} rows={9} className="leading-relaxed" />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={cn("text-muted-foreground", unfilled && "text-warning")}>
                {unfilled ? "Some {{variables}} are still unfilled. Edit them before sending." : "Ready to send."}
              </span>
              <span className={cn("tabular-nums text-muted-foreground", overNote && "text-warning")}>
                {message.length} / {LINKEDIN_NOTE_LIMIT}
                {overNote ? " — too long for a connection note; send it as a message" : " — fits a connection note"}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={contact.linkedin ? "outline" : "default"} disabled={!message} onClick={() => void copy(false)}>
            <CopyIcon /> Copy
          </Button>
          {contact.linkedin && (
            <Button disabled={!message} onClick={() => void copy(true)}>
              <ExternalLinkIcon /> Copy & open LinkedIn
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
