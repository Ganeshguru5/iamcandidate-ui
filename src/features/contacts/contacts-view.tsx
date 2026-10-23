"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  HandshakeIcon,
  LinkIcon,
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { cn } from "cn"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, PersonAvatar, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { DetailList, DetailRow } from "@/components/shared/panel"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { applicationStatus, referralStatus, RELATIONSHIPS, relationship } from "@/lib/constants"
import { useApplications, useById, useCompanies, useContacts, useReferrals } from "@/lib/store/queries"
import type { Contact } from "@/lib/types"
import { formatDate, formatRelativeDay, isOverdue } from "@/lib/utils/dates"
import { hostname, matchesQuery } from "@/lib/utils/format"

import { LinkedInGlyph } from "@/features/integrations/integration-logos"
import { ReferralFormDialog } from "@/features/referrals/referral-form-dialog"
import { LinkedInMessageDialog } from "@/features/templates/linkedin-message-dialog"

import { ContactFormDialog } from "./contact-form-dialog"
import { useDeleteContact } from "./hooks"

export function ContactsView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const selectedId = params.get("contact")

  const { openDialog } = useAppDialogs()
  const { data: contacts, isLoading, error, refetch } = useContacts()
  const { data: companies } = useCompanies()
  const companyById = useById(companies)
  const remove = useDeleteContact()

  const [query, setQuery] = useState("")
  const [rel, setRel] = useState("all")
  const [followUpsOnly, setFollowUpsOnly] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const [referring, setReferring] = useState<Contact | null>(null)
  const [messaging, setMessaging] = useState<Contact | null>(null)

  const select = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set("contact", id)
    else next.delete("contact")
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }

  const filtered = (contacts ?? [])
    .filter((c) => {
      const company = c.companyId ? companyById.get(c.companyId)?.name : undefined
      return (
        matchesQuery(query, c.name, c.email, c.role, company) &&
        (rel === "all" || c.relationship === rel) &&
        (!followUpsOnly || !!c.nextFollowUp)
      )
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const selected = contacts?.find((c) => c.id === selectedId)

  const email = (contact: Contact) =>
    openDialog({ kind: "email", defaults: { to: [contact.email], contactId: contact.id } })

  const menu = (contact: Contact) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${contact.name}`} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => email(contact)}>
          <MailIcon /> Send email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMessaging(contact)}>
          <LinkedInGlyph className="size-4" /> LinkedIn message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setReferring(contact)}>
          <HandshakeIcon /> Create referral
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditing(contact)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(contact)}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const followUpCell = (contact: Contact) =>
    contact.nextFollowUp ? (
      <span className={cn(isOverdue(contact.nextFollowUp) && "font-medium text-destructive")}>
        {formatRelativeDay(contact.nextFollowUp)}
      </span>
    ) : (
      <span className="text-muted-foreground">—</span>
    )

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Recruiters, hiring managers, referrers and your professional network."
        actions={
          <Button onClick={() => openDialog({ kind: "contact" })}>
            <PlusIcon /> Add contact
          </Button>
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, company…" />
          <SimpleSelect
            value={rel}
            onValueChange={setRel}
            options={[{ value: "all", label: "All relationships" }, ...RELATIONSHIPS]}
            className="sm:w-52"
          />
          <Button variant={followUpsOnly ? "secondary" : "outline"} onClick={() => setFollowUpsOnly(!followUpsOnly)} aria-pressed={followUpsOnly}>
            Has follow-up
          </Button>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={contacts?.length ? "No contacts match" : "No contacts yet"}
          description={contacts?.length ? "Try clearing the filters." : "Add recruiters and referrers to keep track of conversations."}
          action={<Button onClick={() => openDialog({ kind: "contact" })}><PlusIcon /> Add contact</Button>}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Last contacted</TableHead>
                  <TableHead>Next follow-up</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contact) => (
                  <TableRow key={contact.id} className="cursor-pointer" onClick={() => select(contact.id)}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={contact.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{contact.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{contact.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.companyId ? companyById.get(contact.companyId)?.name : "—"}
                    </TableCell>
                    <TableCell>
                      <OptionBadge option={relationship(contact.relationship)} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{contact.email}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeDay(contact.lastContacted)}</TableCell>
                    <TableCell>{followUpCell(contact)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>{menu(contact)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:hidden">
            {filtered.map((contact) => (
              <li key={contact.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => select(contact.id)}>
                  <PersonAvatar name={contact.name} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{contact.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {contact.role}
                      {contact.companyId && ` · ${companyById.get(contact.companyId)?.name}`}
                    </span>
                    {contact.nextFollowUp && <span className="mt-1 block text-xs">Follow up {followUpCell(contact)}</span>}
                  </span>
                </button>
                {menu(contact)}
              </li>
            ))}
          </ul>
        </>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && select(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {selected && (
            <ContactDetail
              contact={selected}
              companyName={selected.companyId ? companyById.get(selected.companyId)?.name : undefined}
              onEmail={() => email(selected)}
              onReferral={() => setReferring(selected)}
              onLinkedIn={() => setMessaging(selected)}
              onEdit={() => setEditing(selected)}
              onDelete={() => setDeleting(selected)}
            />
          )}
        </SheetContent>
      </Sheet>

      {editing && <ContactFormDialog key={editing.id} open contact={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      {messaging && (
        <LinkedInMessageDialog
          key={messaging.id}
          contact={messaging}
          preferCategory={messaging.relationship === "recruiter" ? "outreach" : "referral"}
          onOpenChange={(o) => !o && setMessaging(null)}
        />
      )}
      {referring && (
        <ReferralFormDialog
          key={referring.id}
          open
          defaults={{ contactId: referring.id, companyId: referring.companyId }}
          onOpenChange={(o) => !o && setReferring(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "contact"}?`}
        description="This contact will be removed from referrals and email suggestions."
        onConfirm={async () => {
          if (!deleting) return
          if (deleting.id === selectedId) select(null)
          await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}

function ContactDetail({
  contact,
  companyName,
  onEmail,
  onReferral,
  onLinkedIn,
  onEdit,
  onDelete,
}: {
  contact: Contact
  companyName?: string
  onEmail: () => void
  onReferral: () => void
  onLinkedIn: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { data: applications = [] } = useApplications()
  const { data: referrals = [] } = useReferrals()
  const relatedApps = applications.filter((a) => a.recruiterId === contact.id)
  const relatedReferrals = referrals.filter((r) => r.contactId === contact.id)

  return (
    <>
      <SheetHeader className="border-b p-5">
        <div className="flex items-center gap-3">
          <PersonAvatar name={contact.name} className="size-11 text-sm" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-base">{contact.name}</SheetTitle>
            <SheetDescription className="truncate">
              {contact.role}
              {companyName && ` · ${companyName}`}
            </SheetDescription>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={onEmail}>
            <MailIcon /> Email
          </Button>
          <Button size="sm" variant="outline" onClick={onLinkedIn} aria-label="LinkedIn message">
            <LinkedInGlyph className="size-3.5" /> Message
          </Button>
          <Button size="sm" variant="outline" onClick={onReferral}>
            <HandshakeIcon /> Create referral
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <PencilIcon /> Edit
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onDelete} aria-label="Delete contact">
            <Trash2Icon />
          </Button>
        </div>
      </SheetHeader>
      <div className="space-y-6 p-5">
        <DetailList>
          <DetailRow label="Relationship">
            <OptionBadge option={relationship(contact.relationship)} />
          </DetailRow>
          <DetailRow label="Email">
            <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
          </DetailRow>
          {contact.phone && (
            <DetailRow label="Phone">
              <span className="inline-flex items-center gap-1"><PhoneIcon className="size-3" /> {contact.phone}</span>
            </DetailRow>
          )}
          <DetailRow label="LinkedIn">
            {contact.linkedin ? (
              <a href={contact.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                <LinkIcon className="size-3" /> {hostname(contact.linkedin)}
              </a>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Last contacted">{formatDate(contact.lastContacted, true)}</DetailRow>
          <DetailRow label="Next follow-up">
            <span className={cn(contact.nextFollowUp && isOverdue(contact.nextFollowUp) && "font-medium text-destructive")}>
              {contact.nextFollowUp ? formatRelativeDay(contact.nextFollowUp) : "—"}
            </span>
          </DetailRow>
        </DetailList>

        {contact.notes && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Notes</p>
            <p className="text-sm leading-relaxed">{contact.notes}</p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Applications ({relatedApps.length})</p>
          {relatedApps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not linked to any application.</p>
          ) : (
            <ul className="space-y-1.5">
              {relatedApps.map((app) => (
                <li key={app.id}>
                  <Link href={`/career/applications/${app.id}`} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50">
                    <span className="truncate">{app.role}</span>
                    <OptionBadge option={applicationStatus(app.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Referrals ({relatedReferrals.length})</p>
          {relatedReferrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referral requests.</p>
          ) : (
            <ul className="space-y-1.5">
              {relatedReferrals.map((ref) => (
                <li key={ref.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate">{ref.role}</span>
                  <OptionBadge option={referralStatus(ref.status)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
