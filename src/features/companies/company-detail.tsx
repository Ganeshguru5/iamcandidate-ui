"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  CalendarClockIcon,
  CheckIcon,
  GlobeIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SearchXIcon,
  UsersIcon,
} from "lucide-react"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState } from "@/components/shared/empty-state"
import { Monogram, PersonAvatar, StatCard } from "@/components/shared/misc"
import { DetailList, DetailRow, Panel } from "@/components/shared/panel"
import { PageSkeleton } from "@/components/shared/skeletons"
import { OptionBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  applicationStatus,
  companyStatus,
  interviewStatus,
  interviewType,
  relationship,
} from "@/lib/constants"
import {
  useApplications,
  useCompanies,
  useContacts,
  useEmails,
  useInterviews,
} from "@/lib/store/queries"
import type { Company } from "@/lib/types"
import { formatDate, formatDateTime } from "@/lib/utils/dates"
import { hostname } from "@/lib/utils/format"

import { CompanyFormDialog } from "./company-form-dialog"
import { useUpdateCompany } from "./hooks"

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: companies, isLoading } = useCompanies()
  const company = companies?.find((c) => c.id === id)
  if (isLoading) return <PageSkeleton />
  if (!company) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Company not found"
        action={
          <Button variant="outline" onClick={() => router.push("/career/companies")}>
            <ArrowLeftIcon /> Back to companies
          </Button>
        }
      />
    )
  }
  return <CompanyDetailView company={company} />
}

function CompanyDetailView({ company }: { company: Company }) {
  const { openDialog } = useAppDialogs()
  const { data: applications = [] } = useApplications()
  const { data: contacts = [] } = useContacts()
  const { data: emails = [] } = useEmails()
  const { data: interviews = [] } = useInterviews()
  const update = useUpdateCompany()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(company.notes)

  const apps = applications.filter((a) => a.companyId === company.id)
  const appIds = new Set(apps.map((a) => a.id))
  const people = contacts.filter((c) => c.companyId === company.id)
  const peopleEmails = new Set(people.map((p) => p.email))
  const mail = emails
    .filter((e) => (e.applicationId && appIds.has(e.applicationId)) || peopleEmails.has(e.from.email) || e.to.some((t) => peopleEmails.has(t)))
    .sort((a, b) => b.date.localeCompare(a.date))
  const rounds = interviews.filter((i) => appIds.has(i.applicationId)).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  const appById = new Map(apps.map((a) => [a.id, a]))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/career/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Companies
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Monogram name={company.name} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{company.industry}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3.5" /> {company.location}
                </span>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                    <GlobeIcon className="size-3.5" /> {hostname(company.website)}
                  </a>
                )}
                <OptionBadge option={companyStatus(company.status)} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openDialog({ kind: "application" })}>
              <PlusIcon /> Application
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilIcon /> Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Applications" value={apps.length} icon={BriefcaseBusinessIcon} hint={`${apps.filter((a) => !["wishlist", "rejected"].includes(a.status)).length} active`} />
        <StatCard label="Contacts" value={people.length} icon={UsersIcon} />
        <StatCard label="Emails" value={mail.length} icon={MailIcon} />
        <StatCard label="Interviews" value={rounds.length} icon={CalendarClockIcon} hint={`${rounds.filter((r) => r.status === "scheduled").length} upcoming`} />
      </div>

      <Tabs defaultValue="overview">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications · {apps.length}</TabsTrigger>
            <TabsTrigger value="contacts">Contacts · {people.length}</TabsTrigger>
            <TabsTrigger value="emails">Emails · {mail.length}</TabsTrigger>
            <TabsTrigger value="interviews">Interviews · {rounds.length}</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <Panel title="About">
            <p className="mb-4 text-sm leading-relaxed text-foreground/90">{company.description || "No description yet."}</p>
            <DetailList className="sm:grid-cols-2">
              <DetailRow label="Industry">{company.industry}</DetailRow>
              <DetailRow label="Size">{company.size}</DetailRow>
              <DetailRow label="Location">{company.location}</DetailRow>
              <DetailRow label="Tracking since">{formatDate(company.createdAt, true)}</DetailRow>
            </DetailList>
          </Panel>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          {apps.length === 0 ? (
            <EmptyState compact icon={BriefcaseBusinessIcon} title="No applications here yet" />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {apps.map((app) => (
                <li key={app.id}>
                  <Link href={`/career/applications/${app.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{app.role}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.location} · applied {formatDate(app.appliedDate)}
                      </p>
                    </div>
                    <OptionBadge option={applicationStatus(app.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          {people.length === 0 ? (
            <EmptyState
              compact
              icon={UsersIcon}
              title="No contacts at this company"
              action={<Button variant="outline" size="sm" onClick={() => openDialog({ kind: "contact" })}><PlusIcon /> Add contact</Button>}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {people.map((person) => (
                <li key={person.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <PersonAvatar name={person.name} />
                  <Link href={`/career/contacts?contact=${person.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium hover:underline">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{person.role}</p>
                  </Link>
                  <OptionBadge option={relationship(person.relationship)} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Email ${person.name}`}
                    onClick={() => openDialog({ kind: "email", defaults: { to: [person.email], contactId: person.id } })}
                  >
                    <MailIcon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          {mail.length === 0 ? (
            <EmptyState compact icon={MailIcon} title="No emails with this company" />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {mail.map((email) => (
                <li key={email.id}>
                  <Link href={`/communication/email?folder=${email.folder}&email=${email.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                    <MailIcon className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{email.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">{email.folder === "sent" ? `To ${email.to[0]}` : email.from.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(email.date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="interviews" className="mt-4">
          {rounds.length === 0 ? (
            <EmptyState compact icon={CalendarClockIcon} title="No interviews yet" />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {rounds.map((round) => (
                <li key={round.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {interviewType(round.type).label} · {appById.get(round.applicationId)?.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(round.scheduledAt)} · {round.interviewers.join(", ")}
                    </p>
                  </div>
                  <OptionBadge option={interviewStatus(round.status)} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Panel
            title="Notes"
            action={
              notes !== company.notes && (
                <Button size="sm" disabled={update.isPending} onClick={() => void update.mutate(company.id, { notes })}>
                  {update.isPending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />} Save
                </Button>
              )
            }
          >
            <Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Culture, tech stack, team structure, interview process…" />
          </Panel>
        </TabsContent>
      </Tabs>

      {editing && <CompanyFormDialog open company={company} onOpenChange={setEditing} />}
    </div>
  )
}
