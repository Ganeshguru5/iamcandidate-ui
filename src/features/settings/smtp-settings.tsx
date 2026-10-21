"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  PlugZapIcon,
  SaveIcon,
  XCircleIcon,
} from "lucide-react"
import { z } from "zod"

import { Field, SimpleSelect } from "@/components/shared/form"
import { Panel } from "@/components/shared/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiMode } from "@/lib/api/config"
import { smtpService } from "@/lib/services"
import { QK, useSmtpConfig } from "@/lib/store/queries"
import { invalidateQueries, setQueryData, useMutation } from "@/lib/store/query"
import type { SmtpConfig } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"
import { zodResolver } from "@/lib/utils/zod-resolver"

/** With a password already saved on the server, leaving the field blank keeps it. */
const buildSchema = (hasSavedPassword: boolean) =>
  z.object({
    host: z
      .string()
      .trim()
      .min(1, "Host is required")
      .refine((host) => !host.includes("@"), "Enter the mail server, e.g. smtp.gmail.com — not your email address")
      .refine((host) => /^[a-z0-9.-]+$/i.test(host), "Enter a host name, e.g. smtp.gmail.com"),
    port: z.string().regex(/^\d{2,5}$/, "Enter a valid port"),
    username: z.string().trim().min(1, "Username is required"),
    password: hasSavedPassword ? z.string() : z.string().min(1, "Password is required"),
    encryption: z.enum(["tls", "ssl", "none"]),
    senderName: z.string().trim().min(1, "Sender name is required"),
    senderEmail: z.email("Enter a valid email"),
  })

type FormValues = z.infer<ReturnType<typeof buildSchema>>

const toConfig = (values: FormValues, lastTestedAt?: string): SmtpConfig => ({
  ...values,
  port: Number(values.port),
  lastTestedAt,
})

type TestState = { status: "idle" } | { status: "testing" } | { status: "ok"; latencyMs: number } | { status: "error"; message: string }

export function SmtpSettings() {
  const { data: config, isLoading } = useSmtpConfig()
  if (isLoading || !config) {
    return (
      <Panel title="SMTP configuration">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </Panel>
    )
  }
  return <SmtpForm config={config} />
}

function SmtpForm({ config }: { config: SmtpConfig }) {
  const [showPassword, setShowPassword] = useState(false)
  const [test, setTest] = useState<TestState>({ status: "idle" })

  const save = useMutation((next: SmtpConfig) => smtpService.saveConfig(next), {
    onSuccess: (next) => setQueryData<SmtpConfig>(QK.smtp, () => next),
    invalidates: [QK.integrations],
    success: "SMTP configuration saved",
    error: "Couldn't save configuration",
  })

  const hasSavedPassword = Boolean(config.hasPassword)
  const { register, control, handleSubmit, formState, getValues, trigger, reset } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(hasSavedPassword)),
    defaultValues: {
      host: config.host,
      port: String(config.port),
      username: config.username,
      password: config.password,
      encryption: config.encryption,
      senderName: config.senderName,
      senderEmail: config.senderEmail,
    },
  })
  const errors = formState.errors

  const onSave = handleSubmit(async (values) => {
    const result = await save.mutate(toConfig(values, config.lastTestedAt))
    // The server never returns the password, so clear it from the form too.
    if (result) reset(isApiMode ? { ...values, password: "" } : values)
  })

  const onTest = async () => {
    if (!(await trigger())) return
    setTest({ status: "testing" })
    try {
      const result = await smtpService.testConnection(toConfig(getValues()))
      setTest({ status: "ok", latencyMs: result.latencyMs })
      setQueryData<SmtpConfig>(QK.smtp, (prev) => ({ ...prev, lastTestedAt: new Date().toISOString() }))
      invalidateQueries(QK.integrations)
    } catch (caught) {
      setTest({ status: "error", message: caught instanceof Error ? caught.message : "Connection failed" })
    }
  }

  return (
    <form onSubmit={onSave} noValidate>
      <Panel
        title="SMTP configuration"
        description={
          isApiMode
            ? "Emails are sent from your own mailbox through this server. For Gmail or Outlook use an app password, not your normal one."
            : "Mock configuration — no connection is made and no email is ever sent."
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
          <Field label="SMTP host" htmlFor="smtp-host" error={errors.host?.message}>
            <Input id="smtp-host" autoComplete="off" placeholder="smtp.gmail.com" aria-invalid={!!errors.host} {...register("host")} />
          </Field>
          <Field label="Port" htmlFor="smtp-port" error={errors.port?.message}>
            <Input id="smtp-port" inputMode="numeric" aria-invalid={!!errors.port} {...register("port")} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Username" htmlFor="smtp-user" error={errors.username?.message}>
            <Input id="smtp-user" autoComplete="off" aria-invalid={!!errors.username} {...register("username")} />
          </Field>
          <Field label="Password" htmlFor="smtp-pass" error={errors.password?.message}>
            <div className="relative">
              <Input
                id="smtp-pass"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={hasSavedPassword ? "Saved — leave blank to keep" : undefined}
                className="pr-9"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </Field>
          <Field label="Encryption">
            <Controller
              control={control}
              name="encryption"
              render={({ field }) => (
                <SimpleSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "tls", label: "STARTTLS (recommended)" },
                    { value: "ssl", label: "SSL/TLS" },
                    { value: "none", label: "None" },
                  ]}
                />
              )}
            />
          </Field>
          <div />
          <Field label="Sender name" htmlFor="smtp-name" error={errors.senderName?.message}>
            <Input id="smtp-name" aria-invalid={!!errors.senderName} {...register("senderName")} />
          </Field>
          <Field label="Sender email" htmlFor="smtp-from" error={errors.senderEmail?.message}>
            <Input id="smtp-from" type="email" aria-invalid={!!errors.senderEmail} {...register("senderEmail")} />
          </Field>
        </div>

        {test.status !== "idle" && (
          <div
            role="status"
            className={
              test.status === "error"
                ? "mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                : test.status === "ok"
                  ? "mt-5 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm"
                  : "mt-5 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm text-muted-foreground"
            }
          >
            {test.status === "testing" && <><Loader2Icon className="mt-0.5 size-4 animate-spin" /> Connecting to {getValues("host")}:{getValues("port")}…</>}
            {test.status === "ok" && <><CheckCircle2Icon className="mt-0.5 size-4 text-success" /> SMTP connection successful. Server responded in {test.latencyMs} ms.</>}
            {test.status === "error" && <><XCircleIcon className="mt-0.5 size-4" /> {test.message}</>}
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground sm:mr-auto">
            {config.lastTestedAt ? `Last tested ${timeAgo(config.lastTestedAt)}` : "Never tested"}
          </p>
          <Button type="button" variant="outline" onClick={onTest} disabled={test.status === "testing"}>
            {test.status === "testing" ? <Loader2Icon className="animate-spin" /> : <PlugZapIcon />}
            {test.status === "testing" ? "Testing…" : "Test connection"}
          </Button>
          <Button type="submit" disabled={save.isPending || !formState.isDirty}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            {save.isPending ? "Saving…" : "Save configuration"}
          </Button>
        </div>
      </Panel>
    </form>
  )
}
