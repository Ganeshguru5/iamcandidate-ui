"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { pricingService } from "@/lib/services"
import type { PricingConfig } from "@/lib/types"

import { BillingToggle, PricingCards, yearlySaving, type BillingCycle } from "./pricing-cards"

const FAQ = [
  {
    q: "Can I start for free?",
    a: "Yes. The Free plan has no time limit, so you can run a whole job search on it and upgrade only if you need more.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "It stays yours. You can export everything at any time, and on paid plans you can back up to your own S3 bucket.",
  },
  {
    q: "Does the browser extension cost extra?",
    a: "No. The extension works on every plan, including Free.",
  },
  {
    q: "Can I switch between monthly and yearly?",
    a: "Yes. Changes take effect from your next billing date, and yearly billing costs less per month.",
  },
]

export function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<BillingCycle>("yearly")

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    pricingService
      .getPublic()
      .then((next) => active && setConfig(next))
      .catch((caught: unknown) => active && setError(caught instanceof Error ? caught.message : "Couldn't load pricing"))
    return () => {
      active = false
    }
  }, [attempt])

  const load = () => {
    setError(null)
    setAttempt((n) => n + 1)
  }

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">Simple plans for every search</h1>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            Start free. Upgrade when your search picks up. Your data is yours on every plan.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <BillingToggle value={cycle} onChange={setCycle} saving={config ? yearlySaving(config.plans) : 0} />
        </div>

        <div className="mt-12">
          {error ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border p-8 text-center">
              <p className="text-sm font-medium">Couldn&apos;t load pricing</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={load}>
                Try again
              </Button>
            </div>
          ) : !config ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[460px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <PricingCards config={config} cycle={cycle} />
              {config.note && <p className="mt-6 text-center text-sm text-muted-foreground">{config.note}</p>}
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Questions</h2>
        <div className="mt-8 divide-y rounded-2xl border bg-card">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                {item.q}
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
