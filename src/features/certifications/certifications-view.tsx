"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import {
  AwardIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { z } from "zod"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field, parseTags, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { ConfirmDialog, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { Tag } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { certificationService } from "@/lib/services"
import { createCrudHooks } from "@/lib/store/crud-hooks"
import { QK, useById, useCertifications, useDocuments } from "@/lib/store/queries"
import type { Certification } from "@/lib/types"
import { formatDate, fromDateInput, toDateInput } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"
import { zodResolver } from "@/lib/utils/zod-resolver"

const certHooks = createCrudHooks(certificationService, QK.certifications, "Certification")

export function CertificationsView() {
  const { data: certs, isLoading, error, refetch } = useCertifications()
  const { data: documents } = useDocuments()
  const docById = useById(documents)
  const remove = certHooks.useDelete()
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Certification | null>(null)
  const [deleting, setDeleting] = useState<Certification | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const list = (certs ?? [])
    .filter((c) => matchesQuery(query, c.name, c.issuer, c.credentialId, ...c.skills))
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))

  const copy = async (cert: Certification) => {
    try {
      await navigator.clipboard.writeText(cert.credentialId)
    } catch {
      // Clipboard may be unavailable; the visual confirmation still helps.
    }
    setCopied(cert.id)
    window.setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <PageHeader
        title="Certifications"
        description="Courses and credentials, with links to verify them."
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Add certification
          </Button>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search certifications…" />
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={AwardIcon} title={query ? "No certifications match" : "No certifications yet"} action={<Button onClick={() => setCreating(true)}><PlusIcon /> Add certification</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((cert) => {
            const doc = cert.documentId ? docById.get(cert.documentId) : undefined
            return (
              <article key={cert.id} className="flex flex-col rounded-xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                    <AwardIcon className="size-5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm leading-snug font-medium">{cert.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{cert.issuer}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${cert.name}`} />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setEditing(cert)}>
                        <PencilIcon /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(cert)}>
                        <Trash2Icon /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Issued</dt>
                    <dd className="mt-0.5 font-medium">{formatDate(cert.issueDate, true)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Expires</dt>
                    <dd className="mt-0.5 font-medium">{cert.expiryDate ? formatDate(cert.expiryDate, true) : "No expiry"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Credential ID</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5">
                      <code className="truncate font-mono text-[11px]">{cert.credentialId}</code>
                      <button type="button" aria-label="Copy credential ID" onClick={() => void copy(cert)} className="text-muted-foreground hover:text-foreground">
                        {copied === cert.id ? <CheckIcon className="size-3.5 text-success" /> : <CopyIcon className="size-3.5" />}
                      </button>
                    </dd>
                  </div>
                </dl>
                {cert.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {cert.skills.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                )}
                <div className="min-h-4 flex-1" />
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" nativeButton={false} render={<a href={cert.credentialUrl} target="_blank" rel="noreferrer" />}>
                    <ExternalLinkIcon /> Verify
                  </Button>
                  {doc && (
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/documents?file=${doc.id}`} />}>
                      <FileTextIcon /> Document
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {creating && <CertificationFormDialog open onOpenChange={setCreating} />}
      {editing && <CertificationFormDialog key={editing.id} open cert={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  issuer: z.string().trim().min(1, "Issuer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string(),
  credentialId: z.string().trim(),
  credentialUrl: z.union([z.literal(""), z.url("Enter a valid URL")]),
  documentId: z.string(),
  skills: z.string(),
})

type FormValues = z.infer<typeof schema>
const NONE = "__none"

function CertificationFormDialog({
  open,
  onOpenChange,
  cert,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cert?: Certification
}) {
  const { data: documents = [] } = useDocuments()
  const create = certHooks.useCreate()
  const update = certHooks.useUpdate()
  const { register, handleSubmit, formState, setValue, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: cert?.name ?? "",
      issuer: cert?.issuer ?? "",
      issueDate: toDateInput(cert?.issueDate),
      expiryDate: toDateInput(cert?.expiryDate),
      credentialId: cert?.credentialId ?? "",
      credentialUrl: cert?.credentialUrl ?? "",
      documentId: cert?.documentId ?? NONE,
      skills: cert?.skills.join(", ") ?? "",
    },
  })
  const [documentId, setDocumentId] = useState(getValues("documentId"))
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      issuer: values.issuer,
      issueDate: fromDateInput(values.issueDate) ?? new Date().toISOString(),
      expiryDate: fromDateInput(values.expiryDate),
      credentialId: values.credentialId,
      credentialUrl: values.credentialUrl,
      documentId: values.documentId === NONE ? undefined : values.documentId,
      skills: parseTags(values.skills),
    }
    const result = cert ? await update.mutate(cert.id, input) : await create.mutate(input)
    if (result) onOpenChange(false)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={cert ? "Edit certification" : "Add certification"}
      submitLabel={cert ? "Save" : "Add"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
    >
      <Field label="Name" htmlFor="ce-name" error={errors.name?.message}>
        <Input id="ce-name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Issuer" htmlFor="ce-issuer" error={errors.issuer?.message}>
          <Input id="ce-issuer" {...register("issuer")} />
        </Field>
        <Field label="Issued" htmlFor="ce-issued" error={errors.issueDate?.message}>
          <Input id="ce-issued" type="date" {...register("issueDate")} />
        </Field>
        <Field label="Expires" htmlFor="ce-exp">
          <Input id="ce-exp" type="date" {...register("expiryDate")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Credential ID" htmlFor="ce-id">
          <Input id="ce-id" {...register("credentialId")} />
        </Field>
        <Field label="Credential URL" htmlFor="ce-url" error={errors.credentialUrl?.message}>
          <Input id="ce-url" placeholder="https://…" {...register("credentialUrl")} />
        </Field>
      </div>
      <Field label="Linked document">
        <SimpleSelect
          value={documentId}
          onValueChange={(id) => {
            setDocumentId(id)
            setValue("documentId", id)
          }}
          options={[{ value: NONE, label: "None" }, ...documents.filter((d) => d.category === "certificates").map((d) => ({ value: d.id, label: d.name }))]}
        />
      </Field>
      <Field label="Skills" htmlFor="ce-skills" hint="Comma separated">
        <Input id="ce-skills" {...register("skills")} />
      </Field>
    </FormDialog>
  )
}
