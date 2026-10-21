"use client"

import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Field, parseTags, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NOTE_CATEGORIES } from "@/lib/constants"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { useCreateNote } from "./hooks"

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z.enum(["dsa", "system_design", "react", "nextjs", "nodejs", "ai", "career", "projects", "personal"]),
  tags: z.string(),
  content: z.string(),
})

type FormValues = z.infer<typeof schema>

export function NoteFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const create = useCreateNote()
  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "career", tags: "", content: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    const note = await create.mutate({
      title: values.title,
      category: values.category,
      tags: parseTags(values.tags),
      content: values.content,
      favorite: false,
    })
    if (note) {
      onOpenChange(false)
      router.push(`/workspace/notes?note=${note.id}`)
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New note"
      submitLabel="Create note"
      pending={create.isPending}
      onSubmit={onSubmit}
    >
      <Field label="Title" htmlFor="n-title" error={formState.errors.title?.message}>
        <Input id="n-title" placeholder="Untitled" aria-invalid={!!formState.errors.title} {...register("title")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <SimpleSelect value={field.value} onValueChange={field.onChange} options={NOTE_CATEGORIES} />
            )}
          />
        </Field>
        <Field label="Tags" htmlFor="n-tags" hint="Comma separated">
          <Input id="n-tags" placeholder="react, performance" {...register("tags")} />
        </Field>
      </div>
      <Field label="Content" htmlFor="n-content">
        <Textarea id="n-content" rows={6} placeholder="Start writing…" {...register("content")} />
      </Field>
    </FormDialog>
  )
}
