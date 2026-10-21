import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/skeletons"
import { ApplicationDetail } from "@/features/applications/application-detail"

export const metadata: Metadata = { title: "Application" }

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApplicationDetail />
    </Suspense>
  )
}
