import type { Metadata } from "next"
import { Suspense } from "react"

import { ListSkeleton } from "@/components/shared/skeletons"
import { EmailClient } from "@/features/emails/email-client"

export const metadata: Metadata = { title: "Email" }

export default function EmailPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={8} />}>
      <EmailClient />
    </Suspense>
  )
}
