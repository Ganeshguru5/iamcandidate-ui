"use client"

import { useRef, useState, ViewTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  BoldIcon,
  BracesIcon,
  CopyIcon,
  ItalicIcon,
  LayoutTemplateIcon,
  LinkIcon,
  ListIcon,
  Loader2Icon,
  MailIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field, SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { OptionBadge, Tag } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TEMPLATE_CATEGORIES, templateCategory } from "@/lib/constants"
import { useApplications, useById, useCompanies, useContacts, useProfile, useTemplates } from "@/lib/store/queries"
import { LinkedInGlyph } from "@/features/integrations/integration-logos"
import type { EmailTemplate, TemplateCategory, TemplateChannel } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"
import {
  copyText,
  extractVariables,
  fillTemplate,
  LINKEDIN_NOTE_LIMIT,
  TEMPLATE_VARIABLES,
  templateChannel,
} from "@/lib/utils/template"

import {
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useRestoreDefaultTemplates,
  useUpdateTemplate,
} from "./hooks"

const TOOLBAR: Array<{
  label: string
  icon: typeof BoldIcon
  text: string
  wrap?: [string, string]
}> = [
  { label: "Bold", icon: BoldIcon, text: "bold text", wrap: ["**", "**"] },
  { label: "Italic", icon: ItalicIcon, text: "italic text", wrap: ["_", "_"] },
  { label: "Bullet list", icon: ListIcon, text: "\n• " },
  { label: "Link", icon: LinkIcon, text: "{{jobUrl}}" },
]

const CHANNELS: Array<{
  value: TemplateChannel
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    value: "email",
    label: "Email",
    icon: MailIcon,
    description: "Emails you send from knot, with variables like {{name}} and {{company}} that fill themselves in.",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: LinkedInGlyph,
    description:
      "Messages and connection notes for LinkedIn. Fill one in from a contact or referral, copy it and paste it into LinkedIn.",
  },
]

