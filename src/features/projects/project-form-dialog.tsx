"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Field, parseTags, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PROJECT_STATUSES } from "@/lib/constants"
import type { Project } from "@/lib/types"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateProject, useUpdateProject } from "./hooks"

const optionalUrl = z.union([z.literal(""), z.url("Enter a valid URL")])

const schema = z.object({
  name: z.string().trim().min(2, "Project name is required"),
  description: z.string(),
  status: z.enum(["idea", "planning", "development", "completed", "archived"]),
  progress: z.string().regex(/^\d{1,3}$/, "0–100").refine((v) => Number(v) <= 100, "0–100"),
  technologies: z.string(),
  repository: optionalUrl,
  deployment: optionalUrl,
})

type FormValues = z.infer<typeof schema>

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
}) {
  const create = useCreateProject()
  const update = useUpdateProject()
  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "idea",
      progress: String(project?.progress ?? 0),
      technologies: project?.technologies.join(", ") ?? "",
      repository: project?.repository ?? "",
      deployment: project?.deployment ?? "",
    },
  })
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      description: values.description,
      status: values.status,
      progress: Number(values.progress),
      technologies: parseTags(values.technologies),
      repository: values.repository || undefined,
      deployment: values.deployment || undefined,
      startedAt: project?.startedAt ?? new Date().toISOString(),
    }
    const result = project ? await update.mutate(project.id, input) : await create.mutate(input)
    if (result) onOpenChange(false)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={project ? "Edit project" : "New project"}
      submitLabel={project ? "Save changes" : "Create project"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
    >
      <Field label="Name" htmlFor="p-name" error={errors.name?.message}>
        <Input id="p-name" placeholder="Personal OS" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Description" htmlFor="p-desc">
        <Textarea id="p-desc" rows={3} {...register("description")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={PROJECT_STATUSES} />
            )}
          />
        </Field>
        <Field label="Progress (%)" htmlFor="p-progress" error={errors.progress?.message}>
          <Input id="p-progress" inputMode="numeric" {...register("progress")} />
        </Field>
      </div>
      <Field label="Technologies" htmlFor="p-tech" hint="Comma separated">
        <Input id="p-tech" placeholder="Next.js, TypeScript" {...register("technologies")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Repository" htmlFor="p-repo" error={errors.repository?.message}>
          <Input id="p-repo" placeholder="https://github.com/…" {...register("repository")} />
        </Field>
        <Field label="Deployment" htmlFor="p-deploy" error={errors.deployment?.message}>
          <Input id="p-deploy" placeholder="https://…" {...register("deployment")} />
        </Field>
      </div>
    </FormDialog>
  )
}
