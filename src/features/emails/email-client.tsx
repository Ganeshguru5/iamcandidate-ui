"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  FileEditIcon,
  InboxIcon,
  LayoutTemplateIcon,
  MailIcon,
  MailOpenIcon,
  PenSquareIcon,
  ReplyIcon,
  SendIcon,
  StarIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog, PersonAvatar, SearchInput } from "@/components/shared/misc"
import { ListSkeleton } from "@/components/shared/skeletons"
import { OptionBadge, ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { applicationStatus } from "@/lib/constants"
import { useApplications, useById, useCompanies, useEmails, useIntegrations } from "@/lib/store/queries"
import type { Email, EmailFolder } from "@/lib/types"
import { formatDateTime, isToday, formatTime, formatDate } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"

import { useDeleteEmail, useMarkEmailRead, useToggleEmailStar } from "./hooks"

const FOLDERS: Array<{ value: EmailFolder; label: string; icon: LucideIcon }> = [
  { value: "inbox", label: "Inbox", icon: InboxIcon },
  { value: "sent", label: "Sent", icon: SendIcon },
  { value: "drafts", label: "Drafts", icon: FileEditIcon },
]

function shortDate(iso: string) {
  return isToday(iso) ? formatTime(iso) : formatDate(iso)
}

export function EmailClient() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const folder = (params.get("folder") as EmailFolder | null) ?? "inbox"
  const selectedId = params.get("email")

  const { openDialog } = useAppDialogs()
  const { data: emails, isLoading, error, refetch } = useEmails()
  const { data: integrations } = useIntegrations()
  const smtp = integrations?.find((i) => i.id === "smtp")
  const markRead = useMarkEmailRead()
  const star = useToggleEmailStar()
  const remove = useDeleteEmail()
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState<Email | null>(null)

  const navigate = (next: { folder?: EmailFolder; email?: string | null }) => {
    const search = new URLSearchParams(params)
    if (next.folder) search.set("folder", next.folder)
    if (next.email === null) search.delete("email")
    else if (next.email) search.set("email", next.email)
    router.replace(`${pathname}?${search}`, { scroll: false })
  }

  const list = (emails ?? [])
    .filter((e) => e.folder === folder)
    .filter((e) => matchesQuery(query, e.subject, e.body, e.from.name, e.from.email, ...e.to))
    .sort((a, b) => b.date.localeCompare(a.date))
  const selected = emails?.find((e) => e.id === selectedId)

  const selectedUnread = selected && !selected.read ? selected.id : null
  useEffect(() => {
    if (selectedUnread) void markRead.mutate(selectedUnread, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark once per opened email
  }, [selectedUnread])

  const open = (email: Email) => {
    if (email.folder === "drafts") {
      openDialog({
        kind: "email",
        defaults: {
          to: email.to,
          cc: email.cc,
          subject: email.subject,
          body: email.body,
          applicationId: email.applicationId,
          contactId: email.contactId,
          templateId: email.templateId,
          draftId: email.id,
        },
      })
      return
    }
    navigate({ email: email.id })
  }

  const reply = (email: Email) =>
    openDialog({
      kind: "email",
      defaults: {
        to: [email.folder === "sent" ? (email.to[0] ?? "") : email.from.email],
        subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
        body: `\n\n— On ${formatDateTime(email.date)}, ${email.from.name} wrote:\n> ${email.body.split("\n").join("\n> ")}`,
        applicationId: email.applicationId,
        contactId: email.contactId,
      },
    })

  const unreadCount = (emails ?? []).filter((e) => e.folder === "inbox" && !e.read).length

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] min-h-[520px] overflow-hidden rounded-xl border bg-card lg:h-[calc(100dvh-8rem)]">
      {/* Folders */}
      <aside className="hidden w-52 shrink-0 flex-col gap-1 border-r p-3 md:flex">
        <Button className="mb-2 w-full" onClick={() => openDialog({ kind: "email" })}>
          <PenSquareIcon /> Compose
        </Button>
        {FOLDERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => navigate({ folder: f.value, email: null })}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors",
              folder === f.value ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <f.icon className="size-4" />
            <span className="flex-1 text-left">{f.label}</span>
            <span className="text-xs tabular-nums opacity-70">
              {f.value === "inbox" ? unreadCount || "" : (emails ?? []).filter((e) => e.folder === f.value).length}
            </span>
          </button>
        ))}
        <Link
          href="/communication/templates"
          className="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <LayoutTemplateIcon className="size-4" /> Templates
        </Link>
        <div className="mt-auto rounded-lg border p-3 text-xs">
          <p className="font-medium">SMTP</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", smtp?.status === "connected" ? "bg-emerald-500" : "bg-amber-500")} />
            {smtp?.status === "connected" ? smtp.account : "Disconnected"}
          </p>
          <Link href="/settings?tab=email" className="mt-1.5 inline-block text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Settings
          </Link>
        </div>
      </aside>

      {/* List */}
      <section className={cn("flex w-full min-w-0 flex-col border-r lg:w-96 lg:shrink-0", selected && "hidden lg:flex")}>
        <div className="space-y-2 border-b p-3">
          <div className="flex gap-1 md:hidden">
            {FOLDERS.map((f) => (
              <Button key={f.value} size="sm" variant={folder === f.value ? "secondary" : "ghost"} onClick={() => navigate({ folder: f.value, email: null })}>
                {f.label}
              </Button>
            ))}
            <Button size="icon-sm" className="ml-auto" aria-label="Compose" onClick={() => openDialog({ kind: "email" })}>
              <PenSquareIcon />
            </Button>
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder={`Search ${folder}…`} className="sm:w-full" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="p-3"><ErrorState message={error} onRetry={refetch} /></div>
          ) : isLoading ? (
            <ListSkeleton rows={6} className="rounded-none border-0" />
          ) : list.length === 0 ? (
            <EmptyState compact className="m-3" icon={MailIcon} title={query ? "No matching emails" : `No emails in ${folder}`} />
          ) : (
            <ul className="divide-y">
              {list.map((email) => {
                const counterpart = email.folder === "inbox" ? email.from.name : `To: ${email.to.join(", ") || "(no recipient)"}`
                return (
                  <li key={email.id}>
                    <button
                      type="button"
                      onClick={() => open(email)}
                      className={cn(
                        "relative flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        selectedId === email.id && "bg-muted/70",
                      )}
                    >
                      {!email.read && <span className="absolute top-4.5 left-1.5 size-1.5 rounded-full bg-brand" aria-label="Unread" />}
                      <span className="flex items-center gap-2">
                        <span className={cn("min-w-0 flex-1 truncate text-sm", !email.read ? "font-semibold" : "font-medium")}>{counterpart}</span>
                        {email.starred && <StarIcon className="size-3 fill-amber-400 text-amber-400" />}
                        <span className="shrink-0 text-xs text-muted-foreground">{shortDate(email.date)}</span>
                      </span>
                      <span className={cn("truncate text-sm", !email.read ? "text-foreground" : "text-foreground/85")}>{email.subject || "(no subject)"}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{email.body.replace(/\s+/g, " ")}</span>
                      <span className="mt-1 flex gap-1.5">
                        {email.folder === "sent" && <ToneBadge tone="green">Sent</ToneBadge>}
                        {email.folder === "drafts" && <ToneBadge tone="amber">Draft</ToneBadge>}
                        {email.folder === "inbox" && !email.read && <ToneBadge tone="blue">New</ToneBadge>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Detail */}
      <section className={cn("min-w-0 flex-1 flex-col", selected ? "flex" : "hidden lg:flex")}>
        {selected ? (
          <EmailDetail
            email={selected}
            onBack={() => navigate({ email: null })}
            onReply={() => reply(selected)}
            onStar={() => void star.mutate(selected.id)}
            onUnread={() => {
              void markRead.mutate(selected.id, false)
              navigate({ email: null })
            }}
            onDelete={() => setDeleting(selected)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState className="w-full max-w-sm border-0" icon={MailOpenIcon} title="Select an email" description="Choose a message from the list to read it." />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete email?"
        onConfirm={async () => {
          if (!deleting) return
          navigate({ email: null })
          await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}

function EmailDetail({
  email,
  onBack,
  onReply,
  onStar,
  onUnread,
  onDelete,
}: {
  email: Email
  onBack: () => void
  onReply: () => void
  onStar: () => void
  onUnread: () => void
  onDelete: () => void
}) {
  const { data: applications } = useApplications()
  const { data: companies } = useCompanies()
  const appById = useById(applications)
  const companyById = useById(companies)
  const app = email.applicationId ? appById.get(email.applicationId) : undefined

  const action = (label: string, icon: LucideIcon, onClick: () => void, active?: boolean) => {
    const Icon = icon
    return (
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>
          <Icon className={cn(active && "fill-amber-400 text-amber-400")} />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1 border-b px-3 py-2">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onBack}>
          <ArrowLeftIcon /> Back
        </Button>
        <div className="ml-auto flex items-center gap-0.5">
          {action("Reply", ReplyIcon, onReply)}
          {action(email.starred ? "Unstar" : "Star", StarIcon, onStar, email.starred)}
          {email.folder === "inbox" && action("Mark as unread", MailIcon, onUnread)}
          {action("Delete", Trash2Icon, onDelete)}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-balance">{email.subject}</h2>
        <div className="mt-4 flex items-start gap-3">
          <PersonAvatar name={email.from.name} />
          <div className="min-w-0 flex-1 text-sm">
            <p>
              <span className="font-medium">{email.from.name}</span>{" "}
              <span className="text-muted-foreground">&lt;{email.from.email}&gt;</span>
            </p>
            <p className="text-xs text-muted-foreground">To: {email.to.join(", ")}</p>
            {email.cc.length > 0 && <p className="text-xs text-muted-foreground">Cc: {email.cc.join(", ")}</p>}
          </div>
          <time className="shrink-0 text-xs text-muted-foreground" dateTime={email.date}>
            {formatDateTime(email.date)}
          </time>
        </div>
        {app && (
          <Link
            href={`/career/applications/${app.id}`}
            className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60"
          >
            <BriefcaseBusinessIcon className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              Related application: <span className="font-medium">{companyById.get(app.companyId)?.name} — {app.role}</span>
            </span>
            <OptionBadge option={applicationStatus(app.status)} />
          </Link>
        )}
        <div className="mt-6 text-sm leading-relaxed whitespace-pre-wrap">{email.body}</div>
        <div className="mt-8">
          <Button variant="outline" onClick={onReply}>
            <ReplyIcon /> Reply
          </Button>
        </div>
      </div>
    </>
  )
}
