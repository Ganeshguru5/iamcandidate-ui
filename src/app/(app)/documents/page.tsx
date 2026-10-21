import type { Metadata } from "next"
import { Suspense } from "react"

import { CardGridSkeleton } from "@/components/shared/skeletons"
import { DocumentsView } from "@/features/documents/documents-view"

export const metadata: Metadata = { title: "Documents" }

export default function DocumentsPage() {
  return (
    <Suspense fallback={<CardGridSkeleton count={8} />}>
      <DocumentsView />
    </Suspense>
  )
}
