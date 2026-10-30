"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  BriefcaseBusinessIcon,
  CalendarClockIcon,
  CheckIcon,
  FolderOpenIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  SearchIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { BrandMark } from "@/components/layout/brand"

/* All names, companies and numbers here are fictional. */

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)")
      query.addEventListener("change", notify)
      return () => query.removeEventListener("change", notify)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true)
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, threshold])
  return [ref, inView] as const
}

/** An app frame: the IamCandidate mark, the screen title and a sync indicator. */
export function AppWindow({
  title,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-[0_0_0_0.5px_rgb(0_0_0/0.06),0_30px_80px_-28px_color-mix(in_oklch,var(--brand)_40%,transparent)] dark:border-white/10",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-2.5 border-b border-foreground/[0.07] bg-[var(--window)] px-3.5">
        <BrandMark className="size-5 rounded-md [&_svg]:size-3" />
        {title && <p className="truncate text-[12px] font-medium text-muted-foreground">{title}</p>}
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" /> Synced
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------ app chrome */

const SIDEBAR: Array<{ icon: LucideIcon; label: string; scene?: SceneId }> = [
  { icon: LayoutDashboardIcon, label: "Dashboard", scene: "dashboard" },
  { icon: BriefcaseBusinessIcon, label: "Applications", scene: "pipeline" },
  { icon: UsersIcon, label: "Contacts" },
  { icon: HandshakeIcon, label: "Referrals", scene: "referrals" },
  { icon: CalendarClockIcon, label: "Interviews", scene: "calendar" },
  { icon: LayoutTemplateIcon, label: "Templates" },
  { icon: FolderOpenIcon, label: "Documents" },
]

function AppFrame({ scene, title, children }: { scene: SceneId; title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-[440px] bg-background sm:h-[480px]">
      <aside className="hidden w-44 shrink-0 p-1.5 md:block">
        <div className="glass flex h-full flex-col rounded-xl border p-2">
          <p className="px-2 pb-2 pt-0.5 text-[9px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">Career</p>
          {SIDEBAR.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex h-6 items-center gap-2 rounded-md px-2 text-[11px] text-sidebar-foreground/85 transition-colors duration-500",
                item.scene === scene && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("size-3.5", item.scene === scene ? "text-brand" : "text-muted-foreground")} /> {item.label}
            </div>
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-foreground/[0.07] px-4">
          <p className="text-[13px] font-semibold">{title}</p>
          <div className="flex h-6 w-40 items-center gap-1.5 rounded-md bg-foreground/[0.06] px-2 text-[11px] text-muted-foreground dark:bg-white/[0.08]">
            <SearchIcon className="size-3" /> Search
            <span className="ml-auto">⌘K</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- scenes */

type SceneId = "pipeline" | "dashboard" | "referrals" | "calendar"

/** Ticks 0..steps-1 while `active`, every `interval` ms (stays at the end with reduced motion). */
function useSteps(active: boolean, steps: number, interval: number, reduced: boolean) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!active || reduced) return
    const timers = Array.from({ length: steps - 1 }, (_, i) =>
      window.setTimeout(() => setStep(i + 1), interval * (i + 1)),
    )
    return () => {
      timers.forEach(window.clearTimeout)
      setStep(0)
    }
  }, [active, steps, interval, reduced])
  return reduced ? steps - 1 : step
}

function Card({ role, company, meta, flash }: { role: string; company: string; meta: string; flash?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-2.5 shadow-xs transition-all duration-500 animate-in fade-in slide-in-from-left-2",
        flash && "border-brand/60 ring-2 ring-brand/20",
      )}
    >
      <p className="truncate text-[11px] font-medium">{role}</p>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{company}</p>
      <p className="mt-1.5 inline-flex rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{meta}</p>
    </div>
  )
}

