import type { Metadata } from "next"

import { LinkedInView } from "@/features/integrations/linkedin-view"

export const metadata: Metadata = { title: "LinkedIn" }

export default function LinkedInPage() {
  return <LinkedInView />
}
