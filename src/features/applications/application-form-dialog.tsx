"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Field, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { APPLICATION_STATUSES, PRIORITIES, WORK_MODES } from "@/lib/constants"
import { useCompanies, useContacts, useResumes } from "@/lib/store/queries"
import type { Application, ApplicationStatus } from "@/lib/types"
import { fromDateInput, toDateInput } from "@/lib/utils/dates"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateApplication, useUpdateApplication } from "./hooks"

const NEW_COMPANY = "__new"
const NONE = "__none"

const schema = z
  .object({
    companyId: z.string(),
    newCompany: z.string(),
    role: z.string().trim().min(2, "Role is required"),
    location: z.string().trim(),
    workMode: z.enum(["remote", "hybrid", "onsite"]),
    salary: z.string().trim(),
    status: z.enum(["wishlist", "applied", "recruiter", "technical", "hr", "offer", "rejected"]),
    priority: z.enum(["low", "medium", "high"]),
    appliedDate: z.string(),
    nextFollowUp: z.string(),
    jobUrl: z.union([z.literal(""), z.url("Enter a valid URL")]),
    jobId: z.string().trim(),
    source: z.string().trim(),
    recruiterId: z.string(),
    resumeId: z.string(),
    description: z.string(),
    notes: z.string(),
  })
  .refine(
    (v) => (v.companyId === NEW_COMPANY ? v.newCompany.trim().length > 1 : v.companyId.length > 0),
    { message: "Choose a company or add a new one", path: ["companyId"] },
  )

type FormValues = z.infer<typeof schema>

