"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRightIcon, CheckIcon } from "lucide-react"
import { cn } from "cn"

import { GalleryWindow } from "./showcase"

const WORKFLOWS = [
  {
    id: "contacts",
    tab: "Keep people warm",
    title: "Every recruiter and referrer, with a date to follow up",
    text: "Contacts link to the applications they touch. iamcandidate reminds you who to nudge and when, so a good referral never goes quiet.",
    points: ["Follow-up dates on every contact", "Referrals tied to the role they're for", "Add a LinkedIn profile from Chat"],
    screen: "contacts",
  },
  {
    id: "templates",
    tab: "Write outreach fast",
    title: "Templates that fill themselves in",
    text: "Write a cold email or LinkedIn note once. Variables pull in the name, company and role, and it sends from your own mailbox.",
    points: ["Email and LinkedIn templates", "Variables for name, company and role", "Sent from your own SMTP account"],
    screen: "templates",
  },
  {
    id: "resume",
    tab: "Tailor every resume",
    title: "A LaTeX resume for each role",
    text: "Keep a base resume and branch a version per application. It compiles to PDF right in the browser — no local TeX install.",
    points: ["Compile to PDF in the browser", "One version per application", "Stored privately with your documents"],
    screen: "resume",
  },
  {
    id: "integrations",
    tab: "Connect your tools",
    title: "Drive, Calendar and GitHub, all in one place",
    text: "Import offer letters from Google Drive, put interviews on your calendar and show your work — without copying anything by hand.",
    points: ["Read-only Google Drive import", "Interviews on Google Calendar", "GitHub and LinkedIn profiles linked"],
    screen: "integrations",
  },
] as const

/** Tabs across the top; the chosen workflow's story beside its app screen. */
export function WorkflowTabs() {
  const [active, setActive] = useState<(typeof WORKFLOWS)[number]["id"]>("contacts")
  const workflow = WORKFLOWS.find((w) => w.id === active) ?? WORKFLOWS[0]

  return (
    <div className="mt-12">
      <div
        role="tablist"
        aria-label="Workflows"
        className="mx-auto flex [scrollbar-width:none] w-fit max-w-full gap-1 overflow-x-auto rounded-full border bg-card p-1"
      >
        {WORKFLOWS.map((w) => (
          <button
            key={w.id}
            type="button"
            role="tab"
            aria-selected={w.id === active}
            onClick={() => setActive(w.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              w.id === active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {w.tab}
          </button>
        ))}
      </div>

      <div
        key={workflow.id}
        role="tabpanel"
        className="mt-10 grid grid-cols-1 items-center gap-10 rounded-3xl border bg-card p-6 animate-in fade-in duration-500 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{workflow.title}</h3>
          <p className="mt-4 text-base text-pretty text-muted-foreground">{workflow.text}</p>
          <ul className="mt-6 space-y-3">
            {workflow.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <CheckIcon className="size-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Try it in your workspace <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <GalleryWindow screen={workflow.screen} />
      </div>
    </div>
  )
}
