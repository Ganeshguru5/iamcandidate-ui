import type { Metadata } from "next"

import { InterviewsView } from "@/features/interviews/interviews-view"

export const metadata: Metadata = { title: "Interviews" }

export default function InterviewsPage() {
  return <InterviewsView />
}
