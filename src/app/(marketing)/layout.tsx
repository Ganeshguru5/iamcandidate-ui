import { SiteFooter, SiteHeader } from "@/features/marketing/site-chrome"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
