"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRightIcon, UserPlusIcon, XIcon } from "lucide-react"

import { Field, SimpleSelect } from "@/components/shared/form"
import { ButtonSpinner } from "@/components/shared/misc"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isApiMode } from "@/lib/api/config"
import { RELATIONSHIPS } from "@/lib/constants"
import { companyService, contactService } from "@/lib/services"
import { QK, useCompanies, useContacts } from "@/lib/store/queries"
import { upsertItem, useMutation } from "@/lib/store/query"
import type { ContactInput, ExtractedContact, Relationship } from "@/lib/types"

import type { ContactItem } from "./chat-store"
import { Bubble, DuplicateNotice, ErrorCard, hostOf, LoadingCard, SavedCard } from "./link-card"
import { normName } from "./links"

interface Draft {
  name: string
  role: string
  company: string
  email: string
  phone: string
  linkedin: string
  relationship: Relationship
  notes: string
}

/** A first guess from the job title; the user can change it. */
function relationshipFrom(role: string): Relationship {
  if (/recruit|talent|sourc|staffing|\bhr\b|human resources|people partner/i.test(role)) return "recruiter"
  if (/manager|director|head of|\blead\b|vp\b|vice president|cto|ceo|founder/i.test(role)) return "hiring_manager"
  return "professional"
}

const draftFrom = (c: ExtractedContact): Draft => ({
  name: c.name,
  role: c.role,
  company: c.company,
  email: c.email,
  phone: c.phone,
  linkedin: c.linkedin,
  relationship: relationshipFrom(c.role),
  notes: [c.about, c.location && `Location: ${c.location}`, c.website && `Website: ${c.website}`]
    .filter(Boolean)
    .join("\n"),
})

const linkedInSlug = (value: string | undefined) =>
  String(value ?? "").match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1]?.toLowerCase() ?? ""

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isHttpUrl = (value: string) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

/** One profile link (or typed email) in the chat: loading → review & save → saved. */
export function ContactReviewCard({
  item,
  onRetry,
  onFillManually,
  onDismiss,
  onSaved,
}: {
  item: ContactItem
  onRetry: () => void
  onFillManually: () => void
  onDismiss: () => void
  onSaved: (id: string, title: string) => void
}) {
  if (item.status === "loading") return <LoadingCard url={item.url} />
  if (item.status === "error" || !item.extraction) {
    return (
      <ErrorCard
        title="Couldn't read that profile"
        url={item.url}
        error={item.error}
        onRetry={onRetry}
        onFillManually={onFillManually}
        onDismiss={onDismiss}
      />
    )
  }
  if (item.savedId) return <SavedCard title={item.savedTitle} href="/career/contacts" />
  return <ContactForm item={item} onDismiss={onDismiss} onSaved={onSaved} />
}

