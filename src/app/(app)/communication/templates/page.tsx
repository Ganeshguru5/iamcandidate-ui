import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/shared/skeletons"
import { TemplatesView } from "@/features/templates/templates-view"

export const metadata: Metadata = { title: "Templates" }

export default function TemplatesPage() {
  // TemplatesView reads ?channel= from the URL.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TemplatesView />
    </Suspense>
  )
}
