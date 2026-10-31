import type { Metadata } from "next"

import { AutofillView } from "@/features/autofill/autofill-view"

export const metadata: Metadata = { title: "Autofill" }

export default function AutofillPage() {
  return <AutofillView />
}
