"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Field, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { REFERRAL_STATUSES } from "@/lib/constants"
import { useCompanies, useContacts } from "@/lib/store/queries"
import type { Referral } from "@/lib/types"
import { fromDateInput, toDateInput } from "@/lib/utils/dates"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateReferral, useUpdateReferral } from "./hooks"

const schema = z.object({
  contactId: z.string().min(1, "Choose who will refer you"),
  companyId: z.string().min(1, "Choose a company"),
  role: z.string().trim().min(2, "Role is required"),
  jobId: z.string().trim(),
  jobUrl: z.union([z.literal(""), z.url("Enter a valid URL")]),
  status: z.enum(["not_contacted", "request_sent", "accepted", "declined", "submitted", "no_response"]),
  requestDate: z.string(),
  followUpDate: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

export function ReferralFormDialog({
  open,
  onOpenChange,
  referral,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  referral?: Referral
}) {
  const { data: contacts = [] } = useContacts()
  const { data: companies = [] } = useCompanies()
  const create = useCreateReferral()
  const update = useUpdateReferral()

  const { register, control, handleSubmit, setValue, getValues, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contactId: referral?.contactId ?? "",
      companyId: referral?.companyId ?? "",
      role: referral?.role ?? "",
      jobId: referral?.jobId ?? "",
      jobUrl: referral?.jobUrl ?? "",
      status: referral?.status ?? "not_contacted",
      requestDate: toDateInput(referral?.requestDate),
      followUpDate: toDateInput(referral?.followUpDate),
      notes: referral?.notes ?? "",
    },
  })
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      ...values,
      requestDate: fromDateInput(values.requestDate),
      followUpDate: fromDateInput(values.followUpDate),
    }
    const result = referral ? await update.mutate(referral.id, input) : await create.mutate(input)
    if (result) onOpenChange(false)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={referral ? "Edit referral" : "New referral"}
      description={referral ? undefined : "Track a referral request with someone in your network."}
      submitLabel={referral ? "Save changes" : "Add referral"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Person" error={errors.contactId?.message}>
          <Controller
            control={control}
            name="contactId"
            render={({ field }) => (
              <SimpleSelect
                value={field.value || undefined}
                placeholder="Select contact"
                invalid={!!errors.contactId}
                onValueChange={(id) => {
                  field.onChange(id)
                  const contact = contacts.find((c) => c.id === id)
                  if (contact?.companyId && !getValues("companyId")) {
                    setValue("companyId", contact.companyId, { shouldValidate: true })
                  }
                }}
                options={contacts.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          />
        </Field>
        <Field label="Company" error={errors.companyId?.message}>
          <Controller
            control={control}
            name="companyId"
            render={({ field }) => (
              <SimpleSelect
                value={field.value || undefined}
                placeholder="Select company"
                invalid={!!errors.companyId}
                onValueChange={field.onChange}
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          />
        </Field>
        <Field label="Role" htmlFor="r-role" error={errors.role?.message} className="sm:col-span-2">
          <Input id="r-role" placeholder="Frontend Engineer" aria-invalid={!!errors.role} {...register("role")} />
        </Field>
        <Field label="Job ID" htmlFor="r-jobid">
          <Input id="r-jobid" placeholder="HM-48213" {...register("jobId")} />
        </Field>
        <Field label="Job URL" htmlFor="r-url" error={errors.jobUrl?.message}>
          <Input id="r-url" placeholder="https://…" {...register("jobUrl")} />
        </Field>
        <Field label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={REFERRAL_STATUSES} />
            )}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Requested" htmlFor="r-req">
            <Input id="r-req" type="date" {...register("requestDate")} />
          </Field>
          <Field label="Follow up" htmlFor="r-fu">
            <Input id="r-fu" type="date" {...register("followUpDate")} />
          </Field>
        </div>
      </div>
      <Field label="Notes" htmlFor="r-notes">
        <Textarea id="r-notes" rows={2} {...register("notes")} />
      </Field>
    </FormDialog>
  )
}
