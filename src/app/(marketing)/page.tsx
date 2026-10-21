import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CheckIcon,
  CommandIcon,
  FileCodeIcon,
  FolderOpenIcon,
  HandshakeIcon,
  HardDriveIcon,
  KanbanIcon,
  LockIcon,
  MailIcon,
  PuzzleIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: { absolute: "knot — a personal OS for your job search" },
  description:
    "Track applications, referrals, interviews, resumes, documents and notes in one calm place. Capture jobs from any site with the knot browser extension.",
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Extension />
      <Security />
      <ClosingCta />
    </>
  )
}

function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px]",
        className,
      )}
    />
  )
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-brand">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base text-pretty text-muted-foreground">{text}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <DotGrid className="[mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="#extension"
            className="inline-flex items-center gap-2 rounded-full border bg-background/80 py-1 pr-3 pl-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <span className="rounded-full bg-brand px-2 py-0.5 font-medium text-brand-foreground">New</span>
            Save jobs from any site with Alt+K
            <ArrowRightIcon className="size-3" />
          </Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tighter text-balance sm:text-6xl">
            Untangle your job search.
            <span className="block bg-gradient-to-r from-foreground via-brand to-foreground bg-clip-text text-transparent">
              Tie everything together.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            knot is a personal operating system for applications, referrals, interviews, resumes, documents and
            notes — one calm place instead of twelve tabs and a spreadsheet.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "h-10 gap-2 px-5" })}>
              Open your workspace <ArrowRightIcon />
            </Link>
            <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg", className: "h-10 px-5" })}>
              See what&apos;s inside
            </Link>
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  )
}

const BOARD = [
  {
    title: "Wishlist",
    color: "var(--chart-5)",
    cards: [
      { role: "Product Engineer", company: "Linear", meta: "Remote" },
      { role: "Frontend Developer", company: "Razorpay", meta: "Bengaluru" },
    ],
  },
  {
    title: "Applied",
    color: "var(--chart-1)",
    cards: [
      { role: "Software Engineer II", company: "Atlassian", meta: "Referral" },
      { role: "Full-stack Engineer", company: "Postman", meta: "3d ago" },
      { role: "UI Engineer", company: "Zerodha", meta: "1w ago" },
    ],
  },
  {
    title: "Interview",
    color: "var(--chart-2)",
    cards: [{ role: "Senior Frontend", company: "Stripe", meta: "Thu, 4:30 PM" }],
  },
  {
    title: "Offer",
    color: "var(--chart-3)",
    cards: [{ role: "Software Engineer", company: "Vercel", meta: "Decide by Fri" }],
  },
]

function ProductPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div
        aria-hidden
        className="absolute -inset-x-6 -bottom-6 top-10 rounded-[2rem] bg-gradient-to-b from-brand/20 to-transparent blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/5 ring-1 ring-foreground/5">
        <div className="flex h-10 items-center gap-2 border-b bg-sidebar px-4">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <div className="mx-auto flex h-6 w-full max-w-xs items-center gap-2 rounded-md border bg-background px-2 text-[11px] text-muted-foreground">
            <SearchIcon className="size-3" /> Search everything
            <kbd className="ml-auto rounded border px-1 font-mono text-[10px]">⌘K</kbd>
          </div>
        </div>
        <div className="flex">
          <aside className="hidden w-44 shrink-0 border-r bg-sidebar p-3 md:block">
            {[
              { icon: KanbanIcon, label: "Applications", active: true },
              { icon: HandshakeIcon, label: "Referrals" },
              { icon: CalendarClockIcon, label: "Interviews" },
              { icon: FileCodeIcon, label: "Resumes" },
              { icon: FolderOpenIcon, label: "Documents" },
              { icon: MailIcon, label: "Email" },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground",
                  item.active && "bg-sidebar-accent font-medium text-foreground",
                )}
              >
                <item.icon className="size-3.5" /> {item.label}
              </div>
            ))}
          </aside>
          <div className="min-w-0 flex-1 p-4">
            <div className="mb-4 flex items-baseline justify-between">
              <p className="text-sm font-semibold">Applications</p>
              <p className="text-[11px] text-muted-foreground">7 active · 1 offer</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {BOARD.map((column, index) => (
                <div key={column.title} className={cn("rounded-xl bg-muted/50 p-2", index > 1 && "hidden lg:block")}>
                  <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium">
                    <span className="size-1.5 rounded-full" style={{ background: column.color }} />
                    {column.title}
                    <span className="ml-auto text-muted-foreground">{column.cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {column.cards.map((card) => (
                      <div key={card.role} className="rounded-lg border bg-card p-2.5 shadow-xs">
                        <p className="truncate text-xs font-medium">{card.role}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{card.company}</p>
                        <p className="mt-2 inline-flex rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {card.meta}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- features */

interface Feature {
  icon: LucideIcon
  title: string
  text: string
  className?: string
}

const FEATURES: Feature[] = [
  {
    icon: KanbanIcon,
    title: "An application pipeline that keeps up",
    text: "Drag roles from wishlist to offer. Every status change, note and follow-up lands in one timeline, and the dashboard updates the moment you move a card.",
    className: "md:col-span-2",
  },
  {
    icon: HandshakeIcon,
    title: "Referrals & contacts",
    text: "Know who referred you where, and when to nudge them.",
  },
  {
    icon: CalendarClockIcon,
    title: "Interviews",
    text: "Rounds, times and prep notes, attached to the right application.",
  },
  {
    icon: FileCodeIcon,
    title: "LaTeX resumes",
    text: "Write resumes in LaTeX and compile to PDF right in the browser — a version per role.",
  },
  {
    icon: MailIcon,
    title: "Email & templates",
    text: "Send outreach from your own mailbox with reusable templates and variables.",
  },
  {
    icon: FolderOpenIcon,
    title: "Documents & Google Drive",
    text: "Upload certificates and offer letters, or import files straight from Drive. Private storage, presigned links.",
    className: "md:col-span-2",
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
    <section id="features" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Everything in one place"
          title="Built for the long, messy middle of a job search"
          text="The pieces that usually live in spreadsheets, inboxes and folders — connected, searchable and always in sync."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/15",
                feature.className,
              )}
            >
              <div
                aria-hidden
                className="absolute -top-16 -right-16 size-40 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="relative flex size-10 items-center justify-center rounded-xl border bg-background">
                <feature.icon className="size-[18px] text-brand" />
              </span>
              <h3 className="relative mt-5 text-base font-semibold tracking-tight">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- extension */

function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-12 min-w-12 items-center justify-center rounded-xl border border-b-4 bg-card px-4 font-mono text-lg font-medium shadow-sm">
      {children}
    </kbd>
  )
}

function Extension() {
  return (
    <section id="extension" className="relative scroll-mt-16 overflow-hidden border-y bg-sidebar py-24">
      <DotGrid className="opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-brand">
            <PuzzleIcon className="size-4" /> Browser extension
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            See a job you like? Press two keys.
          </h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground">
            The knot extension reads the posting you&apos;re looking at — on LinkedIn, Naukri, Indeed, Lever,
            Greenhouse, Ashby, Workday or any career page — and saves it as an application. On a LinkedIn profile,
            it adds the person as a contact and creates a referral.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Only reads the page when you open it — never in the background",
              "Matches companies and contacts you already have, so nothing is duplicated",
              "Keeps your draft if the popup closes while you copy something",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <CheckIcon className="size-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-col items-center gap-8">
          <div className="flex items-center gap-3">
            <Keycap>Alt</Keycap>
            <span className="text-xl text-muted-foreground">+</span>
            <Keycap>K</Keycap>
          </div>
          <div className="w-full max-w-sm rounded-2xl border bg-card p-4 shadow-xl shadow-foreground/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Save application</p>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                Detected
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                ["Role", "Senior Frontend Engineer"],
                ["Company", "Stripe"],
                ["Location", "Bengaluru · Hybrid"],
                ["Salary", "Not found on page"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p
                    className={cn(
                      "mt-0.5 rounded-md border bg-background px-2 py-1.5 text-xs",
                      value === "Not found on page" && "border-warning/50 bg-warning/10 text-muted-foreground",
                    )}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-8 items-center justify-center rounded-lg bg-primary text-xs font-medium text-primary-foreground">
              Save to knot
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- security */

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
    title: "Secrets encrypted",
    text: "SMTP passwords and Google Drive tokens are encrypted with AES-256-GCM and never sent back to the browser.",
  },
  {
    icon: FolderOpenIcon,
    title: "Read-only Drive",
    text: "The Google Drive connection can only read. knot never writes to, or deletes from, your Drive.",
  },
]

function Security() {
  return (
    <section id="security" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Private by design"
          title="A career archive deserves care"
          text="Resumes, offer letters and contacts are personal. knot is built so they stay that way."
        />
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY.map((item) => (
            <div key={item.title} className="bg-card p-6">
              <item.icon className="size-5 text-brand" />
              <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
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

/* ------------------------------------------------------------------- cta */

function ClosingCta() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-foreground px-6 py-16 text-center text-background sm:px-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        />
        <div aria-hidden className="absolute -bottom-32 left-1/2 h-64 w-[640px] -translate-x-1/2 rounded-full bg-brand/40 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Your next role is a few good habits away.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-background/70">
            Bring your applications, people and paperwork into one place — and spend the saved time preparing.
          </p>
          <Link
            href="/dashboard"
            className={buttonVariants({
              size: "lg",
              className: "mt-8 h-10 gap-2 bg-background px-5 text-foreground hover:bg-background/90",
            })}
          >
            Open knot <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  )
}
