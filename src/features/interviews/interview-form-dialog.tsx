"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Field, parseTags, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from "@/lib/constants"
import { useApplications, useById, useCompanies } from "@/lib/store/queries"
import type { ID, Interview } from "@/lib/types"
import { fromDateTimeInput, toDateTimeInput } from "@/lib/utils/dates"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateInterview, useUpdateInterview } from "./hooks"

const schema = z.object({
  applicationId: z.string().min(1, "Choose an application"),
  type: z.enum(["recruiter_screen", "technical", "system_design", "behavioral", "hr", "final"]),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  scheduledAt: z.string().min(1, "Pick a date and time"),
  durationMinutes: z.string().regex(/^\d+$/, "Minutes"),
  interviewers: z.string(),
  meetingUrl: z.union([z.literal(""), z.url("Enter a valid URL")]),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

export function InterviewFormDialog({
  open,
  onOpenChange,
  interview,
  applicationId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview?: Interview
  applicationId?: ID
}) {
  const { data: applications = [] } = useApplications()
  const { data: companies } = useCompanies()
  const companyById = useById(companies)
  const create = useCreateInterview()
  const update = useUpdateInterview()

  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicationId: interview?.applicationId ?? applicationId ?? "",
      type: interview?.type ?? "technical",
      status: interview?.status ?? "scheduled",
      scheduledAt: toDateTimeInput(interview?.scheduledAt),
      durationMinutes: String(interview?.durationMinutes ?? 60),
      interviewers: interview?.interviewers.join(", ") ?? "",
      meetingUrl: interview?.meetingUrl ?? "",
      notes: interview?.notes ?? "",
    },
  })
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      applicationId: values.applicationId,
      type: values.type,
      status: values.status,
      scheduledAt: fromDateTimeInput(values.scheduledAt) ?? new Date().toISOString(),
      durationMinutes: Number(values.durationMinutes),
      interviewers: parseTags(values.interviewers),
      meetingUrl: values.meetingUrl || undefined,
      notes: values.notes,
    }
    const result = interview ? await update.mutate(interview.id, input) : await create.mutate(input)
    if (result) onOpenChange(false)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={interview ? "Edit interview" : "Schedule interview"}
      submitLabel={interview ? "Save changes" : "Schedule"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
    >
      <Field label="Application" error={errors.applicationId?.message}>
        <Controller
          control={control}
          name="applicationId"
          render={({ field }) => (
            <SimpleSelect
              value={field.value || undefined}
              onValueChange={field.onChange}
              placeholder="Select application"
              invalid={!!errors.applicationId}
              options={applications.map((a) => ({
                value: a.id,
                label: `${companyById.get(a.companyId)?.name ?? ""} — ${a.role}`,
              }))}
            />
          )}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={INTERVIEW_TYPES} />
            )}
          />
        </Field>
        <Field label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={INTERVIEW_STATUSES} />
            )}
          />
        </Field>
        <Field label="Date & time" htmlFor="i-when" error={errors.scheduledAt?.message}>
          <Input id="i-when" type="datetime-local" aria-invalid={!!errors.scheduledAt} {...register("scheduledAt")} />
        </Field>
        <Field label="Duration (minutes)" htmlFor="i-dur" error={errors.durationMinutes?.message}>
          <Input id="i-dur" inputMode="numeric" {...register("durationMinutes")} />
        </Field>
      </div>
      <Field label="Interviewers" htmlFor="i-who" hint="Comma separated">
        <Input id="i-who" placeholder="Johan Lind, Ritu Kapoor" {...register("interviewers")} />
      </Field>
      <Field label="Meeting link" htmlFor="i-url" error={errors.meetingUrl?.message}>
        <Input id="i-url" placeholder="https://meet…" {...register("meetingUrl")} />
      </Field>
      <Field label="Prep notes" htmlFor="i-notes">
        <Textarea id="i-notes" rows={3} {...register("notes")} />
      </Field>
    </FormDialog>
  )
}
