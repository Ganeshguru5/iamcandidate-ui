import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckIcon,
  CheckSquareIcon,
  ClipboardPasteIcon,
  CommandIcon,
  FileCodeIcon,
  FolderOpenIcon,
  GitBranchIcon,
  HandshakeIcon,
  HardDriveIcon,
  IdCardIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  LockIcon,
  MailIcon,
  MenuIcon,
  MessageSquarePlusIcon,
  PuzzleIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { BrandMark } from "@/components/layout/brand"
import { buttonVariants } from "@/components/ui/button"
import { Reveal } from "@/features/marketing/reveal"
import { AppShowcase } from "@/features/marketing/showcase"
import { WorkflowTabs } from "@/features/marketing/workflow-tabs"

export const metadata: Metadata = {
  title: { absolute: "knot — your job search, untangled" },
  description:
    "Track applications, referrals, interviews, resumes, documents and notes in one calm place. Paste a job or profile link into Chat, capture jobs with the browser extension, and install knot on your iPhone.",
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Capture />
      <Tour />
      <Workflows />
      <Features />
      <Mobile />
      <Proof />
      <Integrations />
      <ClosingCta />
    </>
  )
}

const PILL = "h-11 gap-2 rounded-full px-6 text-sm"

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs font-medium tracking-[0.14em] text-brand uppercase", className)}>{children}</p>
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.1]">{title}</h2>
      <p className="mt-4 text-base text-pretty text-muted-foreground">{text}</p>
    </Reveal>
  )
}

