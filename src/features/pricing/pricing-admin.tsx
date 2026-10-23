"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field, SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { pricingService } from "@/lib/services"
import { useIsAdminRole } from "@/lib/store/session"
import type { PricingConfig, PricingCurrency, PricingPlan } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"

import { BillingToggle, PricingCards, yearlySaving, type BillingCycle } from "./pricing-cards"

const CURRENCIES: Array<{ value: PricingCurrency; label: string }> = [
  { value: "INR", label: "Indian rupee (₹)" },
  { value: "USD", label: "US dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British pound (£)" },
]

const MAX_PLANS = 6
const HREF = /^(\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+)$/

/** The same rules the API enforces, so mistakes show before saving. */
function planErrors(plan: PricingPlan): Partial<Record<keyof PricingPlan, string>> {
  const errors: Partial<Record<keyof PricingPlan, string>> = {}
  if (!plan.name.trim()) errors.name = "Required"
  if (!(plan.monthlyPrice >= 0)) errors.monthlyPrice = "0 or more"
  if (!(plan.yearlyPrice >= 0)) errors.yearlyPrice = "0 or more"
  if (!plan.ctaLabel.trim()) errors.ctaLabel = "Required"
  if (!HREF.test(plan.ctaHref.trim())) errors.ctaHref = "Use /path, https://… or mailto:"
  return errors
}

function newPlan(): PricingPlan {
  return {
    id: `plan_${Math.random().toString(36).slice(2, 8)}`,
    name: "New plan",
    tagline: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [],
    ctaLabel: "Get started",
    ctaHref: "/login",
    highlighted: false,
    visible: false,
  }
}

export function PricingAdmin() {
  const isAdmin = useIsAdminRole()
  const [saved, setSaved] = useState<PricingConfig | null>(null)
  const [draft, setDraft] = useState<PricingConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [cycle, setCycle] = useState<BillingCycle>("monthly")

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    pricingService
      .getAdmin()
      .then((config) => {
        if (!active) return
        setSaved(config)
        setDraft(config)
      })
      .catch((caught: unknown) => active && setError(caught instanceof Error ? caught.message : "Couldn't load pricing"))
    return () => {
      active = false
    }
  }, [isAdmin, attempt])

  const load = () => {
    setError(null)
    setAttempt((n) => n + 1)
  }

  if (!isAdmin) {
    return <EmptyState icon={ShieldIcon} title="Admins only" description="Ask an admin to change pricing." />
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const invalid = draft?.plans.some((p) => Object.keys(planErrors(p)).length > 0) ?? false

  const updatePlan = (id: string, patch: Partial<PricingPlan>) =>
    setDraft((d) =>
      d && {
        ...d,
        plans: d.plans.map((p) =>
          p.id === id ? { ...p, ...patch } : patch.highlighted ? { ...p, highlighted: false } : p,
        ),
      },
    )

  const move = (index: number, by: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d
      const plans = [...d.plans]
      const [plan] = plans.splice(index, 1)
      if (plan) plans.splice(index + by, 0, plan)
      return { ...d, plans }
    })

  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const next = await pricingService.save({
        ...draft,
        plans: draft.plans.map((p) => ({ ...p, features: p.features.map((f) => f.trim()).filter(Boolean) })),
      })
      setSaved(next)
      setDraft(next)
      toast.success("Pricing saved. The pricing page is updated.")
    } catch (caught) {
      toast.error("Couldn't save pricing", { description: caught instanceof Error ? caught.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Pricing"
        description={
          saved?.updatedAt
            ? `Plans shown on the public pricing page. Last saved ${timeAgo(saved.updatedAt)}.`
            : "Plans shown on the public pricing page. Showing the built-in defaults."
        }
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/pricing" target="_blank" />}>
              <ExternalLinkIcon /> View page
            </Button>
            <Button variant="outline" onClick={() => setResetting(true)}>
              <RotateCcwIcon /> Reset
            </Button>
            <Button disabled={!dirty || invalid || saving} onClick={() => void save()}>
              {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} Save changes
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !draft ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,34rem)_1fr]">
          <div className="space-y-4">
            <section className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
              <Field label="Currency">
                <SimpleSelect
                  value={draft.currency}
                  onValueChange={(v) => setDraft({ ...draft, currency: v as PricingCurrency })}
                  options={CURRENCIES}
                />
              </Field>
              <Field label="Small print" htmlFor="pricing-note" className="sm:col-span-2">
                <Input id="pricing-note" value={draft.note} maxLength={500} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
              </Field>
            </section>

            {draft.plans.map((plan, index) => (
              <PlanEditor
                key={plan.id}
                plan={plan}
                index={index}
                count={draft.plans.length}
                onChange={(patch) => updatePlan(plan.id, patch)}
                onMove={(by) => move(index, by)}
                onRemove={() => setDraft({ ...draft, plans: draft.plans.filter((p) => p.id !== plan.id) })}
              />
            ))}

            <Button
              variant="outline"
              className="w-full"
              disabled={draft.plans.length >= MAX_PLANS}
              onClick={() => setDraft({ ...draft, plans: [...draft.plans, newPlan()] })}
            >
              <PlusIcon /> Add plan {draft.plans.length >= MAX_PLANS && `(max ${MAX_PLANS})`}
            </Button>
          </div>

          <div className="min-w-0">
            <div className="sticky top-20 rounded-xl border bg-muted/30 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Preview {dirty && <span className="text-xs font-normal text-warning">· unsaved</span>}</p>
                <BillingToggle value={cycle} onChange={setCycle} saving={yearlySaving(draft.plans)} />
              </div>
              <PricingCards config={draft} cycle={cycle} className="md:grid-cols-2 xl:grid-cols-3" />
              {draft.note && <p className="mt-4 text-center text-xs text-muted-foreground">{draft.note}</p>}
              <p className="mt-2 text-center text-xs text-muted-foreground">Hidden plans are faded here and not shown on the site.</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetting}
        onOpenChange={setResetting}
        title="Reset pricing to the defaults?"
        description="This replaces every plan with the built-in Free, Pro and Coach plans."
        confirmLabel="Reset"
        onConfirm={async () => {
          const next = await pricingService.reset()
          setSaved(next)
          setDraft(next)
          toast.success("Pricing reset to the defaults")
        }}
      />
    </div>
  )
}

