import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/skeletons"
import { ResumeEditor } from "@/features/resumes/resume-editor"

export const metadata: Metadata = { title: "Edit resume" }

export default function ResumeEditorPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResumeEditor />
    </Suspense>
  )
}
