import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/skeletons"
import { CompanyDetail } from "@/features/companies/company-detail"

export const metadata: Metadata = { title: "Company" }

export default function CompanyDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CompanyDetail />
    </Suspense>
  )
}
