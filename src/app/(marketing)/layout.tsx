import { EarlyAccessBanner } from "@/features/marketing/early-access-banner"
import { SiteFooter, SiteHeader } from "@/features/marketing/site-chrome"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <EarlyAccessBanner />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
