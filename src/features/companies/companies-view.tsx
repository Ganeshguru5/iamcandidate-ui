"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Building2Icon, GlobeIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog, FilterChips, Monogram, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
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
import { COMPANY_STATUSES, companyStatus } from "@/lib/constants"
import { useApplications, useCompanies, useContacts } from "@/lib/store/queries"
import type { Company, CompanyStatus } from "@/lib/types"
import { hostname, matchesQuery } from "@/lib/utils/format"

import { CompanyFormDialog } from "./company-form-dialog"
import { useDeleteCompany } from "./hooks"

export function CompaniesView() {
  const { data: companies, isLoading, error, refetch } = useCompanies()
  const { data: applications = [] } = useApplications()
  const { data: contacts = [] } = useContacts()
  const remove = useDeleteCompany()

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<CompanyStatus | "all">("all")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState<Company | null>(null)

  const counts = useMemo(() => {
    const map = new Map<string, { apps: number; contacts: number }>()
    for (const c of companies ?? []) map.set(c.id, { apps: 0, contacts: 0 })
    for (const a of applications) {
      const entry = map.get(a.companyId)
      if (entry) entry.apps++
    }
    for (const c of contacts) {
      const entry = c.companyId ? map.get(c.companyId) : undefined
      if (entry) entry.contacts++
    }
    return map
  }, [companies, applications, contacts])

  const filtered = (companies ?? [])
    .filter((c) => (status === "all" || c.status === status) && matchesQuery(query, c.name, c.industry, c.location))
    .sort((a, b) => a.name.localeCompare(b.name))

  const menu = (company: Company) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${company.name}`} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setEditing(company)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        {company.website && (
          <DropdownMenuItem render={<a href={company.website} target="_blank" rel="noreferrer" />}>
            <GlobeIcon /> Website
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(company)}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Organizations you're researching, targeting or interviewing with."
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Add company
          </Button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search companies…" />
          <FilterChips
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: companies?.length },
              ...COMPANY_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
                count: companies?.filter((c) => c.status === s.value).length,
              })),
            ]}
          />
        </div>
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2Icon}
          title={companies?.length ? "No companies match" : "No companies yet"}
          description={companies?.length ? "Try a different search or filter." : "Add companies you want to work at."}
          action={!companies?.length && <Button onClick={() => setCreating(true)}><PlusIcon /> Add company</Button>}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-right">Applications</TableHead>
                  <TableHead className="text-right">Contacts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="pl-4">
                      <Link href={`/career/companies/${company.id}`} className="flex items-center gap-3">
                        <Monogram name={company.name} />
                        <span>
                          <span className="block font-medium hover:underline">{company.name}</span>
                          <span className="block text-xs text-muted-foreground">{company.location}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{company.industry}</TableCell>
                    <TableCell className="text-right tabular-nums">{counts.get(company.id)?.apps ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{counts.get(company.id)?.contacts ?? 0}</TableCell>
                    <TableCell>
                      <OptionBadge option={companyStatus(company.status)} />
                    </TableCell>
                    <TableCell>
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground hover:underline">
                          {hostname(company.website)}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{menu(company)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:hidden">
            {filtered.map((company) => (
              <li key={company.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <Monogram name={company.name} />
                <Link href={`/career/companies/${company.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{company.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {company.industry} · {counts.get(company.id)?.apps ?? 0} apps · {counts.get(company.id)?.contacts ?? 0} contacts
                  </p>
                </Link>
                <OptionBadge option={companyStatus(company.status)} />
                {menu(company)}
              </li>
            ))}
          </ul>
        </>
      )}

      {creating && <CompanyFormDialog open onOpenChange={setCreating} />}
      {editing && <CompanyFormDialog key={editing.id} open company={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "company"}?`}
        description="Applications and contacts linked to it will stay but lose their company link."
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}
