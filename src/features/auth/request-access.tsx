"use client"

import { useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { z } from "zod"

import { Field } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { authService } from "@/lib/services"
import { useMutation } from "@/lib/store/query"
import { zodResolver } from "@/lib/utils/zod-resolver"

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters").max(200),
    confirm: z.string(),
    message: z.string().trim().max(500, "Keep it under 500 characters"),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] })

type Values = z.infer<typeof schema>

const SENT_TEXT =
  "The admin will review it. Once access is granted, sign in with this email and the password you chose."

/** Form state shared by the dialog and the /request-access page. */
function useRequestAccess() {
  const [sent, setSent] = useState(false)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "", message: "" },
  })
  const request = useMutation(
    async ({ name, email, password, message }: Values) => {
      await authService.requestAccess({ name, email, password, ...(message ? { message } : {}) })
      return true
    },
    { error: "Couldn't send your request" },
  )
  const onSubmit = form.handleSubmit(async (values) => {
    if (await request.mutate(values)) setSent(true)
  })
  return { form, onSubmit, pending: request.isPending, sent }
}

function RequestAccessFields({ form, idPrefix }: { form: UseFormReturn<Values>; idPrefix: string }) {
  const { register, formState } = form
  const errors = formState.errors
  const id = (name: string) => `${idPrefix}-${name}`
  return (
    <>
      <Field label="Name" htmlFor={id("name")} error={errors.name?.message}>
        <Input id={id("name")} autoComplete="name" {...register("name")} />
      </Field>
      <Field label="Email" htmlFor={id("email")} error={errors.email?.message}>
        <Input id={id("email")} type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor={id("password")} error={errors.password?.message} hint="You'll sign in with this once access is granted.">
        <Input id={id("password")} type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor={id("confirm")} error={errors.confirm?.message}>
        <Input id={id("confirm")} type="password" autoComplete="new-password" {...register("confirm")} />
      </Field>
      <Field label="Anything to add? (optional)" htmlFor={id("message")} error={errors.message?.message}>
        <Textarea id={id("message")} rows={3} placeholder="What you'd like to use IamCandidate for" {...register("message")} />
      </Field>
    </>
  )
}

export function RequestAccessDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { form, onSubmit, pending, sent } = useRequestAccess()

  if (sent) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <CheckCircle2Icon className="mb-1 size-6 text-brand" />
            <DialogTitle>Request sent</DialogTitle>
            <DialogDescription>{SENT_TEXT}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button />}>Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title="Request access"
      description="IamCandidate is in development. Ask for an account and the admin will review it."
      submitLabel="Send request"
      pendingLabel="Sending…"
      pending={pending}
      onSubmit={onSubmit}
      size="sm"
    >
      <RequestAccessFields form={form} idPrefix="request-dialog" />
    </FormDialog>
  )
}

/** A button that opens the request form. */
export function RequestAccessButton({
  children = "Request access",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button {...props} onClick={() => setOpen(true)}>
        {children}
      </Button>
      {open && <RequestAccessDialog onOpenChange={setOpen} />}
    </>
  )
}

/** The same form on its own page, for links from other sites. */
export function RequestAccessPanel() {
  const { form, onSubmit, pending, sent } = useRequestAccess()

  if (sent) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <CheckCircle2Icon className="size-6 text-brand" />
        <h2 className="mt-3 font-semibold">Request sent</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{SENT_TEXT}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-6">
      <RequestAccessFields form={form} idPrefix="request-page" />
      <Button type="submit" size="lg" className="mt-1 h-9" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  )
}
