"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Field, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RELATIONSHIPS } from "@/lib/constants"
import { useCompanies } from "@/lib/store/queries"
import type { Contact } from "@/lib/types"
import { fromDateInput, toDateInput } from "@/lib/utils/dates"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateContact, useUpdateContact } from "./hooks"

const NONE = "__none"

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  role: z.string().trim(),
  companyId: z.string(),
  email: z.email("Enter a valid email"),
  phone: z.string().trim(),
  linkedin: z.union([z.literal(""), z.url("Enter a valid URL")]),
  relationship: z.enum(["recruiter", "hiring_manager", "employee", "referral", "friend", "professional"]),
  lastContacted: z.string(),
  nextFollowUp: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
}) {
  const { data: companies = [] } = useCompanies()
  const create = useCreateContact()
  const update = useUpdateContact()

  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: contact?.name ?? "",
      role: contact?.role ?? "",
      companyId: contact?.companyId ?? NONE,
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      linkedin: contact?.linkedin ?? "",
      relationship: contact?.relationship ?? "recruiter",
      lastContacted: toDateInput(contact?.lastContacted),
      nextFollowUp: toDateInput(contact?.nextFollowUp),
      notes: contact?.notes ?? "",
    },
  })
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      ...values,
      companyId: values.companyId === NONE ? undefined : values.companyId,
      phone: values.phone || undefined,
      linkedin: values.linkedin || undefined,
      lastContacted: fromDateInput(values.lastContacted),
      nextFollowUp: fromDateInput(values.nextFollowUp),
    }
    const result = contact
      ? await update.mutate(contact.id, input)
      : await create.mutate(input)
    if (result) onOpenChange(false)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? "Edit contact" : "New contact"}
      description={contact ? undefined : "Recruiters, hiring managers, referrers and friends."}
      submitLabel={contact ? "Save changes" : "Add contact"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="c-name" error={errors.name?.message}>
          <Input id="c-name" placeholder="Jordan Reyes" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Role / title" htmlFor="c-role">
          <Input id="c-role" placeholder="Technical Recruiter" {...register("role")} />
        </Field>
        <Field label="Company">
          <Controller
            control={control}
            name="companyId"
            render={({ field }) => (
              <SimpleSelect
                value={field.value}
                onValueChange={field.onChange}
                options={[{ value: NONE, label: "No company" }, ...companies.map((c) => ({ value: c.id, label: c.name }))]}
              />
            )}
          />
        </Field>
        <Field label="Relationship">
          <Controller
            control={control}
            name="relationship"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={RELATIONSHIPS} />
            )}
          />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
          <Input id="c-email" type="email" placeholder="name@company.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Phone" htmlFor="c-phone">
          <Input id="c-phone" placeholder="+91 …" {...register("phone")} />
        </Field>
        <Field label="LinkedIn" htmlFor="c-linkedin" error={errors.linkedin?.message} className="sm:col-span-2">
          <Input id="c-linkedin" placeholder="https://linkedin.com/in/…" {...register("linkedin")} />
        </Field>
        <Field label="Last contacted" htmlFor="c-last">
          <Input id="c-last" type="date" {...register("lastContacted")} />
        </Field>
        <Field label="Next follow-up" htmlFor="c-next">
          <Input id="c-next" type="date" {...register("nextFollowUp")} />
        </Field>
      </div>
      <Field label="Notes" htmlFor="c-notes">
        <Textarea id="c-notes" rows={3} {...register("notes")} />
      </Field>
    </FormDialog>
  )
}
