"use client"

import { useState } from "react"
import { ExternalLinkIcon, HandshakeIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, FilterChips, PersonAvatar, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { OptionBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { REFERRAL_STATUSES, referralStatus } from "@/lib/constants"
import { useById, useCompanies, useContacts, useProfile, useReferrals, useTemplates } from "@/lib/store/queries"
import type { Referral, ReferralStatus } from "@/lib/types"
import { formatDate, formatRelativeDay, isOverdue } from "@/lib/utils/dates"
import { hostname, matchesQuery } from "@/lib/utils/format"
import { LinkedInGlyph } from "@/features/integrations/integration-logos"
import { LinkedInMessageDialog } from "@/features/templates/linkedin-message-dialog"
import { fillTemplate, templateChannel } from "@/lib/utils/template"

import { useDeleteReferral, useSetReferralStatus } from "./hooks"
import { ReferralFormDialog } from "./referral-form-dialog"

export function ReferralsView() {
  const { openDialog } = useAppDialogs()
  const { data: referrals, isLoading, error, refetch } = useReferrals()
  const { data: contacts } = useContacts()
  const { data: companies } = useCompanies()
  const { data: templates = [] } = useTemplates()
  const { data: profile } = useProfile()
  const contactById = useById(contacts)
  const companyById = useById(companies)
  const setStatus = useSetReferralStatus()
  const remove = useDeleteReferral()

  const [query, setQuery] = useState("")
  const [status, setStatusFilter] = useState<ReferralStatus | "all">("all")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Referral | null>(null)
  const [deleting, setDeleting] = useState<Referral | null>(null)
  const [messaging, setMessaging] = useState<Referral | null>(null)
  const messagingContact = messaging ? contactById.get(messaging.contactId) : undefined

  const filtered = (referrals ?? [])
    .filter(
      (r) =>
        (status === "all" || r.status === status) &&
        matchesQuery(query, r.role, r.jobId, contactById.get(r.contactId)?.name, companyById.get(r.companyId)?.name),
    )
    .sort((a, b) => (b.requestDate ?? b.createdAt).localeCompare(a.requestDate ?? a.createdAt))

  const requestEmail = (referral: Referral) => {
    const contact = contactById.get(referral.contactId)
    const emailTemplates = templates.filter((t) => templateChannel(t) === "email")
    const template =
      emailTemplates.find((t) => t.id === "tpl_referral" || t.id === "tpl_default_referral_request") ??
      emailTemplates.find((t) => t.category === "referral")
    const values = {
      name: contact?.name.split(" ")[0],
      company: companyById.get(referral.companyId)?.name,
      role: referral.role,
      jobId: referral.jobId,
      jobUrl: referral.jobUrl,
      senderName: profile?.name,
    }
    openDialog({
      kind: "email",
      defaults: {
        to: contact ? [contact.email] : [],
        contactId: contact?.id,
        templateId: template?.id,
        subject: template ? fillTemplate(template.subject, values) : `Referral request — ${referral.role}`,
        body: template ? fillTemplate(template.body, values) : "",
      },
    })
    if (referral.status === "not_contacted") void setStatus.mutate(referral.id, "request_sent")
  }

  const menu = (referral: Referral) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Referral actions" />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => requestEmail(referral)}>
          <SendIcon /> Email request
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMessaging(referral)}>
          <LinkedInGlyph className="size-4" /> LinkedIn message
        </DropdownMenuItem>
        {referral.jobUrl && (
          <DropdownMenuItem render={<a href={referral.jobUrl} target="_blank" rel="noreferrer" />}>
            <ExternalLinkIcon /> Open job posting
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => setEditing(referral)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(referral)}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const statusSelect = (referral: Referral, className?: string) => (
    <SimpleSelect
      size="sm"
      value={referral.status}
      onValueChange={(value) => void setStatus.mutate(referral.id, value as ReferralStatus)}
      options={REFERRAL_STATUSES}
      className={cn("w-40", className)}
    />
  )

  return (
    <div>
      <PageHeader
        title="Referrals"
        description="Who's referring you where — and when to nudge them."
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Add referral
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search person, company, job ID…" />
          <FilterChips
            value={status}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All", count: referrals?.length },
              ...REFERRAL_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
                count: referrals?.filter((r) => r.status === s.value).length,
              })),
            ]}
          />
        </div>
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HandshakeIcon}
          title={referrals?.length ? "No referrals match" : "No referrals yet"}
          description="Ask someone in your network to refer you for a role."
          action={<Button onClick={() => setCreating(true)}><PlusIcon /> Add referral</Button>}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Person</TableHead>
                  <TableHead>Company & role</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((referral) => {
                  const contact = contactById.get(referral.contactId)
                  const due = referral.followUpDate && !["declined", "submitted"].includes(referral.status) && isOverdue(referral.followUpDate)
                  return (
                    <TableRow key={referral.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <PersonAvatar name={contact?.name ?? "?"} className="size-7 text-[10px]" />
                          <span className="font-medium">{contact?.name ?? "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{companyById.get(referral.companyId)?.name}</p>
                        <p className="text-xs text-muted-foreground">{referral.role}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs tabular-nums">{referral.jobId || "—"}</p>
                        {referral.jobUrl && (
                          <a href={referral.jobUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            {hostname(referral.jobUrl)} <ExternalLinkIcon className="size-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(referral.requestDate)}</TableCell>
                      <TableCell className={cn("text-muted-foreground", due && "font-medium text-destructive")}>
                        {referral.followUpDate ? formatRelativeDay(referral.followUpDate) : "—"}
                      </TableCell>
                      <TableCell>{statusSelect(referral)}</TableCell>
                      <TableCell>{menu(referral)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filtered.map((referral) => {
              const contact = contactById.get(referral.contactId)
              return (
                <li key={referral.id} className="space-y-3 rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <PersonAvatar name={contact?.name ?? "?"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{contact?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {companyById.get(referral.companyId)?.name} · {referral.role}
                      </p>
                    </div>
                    {menu(referral)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Job {referral.jobId || "—"}</span>
                    <span>Requested {formatDate(referral.requestDate)}</span>
                    {referral.followUpDate && <span>Follow up {formatRelativeDay(referral.followUpDate)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <OptionBadge option={referralStatus(referral.status)} />
                    {statusSelect(referral, "w-44")}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {creating && <ReferralFormDialog open onOpenChange={setCreating} />}
      {editing && <ReferralFormDialog key={editing.id} open referral={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      {messaging && messagingContact && (
        <LinkedInMessageDialog
          key={messaging.id}
          contact={messagingContact}
          job={{ companyId: messaging.companyId, role: messaging.role, jobId: messaging.jobId, jobUrl: messaging.jobUrl }}
          preferCategory="referral"
          onOpenChange={(o) => !o && setMessaging(null)}
          onCopied={() => {
            // Sending the message is the request.
            if (messaging.status === "not_contacted") void setStatus.mutate(messaging.id, "request_sent")
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete referral?"
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