function CheckList({ points }: { points: string[] }) {
  return (
    <ul className="mt-8 space-y-3">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
            <CheckIcon className="size-3" />
          </span>
          {point}
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ hero */

// Bar heights for the hero ribbon: two overlapping waves, so it reads as a
// loose strand being pulled into a knot.
const RIBBON = Array.from({ length: 44 }, (_, i) => {
  const wave = Math.sin(i / 4.2) * 0.32 + Math.sin(i / 1.9 + 1) * 0.14
  return Math.round((0.5 + wave) * 100)
})

function RibbonArt() {
  return (
    <div aria-hidden className="absolute inset-0 flex items-center justify-center gap-[3px] px-6 sm:gap-[5px]">
      {RIBBON.map((height, i) => (
        <span
          key={i}
          className="ribbon-bar w-1.5 rounded-full bg-gradient-to-b from-background/90 via-brand/60 to-chart-5/50 sm:w-2"
          style={{ height: `${height}%`, "--ribbon-delay": `${i * -90}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

const HERO_STACK = [
  { icon: KanbanIcon, label: "Applications" },
  { icon: HandshakeIcon, label: "Referrals" },
  { icon: MessageSquarePlusIcon, label: "Chat reads your links", active: true },
  { icon: CalendarClockIcon, label: "Interviews" },
  { icon: FileCodeIcon, label: "LaTeX resumes" },
]

const JOB_BOARDS = ["LinkedIn", "Greenhouse", "Lever", "Ashby", "Workday", "Naukri", "Indeed", "Wellfound"]

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-gradient-to-b from-brand-soft via-brand-soft/40 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div>
            <Eyebrow className="hero-in">Applications · Referrals · Chat</Eyebrow>
            <h1
              className="hero-in mt-5 text-[2.6rem] leading-[1.05] font-semibold tracking-tighter text-balance sm:text-6xl"
              style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
            >
              The calm command centre for your job search
            </h1>
          </div>
          <div className="hero-in lg:pb-2" style={{ "--reveal-delay": "180ms" } as React.CSSProperties}>
            <p className="text-base text-pretty text-muted-foreground sm:text-lg">
              knot ties applications, people, interviews, resumes and documents together — and reads every job link you
              paste, so the busywork is done before you start.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), PILL)}>
                Open your workspace <ArrowRightIcon />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), PILL)}>
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div
          className="hero-in mt-12 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]"
          style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
        >
          <div className="relative h-64 overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-soft via-card to-chart-5/15 sm:h-80">
            <RibbonArt />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border bg-background/80 py-1.5 pr-3.5 pl-1.5 text-xs font-medium backdrop-blur">
              <BrandMark />
              Twelve tabs, one thread
            </div>
          </div>
          <div className="relative flex items-center justify-center overflow-hidden rounded-3xl border bg-gradient-to-b from-card to-brand-soft/60 p-6">
            <ul className="w-full max-w-60 space-y-2">
              {HERO_STACK.map((item) => (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-full border bg-background px-3.5 py-2 text-xs transition-transform",
                    item.active
                      ? "scale-[1.06] border-brand/40 font-semibold shadow-lg shadow-brand/10"
                      : "text-muted-foreground opacity-80",
                  )}
                >
                  <item.icon className={cn("size-3.5", item.active ? "text-brand" : "text-muted-foreground")} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Reveal className="mt-14 text-center">
          <p className="text-sm text-muted-foreground">
            Reads job postings from <span className="font-medium text-brand">every major board</span> and any career page
          </p>
          <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {JOB_BOARDS.map((board) => (
              <li key={board} className="text-lg font-semibold tracking-tight text-foreground/45">
                {board}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- capture */

function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-b-4 bg-background px-3.5 font-mono text-base font-medium shadow-sm">
      {children}
    </kbd>
  )
}

function Capture() {
  return (
    <section id="chat" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Capture"
          title="Paste a link. knot fills in the rest."
          text="Job postings and profiles become applications and contacts in seconds — from Chat, from the browser, or from your phone."
        />
        <Reveal className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), PILL)}>
            Try Chat free <ArrowRightIcon />
          </Link>
          <Link href="#extension" className={cn(buttonVariants({ variant: "outline", size: "lg" }), PILL)}>
            Get the extension
          </Link>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {/* Chat: the big card. */}
          <Reveal className="flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-soft/70 to-card p-6 sm:p-8 lg:col-span-2 lg:row-span-2">
            <span className="flex size-10 items-center justify-center rounded-xl border bg-background">
              <MessageSquarePlusIcon className="size-[18px] text-brand" />
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">Chat that reads links</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Paste a posting from LinkedIn, Greenhouse, Lever, Ashby or Workday — or a LinkedIn or GitHub profile — and
              check the card before it&apos;s saved.
            </p>
            <div className="mt-8 flex flex-1 flex-col justify-end gap-3">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-xs text-background">
                jobs.lever.co/ledgerline/senior-frontend-engineer
              </div>
              <div className="max-w-sm rounded-2xl rounded-bl-md border bg-background p-4 shadow-xl shadow-foreground/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Senior Frontend Engineer</p>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">Read</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Ledgerline · Bengaluru · Hybrid</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "Design systems"].map((tag) => (
                    <span key={tag} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    Save application
                  </span>
                  <span className="flex h-8 items-center justify-center rounded-full border px-3 text-xs">Edit</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal id="extension" delay={120} className="scroll-mt-24 rounded-3xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-xl border bg-background">
              <PuzzleIcon className="size-[18px] text-brand" />
            </span>
            <h3 className="mt-5 text-base font-semibold tracking-tight">Browser extension</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              On any posting, press two keys to save it. On a LinkedIn profile, add the person and a referral.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Keycap>Alt</Keycap>
              <span className="text-muted-foreground">+</span>
              <Keycap>K</Keycap>
            </div>
          </Reveal>

          <Reveal delay={200} className="rounded-3xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-xl border bg-background">
              <ClipboardPasteIcon className="size-[18px] text-brand" />
            </span>
            <h3 className="mt-5 text-base font-semibold tracking-tight">A board that follows you</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              One notepad synced to every device you sign in on, with secrets encrypted in your browser before
              they&apos;re saved.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ tour */

function Tour() {
  return (
    <section id="tour" className="relative scroll-mt-16 overflow-hidden border-y bg-sidebar/60 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="The workspace"
          title="Run your whole search, with knot in every step"
          text="From the first saved posting to the signed offer: a dashboard, a pipeline, your referrers and your interview calendar, always in sync."
        />
        <AppShowcase className="mt-14" />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- workflows */

function Workflows() {
  return (
    <section id="workflows" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Less busywork"
          title="Take care of the small things that move a search forward"
          text="The follow-ups, the outreach, the tailored resumes — knot handles the dozens of small tasks between “applied” and “offer”."
        />
        <WorkflowTabs />
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- features */

const FEATURES: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: KanbanIcon,
    title: "A pipeline that keeps up",
    text: "Drag roles from wishlist to offer. Every change lands in one timeline, and the dashboard updates the moment you move a card.",
  },
  {
    icon: CalendarClockIcon,
    title: "Interviews",
    text: "Rounds, times and prep notes, attached to the right application.",
  },
  {
    icon: MailIcon,
    title: "Email & templates",
    text: "Send outreach from your own mailbox with reusable templates and variables.",
  },
  {
    icon: FolderOpenIcon,
    title: "Documents & Drive",
    text: "Upload certificates and offer letters, or import them straight from Google Drive.",
  },
  {
    icon: SparklesIcon,
    title: "Your knowledge base",
    text: "Notes, skills, certifications and bookmarks that grow with your career.",
  },
  {
    icon: CommandIcon,
    title: "Keyboard first",
    text: "⌘K jumps anywhere and searches everything. ⌘S saves the note you're writing.",
  },
]

function Features() {
  return (
    <section id="features" className="scroll-mt-16 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Everything in one place"
          title="Built for the long, messy middle of a job search"
          text="The pieces that usually live in spreadsheets, inboxes and folders — connected, searchable and always in sync."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal
              key={feature.title}
              delay={(index % 3) * 90}
              className="group relative overflow-hidden rounded-3xl border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft">
                <feature.icon className="size-[18px] text-brand" />
              </span>
              <h3 className="mt-5 text-base font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- mobile */

const PHONE_TABS = [
  { icon: LayoutDashboardIcon, label: "Dashboard" },
  { icon: BriefcaseBusinessIcon, label: "Applications", active: true },
  { icon: MessageSquarePlusIcon, label: "Chat" },
  { icon: CheckSquareIcon, label: "Tasks" },
]

function Mobile() {
  return (
    <section id="mobile" className="scroll-mt-16 px-4 pb-24 sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-soft/70 via-card to-card px-6 pt-12 sm:px-12 lg:grid-cols-2 lg:pt-0">
        <Reveal className="lg:py-16">
          <Eyebrow className="inline-flex items-center gap-2">
            <SmartphoneIcon className="size-4" /> On your phone
          </Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Install knot like an app.</h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground">
            Add knot to your iPhone&apos;s home screen from Safari and it opens full screen, with its own icon and
            launch screen. Your four favourite pages sit in a glass tab bar; everything else is one tap away.
          </p>
          <CheckList
            points={[
              "Choose the four tabs in the control centre — saved on each device",
              "Copy a job link, tap paste in Chat, and it's read for you",
              "A friendly offline screen instead of an error when you lose signal",
            ]}
          />
        </Reveal>

        <Reveal delay={150} className="flex justify-center self-end">
          {/* A phone drawn in CSS, cropped by the card: the app with its glass tab bar. */}
          <div className="relative -mb-24 h-[520px] w-[260px] overflow-hidden rounded-[2.75rem] border-[6px] border-foreground/90 bg-background shadow-2xl shadow-foreground/10 lg:mt-12">
            <div className="absolute top-2 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground/90" />
            <div className="space-y-3 px-4 pt-12">
              <p className="text-sm font-semibold">Applications</p>
              {[
                ["Senior Frontend Engineer", "Ledgerline · Hybrid"],
                ["Product Designer", "Brightwave · Remote"],
                ["Platform Engineer", "Cobalt Cloud · On-site"],
                ["Data Analyst", "FreshPath · Remote"],
              ].map(([role, meta]) => (
                <div key={role} className="rounded-xl border bg-card p-3">
                  <p className="text-xs font-medium">{role}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{meta}</p>
                </div>
              ))}
            </div>
            <div className="absolute inset-x-2.5 bottom-[6.5rem] flex items-center gap-2">
              <div className="glass-bar grid h-12 flex-1 grid-cols-4 rounded-full p-1">
                {PHONE_TABS.map((tab) => (
                  <span
                    key={tab.label}
                    className={cn(
                      "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-full",
                      tab.active ? "bg-foreground/[0.07] text-brand" : "text-foreground/70",
                    )}
                  >
                    <tab.icon className="size-3.5" />
                    <span className="max-w-full truncate text-[7px] font-medium">{tab.label}</span>
                  </span>
                ))}
              </div>
              <span className="glass-bar flex size-12 shrink-0 items-center justify-center rounded-full">
                <MenuIcon className="size-4" />
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- proof */

// Facts about the product, not customer quotes.
const STATS = [
  { label: "Job boards read", value: "8+", note: "plus any career page" },
  { label: "To save a posting", value: "2 keys", note: "Alt + K in the extension" },
  { label: "Secrets", value: "AES-256", note: "GCM, never sent back to the browser" },
  { label: "Price to start", value: "Free", note: "a whole job search, extension included" },
]

const SECURITY = [
  {
    icon: LockIcon,
    title: "Your data, only yours",
    text: "Every record is scoped to your account. Nothing is shared across users, sold or used for ads.",
  },
  {
    icon: HardDriveIcon,
    title: "Private file storage",
    text: "Documents sit in a private, encrypted bucket and are reached only through short-lived signed links.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Read-only Drive",
    text: "The Google Drive connection can only read. knot never writes to, or deletes from, your Drive.",
  },
]

function Proof() {
  return (
    <section id="security" className="scroll-mt-16 border-t bg-sidebar/50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Private by design"
          title="A career archive deserves care"
          text="Resumes, offer letters and contacts are personal. knot is built so they stay that way."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <Reveal
              key={stat.label}
              delay={index * 80}
              className={cn(
                "flex flex-col justify-between rounded-3xl border p-6",
                index % 2 === 0 ? "bg-card" : "bg-gradient-to-br from-brand-soft to-card",
              )}
            >
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{stat.label}</p>
              <div className="mt-10">
                <p className="tabular text-4xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.note}</p>
              </div>
            </Reveal>
          ))}
          {SECURITY.map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 80}
              className={cn("rounded-3xl border bg-card p-6", index === 0 && "sm:col-span-2")}
            >
              <item.icon className="size-5 text-brand" />
              <h3 className="mt-4 text-base font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Read the full{" "}
          <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-medium text-foreground underline underline-offset-4">
            terms
          </Link>
          .
        </p>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- integrations */

const INTEGRATIONS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: FolderOpenIcon, label: "Google Drive" },
  { icon: CalendarIcon, label: "Google Calendar" },
  { icon: MailIcon, label: "Your mailbox" },
  { icon: GitBranchIcon, label: "GitHub" },
  { icon: IdCardIcon, label: "LinkedIn" },
  { icon: HardDriveIcon, label: "Amazon S3" },
]

function Integrations() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.1]">
            Connect the tools you already use
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {INTEGRATIONS.map((item, index) => (
            <Reveal
              key={item.label}
              delay={index * 60}
              className="flex items-center gap-2.5 rounded-full border bg-card py-2 pr-5 pl-2 text-sm font-medium shadow-sm"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-soft">
                <item.icon className="size-4 text-brand" />
              </span>
              {item.label}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- cta */

function ClosingCta() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-gradient-to-br from-brand-soft via-card to-chart-5/15 px-6 py-16 text-center sm:px-12 sm:py-20">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 opacity-60 [mask-image:linear-gradient(to_top,black,transparent)]">
          <RibbonArt />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Turn your job search into a routine
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-pretty text-muted-foreground">
            Bring your applications, people and paperwork into one place — and spend the saved time preparing. Start
            free, upgrade when your search picks up.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), PILL)}>
              Open knot <ArrowRightIcon />
            </Link>
            <Link href="/pricing" className={cn(buttonVariants({ variant: "outline", size: "lg" }), PILL)}>
              See pricing
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
