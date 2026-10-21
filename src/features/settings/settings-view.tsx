"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import {
  BellIcon,
  CheckIcon,
  Loader2Icon,
  LogOutIcon,
  MailIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  PlugIcon,
  RotateCcwIcon,
  SaveIcon,
  ShieldIcon,
  SunIcon,
  UploadIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { cn } from "cn"

import { Field } from "@/components/shared/form"
import { ConfirmDialog, PersonAvatar } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/features/integrations/integrations-view"
import { IntegrationLogo } from "@/features/integrations/integration-logos"
import { isApiMode } from "@/lib/api/config"
import { authService, settingsService } from "@/lib/services"
import { QK, useIntegrations, useNotificationPreferences, useProfile } from "@/lib/store/queries"
import { resetQueryCache, setQueryData, useMutation } from "@/lib/store/query"
import { signOut } from "@/lib/store/session"
import { useTheme } from "@/lib/store/theme"
import type { NotificationPreferences, ThemePreference, UserProfile } from "@/lib/types"
import { zodResolver } from "@/lib/utils/zod-resolver"

import { SmtpSettings } from "./smtp-settings"

type Section = "profile" | "appearance" | "notifications" | "integrations" | "email" | "security"

const SECTIONS: Array<{ value: Section; label: string; icon: LucideIcon }> = [
  { value: "profile", label: "Profile", icon: UserIcon },
  { value: "appearance", label: "Appearance", icon: PaletteIcon },
  { value: "notifications", label: "Notifications", icon: BellIcon },
  { value: "integrations", label: "Integrations", icon: PlugIcon },
  { value: "email", label: "Email", icon: MailIcon },
  { value: "security", label: "Security", icon: ShieldIcon },
]

export function SettingsView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const requested = params.get("tab") as Section | null
  const section: Section = SECTIONS.some((s) => s.value === requested) ? (requested as Section) : "profile"

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, preferences and connected services." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Settings sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-current={section === s.value ? "page" : undefined}
              onClick={() => router.replace(`${pathname}?tab=${s.value}`, { scroll: false })}
              className={cn(
                "flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                section === s.value ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <s.icon className="size-4" />
              {s.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 max-w-3xl space-y-6">
          {section === "profile" && <ProfileSection />}
          {section === "appearance" && <AppearanceSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "integrations" && <IntegrationsSection />}
          {section === "email" && <SmtpSettings />}
          {section === "security" && <SecuritySection />}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
  role: z.string().trim(),
  location: z.string().trim(),
  bio: z.string().max(280, "Keep it under 280 characters"),
})
type ProfileValues = z.infer<typeof profileSchema>

function ProfileSection() {
  const { data: profile } = useProfile()
  if (!profile) return <Skeleton className="h-96 rounded-xl" />
  return <ProfileForm key={profile.name + profile.email} profile={profile} />
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState(profile.avatarUrl)
  const save = useMutation((next: UserProfile) => settingsService.updateProfile(next), {
    onSuccess: (next) => setQueryData<UserProfile>(QK.profile, () => next),
    success: "Profile saved",
    error: "Couldn't save profile",
  })
  const { register, handleSubmit, formState, reset } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, email: profile.email, role: profile.role, location: profile.location, bio: profile.bio },
  })
  const errors = formState.errors
  const dirty = formState.isDirty || avatar !== profile.avatarUrl

  const pickPhoto = (file: File | undefined) => {
    if (!file) return
    if (file.size > 1_500_000) {
      toast.error("Photo too large", { description: "Choose an image under 1.5 MB." })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : undefined)
    reader.readAsDataURL(file)
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await save.mutate({ ...profile, ...values, avatarUrl: avatar })
    if (result) reset(values)
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <Panel title="Profile" description="How you appear across your workspace and in emails.">
        <div className="mb-6 flex items-center gap-4">
          <PersonAvatar name={profile.name} src={avatar} className="size-16 text-lg" />
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <UploadIcon /> Change photo
              </Button>
              {avatar && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(undefined)}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">PNG or JPG, up to 1.5 MB. Stored only in this browser.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="pf-name" error={errors.name?.message}>
            <Input id="pf-name" aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Email" htmlFor="pf-email" error={errors.email?.message}>
            <Input id="pf-email" type="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Role" htmlFor="pf-role">
            <Input id="pf-role" {...register("role")} />
          </Field>
          <Field label="Location" htmlFor="pf-loc">
            <Input id="pf-loc" {...register("location")} />
          </Field>
        </div>
        <Field label="Bio" htmlFor="pf-bio" error={errors.bio?.message} className="mt-4">
          <Textarea id="pf-bio" rows={3} {...register("bio")} />
        </Field>
        <div className="mt-5 flex justify-end border-t pt-4">
          <Button type="submit" disabled={!dirty || save.isPending}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </Panel>
    </form>
  )
}

