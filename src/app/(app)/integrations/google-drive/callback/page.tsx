import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/shared/skeletons"
import { DriveCallback } from "@/features/integrations/drive-callback"

export const metadata: Metadata = { title: "Connecting Google Drive" }

export default function GoogleDriveCallbackPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DriveCallback />
    </Suspense>
  )
}
