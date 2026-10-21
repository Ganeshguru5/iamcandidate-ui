import type { Metadata } from "next"

import { ResumesView } from "@/features/resumes/resumes-view"

export const metadata: Metadata = { title: "Resumes" }

export default function ResumesPage() {
  return <ResumesView />
}
