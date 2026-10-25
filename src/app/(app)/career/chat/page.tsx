import type { Metadata } from "next"
import { Suspense } from "react"

import { JobChatView } from "@/features/job-chat/job-chat-view"

export const metadata: Metadata = { title: "Chat" }

export default function JobChatPage() {
  return (
    <Suspense>
      <JobChatView />
    </Suspense>
  )
}