export function TemplatesView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const channel: TemplateChannel = params.get("channel") === "linkedin" ? "linkedin" : "email"
  const { data: templates, isLoading, error, refetch } = useTemplates()
  const create = useCreateTemplate()
  const restore = useRestoreDefaultTemplates()
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const setChannel = (next: TemplateChannel) => {
    setSelectedId(null)
    router.replace(next === "email" ? pathname : `${pathname}?channel=${next}`, { scroll: false })
  }

  const inChannel = (templates ?? []).filter((t) => templateChannel(t) === channel)
  const list = inChannel
    .filter((t) => matchesQuery(query, t.name, t.subject, t.body))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const selected = inChannel.find((t) => t.id === selectedId) ?? list[0]
  const current = CHANNELS.find((c) => c.value === channel) ?? CHANNELS[0]

  const createNew = async () => {
    const template = await create.mutate(
      channel === "linkedin"
        ? {
            name: "Untitled LinkedIn message",
            category: "referral",
            channel,
            subject: "",
            body: "Hi {{name}}, \n\nThanks,\n{{senderName}}",
          }
        : {
            name: "Untitled template",
            category: "other",
            channel,
            subject: "Hello {{name}}",
            body: "Hi {{name}},\n\n\n\nBest,\n{{senderName}}",
          },
    )
    if (template) setSelectedId(template.id)
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        description={current.description}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void restore.mutate()}
              disabled={restore.isPending}
              title="Add back any default templates you deleted"
            >
              {restore.isPending ? <Loader2Icon className="animate-spin" /> : <RotateCcwIcon />} Restore defaults
            </Button>
            <Button onClick={createNew} disabled={create.isPending}>
              {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />} New template
            </Button>
          </>
        }
      >
        <Tabs value={channel} onValueChange={(value) => setChannel(value as TemplateChannel)}>
          <TabsList>
            {CHANNELS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon /> {label}
                <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                  {(templates ?? []).filter((t) => templateChannel(t) === value).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PageHeader>
      {/* Switching Email / LinkedIn is a navigation (?channel=): crossfade the list. */}
      <ViewTransition key={channel} enter="page-fade" exit="page-fade" default="none">
        <div>
          {error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : isLoading ? (
            <ListSkeleton rows={5} />
          ) : inChannel.length === 0 ? (
            <EmptyState
              icon={LayoutTemplateIcon}
              title={channel === "linkedin" ? "No LinkedIn templates yet" : "No email templates yet"}
              description={
                channel === "linkedin"
                  ? "Start from the default connection notes and referral messages, or write your own."
                  : "Start from the default templates for referrals, outreach, follow-ups and interviews, or write your own."
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => void restore.mutate()} disabled={restore.isPending}>
                    <RotateCcwIcon /> Add default templates
                  </Button>
                  <Button onClick={createNew}>
                    <PlusIcon /> New template
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
              <div className="space-y-2">
                <SearchInput value={query} onChange={setQuery} placeholder="Search templates…" className="sm:w-full" />
                <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                  {list.map((template) => (
                    <li key={template.id} className="w-60 shrink-0 lg:w-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedId(template.id)}
                        className={cn(
                          "w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50",
                          selected?.id === template.id && "border-foreground/20 bg-muted/60",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{template.name}</p>
                          <OptionBadge option={templateCategory(template.category)} dot={false} />
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {template.subject || template.body}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          Used {template.usageCount}× · edited {timeAgo(template.updatedAt)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {selected && (
                <TemplateEditor
                  key={`${selected.id}-${selected.updatedAt}`}
                  template={selected}
                  onDeleted={() => setSelectedId(null)}
                  onDuplicated={setSelectedId}
                />
              )}
            </div>
          )}
        </div>
      </ViewTransition>
    </div>
  )
}

function TemplateEditor({
  template,
  onDeleted,
  onDuplicated,
}: {
  template: EmailTemplate
  onDeleted: () => void
  onDuplicated: (id: string) => void
}) {
  const { openDialog } = useAppDialogs()
  const { data: contacts = [] } = useContacts()
  const { data: applications = [] } = useApplications()
  const { data: companies } = useCompanies()
  const { data: profile } = useProfile()
  const companyById = useById(companies)

  const save = useUpdateTemplate()
  const duplicate = useDuplicateTemplate()
  const remove = useDeleteTemplate()

  const [name, setName] = useState(template.name)
  const [category, setCategory] = useState<TemplateCategory>(template.category)
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [focus, setFocus] = useState<"subject" | "body">("body")
  const [previewContact, setPreviewContact] = useState(contacts[0]?.id ?? "")
  const [previewApp, setPreviewApp] = useState(applications[0]?.id ?? "")
  const [deleting, setDeleting] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)

  const isLinkedIn = templateChannel(template) === "linkedin"
  const dirty =
    name !== template.name || category !== template.category || subject !== template.subject || body !== template.body
  const variables = extractVariables(subject, body)

  const insertAtCursor = (text: string, wrap?: [string, string]) => {
    const target = focus === "subject" ? subjectRef.current : bodyRef.current
    const value = focus === "subject" ? subject : body
    const setValue = focus === "subject" ? setSubject : setBody
    const start = target?.selectionStart ?? value.length
    const end = target?.selectionEnd ?? value.length
    const selectedText = value.slice(start, end)
    const insert = wrap ? `${wrap[0]}${selectedText || text}${wrap[1]}` : text
    setValue(value.slice(0, start) + insert + value.slice(end))
    requestAnimationFrame(() => {
      target?.focus()
      const caret = start + insert.length
      target?.setSelectionRange(caret, caret)
    })
  }

  const contact = contacts.find((c) => c.id === previewContact)
  const app = applications.find((a) => a.id === previewApp)
  const values = {
    name: contact?.name.split(" ")[0],
    company: app
      ? companyById.get(app.companyId)?.name
      : contact?.companyId
        ? companyById.get(contact.companyId)?.name
        : undefined,
    role: app?.role,
    jobUrl: app?.jobUrl,
    jobId: app?.jobId,
    senderName: profile?.name,
  }
  /** Length once filled with the preview values, against LinkedIn's note limit. */
  const filledLength = fillTemplate(body, values).length

  return (
    <div className="min-w-0 rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Template name"
          className="h-9 font-medium sm:max-w-xs"
        />
        <SimpleSelect
          value={category}
          onValueChange={(v) => setCategory(v as TemplateCategory)}
          options={TEMPLATE_CATEGORIES}
          className="sm:w-40"
        />
        <div className="flex gap-1.5 sm:ml-auto">
          {isLinkedIn ? (
            <Button
              variant="outline"
              size="sm"
              title="Copy with the preview contact and application filled in"
              onClick={() => {
                copyText(fillTemplate(body, values))
                  .then(() => toast.success("Message copied. Paste it into LinkedIn."))
                  .catch(() => toast.error("Couldn't copy the message"))
              }}
            >
              <CopyIcon /> Copy
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openDialog({
                  kind: "email",
                  defaults: {
                    templateId: template.id,
                    subject: fillTemplate(template.subject, values),
                    body: fillTemplate(template.body, values),
                  },
                })
              }
            >
              <SendIcon /> Use
            </Button>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Duplicate template"
            disabled={duplicate.isPending}
            onClick={async () => {
              const copy = await duplicate.mutate(template.id)
              if (copy) onDuplicated(copy.id)
            }}
          >
            {duplicate.isPending ? <Loader2Icon className="animate-spin" /> : <CopyIcon />}
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Delete template" onClick={() => setDeleting(true)}>
            <Trash2Icon />
          </Button>
          <Button
            size="sm"
            disabled={!dirty || save.isPending}
            onClick={() => void save.mutate(template.id, { name, category, subject, body })}
          >
            {save.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit" className="p-4">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 space-y-4">
          {!isLinkedIn && (
            <Field label="Subject" htmlFor="tpl-subject">
              <Input
                ref={subjectRef}
                id="tpl-subject"
                value={subject}
                onFocus={() => setFocus("subject")}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
          )}
          <div className="grid grid-cols-1 gap-1.5">
            <span className="text-xs font-medium text-foreground/80">{isLinkedIn ? "Message" : "Body"}</span>
            <div className="overflow-hidden rounded-lg border focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
                {/* LinkedIn messages are plain text: no formatting buttons. */}
                {!isLinkedIn &&
                  TOOLBAR.map((tool) => (
                    <Tooltip key={tool.label}>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={tool.label}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertAtCursor(tool.text, tool.wrap)}
                          />
                        }
                      >
                        <tool.icon />
                      </TooltipTrigger>
                      <TooltipContent>{tool.label}</TooltipContent>
                    </Tooltip>
                  ))}
                {!isLinkedIn && <span className="mx-1 h-4 w-px bg-border" />}
                <BracesIcon className="mx-1 size-3.5 text-muted-foreground" />
                {TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertAtCursor(`{{${variable}}}`)}
                    className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <Textarea
                ref={bodyRef}
                value={body}
                onFocus={() => setFocus("body")}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className="rounded-none border-0 leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                aria-label="Template body"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            Variables used:
            {variables.length ? variables.map((v) => <Tag key={v} className="font-mono">{`{{${v}}}`}</Tag>) : " none"}
            {isLinkedIn && (
              <span className={cn("ml-auto tabular-nums", filledLength > LINKEDIN_NOTE_LIMIT && "text-warning")}>
                {filledLength} / {LINKEDIN_NOTE_LIMIT} characters filled
                {filledLength > LINKEDIN_NOTE_LIMIT ? ": too long for a connection note" : ": fits a connection note"}
              </span>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Preview as contact">
              <SimpleSelect
                value={previewContact}
                onValueChange={setPreviewContact}
                options={contacts.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Field>
            <Field label="For application">
              <SimpleSelect
                value={previewApp}
                onValueChange={setPreviewApp}
                options={applications.map((a) => ({
                  value: a.id,
                  label: `${companyById.get(a.companyId)?.name} — ${a.role}`,
                }))}
              />
            </Field>
          </div>
          <div className="rounded-lg border">
            {!isLinkedIn && (
              <div className="border-b px-4 py-3 text-sm">
                <span className="text-muted-foreground">Subject: </span>
                <span className="font-medium">{fillTemplate(subject, values)}</span>
              </div>
            )}
            <div className="px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap">{fillTemplate(body, values)}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            Variables without a value are left as <code>{"{{placeholders}}"}</code>.
          </p>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete "${template.name}"?`}
        onConfirm={async () => {
          await remove.mutate(template.id)
          onDeleted()
        }}
      />
    </div>
  )
}
