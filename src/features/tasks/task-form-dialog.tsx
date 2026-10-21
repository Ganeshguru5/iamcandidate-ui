"use client"

import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Field, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants"
import { useApplications, useById, useCompanies, useProjects } from "@/lib/store/queries"
import type { RelatedItem, Task } from "@/lib/types"
import { fromDateInput, toDateInput } from "@/lib/utils/dates"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateTask, useUpdateTask } from "./hooks"

const NONE = "__none"

const schema = z.object({
  title: z.string().trim().min(2, "Give the task a title"),
  description: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["todo", "in_progress", "done"]),
  dueDate: z.string(),
  related: z.string(),
})

type FormValues = z.infer<typeof schema>

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
}) {
  const { data: applications = [] } = useApplications()
  const { data: projects = [] } = useProjects()
  const { data: companies } = useCompanies()
  const companyById = useById(companies)
  const create = useCreateTask()
  const update = useUpdateTask()

  const relatedOptions: Array<{ value: string; label: string; item: RelatedItem }> = [
    ...applications.map((a) => {
      const label = `${companyById.get(a.companyId)?.name ?? "Company"} — ${a.role}`
      return { value: `application:${a.id}`, label, item: { type: "application" as const, id: a.id, label } }
    }),
    ...projects.map((p) => ({
      value: `project:${p.id}`,
      label: `Project · ${p.name}`,
      item: { type: "project" as const, id: p.id, label: p.name },
    })),
  ]
  if (task?.related && !relatedOptions.some((o) => o.value === `${task.related?.type}:${task.related?.id}`)) {
    relatedOptions.push({
      value: `${task.related.type}:${task.related.id}`,
      label: task.related.label,
      item: task.related,
    })
  }

  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "medium",
      status: task?.status ?? "todo",
      dueDate: toDateInput(task?.dueDate ?? new Date().toISOString()),
      related: task?.related ? `${task.related.type}:${task.related.id}` : NONE,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      status: values.status,
      dueDate: fromDateInput(values.dueDate),
      related: relatedOptions.find((o) => o.value === values.related)?.item,
    }
    const result = task ? await update.mutate(task.id, input) : await create.mutate(input)
    if (result) onOpenChange(false)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      submitLabel={task ? "Save changes" : "Create task"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
    >
      <Field label="Title" htmlFor="t-title" error={formState.errors.title?.message}>
        <Input id="t-title" placeholder="Follow up with recruiter" aria-invalid={!!formState.errors.title} {...register("title")} />
      </Field>
      <Field label="Description" htmlFor="t-desc">
        <Textarea id="t-desc" rows={3} {...register("description")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Priority">
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={TASK_PRIORITIES} />
            )}
          />
        </Field>
        <Field label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={TASK_STATUSES} />
            )}
          />
        </Field>
        <Field label="Due date" htmlFor="t-due">
          <Input id="t-due" type="date" {...register("dueDate")} />
        </Field>
      </div>
      <Field label="Related to">
        <Controller
          control={control}
          name="related"
          render={({ field }) => (
            <SimpleSelect
              value={field.value}
              onValueChange={field.onChange}
              options={[{ value: NONE, label: "Nothing" }, ...relatedOptions]}
            />
          )}
        />
      </Field>
    </FormDialog>
  )
}
