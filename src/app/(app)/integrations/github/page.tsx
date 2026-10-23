import type { Metadata } from "next"

import { GitHubView } from "@/features/integrations/github-view"

export const metadata: Metadata = { title: "GitHub" }

export default function GitHubPage() {
  return <GitHubView />
}
