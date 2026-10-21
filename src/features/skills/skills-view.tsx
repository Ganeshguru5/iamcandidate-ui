"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { MoreHorizontalIcon, PencilIcon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { z } from "zod"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { ConfirmDialog, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { proficiencyLabel, SKILL_GROUPS } from "@/lib/constants"
import { skillService } from "@/lib/services"
import { createCrudHooks } from "@/lib/store/crud-hooks"
import { QK, useSkills } from "@/lib/store/queries"
import type { Skill } from "@/lib/types"
import { matchesQuery } from "@/lib/utils/format"
import { zodResolver } from "@/lib/utils/zod-resolver"

const skillHooks = createCrudHooks(skillService, QK.skills, "Skill")

const LEVELS = [20, 40, 60, 80, 100]

function ProficiencyMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`Proficiency ${value}%`}>
      <div className="flex flex-1 gap-0.5">
        {LEVELS.map((level, i) => {
          const fill = Math.max(0, Math.min(1, (value - (level - 20)) / 20))
          return (
            <span key={level} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span className={cn("absolute inset-y-0 left-0 rounded-full bg-brand", i === 4 && "bg-brand")} style={{ width: `${fill * 100}%` }} />
            </span>
          )
        })}
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{value}</span>
    </div>
  )
}

export function SkillsView() {
  const { data: skills, isLoading, error, refetch } = useSkills()
  const remove = skillHooks.useDelete()
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [deleting, setDeleting] = useState<Skill | null>(null)

  const all = (skills ?? []).filter((s) => matchesQuery(query, s.name))
  const groups = SKILL_GROUPS.map((group) => ({
    ...group,
    skills: all.filter((s) => s.group === group.value).sort((a, b) => b.proficiency - a.proficiency),
  })).filter((g) => g.skills.length > 0)
  const expert = (skills ?? []).filter((s) => s.proficiency >= 85).length

  return (
    <div>
      <PageHeader
        title="Skills"
        description={skills ? `${skills.length} skills tracked · ${expert} at expert level` : "Your technical skill inventory."}
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Add skill
          </Button>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search skills…" />
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState icon={SparklesIcon} title={query ? "No skills match" : "No skills yet"} action={<Button onClick={() => setCreating(true)}><PlusIcon /> Add skill</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const avg = Math.round(group.skills.reduce((sum, s) => sum + s.proficiency, 0) / group.skills.length)
            return (
              <section key={group.value} className="rounded-xl border bg-card">
                <header className="flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-sm font-semibold">{group.label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {group.skills.length} · avg {avg}
                  </span>
                </header>
                <ul className="divide-y">
                  {group.skills.map((skill) => (
                    <li key={skill.id} className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {proficiencyLabel(skill.proficiency)} · {skill.years} yr{skill.years === 1 ? "" : "s"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${skill.name}`} />}>
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => setEditing(skill)}>
                            <PencilIcon /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(skill)}>
                            <Trash2Icon /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="col-span-2">
                        <ProficiencyMeter value={skill.proficiency} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      {creating && <SkillFormDialog open onOpenChange={setCreating} />}
      {editing && <SkillFormDialog key={editing.id} open skill={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}

const schema = z.object({
  name: z.string().trim().min(1, "Skill name is required"),
  group: z.enum(["frontend", "backend", "mobile", "database", "cloud", "ai", "tools"]),
  proficiency: z.number().min(0).max(100),
  years: z.string().regex(/^\d{1,2}$/, "Years"),
})

type FormValues = z.infer<typeof schema>

function SkillFormDialog({ open, onOpenChange, skill }: { open: boolean; onOpenChange: (open: boolean) => void; skill?: Skill }) {
  const create = skillHooks.useCreate()
  const update = skillHooks.useUpdate()
  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: skill?.name ?? "",
      group: skill?.group ?? "frontend",
      proficiency: skill?.proficiency ?? 60,
      years: String(skill?.years ?? 1),
    },
  })
  const onSubmit = handleSubmit(async (values) => {
    const input = { ...values, years: Number(values.years) }
    const result = skill ? await update.mutate(skill.id, input) : await create.mutate(input)
    if (result) onOpenChange(false)
  })
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={skill ? "Edit skill" : "Add skill"}
      submitLabel={skill ? "Save" : "Add skill"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
      size="sm"
    >
      <Field label="Name" htmlFor="sk-name" error={formState.errors.name?.message}>
        <Input id="sk-name" placeholder="TypeScript" {...register("name")} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Group">
          <Controller control={control} name="group" render={({ field }) => <SimpleSelect value={field.value} onValueChange={field.onChange} options={SKILL_GROUPS} />} />
        </Field>
        <Field label="Years" htmlFor="sk-years" error={formState.errors.years?.message}>
          <Input id="sk-years" inputMode="numeric" {...register("years")} />
        </Field>
      </div>
      <Controller
        control={control}
        name="proficiency"
        render={({ field }) => (
          <Field label={`Proficiency — ${field.value} (${proficiencyLabel(field.value)})`} htmlFor="sk-prof">
            <input
              id="sk-prof"
              type="range"
              min={0}
              max={100}
              step={5}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
          </Field>
        )}
      />
    </FormDialog>
  )
}