function PlanEditor({
  plan,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  plan: PricingPlan
  index: number
  count: number
  onChange: (patch: Partial<PricingPlan>) => void
  onMove: (by: -1 | 1) => void
  onRemove: () => void
}) {
  const errors = planErrors(plan)
  const id = (field: string) => `${plan.id}-${field}`
  const price = (value: string) => (value === "" ? Number.NaN : Number(value))

  return (
    <section className={cn("rounded-xl border bg-card", plan.highlighted && "border-brand/50")}>
      <header className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="text-xs text-muted-foreground tabular-nums">{index + 1}</span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{plan.name || "Untitled plan"}</p>
        <Button variant="ghost" size="icon-xs" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUpIcon />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
          <ArrowDownIcon />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label={`Delete ${plan.name}`} onClick={onRemove}>
          <Trash2Icon />
        </Button>
      </header>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={id("name")} error={errors.name}>
          <Input id={id("name")} value={plan.name} maxLength={60} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>
        <div className="flex items-end gap-4 pb-1.5">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={plan.visible} onCheckedChange={(visible) => onChange({ visible })} /> Visible
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={plan.highlighted} onCheckedChange={(highlighted) => onChange({ highlighted })} /> Most popular
          </label>
        </div>
        <Field label="Tagline" htmlFor={id("tagline")} className="sm:col-span-2">
          <Input id={id("tagline")} value={plan.tagline} maxLength={200} onChange={(e) => onChange({ tagline: e.target.value })} />
        </Field>
        <Field label="Price / month (monthly)" htmlFor={id("monthly")} error={errors.monthlyPrice} hint="0 shows “Free”">
          <Input
            id={id("monthly")}
            type="number"
            min={0}
            step="any"
            value={Number.isNaN(plan.monthlyPrice) ? "" : plan.monthlyPrice}
            onChange={(e) => onChange({ monthlyPrice: price(e.target.value) })}
          />
        </Field>
        <Field label="Price / month (yearly)" htmlFor={id("yearly")} error={errors.yearlyPrice}>
          <Input
            id={id("yearly")}
            type="number"
            min={0}
            step="any"
            value={Number.isNaN(plan.yearlyPrice) ? "" : plan.yearlyPrice}
            onChange={(e) => onChange({ yearlyPrice: price(e.target.value) })}
          />
        </Field>
        <Field label="Features" htmlFor={id("features")} hint="One per line" className="sm:col-span-2">
          <Textarea
            id={id("features")}
            rows={Math.max(3, plan.features.length)}
            value={plan.features.join("\n")}
            onChange={(e) => onChange({ features: e.target.value.split("\n") })}
          />
        </Field>
        <Field label="Button label" htmlFor={id("cta")} error={errors.ctaLabel}>
          <Input id={id("cta")} value={plan.ctaLabel} maxLength={40} onChange={(e) => onChange({ ctaLabel: e.target.value })} />
        </Field>
        <Field label="Button link" htmlFor={id("href")} error={errors.ctaHref}>
          <Input id={id("href")} value={plan.ctaHref} placeholder="/login" onChange={(e) => onChange({ ctaHref: e.target.value })} />
        </Field>
      </div>
    </section>
  )
}
