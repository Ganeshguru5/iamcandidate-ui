"use client"

import Link from "next/link"
import { CheckIcon, SparklesIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import type { PricingConfig, PricingCurrency, PricingPlan } from "@/lib/types"

export type BillingCycle = "monthly" | "yearly"

const LOCALE: Record<PricingCurrency, string> = { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB" }

export function formatPrice(amount: number, currency: PricingCurrency): string {
  return new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

/** Largest yearly saving across paid plans, as a whole percent (0 if none). */
export function yearlySaving(plans: PricingPlan[]): number {
  const savings = plans
    .filter((p) => p.monthlyPrice > 0 && p.yearlyPrice < p.monthlyPrice)
    .map((p) => Math.round((1 - p.yearlyPrice / p.monthlyPrice) * 100))
  return savings.length ? Math.max(...savings) : 0
}

/** Monthly / yearly switch (segmented control). */
export function BillingToggle({
  value,
  onChange,
  saving,
}: {
  value: BillingCycle
  onChange: (value: BillingCycle) => void
  saving: number
}) {
  return (
    <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-lg bg-foreground/[0.06] p-0.5 dark:bg-white/[0.08]">
      {(["monthly", "yearly"] as const).map((cycle) => (
        <button
          key={cycle}
          type="button"
          role="radio"
          aria-checked={value === cycle}
          onClick={() => onChange(cycle)}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-all",
            value === cycle ? "bg-background text-foreground shadow-sm dark:bg-white/15" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {cycle === "monthly" ? "Monthly" : "Yearly"}
          {cycle === "yearly" && saving > 0 && (
            <span className="rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success">−{saving}%</span>
          )}
        </button>
      ))}
    </div>
  )
}

function PlanButton({ plan }: { plan: PricingPlan }) {
  const className = buttonVariants({
    variant: plan.highlighted ? "default" : "outline",
    size: "lg",
    className: "h-10 w-full",
  })
  // Site paths use client navigation; URLs and mailto: are plain links.
  return plan.ctaHref.startsWith("/") ? (
    <Link href={plan.ctaHref} className={className}>
      {plan.ctaLabel}
    </Link>
  ) : (
    <a href={plan.ctaHref} className={className} {...(plan.ctaHref.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
      {plan.ctaLabel}
    </a>
  )
}

export function PricingCards({
  config,
  cycle,
  className,
}: {
  config: PricingConfig
  cycle: BillingCycle
  className?: string
}) {
  const plans = config.plans
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        plans.length === 2 && "md:grid-cols-2",
        plans.length === 3 && "md:grid-cols-3",
        plans.length >= 4 && "md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {plans.map((plan, index) => {
        const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
        const free = price === 0
        return (
          <article
            key={plan.id}
            style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
            className={cn(
              "hero-in relative flex flex-col rounded-2xl border bg-card p-6 transition-shadow",
              plan.highlighted &&
                "border-brand/50 shadow-[0_0_0_1px_var(--brand),0_20px_50px_-20px_color-mix(in_oklch,var(--brand)_45%,transparent)]",
              !plan.visible && "opacity-55",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-brand-foreground">
                <SparklesIcon className="size-3" /> Most popular
              </span>
            )}
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
              {!plan.visible && <span className="text-[11px] text-muted-foreground">Hidden</span>}
            </div>
            <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.tagline}</p>
            <div className="mt-5 flex items-baseline gap-1.5">
              {/* Keyed by billing cycle: the price slides in when the toggle changes. */}
              <span key={`${plan.id}-${cycle}`} className="price-swap text-4xl font-semibold tracking-tight tabular-nums">
                {free ? "Free" : formatPrice(price, config.currency)}
              </span>
              {!free && <span className="text-sm text-muted-foreground">/ month</span>}
            </div>
            <p className="mt-1 h-4 text-xs text-muted-foreground">
              {!free && cycle === "yearly" && `Billed yearly · ${formatPrice(price * 12, config.currency)} / year`}
              {!free && cycle === "monthly" && plan.yearlyPrice < plan.monthlyPrice &&
                `or ${formatPrice(plan.yearlyPrice, config.currency)} / month billed yearly`}
            </p>
            <div className="mt-6">
              <PlanButton plan={plan} />
            </div>
            <ul className="mt-6 space-y-2.5 border-t pt-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <CheckIcon className={cn("mt-0.5 size-4 shrink-0", plan.highlighted ? "text-brand" : "text-muted-foreground")} />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        )
      })}
    </div>
  )
}
