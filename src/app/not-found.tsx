import Link from "next/link"

import { BrandMark } from "@/components/layout/brand"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandMark />
      <div>
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-sm text-muted-foreground">The link may be broken or the page was moved.</p>
      </div>
      <Link href="/dashboard" className="text-sm font-medium underline underline-offset-4">
        Back to dashboard
      </Link>
    </div>
  )
}
