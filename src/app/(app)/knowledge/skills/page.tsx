import type { Metadata } from "next"

import { SkillsView } from "@/features/skills/skills-view"

export const metadata: Metadata = { title: "Skills" }

export default function SkillsPage() {
  return <SkillsView />
}