function PipelineScene({ active, reduced }: { active: boolean; reduced: boolean }) {
  // 0: start · 1: card picked up · 2: moved to Interview · 3: interview scheduled
  const step = useSteps(active, 4, 1100, reduced)
  const moved = step >= 2
  const columns = [
    { title: "Wishlist", color: "var(--chart-5)", cards: [{ role: "Product Engineer", company: "Lumen", meta: "Remote" }, { role: "Frontend Developer", company: "Paywise", meta: "Bengaluru" }] },
    {
      title: "Applied",
      color: "var(--chart-1)",
      cards: [
        ...(moved ? [] : [{ role: "Senior Frontend", company: "Ledgerline", meta: step === 1 ? "Moving…" : "Referral" }]),
        { role: "Software Engineer II", company: "Teamforge", meta: "3d ago" },
        { role: "UI Engineer", company: "Tradewell", meta: "1w ago" },
      ],
    },
    {
      title: "Interview",
      color: "var(--chart-2)",
      cards: [
        ...(moved ? [{ role: "Senior Frontend", company: "Ledgerline", meta: step >= 3 ? "Thu, 4:30 PM" : "Just now" }] : []),
        { role: "Platform Engineer", company: "Relay API", meta: "Mon, 11:00 AM" },
      ],
    },
    { title: "Offer", color: "var(--chart-3)", cards: [{ role: "Software Engineer", company: "Northwind Labs", meta: "Decide by Fri" }] },
  ]
  return (
    <div className="grid h-full grid-cols-2 gap-2.5 lg:grid-cols-4">
      {columns.map((column, index) => (
        <div key={column.title} className={cn("rounded-xl bg-muted/50 p-2", index > 1 && "hidden lg:block")}>
          <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-medium">
            <span className="size-1.5 rounded-full" style={{ background: column.color }} />
            {column.title}
            <span className="ml-auto text-muted-foreground tabular-nums">{column.cards.length}</span>
          </div>
          <div className="space-y-2">
            {column.cards.map((card) => (
              <Card key={`${card.role}-${card.company}`} {...card} flash={card.company === "Ledgerline" && step >= 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CountUp({ to, active, reduced }: { to: number; active: boolean; reduced: boolean }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active || reduced) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900)
      setValue(Math.round(to * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      setValue(0)
    }
  }, [active, reduced, to])
  return <>{reduced ? to : value}</>
}

const WEEKS = [3, 5, 4, 7, 6, 9, 8, 11]

function DashboardScene({ active, reduced }: { active: boolean; reduced: boolean }) {
  const grown = useSteps(active, 2, 150, reduced) === 1
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: "Applications", value: 42 },
          { label: "Interviews", value: 7 },
          { label: "Referrals", value: 12 },
          { label: "Offers", value: 2 },
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              <CountUp to={tile.value} active={active} reduced={reduced} />
            </p>
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 gap-2.5">
        <div className="flex flex-1 flex-col rounded-xl border bg-card p-3">
          <p className="text-[11px] font-medium">Applications per week</p>
          <div className="mt-3 flex flex-1 items-end gap-2">
            {WEEKS.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-brand/80 transition-[height] duration-700 ease-out"
                  style={{ height: grown ? `${(n / 11) * 100}%` : "4%", transitionDelay: `${i * 60}ms` }}
                />
                <span className="text-[9px] text-muted-foreground">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden w-48 flex-col gap-2 rounded-xl border bg-card p-3 lg:flex">
          <p className="text-[11px] font-medium">Up next</p>
          {[
            ["Technical interview", "Ledgerline · Thu 4:30 PM"],
            ["Follow up", "Teamforge · Tomorrow"],
            ["Referral nudge", "Maya Patel · Fri"],
          ].map(([title, meta], i) => (
            <div
              key={title}
              className="rounded-lg bg-muted/60 p-2 transition-all duration-500"
              style={{ opacity: grown ? 1 : 0, transform: grown ? "none" : "translateY(6px)", transitionDelay: `${300 + i * 120}ms` }}
            >
              <p className="text-[10px] font-medium">{title}</p>
              <p className="text-[9px] text-muted-foreground">{meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const MESSAGE =
  "Hi Maya, I'm applying for the Senior Frontend role at Ledgerline and would love to connect. I'd really appreciate a referral if you think I'd be a good fit. Thank you!"

function ReferralsScene({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [typed, setTyped] = useState(0)
  useEffect(() => {
    if (!active || reduced) return
    const timer = window.setInterval(() => setTyped((n) => (n >= MESSAGE.length ? n : n + 2)), 28)
    return () => {
      window.clearInterval(timer)
      setTyped(0)
    }
  }, [active, reduced])
  const shown = reduced ? MESSAGE.length : typed
  const done = shown >= MESSAGE.length
  return (
    <div className="flex h-full gap-3">
      <div className="hidden flex-1 space-y-2 lg:block">
        {[
          { name: "Maya Patel", role: "Senior Frontend · Ledgerline", status: "Request sent", tone: "bg-brand/15 text-brand", active: true },
          { name: "Jordan Reyes", role: "Platform Engineer · Relay API", status: "Accepted", tone: "bg-success/15 text-success" },
          { name: "Elias Weber", role: "Software Engineer II · Teamforge", status: "Not contacted", tone: "bg-muted text-muted-foreground" },
          { name: "Nina Kapoor", role: "UI Engineer · Tradewell", status: "Submitted", tone: "bg-success/15 text-success" },
        ].map((r) => (
          <div key={r.name} className={cn("flex items-center gap-2.5 rounded-xl border bg-card p-2.5", r.active && "border-brand/40")}>
            <span className="flex size-7 items-center justify-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand">
              {r.name.split(" ").map((p) => p[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium">{r.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{r.role}</p>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", r.tone)}>{r.status}</span>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col rounded-xl border bg-card p-3 lg:w-72">
        <p className="text-[11px] font-semibold">LinkedIn message to Maya Patel</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Template: Connection request · referral</p>
        <div className="mt-2.5 flex-1 rounded-lg border bg-background p-2.5 text-[11px] leading-relaxed">
          {MESSAGE.slice(0, shown)}
          {!done && <span className="ml-px inline-block h-3 w-px translate-y-0.5 animate-pulse bg-foreground" />}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="tabular-nums">{shown} / 300</span>
          <span
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition-colors",
              done ? "bg-brand text-brand-foreground" : "bg-muted",
            )}
          >
            {done && <CheckIcon className="size-3" />} {done ? "Copied" : "Copy & open LinkedIn"}
          </span>
        </div>
      </div>
    </div>
  )
}

const EVENTS = [
  { day: 0, top: 18, height: 22, title: "Recruiter screen", meta: "Paywise", color: "bg-chart-3/20 border-chart-3/50" },
  { day: 1, top: 52, height: 30, title: "Technical", meta: "Ledgerline", color: "bg-brand/15 border-brand/50" },
  { day: 2, top: 8, height: 10, title: "Follow up", meta: "Teamforge", color: "bg-chart-2/20 border-chart-2/50" },
  { day: 3, top: 34, height: 26, title: "System design", meta: "Relay API", color: "bg-chart-5/20 border-chart-5/50" },
  { day: 4, top: 60, height: 20, title: "Final round", meta: "Northwind Labs", color: "bg-success/15 border-success/50" },
]

function CalendarScene({ active, reduced }: { active: boolean; reduced: boolean }) {
  const step = useSteps(active, EVENTS.length + 1, 450, reduced)
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium">This week</p>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors", step >= EVENTS.length ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
          {step >= EVENTS.length ? <><CheckIcon className="size-3" /> Synced to Google Calendar</> : "Syncing…"}
        </span>
      </div>
      <div className="grid flex-1 grid-cols-5 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, d) => (
          <div key={day} className="relative rounded-lg bg-muted/40">
            <p className="border-b border-foreground/[0.06] px-2 py-1 text-[10px] font-medium text-muted-foreground">{day}</p>
            {EVENTS.filter((e) => e.day === d).map((event) => {
              const shown = EVENTS.indexOf(event) < step
              return (
                <div
                  key={event.title}
                  className={cn("absolute inset-x-1 rounded-md border px-1.5 py-1 transition-all duration-500", event.color)}
                  style={{
                    top: `calc(${event.top}% + 1.5rem)`,
                    height: `${event.height}%`,
                    opacity: shown ? 1 : 0,
                    transform: shown ? "none" : "scale(0.92)",
                  }}
                >
                  <p className="truncate text-[9px] font-semibold">{event.title}</p>
                  <p className="truncate text-[9px] text-muted-foreground">{event.meta}</p>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const SCENES: Array<{ id: SceneId; tab: string; title: string; caption: string; Component: typeof PipelineScene }> = [
  { id: "pipeline", tab: "Pipeline", title: "Applications", caption: "Drag roles from wishlist to offer.", Component: PipelineScene },
  { id: "dashboard", tab: "Dashboard", title: "Dashboard", caption: "See your week at a glance.", Component: DashboardScene },
  { id: "referrals", tab: "Referrals", title: "Referrals", caption: "Message referrers from templates.", Component: ReferralsScene },
  { id: "calendar", tab: "Calendar", title: "Interviews", caption: "Interviews land on your calendar.", Component: CalendarScene },
]

const SCENE_MS = 5600

/** The hero: the app in a frame, cycling through scenes with progress tabs. */
export function AppShowcase({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [ref, inView] = useInView<HTMLDivElement>(0.2)
  const running = inView && !paused && !reduced

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % SCENES.length), SCENE_MS)
    return () => window.clearTimeout(timer)
  }, [running, index])

  const scene = SCENES[index] ?? SCENES[0]!
  return (
    <div ref={ref} className={cn("relative mx-auto mt-16 max-w-5xl", className)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div aria-hidden className="absolute -inset-x-6 -bottom-6 top-10 rounded-[2rem] bg-gradient-to-b from-brand/25 to-transparent blur-2xl" />
      <AppWindow title={`IamCandidate — ${scene.title}`} className="relative" bodyClassName="relative">
        <AppFrame scene={scene.id} title={scene.title}>
          <div key={scene.id} className="h-full animate-in fade-in duration-500">
            <scene.Component active={inView} reduced={reduced} />
          </div>
        </AppFrame>
      </AppWindow>

      <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="App tour">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={cn("group text-left transition-opacity", i === index ? "opacity-100" : "opacity-60 hover:opacity-90")}
          >
            <div className="h-0.5 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn("h-full bg-brand", i === index && running ? "animate-[showcase-progress_linear_forwards]" : "")}
                style={{
                  width: i === index ? (running ? undefined : "100%") : i < index ? "100%" : "0%",
                  animationDuration: `${SCENE_MS}ms`,
                }}
              />
            </div>
            <p className="mt-2 text-sm font-medium">{s.tab}</p>
            <p className="text-xs text-muted-foreground">{s.caption}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------------------- gallery screens */

function ContactsScreen({ shown }: { shown: boolean }) {
  const rows = [
    ["Maya Patel", "Technical Recruiter", "Ledgerline", "Recruiter", "bg-chart-3/15 text-chart-3", "In 3 days"],
    ["Jordan Reyes", "Senior Software Engineer", "Relay API", "Referral", "bg-success/15 text-success", "In 2 days"],
    ["Elias Weber", "Engineering Manager", "Teamforge", "Hiring Manager", "bg-chart-5/15 text-chart-5", "Tomorrow"],
    ["Nina Kapoor", "HR Business Partner", "Northwind Labs", "Recruiter", "bg-chart-3/15 text-chart-3", "Today"],
    ["Sam Okafor", "Staff Engineer", "Paywise", "Professional", "bg-muted text-muted-foreground", "—"],
  ]
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 border-b px-3 py-2 text-[10px] font-medium text-muted-foreground">
        <span>Name</span>
        <span>Company</span>
        <span>Relationship</span>
        <span>Follow-up</span>
      </div>
      {rows.map(([name, role, company, rel, tone, follow], i) => (
        <div
          key={name}
          className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-2 border-b px-3 py-2 transition-all duration-500 last:border-0"
          style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(6px)", transitionDelay: `${i * 90}ms` }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[9px] font-semibold text-brand">
              {String(name).split(" ").map((p) => p[0]).join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium">{name}</p>
              <p className="truncate text-[9px] text-muted-foreground">{role}</p>
            </div>
          </div>
          <span className="truncate text-[10px]">{company}</span>
          <span className={cn("w-fit rounded-full px-1.5 py-0.5 text-[9px] font-medium", tone)}>{rel}</span>
          <span className="text-[10px]">{follow}</span>
        </div>
      ))}
    </div>
  )
}

function TemplatesScreen({ shown }: { shown: boolean }) {
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="inline-flex w-fit rounded-md bg-foreground/[0.06] p-0.5 text-[10px] dark:bg-white/[0.08]">
        <span className="rounded px-2 py-0.5 text-muted-foreground">Email 10</span>
        <span className="rounded bg-background px-2 py-0.5 font-medium shadow-sm dark:bg-white/15">LinkedIn 7</span>
      </div>
      <div className="flex min-h-0 flex-1 gap-2.5">
        <div className="hidden w-36 space-y-1.5 sm:block">
          {["Connection request: referral", "Referral request", "Referral follow-up", "Thanks for the referral"].map((name, i) => (
            <div key={name} className={cn("rounded-lg border bg-card p-2", i === 0 && "border-foreground/20 bg-muted/60")}>
              <p className="truncate text-[10px] font-medium">{name}</p>
              <p className="text-[9px] text-muted-foreground">Referral</p>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col rounded-xl border bg-card p-3">
          <p className="text-[11px] font-semibold">Connection request: referral</p>
          <div className="mt-2 flex flex-wrap gap-1 border-b pb-2 font-mono text-[9px] text-muted-foreground">
            {["name", "company", "role", "jobUrl", "senderName"].map((v) => (
              <span key={v} className="rounded bg-muted px-1">{v}</span>
            ))}
          </div>
          <p className="mt-2 flex-1 text-[11px] leading-relaxed">
            Hi <span className="rounded bg-brand/15 px-0.5 text-brand">{"{{name}}"}</span>, I&apos;m applying for the{" "}
            <span className="rounded bg-brand/15 px-0.5 text-brand">{"{{role}}"}</span> role at{" "}
            <span className="rounded bg-brand/15 px-0.5 text-brand">{"{{company}}"}</span> and would love to connect. I&apos;d really
            appreciate a referral if you think I&apos;d be a good fit. Thank you!
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Fits a connection note</span>
            <span className="tabular-nums transition-opacity duration-700" style={{ opacity: shown ? 1 : 0 }}>
              197 / 300
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationsScreen({ shown }: { shown: boolean }) {
  const items = [
    ["Google Drive", "Connected", true],
    ["Google Calendar", "Synced 2 min ago", true],
    ["GitHub", "@alexmorgan-demo", true],
    ["LinkedIn", "214 contacts imported", true],
    ["SMTP", "Sending from your mailbox", true],
    ["AWS S3", "Backed up today", true],
  ] as const
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([name, meta], i) => (
        <div
          key={name}
          className="rounded-xl border bg-card p-2.5 transition-all duration-500"
          style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "scale(0.96)", transitionDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[11px] font-medium">{name}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 text-[9px] font-medium text-success">
              <span className="size-1 rounded-full bg-success" /> On
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">{meta}</p>
        </div>
      ))}
    </div>
  )
}

const LATEX = [
  ["\\section", "{Experience}"],
  ["\\textbf", "{Senior Frontend Engineer} \\hfill 2023 -- now"],
  ["\\item", " Led the design system used by 40 engineers"],
  ["\\item", " Cut page load time by 38\\%"],
  ["\\section", "{Skills}"],
  ["", "React, TypeScript, Next.js, GraphQL"],
] as const

function ResumeScreen({ shown }: { shown: boolean }) {
  return (
    <div className="grid h-full grid-cols-2 gap-2.5">
      <div className="rounded-xl border bg-[oklch(0.2_0.01_265)] p-3 font-mono text-[9.5px] leading-relaxed text-white/85">
        {LATEX.map(([cmd, rest], i) => (
          <p key={i} className="truncate transition-opacity duration-300" style={{ opacity: shown ? 1 : 0, transitionDelay: `${i * 140}ms` }}>
            <span className="text-[#ff7ab2]">{cmd}</span>
            {rest}
          </p>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-3 text-zinc-900 shadow-sm">
        <p className="text-[12px] font-semibold">Alex Morgan</p>
        <p className="text-[8px] text-zinc-500">Frontend Engineer · alex.morgan@example.com</p>
        <p className="mt-2 border-b border-zinc-200 text-[9px] font-semibold uppercase tracking-wide">Experience</p>
        <p className="mt-1 text-[9px] font-semibold">Senior Frontend Engineer</p>
        <p className="text-[8px] text-zinc-600">• Led the design system used by 40 engineers</p>
        <p className="text-[8px] text-zinc-600">• Cut page load time by 38%</p>
        <p className="mt-2 border-b border-zinc-200 text-[9px] font-semibold uppercase tracking-wide">Skills</p>
        <p className="mt-1 text-[8px] text-zinc-600">React, TypeScript, Next.js, GraphQL</p>
      </div>
    </div>
  )
}

const GALLERY = {
  contacts: { title: "Contacts", sidebar: "Contacts", Screen: ContactsScreen },
  templates: { title: "Templates", sidebar: "Templates", Screen: TemplatesScreen },
  integrations: { title: "Integrations", sidebar: "", Screen: IntegrationsScreen },
  resume: { title: "Resume — Frontend", sidebar: "Documents", Screen: ResumeScreen },
} as const

/** One app screen in a frame; it animates in when scrolled into view. */
export function GalleryWindow({
  screen,
  delay = 0,
  className,
}: {
  screen: keyof typeof GALLERY
  delay?: number
  className?: string
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.2)
  const reduced = usePrefersReducedMotion()
  const shown = inView || reduced
  const { title, sidebar, Screen } = GALLERY[screen]
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out motion-reduce:transition-none", shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <AppWindow title={`IamCandidate — ${title}`} className="transition-transform duration-500 hover:-translate-y-1">
        <div className="flex h-[300px] bg-background">
          <aside className="hidden w-36 shrink-0 p-1.5 sm:block">
            <div className="glass flex h-full flex-col rounded-xl border p-1.5">
              {SIDEBAR.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[10px] text-sidebar-foreground/85",
                    item.label === sidebar && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className={cn("size-3", item.label === sidebar ? "text-brand" : "text-muted-foreground")} /> {item.label}
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0 flex-1 overflow-hidden p-3">
            <p className="mb-2.5 text-[13px] font-semibold">{title}</p>
            <Screen shown={shown} />
          </div>
        </div>
      </AppWindow>
    </div>
  )
}
