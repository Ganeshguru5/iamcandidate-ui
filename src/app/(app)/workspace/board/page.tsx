import type { Metadata } from "next"
import { Suspense } from "react"

import { ListSkeleton } from "@/components/shared/skeletons"
import { BoardView } from "@/features/board/board-view"

export const metadata: Metadata = { title: "Board" }

export default function BoardPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <BoardView />
    </Suspense>
  )
}
