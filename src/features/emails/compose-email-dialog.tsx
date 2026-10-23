"use client"

import { useState } from "react"
import { CheckCircle2Icon, Loader2Icon, SaveIcon, SendIcon } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  useApplications,
  useById,
  useCompanies,
  useContacts,
  useProfile,
  useTemplates,
} from "@/lib/store/queries"
import { isApiMode } from "@/lib/api/config"
import type { ComposeEmailInput, ID } from "@/lib/types"
import { fillTemplate, templateChannel } from "@/lib/utils/template"

import { useSaveDraft, useSendEmail } from "./hooks"

export interface ComposeDefaults {
  to?: string[]
  cc?: string[]
  subject?: string
  body?: string
  applicationId?: ID
  contactId?: ID
  templateId?: ID
  draftId?: ID
}

const NONE = "__none"
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function splitAddresses(value: string): string[] {
  return value
    .split(/[,;\s]+/)
    .map((v) => v.trim())
    .filter(Boolean)
}

type Phase = "compose" | "confirm" | "sending" | "sent"

export function ComposeEmailDialog({
  open,
  onOpenChange,
  defaults,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaults?: ComposeDefaults
}) {
  const { data: contacts = [] } = useContacts()
  const { data: allTemplates = [] } = useTemplates()
  // LinkedIn templates are copied into LinkedIn, not emailed.
  const templates = allTemplates.filter((t) => templateChannel(t) === "email")
  const { data: applications = [] } = useApplications()
  const { data: companies } = useCompanies()
  const { data: profile } = useProfile()
  const companyById = useById(companies)

  const [to, setTo] = useState(defaults?.to?.join(", ") ?? "")
  const [cc, setCc] = useState(defaults?.cc?.join(", ") ?? "")
  const [subject, setSubject] = useState(defaults?.subject ?? "")
  const [body, setBody] = useState(defaults?.body ?? "")
  const [contactId, setContactId] = useState(defaults?.contactId ?? NONE)
  const [applicationId, setApplicationId] = useState(defaults?.applicationId ?? NONE)
  const [templateId, setTemplateId] = useState(defaults?.templateId ?? NONE)
  const [phase, setPhase] = useState<Phase>("compose")
  const [error, setError] = useState<string | null>(null)

  const send = useSendEmail()
  const draft = useSaveDraft()

  const variableValues = (nextContactId: string, nextApplicationId: string) => {
    const contact = contacts.find((c) => c.id === nextContactId)
    const app = applications.find((a) => a.id === nextApplicationId)
    const companyId = app?.companyId ?? contact?.companyId
    return {
      name: contact?.name.split(" ")[0],
      company: companyId ? companyById.get(companyId)?.name : undefined,
      role: app?.role,
      jobUrl: app?.jobUrl,
      jobId: app?.jobId,
      senderName: profile?.name,
    }
  }

  const applyTemplate = (id: string, nextContactId = contactId, nextApplicationId = applicationId) => {
    setTemplateId(id)
    const template = templates.find((t) => t.id === id)
    if (!template) return
    const values = variableValues(nextContactId, nextApplicationId)
    setSubject(fillTemplate(template.subject, values))
    setBody(fillTemplate(template.body, values))
  }

  const chooseContact = (id: string) => {
    setContactId(id)
    const contact = contacts.find((c) => c.id === id)
    if (contact && !splitAddresses(to).includes(contact.email)) {
      setTo([...splitAddresses(to), contact.email].join(", "))
    }
    if (templateId !== NONE) applyTemplate(templateId, id, applicationId)
  }

  const chooseApplication = (id: string) => {
    setApplicationId(id)
    if (templateId !== NONE) applyTemplate(templateId, contactId, id)
  }

  const input = (): ComposeEmailInput => ({
    to: splitAddresses(to),
    cc: splitAddresses(cc),
    subject: subject.trim(),
    body,
    contactId: contactId === NONE ? undefined : contactId,
    applicationId: applicationId === NONE ? undefined : applicationId,
    templateId: templateId === NONE ? undefined : templateId,
  })

  const validate = (): string | null => {
    const value = input()
    if (value.to.length === 0) return "Add at least one recipient"
    const invalid = [...value.to, ...value.cc].find((a) => !EMAIL_PATTERN.test(a))
    if (invalid) return `"${invalid}" is not a valid email address`
    if (!value.subject) return "Subject is required"
    if (!value.body.trim()) return "Message is empty"
    return null
  }

  const requestSend = () => {
    const problem = validate()
    setError(problem)
    if (!problem) setPhase("confirm")
  }

  const doSend = async () => {
    setPhase("sending")
    const result = await send.mutate(input(), defaults?.draftId)
    if (result) {
      setPhase("sent")
      window.setTimeout(() => onOpenChange(false), 1400)
    } else {
      setPhase("compose")
      setError("Sending failed — check the details and try again.")
    }
  }

  const saveDraft = async () => {
    const result = await draft.mutate(input(), defaults?.draftId)
    if (result) onOpenChange(false)
  }

  const busy = phase === "sending" || draft.isPending
  const unresolved = /\{\{\s*\w+\s*\}\}/.test(subject + body)

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{phase === "sent" ? "Email sent" : "New email"}</DialogTitle>
          <DialogDescription>
            {isApiMode
              ? "Sent from your own email account (Settings → Email) and saved in Sent."
              : "Sent through your mock SMTP connection — nothing leaves this browser."}
          </DialogDescription>
        </DialogHeader>

        {phase === "sent" ? (
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <CheckCircle2Icon className="size-10 text-success" />
            <p className="font-medium">Email sent successfully</p>
            <p className="text-sm text-muted-foreground">It&apos;s now in your Sent folder.</p>
          </div>
        ) : phase === "confirm" || phase === "sending" ? (
          <div className="space-y-3 px-5 py-6">
            <p className="text-sm">
              Send <span className="font-medium">&ldquo;{subject}&rdquo;</span> to{" "}
              <span className="font-medium">{splitAddresses(to).join(", ")}</span>
              {splitAddresses(cc).length > 0 && <> (cc {splitAddresses(cc).join(", ")})</>}?
            </p>
            {unresolved && (
              <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
                Some template variables are still unfilled, e.g. <code>{"{{name}}"}</code>.
              </p>
            )}
            <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {body}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 max-h-[65dvh] gap-4 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Contact">
                <SimpleSelect
                  value={contactId}
                  onValueChange={chooseContact}
                  options={[{ value: NONE, label: "Choose contact" }, ...contacts.map((c) => ({ value: c.id, label: c.name }))]}
                />
              </Field>
              <Field label="Related application">
                <SimpleSelect
                  value={applicationId}
                  onValueChange={chooseApplication}
                  options={[
                    { value: NONE, label: "None" },
                    ...applications.map((a) => ({
                      value: a.id,
                      label: `${companyById.get(a.companyId)?.name ?? ""} — ${a.role}`,
                    })),
                  ]}
                />
              </Field>
              <Field label="Template">
                <SimpleSelect
                  value={templateId}
                  onValueChange={(id) => (id === NONE ? setTemplateId(NONE) : applyTemplate(id))}
                  options={[{ value: NONE, label: "No template" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]}
                />
              </Field>
            </div>
            <Field label="To" htmlFor="mail-to" hint="Separate multiple addresses with commas">
              <Input id="mail-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@company.com" />
            </Field>
            <Field label="CC" htmlFor="mail-cc">
              <Input id="mail-cc" value={cc} onChange={(e) => setCc(e.target.value)} />
            </Field>
            <Field label="Subject" htmlFor="mail-subject">
              <Input id="mail-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Message" htmlFor="mail-body">
              <Textarea id="mail-body" rows={9} value={body} onChange={(e) => setBody(e.target.value)} className="font-[inherit] leading-relaxed" />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {phase !== "sent" && (
          <DialogFooter className="mx-0 mb-0 px-5 py-3">
            {phase === "compose" ? (
              <>
                <Button variant="outline" onClick={saveDraft} disabled={busy} className="sm:mr-auto">
                  {draft.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
                  {draft.isPending ? "Saving…" : "Save draft"}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                  Discard
                </Button>
                <Button onClick={requestSend} disabled={busy}>
                  <SendIcon />
                  Send
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setPhase("compose")} disabled={busy}>
                  Back
                </Button>
                <Button onClick={doSend} disabled={busy}>
                  {busy ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
                  {busy ? "Sending…" : "Confirm & send"}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