/* ------------------------------------------------------------------ */

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const options: Array<{ value: ThemePreference; label: string; icon: LucideIcon; preview: string }> = [
    { value: "light", label: "Light", icon: SunIcon, preview: "bg-white" },
    { value: "dark", label: "Dark", icon: MoonIcon, preview: "bg-zinc-900" },
    { value: "system", label: "System", icon: MonitorIcon, preview: "bg-gradient-to-r from-white from-50% to-zinc-900 to-50%" },
  ]
  return (
    <Panel title="Appearance" description="Choose how Personal OS looks. Your choice is saved on this device.">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={theme === option.value}
            onClick={() => {
              setTheme(option.value)
              toast.success(`Theme set to ${option.label.toLowerCase()}`)
            }}
            className={cn(
              "rounded-xl border p-2 text-left transition-colors hover:bg-muted/40",
              theme === option.value && "border-brand ring-2 ring-brand/30",
            )}
          >
            <span className={cn("block h-20 rounded-lg border", option.preview)}>
              <span className="m-2 block h-2 w-10 rounded bg-zinc-400/50" />
              <span className="mx-2 block h-1.5 w-16 rounded bg-zinc-400/30" />
            </span>
            <span className="mt-2 flex items-center gap-2 px-1 text-sm font-medium">
              <option.icon className="size-4 text-muted-foreground" />
              {option.label}
              {theme === option.value && <CheckIcon className="ml-auto size-4 text-brand" />}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */

const NOTIFICATION_ROWS: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
  { key: "emailNotifications", label: "Email notifications", description: "Receive a summary of replies and status changes by email." },
  { key: "interviewReminders", label: "Interview reminders", description: "Remind me about interviews in the next 3 days." },
  { key: "taskReminders", label: "Task reminders", description: "Show tasks due today and overdue in notifications." },
  { key: "followUpReminders", label: "Follow-up reminders", description: "Nudge me when a follow-up date arrives." },
  { key: "weeklyDigest", label: "Weekly digest", description: "A Monday recap of applications, interviews and activity." },
]

function NotificationsSection() {
  const { data: prefs } = useNotificationPreferences()
  const save = useMutation((next: NotificationPreferences) => settingsService.updateNotificationPreferences(next), {
    onMutate: (next) => setQueryData<NotificationPreferences>(QK.notificationPreferences, () => next),
    success: "Notification preferences saved",
    error: "Couldn't save preferences",
  })
  return (
    <Panel title="Notifications" description="Changes save automatically and update the bell in the top bar." bodyClassName="p-0">
      {!prefs ? (
        <div className="space-y-3 p-4">
          {NOTIFICATION_ROWS.map((row) => (
            <Skeleton key={row.key} className="h-10" />
          ))}
        </div>
      ) : (
        <ul className="divide-y">
          {NOTIFICATION_ROWS.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <label htmlFor={`notif-${row.key}`} className="min-w-0 cursor-pointer">
                <span className="block text-sm font-medium">{row.label}</span>
                <span className="block text-xs text-muted-foreground">{row.description}</span>
              </label>
              <Switch
                id={`notif-${row.key}`}
                checked={prefs[row.key]}
                onCheckedChange={(checked) => void save.mutate({ ...prefs, [row.key]: checked })}
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/* ------------------------------------------------------------------ */

function IntegrationsSection() {
  const { data: integrations } = useIntegrations()
  return (
    <Panel
      title="Integrations"
      description="Connected services and their status."
      action={
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/integrations" />}>
          Manage
        </Button>
      }
      bodyClassName="p-0"
    >
      <ul className="divide-y">
        {(integrations ?? []).map((integration) => (
          <li key={integration.id} className="flex items-center gap-3 px-4 py-3">
            <IntegrationLogo id={integration.id} className="size-8 [&_svg]:size-4" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{integration.name}</p>
              <p className="truncate text-xs text-muted-foreground">{integration.account ?? integration.category}</p>
            </div>
            <StatusBadge integration={integration} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Passwords don't match", path: ["confirm"] })
type PasswordValues = z.infer<typeof passwordSchema>

function SecuritySection() {
  const router = useRouter()
  const [resetting, setResetting] = useState(false)
  const { register, handleSubmit, formState, reset } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  })
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authService.changePassword(values.current, values.next)
    } catch (error) {
      toast.error("Couldn't update password", {
        description: error instanceof Error ? error.message : undefined,
      })
      return
    }
    toast.success(
      "Password updated",
      isApiMode ? undefined : { description: "Simulated — the demo password stays demo123." },
    )
    reset()
  })

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <Panel
          title="Password"
          description={isApiMode ? "Change the password you sign in with." : "Fake authentication — nothing is actually changed."}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Current password" htmlFor="pw-current" error={errors.current?.message}>
              <Input id="pw-current" type="password" autoComplete="current-password" {...register("current")} />
            </Field>
            <Field label="New password" htmlFor="pw-next" error={errors.next?.message}>
              <Input id="pw-next" type="password" autoComplete="new-password" {...register("next")} />
            </Field>
            <Field label="Confirm" htmlFor="pw-confirm" error={errors.confirm?.message}>
              <Input id="pw-confirm" type="password" autoComplete="new-password" {...register("confirm")} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end border-t pt-4">
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2Icon className="animate-spin" />} Update password
            </Button>
          </div>
        </Panel>
      </form>

      <Panel title="Sessions">
        <div className="flex items-center gap-3">
          <MonitorIcon className="size-5 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">This browser</p>
            <p className="text-xs text-muted-foreground">
              {isApiMode ? "Active now · signed in for up to 12 hours" : "Active now · mock session stored locally"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut()
              router.replace("/login")
            }}
          >
            <LogOutIcon /> Sign out
          </Button>
        </div>
      </Panel>

      {/* Real (API) data is never reset from the UI; see knot-server's seed script. */}
      {!isApiMode && (
        <Panel title="Demo data" className="border-destructive/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Restore all mock data to its original state. Your theme and session are kept.</p>
            <Button variant="destructive" onClick={() => setResetting(true)}>
              <RotateCcwIcon /> Reset demo data
            </Button>
          </div>
        </Panel>
      )}

      <ConfirmDialog
        open={resetting}
        onOpenChange={setResetting}
        title="Reset all demo data?"
        description="Applications, contacts, documents, emails and everything else you changed will be restored to the seed data."
        confirmLabel="Reset data"
        onConfirm={async () => {
          await settingsService.resetDemoData()
          resetQueryCache()
          toast.success("Demo data restored")
        }}
      />
    </>
  )
}
