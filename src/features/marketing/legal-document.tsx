import Link from "next/link"

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

/** Typography for the section bodies, which are plain HTML elements. */
const PROSE = [
  "mt-4 space-y-4 text-[15px] leading-7 text-foreground/85",
  "[&_h3]:pt-2 [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:marker:text-muted-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-brand",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]",
].join(" ")

interface LegalDocumentProps {
  eyebrow: string
  title: string
  updated: string
  intro: React.ReactNode
  highlights: string[]
  sections: LegalSection[]
  related: { href: string; label: string }
}

export function LegalDocument({ eyebrow, title, updated, intro, highlights, sections, related }: LegalDocumentProps) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 sm:pt-20">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-brand">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tighter sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated {updated}</p>
          <div className="mt-6 text-base leading-relaxed text-pretty text-muted-foreground">{intro}</div>
        </header>

        <div className="mt-10 rounded-2xl border bg-card p-6 sm:p-8">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">The short version</p>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">On this page</p>
              <ol className="mt-3 space-y-1 border-l">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      <span className="tabular mr-1.5 text-xs text-muted-foreground/70">{index + 1}.</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
              <Link
                href={related.href}
                className="mt-6 inline-block text-sm font-medium underline-offset-4 hover:underline"
              >
                {related.label} →
              </Link>
            </div>
          </nav>

          <article className="min-w-0 max-w-3xl">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 border-b py-8 first:pt-0 last:border-b-0">
                <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
                  <span className="tabular font-mono text-sm text-brand">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </h2>
                <div className={PROSE}>{section.body}</div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  )
}