function ContactForm({
  item,
  onDismiss,
  onSaved,
}: {
  item: ContactItem
  onDismiss: () => void
  onSaved: (id: string, title: string) => void
}) {
  const extraction = item.extraction!
  const [draft, setDraft] = useState<Draft>(() => draftFrom(extraction.contact))
  const [submitted, setSubmitted] = useState(false)
  const { data: companies = [] } = useCompanies()
  const { data: contacts = [] } = useContacts()

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const company = useMemo(() => {
    const key = normName(draft.company)
    return key ? companies.find((c) => normName(c.name) === key) : undefined
  }, [companies, draft.company])

  // Same LinkedIn profile, else same email, else same name.
  const duplicate = useMemo(() => {
    const slug = linkedInSlug(draft.linkedin)
    const email = draft.email.trim().toLowerCase()
    const name = normName(draft.name)
    return (
      (slug && contacts.find((c) => linkedInSlug(c.linkedin) === slug)) ||
      (email && contacts.find((c) => c.email.toLowerCase() === email)) ||
      (name && contacts.find((c) => normName(c.name) === name)) ||
      undefined
    )
  }, [contacts, draft.email, draft.linkedin, draft.name])

  const create = useMutation(
    async (input: ContactInput, companyName: string) => {
      let companyId = input.companyId
      if (!companyId && companyName) {
        const created = await companyService.createCompany({
          name: companyName,
          industry: "",
          website: "",
          location: "",
          size: "",
          status: "target",
          description: "",
          notes: "",
        })
        upsertItem(QK.companies, created)
        companyId = created.id
      }
      return contactService.createContact({ ...input, ...(companyId ? { companyId } : {}) })
    },
    {
      onSuccess: (contact) => upsertItem(QK.contacts, contact),
      success: (contact) => `${contact.name} added to contacts`,
      error: "Couldn't add contact",
    },
  )

  const missing = (key: keyof ExtractedContact) => !extraction.contact[key]
  const hint = (key: keyof ExtractedContact) => (missing(key) ? "Not found on the page" : undefined)
  const errors = {
    name: draft.name.trim().length < 2 ? "Name is required" : undefined,
    email: draft.email.trim() && !isEmail(draft.email.trim()) ? "Enter a valid email" : undefined,
    linkedin: draft.linkedin.trim() && !isHttpUrl(draft.linkedin.trim()) ? "Enter a valid URL" : undefined,
  }
  const error = (key: keyof typeof errors) => (submitted ? errors[key] : undefined)

  const save = async () => {
    setSubmitted(true)
    if (errors.name || errors.email || errors.linkedin) return
    const input: ContactInput = {
      name: draft.name.trim(),
      role: draft.role.trim(),
      email: draft.email.trim(),
      relationship: draft.relationship,
      notes: draft.notes.trim(),
    }
    if (company) input.companyId = company.id
    if (draft.phone.trim()) input.phone = draft.phone.trim()
    if (draft.linkedin.trim()) input.linkedin = draft.linkedin.trim()
    const contact = await create.mutate(input, company ? "" : draft.company.trim())
    if (contact) {
      const at = company?.name ?? draft.company.trim()
      onSaved(contact.id, at ? `${contact.name} (${at})` : contact.name)
    }
  }

  const found = extraction.kind === "profile"
  const fromTyped = item.url.startsWith("mailto:")

  return (
    <Bubble wide>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <ToneBadge tone="violet">Contact</ToneBadge>
              {extraction.site && <ToneBadge tone="teal">{extraction.site}</ToneBadge>}
              {!fromTyped && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  {hostOf(item.url)} <ArrowUpRightIcon className="size-3" />
                </a>
              )}
            </div>
            <p className="text-sm text-pretty">
              {fromTyped
                ? "Add this email as a contact? Fill in who it is and save."
                : found
                  ? `Read from ${extraction.site || hostOf(item.url)}. Check the details and save.`
                  : isApiMode
                    ? "I couldn't find a person on that page. Fill in what you know and save."
                    : "Demo mode can't read pages, so only the link's details are filled in."}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1 text-muted-foreground" onClick={onDismiss} aria-label="Dismiss">
            <XIcon />
          </Button>
        </div>

        {duplicate && (
          <DuplicateNotice>
            Already in your contacts: {duplicate.name}
            {duplicate.role ? ` · ${duplicate.role}` : ""}.{" "}
            <Link href="/career/contacts" className="font-medium text-brand hover:underline">
              View contacts
            </Link>
          </DuplicateNotice>
        )}

        {/* content-start: a hint under one field mustn't push its neighbour down. */}
        <div className="grid grid-cols-1 gap-3 *:content-start sm:grid-cols-2">
          <Field label="Name" htmlFor={`${item.id}-name`} error={error("name")} hint={hint("name")}>
            <Input id={`${item.id}-name`} value={draft.name} onChange={(e) => set("name", e.target.value)} aria-invalid={Boolean(error("name"))} />
          </Field>
          <Field label="Role" htmlFor={`${item.id}-role`} hint={hint("role")}>
            <Input id={`${item.id}-role`} value={draft.role} onChange={(e) => set("role", e.target.value)} />
          </Field>
          <Field
            label="Company"
            htmlFor={`${item.id}-company`}
            hint={
              draft.company.trim()
                ? company
                  ? `Matches ${company.name} in your companies`
                  : "New company — it'll be added to your companies"
                : hint("company")
            }
          >
            <Input id={`${item.id}-company`} value={draft.company} onChange={(e) => set("company", e.target.value)} />
          </Field>
          <Field label="Relationship">
            <SimpleSelect
              value={draft.relationship}
              onValueChange={(v) => set("relationship", v as Relationship)}
              options={RELATIONSHIPS}
            />
          </Field>
          <Field label="Email" htmlFor={`${item.id}-email`} error={error("email")}>
            <Input
              id={`${item.id}-email`}
              type="email"
              inputMode="email"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={Boolean(error("email"))}
            />
          </Field>
          <Field label="Phone" htmlFor={`${item.id}-phone`}>
            <Input id={`${item.id}-phone`} type="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="LinkedIn" htmlFor={`${item.id}-linkedin`} error={error("linkedin")} className="sm:col-span-2">
            <Input
              id={`${item.id}-linkedin`}
              value={draft.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              placeholder="https://www.linkedin.com/in/…"
              aria-invalid={Boolean(error("linkedin"))}
            />
          </Field>
          <Field label="Notes" htmlFor={`${item.id}-notes`} className="sm:col-span-2">
            <Textarea id={`${item.id}-notes`} value={draft.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-16 text-sm" />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
          <Button variant="ghost" onClick={onDismiss}>
            Discard
          </Button>
          <Button onClick={save} disabled={create.isPending}>
            <ButtonSpinner pending={create.isPending} icon={UserPlusIcon} />
            {duplicate ? "Save anyway" : "Save contact"}
          </Button>
        </div>
      </div>
    </Bubble>
  )
}