function defaults(app?: Application, status?: ApplicationStatus): FormValues {
  return {
    companyId: app?.companyId ?? "",
    newCompany: "",
    role: app?.role ?? "",
    location: app?.location ?? "",
    workMode: app?.workMode ?? "hybrid",
    salary: app?.salary ?? "",
    status: app?.status ?? status ?? "applied",
    priority: app?.priority ?? "medium",
    appliedDate: toDateInput(app?.appliedDate ?? (app ? undefined : new Date().toISOString())),
    nextFollowUp: toDateInput(app?.nextFollowUp),
    jobUrl: app?.jobUrl ?? "",
    jobId: app?.jobId ?? "",
    source: app?.source ?? "",
    recruiterId: app?.recruiterId ?? NONE,
    resumeId: app?.resumeId ?? NONE,
    description: app?.description ?? "",
    notes: app?.notes ?? "",
  }
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
  initialStatus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  application?: Application
  initialStatus?: ApplicationStatus
}) {
  const { data: companies = [] } = useCompanies()
  const { data: contacts = [] } = useContacts()
  const { data: resumes = [] } = useResumes()
  const create = useCreateApplication()
  const update = useUpdateApplication()
  const pending = create.isPending || update.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(application, initialStatus),
  })
  const { register, control, handleSubmit, formState } = form
  const errors = formState.errors
  const companyId = useWatch({ control, name: "companyId" })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      companyId: values.companyId,
      role: values.role,
      location: values.location || "Remote",
      workMode: values.workMode,
      salary: values.salary || undefined,
      status: values.status,
      priority: values.priority,
      appliedDate: fromDateInput(values.appliedDate),
      nextFollowUp: fromDateInput(values.nextFollowUp),
      jobUrl: values.jobUrl || undefined,
      jobId: values.jobId || undefined,
      source: values.source || undefined,
      recruiterId: values.recruiterId === NONE ? undefined : values.recruiterId,
      resumeId: values.resumeId === NONE ? undefined : values.resumeId,
      description: values.description || undefined,
      notes: values.notes,
    }
    const result = application
      ? await update.mutate(application.id, input)
      : await create.mutate(
          input,
          values.companyId === NEW_COMPANY
            ? {
                name: values.newCompany.trim(),
                industry: "—",
                website: "",
                location: values.location,
                size: "—",
                status: "active",
                description: "",
                notes: "",
              }
            : undefined,
        )
    if (result) onOpenChange(false)
  })

  const companyOptions = [
    ...companies.map((c) => ({ value: c.id, label: c.name })),
    ...(application ? [] : [{ value: NEW_COMPANY, label: "+ Add new company" }]),
  ]
  const contactOptions = [
    { value: NONE, label: "None" },
    ...contacts.map((c) => ({ value: c.id, label: `${c.name} · ${c.role}` })),
  ]
  const resumeOptions = [
    { value: NONE, label: "None" },
    ...resumes.map((r) => ({ value: r.id, label: `${r.title} (${r.version})` })),
  ]

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={application ? "Edit application" : "New application"}
      description={application ? undefined : "Track a role you're interested in or have applied to."}
      submitLabel={application ? "Save changes" : "Create application"}
      pending={pending}
      onSubmit={onSubmit}
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company" error={errors.companyId?.message}>
          <Controller
            control={control}
            name="companyId"
            render={({ field }) => (
              <SimpleSelect
                value={field.value || undefined}
                onValueChange={field.onChange}
                options={companyOptions}
                placeholder="Select company"
                invalid={!!errors.companyId}
              />
            )}
          />
        </Field>
        {companyId === NEW_COMPANY ? (
          <Field label="New company name" htmlFor="newCompany">
            <Input id="newCompany" placeholder="e.g. Stripe" autoFocus {...register("newCompany")} />
          </Field>
        ) : (
          <Field label="Role" htmlFor="role" error={errors.role?.message}>
            <Input id="role" placeholder="Frontend Engineer" aria-invalid={!!errors.role} {...register("role")} />
          </Field>
        )}
        {companyId === NEW_COMPANY && (
          <Field label="Role" htmlFor="role" error={errors.role?.message} className="sm:col-span-2">
            <Input id="role" placeholder="Frontend Engineer" aria-invalid={!!errors.role} {...register("role")} />
          </Field>
        )}
        <Field label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={APPLICATION_STATUSES} />
            )}
          />
        </Field>
        <Field label="Priority">
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={PRIORITIES} />
            )}
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <Input id="location" placeholder="Bengaluru" {...register("location")} />
        </Field>
        <Field label="Work mode">
          <Controller
            control={control}
            name="workMode"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={WORK_MODES} />
            )}
          />
        </Field>
        <Field label="Salary range" htmlFor="salary">
          <Input id="salary" placeholder="₹25–30 LPA" {...register("salary")} />
        </Field>
        <Field label="Source" htmlFor="source">
          <Input id="source" placeholder="LinkedIn, Referral…" {...register("source")} />
        </Field>
        <Field label="Applied date" htmlFor="appliedDate">
          <Input id="appliedDate" type="date" {...register("appliedDate")} />
        </Field>
        <Field label="Next follow-up" htmlFor="nextFollowUp">
          <Input id="nextFollowUp" type="date" {...register("nextFollowUp")} />
        </Field>
        <Field label="Job URL" htmlFor="jobUrl" error={errors.jobUrl?.message}>
          <Input id="jobUrl" placeholder="https://…" aria-invalid={!!errors.jobUrl} {...register("jobUrl")} />
        </Field>
        <Field label="Job ID" htmlFor="jobId">
          <Input id="jobId" placeholder="HM-48213" {...register("jobId")} />
        </Field>
        <Field label="Recruiter / contact">
          <Controller
            control={control}
            name="recruiterId"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={contactOptions} />
            )}
          />
        </Field>
        <Field label="Resume used">
          <Controller
            control={control}
            name="resumeId"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={resumeOptions} />
            )}
          />
        </Field>
      </div>
      <Field label="Job description" htmlFor="description">
        <Textarea id="description" rows={3} placeholder="Paste key responsibilities…" {...register("description")} />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" rows={2} placeholder="Anything to remember" {...register("notes")} />
      </Field>
    </FormDialog>
  )
}
