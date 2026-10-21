import type { Metadata } from "next"

import { ApplicationsBoard } from "@/features/applications/applications-board"

export const metadata: Metadata = { title: "Applications" }

export default function ApplicationsPage() {
  return <ApplicationsBoard />
}
