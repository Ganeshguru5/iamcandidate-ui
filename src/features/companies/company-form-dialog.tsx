"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Field, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { COMPANY_STATUSES } from "@/lib/constants"
import type { Company } from "@/lib/types"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateCompany, useUpdateCompany } from "./hooks"

const schema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  industry: z.string().trim(),
  website: z.union([z.literal(""), z.url("Enter a valid URL")]),
  location: z.string().trim(),
  size: z.string().trim(),
  status: z.enum(["researching", "target", "active", "paused", "closed"]),
  description: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company
}) {
  const create = useCreateCompany()
  const update = useUpdateCompany()
  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company?.name ?? "",
      industry: company?.industry ?? "",
      website: company?.website ?? "",
      location: company?.location ?? "",
      size: company?.size ?? "",
      status: company?.status ?? "researching",
      description: company?.description ?? "",
      notes: company?.notes ?? "",
    },
  })
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    const result = company ? await update.mutate(company.id, values) : await create.mutate(values)
    if (result) onOpenChange(false)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={company ? "Edit company" : "New company"}
      submitLabel={company ? "Save changes" : "Add company"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="co-name" error={errors.name?.message}>
          <Input id="co-name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Industry" htmlFor="co-industry">
          <Input id="co-industry" placeholder="SaaS" {...register("industry")} />
        </Field>
        <Field label="Website" htmlFor="co-web" error={errors.website?.message}>
          <Input id="co-web" placeholder="https://…" {...register("website")} />
        </Field>
        <Field label="Location" htmlFor="co-loc">
          <Input id="co-loc" placeholder="Chennai, India" {...register("location")} />
        </Field>
        <Field label="Company size" htmlFor="co-size">
          <Input id="co-size" placeholder="1,000–5,000" {...register("size")} />
        </Field>
        <Field label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={COMPANY_STATUSES} />
            )}
          />
        </Field>
      </div>
      <Field label="Description" htmlFor="co-desc">
        <Textarea id="co-desc" rows={3} {...register("description")} />
      </Field>
      <Field label="Notes" htmlFor="co-notes">
        <Textarea id="co-notes" rows={2} {...register("notes")} />
      </Field>
    </FormDialog>
  )
}
