import type { Metadata } from "next"
import { Suspense } from "react"

import { ListSkeleton } from "@/components/shared/skeletons"
import { NotesView } from "@/features/notes/notes-view"

export const metadata: Metadata = { title: "Notes" }

export default function NotesPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <NotesView />
    </Suspense>
  )
}
