import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { BrandMark } from "@/components/layout/brand"
import { buttonVariants } from "@/components/ui/button"

export const CONTACT_EMAIL = "ganeshguru8681@gmail.com"

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#extension", label: "Extension" },
  { href: "/#security", label: "Security" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight">knot</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}>
            Sign in
          </Link>
          <Link href="/dashboard" className={buttonVariants({ className: "gap-1.5" })}>
            Open app <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </header>
  )
}

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#extension", label: "Browser extension" },
      { href: "/dashboard", label: "Open app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms & conditions" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-sidebar/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight">knot</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A personal operating system for your job search, documents and knowledge.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        {FOOTER_LINKS.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 knot. All rights reserved.</p>
          <p>Built with Next.js, AWS Lambda and DynamoDB.</p>
        </div>
      </div>
    </footer>
  )
}
