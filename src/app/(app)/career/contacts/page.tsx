import type { Metadata } from "next"
import { Suspense } from "react"

import { ListSkeleton } from "@/components/shared/skeletons"
import { ContactsView } from "@/features/contacts/contacts-view"

export const metadata: Metadata = { title: "Contacts" }

export default function ContactsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={8} />}>
      <ContactsView />
    </Suspense>
  )
}
